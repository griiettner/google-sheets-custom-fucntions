function onEdit(e) {
  if (!e || !e.range) return;
  
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  Logger.log(range)
  Logger.log(sheet)
  Logger.log(sheetName)

  var ctx = editContext(e);
  editHeaderTheme(ctx);
  editZebraTheme(ctx);
  changeRows();
  editRowTemplate(ctx);

  // 1. Validation: Only run if correct column and not the settings sheet
  if (range.getColumn() !== CFG.ACTION_COL || sheetName === CFG.SETTINGS_SHEET_NAME) {
    return;
  }

  var actionValue = e.value;
  const dependentCell = sheet.getRange(range.getRow(), CFG.DEPENDENT_COL);

  // 2. Initial Reset
  dependentCell.clearDataValidations();
  dependentCell.clearContent();

  // 3. Router: Route to specific logic handlers
  if (!actionValue) return;

  switch (actionValue) {
    case CFG.TEXT_MATCH:
    case CFG.TEXT_PLAIN: {
      break;
    }

    case CFG.CUSTOM_SELECT: {
      editCustomSelect(sheet, dependentCell);
      break;
    }

    default: {
      editDependentCell(e, actionValue, dependentCell);
    }
  }
}
