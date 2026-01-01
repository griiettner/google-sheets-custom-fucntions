/**
 * Utility Functions
 * 
 * General purpose helpers for text normalization, theme retrieval, 
 * and low-level range styling.
 */

/**
 * Strips whitespace and handles null/undefined values for safer text comparisons.
 */
function utilNormalizeText(v) {
  return String(v == null ? '' : v).trim();
}

/**
 * Maps section names (including legacy aliases) to their background/foreground color pairs.
 */
function utilGetTheme(name) {
  var nameClean = utilNormalizeText(name).toUpperCase();
  
  if (nameClean === 'SECONDARY' || nameClean === 'OPT') {
    return { bg: CFG.SECONDARY_BG, fg: CFG.SECONDARY_FG };
  }
  
  if (nameClean === 'TERTIARY' || nameClean === 'GREY') {
    return { bg: CFG.TERTIARY_BG, fg: CFG.TERTIARY_FG };
  }
  
  // Default to Primary
  return { bg: CFG.PRIMARY_BG, fg: CFG.PRIMARY_FG };
}

/**
 * Low-level function to apply the premium header look:
 * Background Color, White Text, Bold, and Centered.
 */
function utilApplyHeaderStyle(range, theme) {
  if (!range || !theme) return;
  range.setBackground(theme.bg)
    .setFontColor(theme.fg)
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
}

/**
 * Clears custom formatting from a range (resets to default sheet styling).
 */
function utilClearHeaderStyle(range) {
  if (!range) return;
  range.setBackground(null)
    .setFontColor(null)
    .setFontWeight('normal')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
}

/**
 * Deep copies formatting and data validation from a template row to a target row.
 * Used for initializing new rows added by the user.
 */
function utilApplyRowTemplate_(sheet, templateRow, targetRow, lastCol) {
  if (!sheet || !lastCol) return;
  
  var templateRange = sheet.getRange(templateRow, 1, 1, lastCol);
  var targetRange = sheet.getRange(targetRow, 1, 1, lastCol);

  // Preserve user-entered data before overwriting the row with template formatting
  var existingValues = targetRange.getValues();

  // 1) Physical Style Transfer: Copy borders, colors, font settings
  templateRange.copyFormatToRange(sheet, 1, lastCol, targetRow, targetRow);

  // 2) Functional Transfer: Copy dropdowns and data validation rules
  var dvs = templateRange.getDataValidations(); 
  targetRange.setDataValidations(dvs);

  // 3) Restore Data: Re-apply the user's data so the format copy doesn't wipe their entry
  targetRange.setValues(existingValues);
}
