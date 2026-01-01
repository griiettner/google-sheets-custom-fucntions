function utilNormalizeText(v) {
  return String(v == null ? '' : v).trim();
}

function utilGetTheme(name) {
  if (name === 'SECONDARY' || name === 'OPT') return { bg: CFG.SECONDARY_BG, fg: CFG.SECONDARY_FG };
  if (name === 'TERTIARY' || name === 'GREY') return { bg: CFG.TERTIARY_BG, fg: CFG.TERTIARY_FG };
  return { bg: CFG.PRIMARY_BG, fg: CFG.PRIMARY_FG };
}

function utilApplyHeaderStyle(range, theme) {
  range.setBackground(theme.bg).setFontColor(theme.fg);
}

function utilClearHeaderStyle(range) {
  range.setBackground(null).setFontColor(null);
}

function utilRowStyle(sheet) {

}

function utilApplyRowTemplate_(sheet, templateRow, targetRow, lastCol) {
  var templateRange = sheet.getRange(templateRow, 1, 1, lastCol);
  var targetRange = sheet.getRange(targetRow, 1, 1, lastCol);

  // Preserve anything the user already typed in that row
  var existingValues = targetRange.getValues();

  // 1) Copy formatting from template row -> target row
  templateRange.copyFormatToRange(sheet, 1, lastCol, targetRow, targetRow);

  // 2) Copy data validations (dropdowns)
  var dvs = templateRange.getDataValidations(); // 2D array
  targetRange.setDataValidations(dvs);

  // 3) Restore user-entered values (so we don't overwrite what they just typed)
  targetRange.setValues(existingValues);
}

