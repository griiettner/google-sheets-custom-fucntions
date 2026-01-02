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


