/**
 * Orchestrates the application of zebra striping across all sheets or a single sheet.
 * Uses LibRows for the actual section-independent logic.
 */

/**
 * Applies zebra striping to all sheets in the spreadsheet.
 */
function changeZebraThemeAll(ctx) {
  var ss = (ctx && ctx.ss) ? ctx.ss : SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  for (var i = 0; i < sheets.length; i++) {
    changeZebraTheme({ sheet: sheets[i] });
  }
}

/**
 * Applies independent zebra striping to a single sheet.
 * 
 * @param {Object} ctx Context containing the target sheet.
 */
function changeZebraTheme(ctx) {
  var sheet = ctx.sheet;
  if (!sheet) return;

  // Delegate the logic to the dedicated Rows library
  LibRows.applyZebraAll(sheet);
}
