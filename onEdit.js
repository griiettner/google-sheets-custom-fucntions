/**
 * Global onEdit Trigger
 * 
 * Fires whenever a cell value is changed. 
 * Orchestrates real-time visual updates (Headers, Zebras) and functional routing.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  
  var ctx = editContext(e);

  // --- 1. REAL-TIME DESIGN ENGINE ---
  // Re-run theme and structure checks on every edit to ensure dividers and colors stay synced.
  editHeaderTheme(ctx);   // Updates section themes and splitters if header content changed
  changeRows();           // Ensures row heights remain consistent
  editRowTemplate(ctx);   // Handles new row initialization and separator styling
  editZebraTheme(ctx);    // Adjusts alternating row background logic (Run last to override template formatting)

  // --- 2. FUNCTIONAL ROUTER (ACTION_COL) ---
  // Logic below this point is reserved for automated workflows triggered in the ACTION_COL.
  
  var sheet = ctx.sheet;
  var range = ctx.range;
  
  // Guard: Only process specific columns, and never touch the settings sheet
  if (
    range.getColumn() !== CFG.ACTION_COL ||
    sheet.getName() === CFG.SETTINGS_SHEET_NAME
  ) {
    return;
  }

  var actionValue = e.value;
  var dependentCell = sheet.getRange(range.getRow(), CFG.DEPENDENT_COL);

  // Reset the dependent cell before applying new logic
  dependentCell.clearDataValidations();
  dependentCell.clearContent();

  if (!actionValue) return;

  // Route the action to the dedicated handler
  switch (actionValue) {
    case CFG.TEXT_MATCH:
    case CFG.TEXT_PLAIN: {
      // Direct text modes require no special dependent cell logic
      break;
    }

    case CFG.CUSTOM_SELECT: {
      // Triggers a custom dropdown build
      editCustomSelect(sheet, dependentCell);
      break;
    }

    default: {
      // General dependent cell validation logic
      editDependentCell(e, actionValue, dependentCell);
    }
  }
}
