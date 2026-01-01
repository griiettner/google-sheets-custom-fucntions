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

  // Boundary Enforcement (Protect delimiters, etc.)
  // We can do this here or separately. Doing it here ensures structure exists before painting by color.
  LibSections.enforceBoundaries(sheet);

  var layout = LibSections.getLayout(sheet);
  Logger.log('[changeHeaderTheme] Layout: ' + JSON.stringify(layout));

  // 1. PRIMARY Block
  if (layout.primary && layout.primary.end >= layout.primary.start) {
     var pRange = sheet.getRange(headerRow, layout.primary.start, 1, layout.primary.end - layout.primary.start + 1);
     utilApplyHeaderStyle(pRange, { bg: CFG.PRIMARY_BG, fg: CFG.PRIMARY_FG });
  }

  // 2. DELIMITER 1
  if (layout.delimiter1) {
     utilClearHeaderStyle(sheet.getRange(headerRow, layout.delimiter1.col));
  }

  // 3. SECONDARY Block
  if (layout.secondary && layout.secondary.end >= layout.secondary.start) {
     var sRange = sheet.getRange(headerRow, layout.secondary.start, 1, layout.secondary.end - layout.secondary.start + 1);
     utilApplyHeaderStyle(sRange, { bg: CFG.SECONDARY_BG, fg: CFG.SECONDARY_FG });
  }

  // 4. DELIMITER 2
  if (layout.delimiter2) {
     utilClearHeaderStyle(sheet.getRange(headerRow, layout.delimiter2.col));
  }

  // 5. TERTIARY Block (Rest)
  if (layout.tertiary && layout.tertiary.end >= layout.tertiary.start) {
     var tRange = sheet.getRange(headerRow, layout.tertiary.start, 1, layout.tertiary.end - layout.tertiary.start + 1);
     utilApplyHeaderStyle(tRange, { bg: CFG.TERTIARY_BG, fg: CFG.TERTIARY_FG });
  }
}
