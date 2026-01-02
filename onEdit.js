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
  // Only update header themes if the header row itself was edited
  if (ctx.row === CFG.HEADER_ROW) {
    editHeaderTheme(ctx);
  }

  // Row heights and global styling (changeRows) now only run on structural changes (onChange)
  // to prevent alignment 'flicker' and improve performance.

  editRowTemplate(ctx);   // Handles new row initialization and separator styling
  editZebraTheme(ctx);    // Adjusts alternating row background logic
  changeCustomCells({ sheet: ctx.sheet }); // Refresh custom cell validations and cleanup logic
  utilCustomCells.handleEdit(ctx);         // Real-time dependency (e.g. Actions -> Actions Result)
}
