/**
 * Orchestrates the application of custom cell logic (dropdowns, specialized validations)
 * across all sheets or a single sheet.
 */

/**
 * Applies custom cell logic to all sheets in the spreadsheet.
 */
function changeCustomCellsAll(ctx) {
  var ss = (ctx && ctx.ss) ? ctx.ss : SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  for (var i = 0; i < sheets.length; i++) {
    changeCustomCells({ sheet: sheets[i] });
  }
}

/**
 * Applies custom cell logic to a single sheet.
 */
function changeCustomCells(ctx) {
  var sheet = ctx.sheet;
  if (!sheet) return;
  if (sheet.getName() === CFG.SETTINGS_SHEET_NAME) return;

  // Delegate the logic to the dedicated CustomCells library
  utilCustomCells.applyAll(sheet);
}
