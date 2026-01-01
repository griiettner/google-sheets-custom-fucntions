function editContext(e) {
  return {
    e: e,
    ss: e.source,
    sheet: e.range.getSheet(),
    range: e.range,
    row: e.range.getRow(),
    col: e.range.getColumn(),
    value: e.value
  };
}
