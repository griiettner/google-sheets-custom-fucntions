function onChange(e) {
  Logger.log('[onChange] Triggered. Event: ' + JSON.stringify(e));
  if (!e || !e.changeType) return;

  var ctx = changeContext(e);
  Logger.log('[onChange] ChangeType: ' + e.changeType);
  var activeSheet = ctx.ss.getActiveSheet();
  Logger.log('[onChange] Active Sheet: ' + (activeSheet ? activeSheet.getName() : 'None'));

  switch (e.changeType) {
    case 'INSERT_GRID':
      Logger.log('[onChange] Detected INSERT_GRID. Calling all style updaters...');
      changeGridStyleAll();
      changeRows(); 
      changeHeaderThemeAll(ctx); // Fixed: Passing context because this function requires it
      break;
    case 'INSERT_COLUMN':
    case 'INSERT_GRID':
    case 'REMOVE_COLUMN':
    case 'REMOVE_ROW':
    case 'INSERT_ROW':
      changeHeaderThemeAll(ctx);
      changeZebraThemeAll(ctx);
      changeRows();
      break;
    default:
      break;
  }
}

