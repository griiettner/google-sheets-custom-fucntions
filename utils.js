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
 * Deep copies formatting and data validation from a template row to a target row within specific column bounds.
 * Used for initializing new rows and restoring section columns after separator removal.
 */
function utilApplyRowTemplate_(sheet, templateRow, targetRow, startCol, endCol) {
  if (!sheet || !startCol || !endCol) return;
  
  var numCols = endCol - startCol + 1;
  var templateRange = sheet.getRange(templateRow, startCol, 1, numCols);
  var targetRange = sheet.getRange(targetRow, startCol, 1, numCols);

  // Preserve user-entered data
  var existingValues = targetRange.getValues();

  // 1) Physical Style Transfer (Restricted to section boundaries)
  templateRange.copyFormatToRange(sheet, startCol, endCol, targetRow, targetRow);

  // 2) Functional Transfer: Copy dropdowns and rules
  var dvs = templateRange.getDataValidations(); 
  targetRange.setDataValidations(dvs);

  // 3) Restore Data
  targetRange.setValues(existingValues);
}
