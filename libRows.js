/**
 * LibRows: A Library for Row-Level Management
 * 
 * Handles row-specific logic such as zebra striping, 
 * independent across sheet sections defined by LibSections.
 */
var LibRows = (function () {

  /**
   * Applies independent zebra striping to all sections of the sheet.
   * Respects section boundaries and avoids overwriting 'Separators'.
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to process.
   */
  function applyZebraAll(sheet) {
    if (!sheet) return;
    
    var layout = LibSections.getLayout(sheet);
    var lastRow = sheet.getLastRow();
    
    // Start zebra from the first data row (usually row 2)
    var startRow = CFG.TEMPLATE_ROW; 
    if (lastRow < startRow) return;

    Logger.log('[LibRows.applyZebraAll] Logic start for sheet: ' + sheet.getName());

    // Apply zebra logic to each section independently
    _applySectionZebra(sheet, layout.primary, 'PRIMARY', startRow, lastRow);
    _applySectionZebra(sheet, layout.secondary, 'SECONDARY', startRow, lastRow);
    _applySectionZebra(sheet, layout.tertiary, 'TERTIARY', startRow, lastRow);
  }

  /**
   * Internal helper to apply zebra colors to a specific section.
   */
  function _applySectionZebra(sheet, section, type, startRow, lastRow) {
    if (!section) return;

    try {
        var startCol = section.start;
        var endCol = section.end;
        var numCols = endCol - startCol + 1;
        var maxRows = sheet.getMaxRows();
        
        if (maxRows < startRow) return;

        // 1. Fetch current backgrounds
        var totalRowsToProcess = maxRows - startRow + 1;
        var range = sheet.getRange(startRow, startCol, totalRowsToProcess, numCols);
        var backgrounds = range.getBackgrounds();

        // 2. Resolve Config
        var sepColor = (SEPARATOR[type + '_BG'] || '').toLowerCase();
        var colorA = (ZEBRA[type + '_A'] || '#ffffff').toLowerCase();
        var colorB = (ZEBRA[type + '_B'] || '#ffffff').toLowerCase();

        var changed = false;

        // 3. Pattern Generation
        for (var r = 0; r < totalRowsToProcess; r++) {
          var rowNum = startRow + r;
          var currentBg = (backgrounds[r][0] || '#ffffff').toLowerCase();

          // CLEANUP EXTRA ROWS
          if (rowNum > lastRow) {
            if (currentBg !== '#ffffff' && currentBg !== 'white') {
                for (var c = 0; c < numCols; c++) backgrounds[r][c] = '#ffffff';
                changed = true;
            }
            continue;
          }

          // SKIP SEPARATORS
          if (sepColor && currentBg === sepColor) {
            continue; 
          }

          // APPLY ZEBRA
          var targetBg = ((r + startRow) % 2 === 0) ? colorA : colorB;

          if (currentBg !== targetBg) {
            for (var c = 0; c < numCols; c++) {
              backgrounds[r][c] = targetBg;
            }
            changed = true;
          }
        }

        // 4. Update
        if (changed) {
          range.setBackgrounds(backgrounds);
          SpreadsheetApp.flush();
        }
    } catch (e) {
        Logger.log('[LibRows._applySectionZebra] Error in section ' + type + ': ' + e.message);
    }
  }

  /**
   * Resets all backgrounds in the data rows of a sheet.
   */
  function clearZebraAll(sheet) {
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var startRow = CFG.TEMPLATE_ROW;

    if (lastRow >= startRow && lastCol > 0) {
      sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).setBackground(null);
    }
  }

  return {
    applyZebraAll: applyZebraAll,
    clearZebraAll: clearZebraAll
  };

})();
