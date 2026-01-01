function editHeaderTheme(ctx) {
  // Only react to header row edits
  if (ctx.row !== CFG.HEADER_ROW) return;

  // Only single-cell edits
  if (ctx.range.getNumRows() !== 1 || ctx.range.getNumColumns() !== 1) return;

  // Re-theme this sheet on any header edit (typing, clearing, paste-1-cell, etc.)
  changeHeaderTheme({ sheet: ctx.sheet });
}
