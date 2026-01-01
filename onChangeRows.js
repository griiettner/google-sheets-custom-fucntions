function changeRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    changeRowsOnSheet_(sheets[i]);
  }
}

function changeRowsOnSheet_(sheet) {
  var headerRow = CFG.HEADER_ROW;
  var indentFormat = '- #,##0.00 ; - #,##0.00 ; 0.00 ; @ ';

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  // Using maxRows to ensure even empty rows get the correct height
  var maxRows = sheet.getMaxRows();

  // --------------------
  // Header row (row 1)
  // --------------------
  sheet.setRowHeight(headerRow, CFG.HEADER_ROW_HEIGHT);

  if (lastCol > 0) {
    sheet
      .getRange(headerRow, 1, 1, lastCol)
      .setFontSize(11)
      .setFontWeight('bold')
      .setFontFamily(CFG.FONT_FAMILY)
      .setVerticalAlignment('middle')
      .setNumberFormat(indentFormat);
  }

  // --------------------
  // Data rows (All remaining rows)
  // --------------------
  if (maxRows > headerRow) {
    // Set row heights for ALL rows
    sheet.setRowHeights(headerRow + 1, maxRows - headerRow, CFG.ROW_HEIGHT);
  }

  // Only apply expensive formatting (font, alignment) to rows with data
  if (lastRow > headerRow && lastCol > 0) {
    sheet
      .getRange(headerRow + 1, 1, lastRow - headerRow, lastCol)
      .setFontFamily(CFG.FONT_FAMILY)
      .setVerticalAlignment('middle')
      .setNumberFormat(indentFormat);
  }
}

