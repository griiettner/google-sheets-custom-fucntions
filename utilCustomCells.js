/**
 * utilCustomCells: Manages highly specific row-level validation and logic
 * that goes beyond simple template copying.
 */
var utilCustomCells = (function () {

  var HEADERS = {
    TYPES: 'Types'
  };

  /**
   * Main entry point to enforce custom cell rules across a sheet.
   */
  function applyAll(sheet) {
    if (!sheet) return;
    
    var layout = LibSections.getLayout(sheet);
    if (!layout.primary) return;

    var lastRow = sheet.getLastRow();
    if (lastRow < CFG.TEMPLATE_ROW) return;

    // 1. Find Column Indices
    var colMap = _getColumnMap(sheet, layout.primary);
    
    // 2. Apply "Types" (FIELD_TYPE) Logic
    if (colMap.types) {
      _applyFieldTypeValidation(sheet, colMap.types, lastRow);
    }
    
    // Space for future custom cells (e.g. colMap.other...)
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
    }
    
    return map;
  }

  /**
   * Applies the Data Validation rule for Field Types.
   * Rule: =SETTINGS_FIELD!$A$2:$A
   */
  function _applyFieldTypeValidation(sheet, colIndex, lastRow) {
    var numRows = lastRow - CFG.TEMPLATE_ROW + 1;
    if (numRows < 1) return;
    
    var range = sheet.getRange(CFG.TEMPLATE_ROW, colIndex, numRows, 1);
    var settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SETTINGS_SHEET_NAME);
    
    if (!settingsSheet) {
      Logger.log('[utilCustomCells] Error: Settings sheet not found: ' + CFG.SETTINGS_SHEET_NAME);
      return;
    }

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(settingsSheet.getRange("A2:A"))
      .setAllowInvalid(false)
      .build();
      
    range.setDataValidation(rule);
  }

  return {
    applyAll: applyAll
  };

})();
