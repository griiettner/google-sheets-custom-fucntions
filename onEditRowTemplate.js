/**
 * Handles formatting for newly edited rows.
 * 
 * Responsibilities:
 * 1. Boundary Enforcement: Blocks merges across section dividers.
 * 2. Section Separators: Automatically styles merged horizontal ranges as color-coded separators.
 * 3. Data Validation: Automatically copies dropdowns/logic from the Template Row to new rows.
 */
function editRowTemplate(ctx) {
  var sheet = ctx.sheet;
  var row = ctx.row;

  // Safety: Ignore headers and system-specific sheets
  if (row <= CFG.HEADER_ROW) return;
  if (sheet.getName() === CFG.SETTINGS_SHEET_NAME) return;

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  // --- 1. RIGID BOUNDARY ENFORCEMENT ---
  // Ensure the edit doesn't bridge a delimiter or touch protected sections.
  var validation = LibSections.validateRange(sheet, ctx.range);
  
  if (!validation.valid) {
    Logger.log('[editRowTemplate] Action Blocked: ' + validation.reason);
    
    // If the user tried to merge across sections, break the merge and alert them.
    if (ctx.range.isPartOfMerge()) {
      ctx.range.breakApart();
      SpreadsheetApp
        .getUi()
        .alert('Section Integrity Violation: You cannot merge cells across section dividers.');
    }
    return;
  }

  // --- 2. DYNAMIC SECTION SEPARATORS ---
  // If the user merges cells COMPLETELY WITHIN a single section, we style it as a visual separator.
  if (ctx.range.isPartOfMerge()) {
    var bg, fg;
    
    // Choose the palette matching the section the merge sits in.
    switch (validation.section) {
      case 'PRIMARY':
        bg = SEPARATOR.PRIMARY_BG;
        fg = SEPARATOR.PRIMARY_FG;
        break;
      case 'SECONDARY':
        bg = SEPARATOR.SECONDARY_BG;
        fg = SEPARATOR.SECONDARY_FG;
        break;
      case 'TERTIARY':
        bg = SEPARATOR.TERTIARY_BG;
        fg = SEPARATOR.TERTIARY_FG;
        break;
    }

    if (bg && fg) {
      ctx.range.setBackground(bg)
        .setFontColor(fg)
        .setFontWeight('bold')
        .setHorizontalAlignment('left')
        .setVerticalAlignment('middle');
    }
    
    // Stop: separators do not inherit normal row validation/formatting
    return;
  }

  // --- 3. AUTO-INITIALIZATION OF NEW ROWS ---
  // If the row lacks data validation in the 'template check' column, it's a new row.
  // We sync its formatting and logic with the global Template Row definition.
  var checkCol = CFG.TEMPLATE_CHECK_COL;
  var templateRow = CFG.TEMPLATE_ROW;

  // Ensure the template row itself exists
  if (sheet.getLastRow() < templateRow) return;

  var templateDv = sheet.getRange(templateRow, checkCol).getDataValidation();
  if (!templateDv) return;

  var currentDv = sheet.getRange(row, checkCol).getDataValidation();
  if (currentDv) return; // Already initialized

  // Synchronize the row formatting and logic
  utilApplyRowTemplate_(sheet, templateRow, row, lastCol);
}
