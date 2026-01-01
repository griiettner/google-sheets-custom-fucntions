function editDependentCell(e, actionValue, dependentCell) {
  const ss = e.source;
  const settingsSheet = ss.getSheetByName(CFG.SETTINGS_SHEET_NAME);

  if (!settingsSheet) {
    SpreadsheetApp.getUi().alert(`Error: ${CFG.SETTINGS_SHEET_NAME} not found.`);
    return;
  }

  // Special cases: "None" or "Click" → clear and set to "NULL"
  if (actionValue === CFG.TEXT_NONE || actionValue === CFG.TEXT_CLICK) {
    dependentCell.clearDataValidations();
    dependentCell.setValue("NULL");
    return;
  }

  // Get headers from settings sheet (row 1, starting at CFGured column)
  const lastCol = settingsSheet.getLastColumn();
  const headers = settingsSheet.getRange(1, CFG.SETTINGS_START_COL, 1, lastCol - CFG.SETTINGS_START_COL + 1).getValues()[0];

  const colIndex = headers.indexOf(actionValue);
  if (colIndex === -1) return;  // Action not found in headers → do nothing

  const sourceCol = CFG.SETTINGS_START_COL + colIndex;
  const lastRow = settingsSheet.getLastRow();

  if (lastRow < 2) return;  // No data rows

  // Build range from row 2 down to last row in the matched column
  const sourceRange = settingsSheet.getRange(2, sourceCol, lastRow - 1, 1);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(sourceRange)
    .setAllowInvalid(true)  // Allows temporary invalid entries
    .setHelpText(`Select from the list for ${actionValue}.`)
    .build();

  dependentCell.setDataValidation(rule);
  dependentCell.setValue(`-- Select a ${actionValue} option --`);
}