/**
 * White Grid Style Handler
 * 
 * Replaces the default grey Google Sheets gridlines with custom white borders.
 * This provides a cleaner 'Application' look while maintaining the benefit of visible cell boundaries.
 */

/**
 * Iterates through all sheets and applies the white grid style.
 */
function changeGridStyleAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; ss && i < sheets.length; i++) {
    changeGridStyle(sheets[i]);
  }
}

/**
 * Applies white borders to every cell in the sheet and hides the default system gridlines.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The target sheet.
 */
function changeGridStyle(sheet) {
  if (!sheet) return;
  
  Logger.log('[changeGridStyle] Applying white grid to: ' + sheet.getName());

  // Use getMaxRows/Cols to ensure the border reaches the very edge of the 'canvas'
  var rows = sheet.getMaxRows();
  var cols = sheet.getMaxColumns();
  
  // Hide the standard browser grid
  sheet.setHiddenGridlines(true);

  // Apply custom white borders to the entire sheet range
  var fullRange = sheet.getRange(1, 1, rows, cols);
  
  fullRange.setBorder(
    true, true, true, true, true, true, 
    '#ffffff', 
    SpreadsheetApp.BorderStyle.SOLID
  );
}
