function editZebraTheme(ctx) {
  if (ctx.row === CFG.HEADER_ROW) return;

  changeZebraTheme({ sheet: ctx.sheet });
}
