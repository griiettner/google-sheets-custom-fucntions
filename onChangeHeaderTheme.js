/**
 * Handles the application of distinctive themes (colors, font styles) to the header row
 * based on the sections defined by LibSections.
 */

/**
 * Re-applies header themes to all sheets in the spreadsheet.
 */
function changeHeaderThemeAll(ctx) {
  var ss = (ctx && ctx.ss) ? ctx.ss : SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    changeHeaderTheme({ sheet: sheets[i] });
  }
}

/**
 * Applies PRIMARY, SECONDARY, and TERTIARY themes to the header row (Row 1).
 * 
 * Logic flow:
 * 1. Enforce structural boundaries (frozen rows/cols, delimiter protection).
 * 2. Get the logical layout of sections.
 * 3. Paint each section with its configured background/foreground colors.
 * 4. Clear styles on delimiter columns for visibility.
 * 
 * @param {Object} ctx Context object containing the target sheet.
 */
function changeHeaderTheme(ctx) {
  var sheet = ctx.sheet;
  if (!sheet) return;
  var headerRow = CFG.HEADER_ROW;

  // 1. Structure: Ensure columns are correct widths and protected before painting
  LibSections.enforceBoundaries(sheet);

  // 2. Discovery: Get the exact coordinates of Primary, Secondary, and Tertiary islands
  var layout = LibSections.getLayout(sheet);
  Logger.log('[changeHeaderTheme] Processing sheet: ' + sheet.getName());

  // --- PAINTING LOGIC ---

  // 1. PRIMARY Block (Blue)
  if (layout.primary && layout.primary.end >= layout.primary.start) {
     var pRange = sheet.getRange(headerRow, layout.primary.start, 1, layout.primary.end - layout.primary.start + 1);
     utilApplyHeaderStyle(pRange, { bg: CFG.PRIMARY_BG, fg: CFG.PRIMARY_FG });
  }

  // 2. DELIMITER 1 (Clear style for the gap)
  if (layout.delimiter1) {
     utilClearHeaderStyle(sheet.getRange(headerRow, layout.delimiter1.col));
  }

  // 3. SECONDARY Block (Red)
  if (layout.secondary && layout.secondary.end >= layout.secondary.start) {
     var sRange = sheet.getRange(headerRow, layout.secondary.start, 1, layout.secondary.end - layout.secondary.start + 1);
     utilApplyHeaderStyle(sRange, { bg: CFG.SECONDARY_BG, fg: CFG.SECONDARY_FG });
  }

  // 4. DELIMITER 2 (Clear style for the gap)
  if (layout.delimiter2) {
     utilClearHeaderStyle(sheet.getRange(headerRow, layout.delimiter2.col));
  }

  // 5. TERTIARY Block (Grey)
  if (layout.tertiary && layout.tertiary.end >= layout.tertiary.start) {
     var tRange = sheet.getRange(headerRow, layout.tertiary.start, 1, layout.tertiary.end - layout.tertiary.start + 1);
     utilApplyHeaderStyle(tRange, { bg: CFG.TERTIARY_BG, fg: CFG.TERTIARY_FG });
  }
}
