/**
 * Row Height and Global Formatting Handler
 * 
 * Manages the consistent vertical spacing and basic typography of the spreadsheet.
 */

/**
 * Iterates through all sheets and applies standard row heights.
 */
function changeRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; ss && i < sheets.length; i++) {
    changeRowsOnSheet_(sheets[i]);
  }
}

/**
 * Standardizes row heights and common text formatting across a whole sheet.
 * 
 * Logic:
 * 1. Set Header Row height (40px).
 * 2. Set all other rows to standard height (30px).
 * 3. Apply global font family and centering to all data-containing rows.
 */
function changeRowsOnSheet_(sheet) {
  if (!sheet) return;

  var maxRows = sheet.getMaxRows();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // --- 1. SET VERTICAL SPACING ---
  
  // Header row is slightly taller for visual emphasis
  sheet.setRowHeight(CFG.HEADER_ROW, CFG.HEADER_ROW_HEIGHT);

  // All other rows follow the standard 30px density
  if (maxRows > 1) {
    sheet.setRowHeights(2, maxRows - 1, CFG.ROW_HEIGHT);
  }

  // --- 2. GLOBAL FORMATTING ---

  // Only apply expensive formatting to the range that actually has content
  if (lastRow > 1 && lastCol > 0) {
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    
    dataRange.setFontFamily(CFG.FONT_FAMILY)
             .setVerticalAlignment('middle')
             .setHorizontalAlignment('center');
  }
}
