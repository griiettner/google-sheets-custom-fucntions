/**
 * utilCustomCells: Manages highly specific row-level validation and logic
 * that goes beyond simple template copying.
 */
var utilCustomCells = (function () {

  var HEADERS = {
    TYPES: 'Types',
    ACTIONS: 'Actions'
  };

  /**
   * Main entry point to enforce custom cell rules across a sheet.
   */
  function applyAll(sheet) {
    if (!sheet) return;
    
    var layout = LibSections.getLayout(sheet);
    if (!layout.primary) return;

    var globalLastRow = sheet.getLastRow();
    var startRow = CFG.TEMPLATE_ROW;

    // 1. Calculate section-specific last row (same logic as zebra logic)
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
    }
    
    return map;
  }

  /**
   * General purpose validation applier for custom cells.
   * Handles both vertical and horizontal ranges from the settings sheet.
   */
  function _applyValidation(sheet, colIndex, lastRow, settingsRangeA1) {
    var maxRows = sheet.getMaxRows();
    var startRow = CFG.TEMPLATE_ROW;
    
    if (maxRows < startRow) return;

    // 1. Apply validation to the content area
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

    // 2. Clear validation for everything below the content area (Cleanup)
    var cleanupStart = Math.max(startRow, lastRow + 1);
    var cleanupNumRows = maxRows - cleanupStart + 1;
    
    if (cleanupNumRows > 0) {
      sheet.getRange(cleanupStart, colIndex, cleanupNumRows, 1).clearDataValidations();
    }
  }

  return {
    applyAll: applyAll
  };

})();
