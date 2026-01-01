function editCustomSelect(sheet, dependentCell) {
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt(
    'Custom Select Source',
    'Enter the column letter (e.g., J) for your options:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const colLetter = response.getResponseText().toUpperCase().trim();

  if (colLetter.match(/^[A-Z]{1}$/)) {  // Supports A thru Z only (single column)
    const sourceRange = sheet.getRange(`${colLetter}2:${colLetter}`);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sourceRange)
      .setAllowInvalid(false)
      .setHelpText(`Select from column $${colLetter}.`)
      .build();

    dependentCell.setDataValidation(rule);
    dependentCell.setValue(`-- Select from Col $${colLetter} --`);
  } else {
    ui.alert('Invalid column letter. Please enter A-Z.');
  }
}