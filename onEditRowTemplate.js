/**
 * Handles formatting for newly edited rows.
 * 
 * Responsibilities:
 * 1. Boundary Enforcement: Blocks merges across section dividers.
 * 2. Section Separators: Automatically styles merged horizontal ranges as color-coded separators.
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
  if (ctx.range.isPartOfMerge()) {
    var sectionName = validation.section;
    var layout = LibSections.getLayout(sheet);
    var section = layout[sectionName.toLowerCase()];

    if (section) {
      var cellVal = String(ctx.range.getValue() || '').trim();
      var currentBg = String(ctx.range.getBackground() || '').toLowerCase();
      
      // REVERSION LOGIC: If a STYLED separator is cleared, revert it.
      var isSeparatorStyled = (
        currentBg === String(SEPARATOR.PRIMARY_BG).toLowerCase() ||
        currentBg === String(SEPARATOR.SECONDARY_BG).toLowerCase() ||
        currentBg === String(SEPARATOR.TERTIARY_BG).toLowerCase()
      );

      if (cellVal === '' && isSeparatorStyled) {
        var fullSectionRowRange = sheet.getRange(row, section.start, 1, section.end - section.start + 1);
        
        // 1. Dismantle: Unmerge the full section span and reset visual styles
        fullSectionRowRange.breakApart()
                 .setBackground(null)
                 .setFontColor(null)
                 .setFontWeight('normal')
                 .setHorizontalAlignment('left')
                 .setVerticalAlignment('middle')
                 .setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID);
        
        // 2. Cleanup: Clear any content that might have been left over (should be empty already)
        fullSectionRowRange.clearContent();
        
        return; 
      }

      // Choose the palette matching the section the merge sits in.
      var bg, fg;
      switch (sectionName) {
        case 'PRIMARY':   bg = SEPARATOR.PRIMARY_BG;   fg = SEPARATOR.PRIMARY_FG;   break;
        case 'SECONDARY': bg = SEPARATOR.SECONDARY_BG; fg = SEPARATOR.SECONDARY_FG; break;
        case 'TERTIARY':  bg = SEPARATOR.TERTIARY_BG;  fg = SEPARATOR.TERTIARY_FG;  break;
      }

      if (bg && fg) {
        ctx.range.setBackground(bg)
          .setFontColor(fg)
          .setFontWeight('bold')
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle');
      }
    }
    return;
  }
}
