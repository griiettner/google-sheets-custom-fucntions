function changeContext(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return { e: e, ss: ss };
}
