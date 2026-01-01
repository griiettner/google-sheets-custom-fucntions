function changeHeaderThemeAll(ctx) {
  var ss = (ctx && ctx.ss) ? ctx.ss : SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    changeHeaderTheme({ sheet: sheets[i] });
  }
}

function changeHeaderTheme(ctx) {
  var sheet = ctx.sheet;
  if (!sheet) return;
  var headerRow = CFG.HEADER_ROW;

  var lastCol = sheet.getLastColumn();
  Logger.log('[changeHeaderTheme] Sheet: ' + sheet.getName() + ' LastCol: ' + lastCol);

  if (lastCol < 1) {
    // New/Empty sheet: Default A1 to MAIN theme
    Logger.log('[changeHeaderTheme] Empty sheet detected. Styling A1 as MAIN.');
    utilApplyHeaderStyle(sheet.getRange(headerRow, 1), utilGetTheme('MAIN'));
    return;
  }

  var values = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];

  var layout = utilComputeLayout_(values, lastCol);

  // ---- MAIN block (1..mainEnd) ----
  if (layout.mainEnd > 0) {
    utilApplyHeaderStyle(
      sheet.getRange(headerRow, 1, 1, layout.mainEnd),
      utilGetTheme('MAIN')
    );
  }

  // ---- GAP between MAIN and OPTIONAL (gapStart..gapEnd) ----
  if (layout.gapStart && layout.gapEnd && layout.gapEnd >= layout.gapStart) {
    for (var c = layout.gapStart; c <= layout.gapEnd; c++) {
      var t = utilNormalizeText(values[c - 1]);

      if (!t) {
        // keep blank gap columns blank (no formatting)
        utilClearHeaderStyle(sheet.getRange(headerRow, c));
        continue;
      }

      // Filled gap column: inherit MAIN if closer to MAIN, OPT if closer to OPT
      var themeName = utilChooseGapTheme_(layout, c);
      if (themeName) {
        utilApplyHeaderStyle(sheet.getRange(headerRow, c), utilGetTheme(themeName));
      } else {
        // ambiguous -> leave blank (no formatting)
        utilClearHeaderStyle(sheet.getRange(headerRow, c));
      }
    }
  }

  // ---- OPTIONAL block (optStart..optEnd) ----
  if (layout.optStart) {
    utilApplyHeaderStyle(
      sheet.getRange(headerRow, layout.optStart, 1, layout.optEnd - layout.optStart + 1),
      utilGetTheme('OPT')
    );
  }

  // ---- After OPTIONAL: text => GREY, blanks stay blank ----
  var afterStart = layout.optStart ? (layout.optEnd + 1) : (layout.mainEnd + 1);
  if (afterStart < 1) afterStart = 1;

  for (var j = afterStart; j <= lastCol; j++) {
    // Don’t override MAIN or OPT block columns
    if (j <= layout.mainEnd) continue;
    if (layout.optStart && j >= layout.optStart && j <= layout.optEnd) continue;
    if (layout.gapStart && j >= layout.gapStart && j <= layout.gapEnd) continue;

    var txt = utilNormalizeText(values[j - 1]);
    if (!txt) {
      utilClearHeaderStyle(sheet.getRange(headerRow, j));
      continue;
    }
    utilApplyHeaderStyle(sheet.getRange(headerRow, j), utilGetTheme('GREY'));
  }
}
