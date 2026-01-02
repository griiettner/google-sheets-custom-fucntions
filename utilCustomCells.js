/**
 * utilCustomCells: Manages highly specific row-level validation and logic
 * that goes beyond simple template copying.
 */
var utilCustomCells = (function () {

  var HEADERS = {
    TYPES: 'Types',
    ACTIONS: 'Actions',
    ACTIONS_RESULT: 'Actions Result',
    REQUIRED: 'Required'
  };

  /**
   * Main entry point to enforce custom cell rules across a sheet.
   * Called by onChange and onEdit.
   */
  function applyAll(sheet) {
    if (!sheet) return;
    
    var layout = LibSections.getLayout(sheet);
    if (!layout.primary) return;

    var globalLastRow = sheet.getLastRow();
    var startRow = CFG.TEMPLATE_ROW;

    // 1. Calculate section-specific last row
    var primaryLastRow = _getSectionLastRow(sheet, layout.primary, startRow, globalLastRow);

    // 2. Find Column Indices
    var colMap = _getColumnMap(sheet, layout.primary);
    
    // 3. Apply "Types" (FIELD_TYPE) Logic
    if (colMap.types) {
      _applyValidation(sheet, colMap.types, primaryLastRow, "A2:A");
    }

    // 4. Apply "Actions" Logic
    if (colMap.actions) {
      _applyValidation(sheet, colMap.actions, primaryLastRow, "C1:Z1");
    }

    // 5. Apply "Actions Result" Logic (Dependent Logic)
    if (colMap.actions && colMap.actionsResult) {
       _syncActionsResultAll(sheet, colMap.actions, colMap.actionsResult, startRow, primaryLastRow);
    }

    // 6. Apply "Required" Logic
    if (colMap.required) {
      _applyCheckbox(sheet, colMap.required, primaryLastRow);
    }
  }

  /**
   * Handles real-time dependency updates when an 'Actions' cell is edited.
   */
  function handleEdit(ctx) {
    var layout = LibSections.getLayout(ctx.sheet);
    if (!layout.primary) return;
    
    var colMap = _getColumnMap(ctx.sheet, layout.primary);
    if (!colMap.actions || !colMap.actionsResult) return;

    if (ctx.col === colMap.actions && ctx.row >= CFG.TEMPLATE_ROW) {
      // CLEAR CONTENT FIRST: Prevent old data from persisting with new validation rules
      var resultCell = ctx.sheet.getRange(ctx.row, colMap.actionsResult);
      resultCell.clearContent().setNote(''); // Clear note as well for fresh setup
      
      _updateActionsResultCell(ctx.sheet, ctx.row, colMap.actions, colMap.actionsResult, true);
    }
  }

  /**
   * Scans the specific columns of a section to find the last row containing any text.
   */
  function _getSectionLastRow(sheet, section, startRow, globalLastRow) {
    if (!section) return 0;
    if (globalLastRow < startRow) return 0;

    var startCol = section.start;
    var numCols = section.end - section.start + 1;
    var numRows = globalLastRow - startRow + 1;

    var values = sheet.getRange(startRow, startCol, numRows, numCols).getValues();
    for (var r = values.length - 1; r >= 0; r--) {
      for (var c = 0; c < numCols; c++) {
        var val = String(values[r][c] == null ? '' : values[r][c]).trim();
        if (val !== '') return startRow + r;
      }
    }
    return 0;
  }

  /**
   * Discovers the column indices for known custom headers within a section.
   */
  function _getColumnMap(sheet, section) {
    var headerRow = CFG.HEADER_ROW;
    var startCol = section.start;
    var numCols = section.end - section.start + 1;
    
    var values = sheet.getRange(headerRow, startCol, 1, numCols).getValues()[0];
    var map = {};
    
    for (var i = 0; i < values.length; i++) {
      var val = String(values[i] || '').trim();
      if (val === HEADERS.TYPES) map.types = startCol + i;
      if (val === HEADERS.ACTIONS) map.actions = startCol + i;
      if (val === HEADERS.ACTIONS_RESULT) map.actionsResult = startCol + i;
      if (val === HEADERS.REQUIRED) map.required = startCol + i;
    }
    
    return map;
  }

  /**
   * General purpose validation applier for custom cells (Types, Actions).
   */
  function _applyValidation(sheet, colIndex, lastRow, settingsRangeA1) {
    var maxRows = sheet.getMaxRows();
    var startRow = CFG.TEMPLATE_ROW;
    
    if (maxRows < startRow) return;

    if (lastRow >= startRow) {
      var numRows = lastRow - startRow + 1;
      var range = sheet.getRange(startRow, colIndex, numRows, 1);
      var settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SETTINGS_SHEET_NAME);
      
      if (settingsSheet) {
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInRange(settingsSheet.getRange(settingsRangeA1))
          .setAllowInvalid(false)
          .build();
          
        range.setDataValidation(rule);
      }
    }

    var cleanupStart = Math.max(startRow, lastRow + 1);
    var cleanupNumRows = maxRows - cleanupStart + 1;
    if (cleanupNumRows > 0) {
      sheet.getRange(cleanupStart, colIndex, cleanupNumRows, 1).clearDataValidations();
    }
  }

  /**
   * Applies checkbox validation to the given column within the section bounds.
   */
  function _applyCheckbox(sheet, colIndex, lastRow) {
    var maxRows = sheet.getMaxRows();
    var startRow = CFG.TEMPLATE_ROW;
    
    if (maxRows < startRow) return;

    if (lastRow >= startRow) {
      var numRows = lastRow - startRow + 1;
      var range = sheet.getRange(startRow, colIndex, numRows, 1);
      var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
      range.setDataValidation(rule);
    }

    var cleanupStart = Math.max(startRow, lastRow + 1);
    var cleanupNumRows = maxRows - cleanupStart + 1;
    if (cleanupNumRows > 0) {
      sheet.getRange(cleanupStart, colIndex, cleanupNumRows, 1).clearDataValidations();
    }
  }

  /**
   * Syncs the Actions Result column for all rows in the section.
   */
  function _syncActionsResultAll(sheet, actionsCol, resultCol, startRow, lastRow) {
    if (lastRow < startRow) {
       var maxRows = sheet.getMaxRows();
       if (maxRows >= startRow) {
         sheet.getRange(startRow, resultCol, maxRows - startRow + 1, 1).clearDataValidations().clearContent().setNote('');
       }
       return;
    }

    for (var r = startRow; r <= lastRow; r++) {
      _updateActionsResultCell(sheet, r, actionsCol, resultCol, false);
    }

    var maxRows = sheet.getMaxRows();
    if (maxRows > lastRow) {
      sheet.getRange(lastRow + 1, resultCol, maxRows - lastRow, 1).clearDataValidations().clearContent().setNote('');
    }
  }

  /**
   * Updates a single result cell based on its action cell.
   * @param {Boolean} allowPrompt If true, can show UI prompts (onEdit flow).
   */
  function _updateActionsResultCell(sheet, row, actionsCol, resultCol, allowPrompt) {
    var actionVal = String(sheet.getRange(row, actionsCol).getValue() || '').trim();
    var resultCell = sheet.getRange(row, resultCol);
    
    if (actionVal === '') {
      resultCell.clearDataValidations();
      resultCell.clearContent();
      resultCell.setNote('');
      return;
    }

    var settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SETTINGS_SHEET_NAME);
    if (!settingsSheet) return;

    var headers = settingsSheet.getRange("C1:Z1").getValues()[0];
    var settingsColIndex = -1;
    for (var i = 0; i < headers.length; i++) {
       if (String(headers[i]).trim() === actionVal) {
         settingsColIndex = 3 + i; 
         break;
       }
    }

    if (settingsColIndex === -1) {
      resultCell.clearDataValidations();
      return;
    }

    var type = String(settingsSheet.getRange(2, settingsColIndex).getValue() || '').toLowerCase().trim();
    var lastSettingsRow = settingsSheet.getLastRow();

    switch (type) {
      case 'select':
        if (lastSettingsRow >= 3) {
          var rule = SpreadsheetApp.newDataValidation()
            .requireValueInRange(settingsSheet.getRange(3, settingsColIndex, lastSettingsRow - 2, 1))
            .setAllowInvalid(false)
            .build();
          resultCell.setDataValidation(rule);
        }
        break;
      
      case 'bool':
        var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
        resultCell.setDataValidation(rule);
        break;

      case 'select-custom':
        _handleSelectCustom(sheet, row, resultCell, allowPrompt);
        break;

      case 'options-match':
        _handleOptionsMatch(sheet, row, resultCell, allowPrompt);
        break;

      case 'text':
      case 'disable':
      default:
        resultCell.clearDataValidations();
        break;
    }
  }

  /**
   * Core helper to get a source column either from notes or by prompting the user.
   */
  function _getOrPromptSourceCol(resultCell, allowPrompt, title) {
    var note = resultCell.getNote();
    if (note.indexOf('sourceCol:') === 0) {
      return note.replace('sourceCol:', '').trim();
    }

    if (!allowPrompt) return '';

    var ui = SpreadsheetApp.getUi();
    var response = ui.prompt(title, 
      'Please enter the COLUMN LETTER (e.g. B, F, K) containing the source values:', 
      ui.ButtonSet.OK_CANCEL);

    if (response.getSelectedButton() == ui.Button.OK) {
      var sourceCol = response.getResponseText().toUpperCase().replace(/[^A-Z]/g, '');
      if (sourceCol) {
        resultCell.setNote('sourceCol:' + sourceCol);
        return sourceCol;
      }
    }
    return '';
  }

  /**
   * Helper to handle 'select-custom' prompting and persistence.
   */
  function _handleSelectCustom(sheet, row, resultCell, allowPrompt) {
    var sourceCol = _getOrPromptSourceCol(resultCell, allowPrompt, 'Select Custom Range');

    if (sourceCol) {
      try {
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInRange(sheet.getRange(sourceCol + CFG.TEMPLATE_ROW + ":" + sourceCol))
          .setAllowInvalid(false)
          .build();
        resultCell.setDataValidation(rule);
      } catch (e) {
        Logger.log('[utilCustomCells] select-custom error on col ' + sourceCol + ': ' + e.message);
      }
    }
  }

  /**
   * Helper to handle 'options-match' prompting and array generation.
   */
  function _handleOptionsMatch(sheet, row, resultCell, allowPrompt) {
    var sourceCol = _getOrPromptSourceCol(resultCell, allowPrompt, 'Options Match Configuration');

    if (sourceCol) {
      try {
        var range = sheet.getRange(sourceCol + CFG.TEMPLATE_ROW + ":" + sourceCol);
        var values = range.getValues();
        var options = [];
        
        for (var i = 0; i < values.length; i++) {
          var val = String(values[i][0] == null ? '' : values[i][0]).trim();
          if (val !== '') {
            options.push(val);
          }
        }
        
        // Format as JSON array string
        var arrayStr = JSON.stringify(options);
        resultCell.setValue(arrayStr);
        resultCell.clearDataValidations(); // Ensure it's treated as text
      } catch (e) {
        Logger.log('[utilCustomCells] options-match error on col ' + sourceCol + ': ' + e.message);
      }
    }
  }

  return {
    applyAll: applyAll,
    handleEdit: handleEdit
  };

})();
