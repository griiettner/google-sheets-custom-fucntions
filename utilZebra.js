/**
 * Finds the last row (>= startRow) that has ANY non-empty cell in the given column window.
 * Returns 0 if no data found.
 */
function utilLastDataRow_(sheet, startRow, startCol, numRows, numCols) {
  if (numRows <= 0 || numCols <= 0) return 0;

  var values = sheet.getRange(startRow, startCol, numRows, numCols).getValues();

  for (var r = values.length - 1; r >= 0; r--) {
    var row = values[r];
    for (var c = 0; c < row.length; c++) {
      if (String(row[c] == null ? '' : row[c]).trim() !== '') {
        return startRow + r;
      }
    }
  }
  return 0;
}

/**
 * Applies zebra striping on a rectangular range. Row parity is based on the section's startRow,
 * so each section starts its own zebra pattern (your requirement).
 */
function utilApplyZebra_(sheet, startRow, endRow, startCol, endCol, colorA, colorB) {
  if (endRow < startRow) return;
  if (endCol < startCol) return;

  var numRows = endRow - startRow + 1;
  var numCols = endCol - startCol + 1;

  // Build 2D background matrix for speed (single setBackgrounds call)
  var backgrounds = [];
  for (var r = 0; r < numRows; r++) {
    var bg = (r % 2 === 0) ? colorA : colorB;
    var row = [];
    for (var c = 0; c < numCols; c++) row.push(bg);
    backgrounds.push(row);
  }

  sheet.getRange(startRow, startCol, numRows, numCols).setBackgrounds(backgrounds);
}

/**
 * Clears backgrounds for a rectangular range (used if you want to "reset" zebra).
 * (Not called by default.)
 */
function utilClearBackground_(sheet, startRow, endRow, startCol, endCol) {
  if (endRow < startRow) return;
  if (endCol < startCol) return;

  sheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1).setBackground(null);
}
