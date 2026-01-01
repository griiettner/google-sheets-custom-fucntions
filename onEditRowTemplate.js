function editRowTemplate(ctx) {
  var sheet = ctx.sheet;
  var row = ctx.row;

  // Ignore header + settings sheet
  if (row <= CFG.HEADER_ROW) return;
  if (sheet.getName() === CFG.SETTINGS_SHEET_NAME) return;

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  // ---------------------------------------------------------
  // 1. Separator Logic (Merged Rows)
  // ---------------------------------------------------------
  // If the edited range is merged, we treat it as a Separator trigger
  if (ctx.range.isPartOfMerge()) {
    var headerRow = CFG.HEADER_ROW;
    
    // We need the layout to know which section we are in
    var values = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    var layout = utilComputeLayout_(values, lastCol);
    
    var startCol = ctx.range.getColumn();
    // Use heuristic to determine section based on start column
    
    var bg, fg;

    // Check overlaps
    // MAIN is usually on the left (starts at 1)
    if (layout.mainEnd > 0 && startCol <= layout.mainEnd) {
      bg = SEPARATOR.MAIN_BG;
      fg = SEPARATOR.MAIN_FG;
    } 
    // OPTIONAL is in the middle/right
    else if (layout.optStart && startCol >= layout.optStart) {
      if (layout.optEnd && startCol <= layout.optEnd) {
         bg = SEPARATOR.OPT_BG;
         fg = SEPARATOR.OPT_FG;
      } else {
         // Could be the gap or after optional?
         // User specified "Main", "Optional", "Grey".
         // If it's strictly > optEnd, it's Grey.
         if (startCol > layout.optEnd) {
            bg = SEPARATOR.GREY_BG;
            fg = SEPARATOR.GREY_FG;
         } else {
            // Gap or unknown. Defaulting to Grey or ignoring?
            // Let's assume Grey for "rest".
            bg = SEPARATOR.GREY_BG;
            fg = SEPARATOR.GREY_FG;
         }
      }
    } 
    // GREY (if no optional, or if startCol is passed main)
    else {
      bg = SEPARATOR.GREY_BG;
      fg = SEPARATOR.GREY_FG;
    }

    if (bg && fg) {
      ctx.range
        .setBackground(bg)
        .setFontColor(fg)
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
    }
    
    // Stop: Do not apply the normal row template to a separator
    return;
  }

  // ---------------------------------------------------------
  // 2. Normal Row Template Logic (Uninitialized Rows)
  // ---------------------------------------------------------

  // Only run if the edited row appears to be "uninitialized"
  // We check a column that should always have a dropdown (e.g., Type col B)
  var checkCol = CFG.TEMPLATE_CHECK_COL;
  var templateRow = CFG.TEMPLATE_ROW;

  // If we don't have a template row (sheet too small), stop
  if (sheet.getLastRow() < templateRow) return;

  var templateDv = sheet.getRange(templateRow, checkCol).getDataValidation();
  if (!templateDv) return; // template itself has no validation -> nothing to copy

  var currentDv = sheet.getRange(row, checkCol).getDataValidation();
  if (currentDv) return; // already has dropdowns -> already initialized

  utilApplyRowTemplate_(sheet, templateRow, row, lastCol);
}
