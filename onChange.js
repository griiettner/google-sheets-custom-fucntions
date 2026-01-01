/**
 * Global onChange Trigger
 * 
 * This trigger fires when the user performs structural changes to the spreadsheet,
 * such as inserting or deleting rows, columns, or entirely new sheets.
 * 
 * Responsibility:
 * - Ensures that every new sheet or modified sheet follows the design system (Header colors, 
 *   Frozen panes, Delimiter protection, Row heights, and Grid styles).
 */
function onChange(e) {
  Logger.log('[onChange] Event detected: ' + (e ? e.changeType : 'Unknown'));
  if (!e || !e.changeType) return;

  var ctx = changeContext(e);

  switch (e.changeType) {
    /**
     * INSERT_GRID fires when a brand new tab is created.
     * We initialize the entire visual structure for the new tab.
     */
    case 'INSERT_GRID':
      Logger.log('[onChange] Initializing new sheet structure...');
      changeGridStyleAll();   // Apply white gridlines globally
      changeRows();           // Set standard row heights (Header 40px, Data 30px)
      changeHeaderThemeAll(ctx); // Apply Section Library themes
      changeZebraThemeAll(ctx);  // Apply initial zebra pattern
      break;

    /**
     * Common architectural changes (Adding columns, deleting rows, etc.)
     * We recalculate the section layout and re-apply styles to maintain design integrity.
     */
    case 'INSERT_COLUMN':
    case 'REMOVE_COLUMN':
    case 'REMOVE_ROW':
    case 'INSERT_ROW':
      Logger.log('[onChange] Recalculating section layout after structural change...');
      changeHeaderThemeAll(ctx); // Re-enforce LibSections & Headers
      changeZebraThemeAll(ctx);  // Adjust zebra striping frequency
      changeRows();              // Ensure new rows have correct heights
      break;

    default:
      break;
  }
}
