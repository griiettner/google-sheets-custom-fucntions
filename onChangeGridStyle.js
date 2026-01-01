function changeGridStyleAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheets().forEach(function (sheet) {
    changeGridStyle({ sheet: sheet });
  });
}

function changeGridStyle(ctx) {
  Logger.log('[changeGridStyle] Called.');
  var sheet = ctx.sheet;
  if (!sheet) {
    Logger.log('[changeGridStyle] Error: No sheet provided in context.');
    return;
  }
  Logger.log('[changeGridStyle] Sheet Name: ' + sheet.getName());

  // Optional: hide default gridlines so you only see your custom "white grid"
  sheet.setHiddenGridlines(true);

  // Use Max dimensions to cover the whole visible sheet, not just content
  var maxRow = sheet.getMaxRows();
  var maxCol = sheet.getMaxColumns();
  Logger.log('[changeGridStyle] Dimensions: ' + maxRow + ' rows x ' + maxCol + ' cols.');

  var range = sheet.getRange(1, 1, maxRow, maxCol);

  // Draw a full grid using borders (white)
  range.setBorder(
    true, true, true, true,  // top, left, bottom, right
    true, true,              // vertical, horizontal
    '#ffffff',               // border color
    SpreadsheetApp.BorderStyle.SOLID
  );
  Logger.log('[changeGridStyle] Borders applied.');
}
