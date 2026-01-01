function editRowTemplate(ctx) {
  var sheet = ctx.sheet;
  var row = ctx.row;

  // Ignore header + settings sheet
  if (row <= CFG.HEADER_ROW) return;
  if (sheet.getName() === CFG.SETTINGS_SHEET_NAME) return;

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  // ---------------------------------------------------------
  // 1. Strict Boundary Check
  // ---------------------------------------------------------
  // Ensure the edit does not cross into a delimiter or span multiple sections.
  var validation = LibSections.validateRange(sheet, ctx.range);
  if (!validation.valid) {
    Logger.log('[editRowTemplate] Invalid Range: ' + validation.reason);
    
    // Attempt to undo the action if it was a Merge that crossed boundaries
    // Note: Script cannot easily "Undo" user actions perfectly, but we can try to unmerge
    if (ctx.range.isPartOfMerge()) {
       ctx.range.breakApart();
       SpreadsheetApp.getUi().alert('Action Blocked: You cannot merge cells across section dividers.');
    }
    return;
  }

  // ---------------------------------------------------------
  // 2. Separator Logic (Merged Rows)
  // ---------------------------------------------------------
  // If the edited range is merged, we treat it as a Separator trigger
  if (ctx.range.isPartOfMerge()) {
    // Determine section from validation result or re-query
    // validation.section should return 'PRIMARY', 'SECONDARY', or 'TERTIARY'
    
    var bg, fg;
    
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
        default:
            // Should not happen if valid, but safe fallback
            bg = SEPARATOR.TERTIARY_BG;
            fg = SEPARATOR.TERTIARY_FG;
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
  // 3. Normal Row Template Logic (Uninitialized Rows)
  // ---------------------------------------------------------
  // Only run if the edited row appears to be "uninitialized"
  var checkCol = CFG.TEMPLATE_CHECK_COL;
  var templateRow = CFG.TEMPLATE_ROW;

  if (sheet.getLastRow() < templateRow) return;

  var templateDv = sheet.getRange(templateRow, checkCol).getDataValidation();
  if (!templateDv) return;

  var currentDv = sheet.getRange(row, checkCol).getDataValidation();
  if (currentDv) return; 

  utilApplyRowTemplate_(sheet, templateRow, row, lastCol);
}
