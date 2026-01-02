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
    var globalLastRow = sheet.getLastRow();
    var startRow = CFG.DATA_START_ROW; 
    
    if (globalLastRow < startRow) return;

    Logger.log('[LibRows.applyZebraAll] Independent zebra scaling enabled.');

    // Calculate section-specific last rows based on content within their column boundaries
    var pLast = _getSectionLastRow(sheet, layout.primary, startRow, globalLastRow);
    var sLast = _getSectionLastRow(sheet, layout.secondary, startRow, globalLastRow);
    var tLast = _getSectionLastRow(sheet, layout.tertiary, startRow, globalLastRow);

    // Apply zebra logic to each section independently with its own stopping point
    _applySectionZebra(sheet, layout.primary, 'PRIMARY', startRow, pLast);
    _applySectionZebra(sheet, layout.secondary, 'SECONDARY', startRow, sLast);
    _applySectionZebra(sheet, layout.tertiary, 'TERTIARY', startRow, tLast);
  }

  /**
   * Scans the specific columns of a section to find the last row containing any text.
   */
  function _getSectionLastRow(sheet, section, startRow, globalLastRow) {
    if (!section) return 0;
    
    var startCol = section.start;
    var numCols = section.end - section.start + 1;
    var numRows = globalLastRow - startRow + 1;
    
    if (numRows <= 0) return 0;

    var values = sheet.getRange(startRow, startCol, numRows, numCols).getValues();
    for (var r = values.length - 1; r >= 0; r--) {
      for (var c = 0; c < numCols; c++) {
        var val = String(values[r][c] == null ? '' : values[r][c]).trim();
        if (val !== '') return startRow + r;
      }
    }
    return 0;
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

        // 1. Fetch current visual state
        var totalRowsToProcess = maxRows - startRow + 1;
        var range = sheet.getRange(startRow, startCol, totalRowsToProcess, numCols);
        
        var backgrounds = range.getBackgrounds();
        var alignments = range.getHorizontalAlignments();
        var weights = range.getFontWeights();
        var wrapStrategies = range.getWrapStrategies();

        // 2. Identify Merged Ranges (Separators)
        var mergedRanges = range.getMergedRanges();
        var isSepRow = {};
        mergedRanges.forEach(function(m) {
           for (var r = m.getRow(); r <= m.getLastRow(); r++) {
             isSepRow[r] = true;
           }
        });

        // 3. Resolve Config
        var separatorBg = (SEPARATOR[type + '_BG'] || '').toLowerCase();
        var colorA = (ZEBRA[type + '_A'] || '#ffffff').toLowerCase();
        var colorB = (ZEBRA[type + '_B'] || '#ffffff').toLowerCase();

        var changed = false;

        // 4. Pattern Generation & Alignment Enforcement
        for (var r = 0; r < totalRowsToProcess; r++) {
          var rowNum = startRow + r;
          var isSeparator = isSepRow[rowNum];
          var currentBg = (backgrounds[r][0] || '#ffffff').toLowerCase();

          // A. WRAP STRATEGY (Disable bleeding)
          if (wrapStrategies[r][0] !== SpreadsheetApp.WrapStrategy.CLIP) {
            for (var c = 0; c < numCols; c++) {
              wrapStrategies[r][c] = SpreadsheetApp.WrapStrategy.CLIP;
            }
            changed = true;
          }

          // B. ALIGNMENT & WEIGHT (Enforce on ALL rows to keep them consistent)
          var targetAlign = isSeparator ? 'center' : 'left';
          var targetWeight = isSeparator ? 'bold' : 'normal';

          if (alignments[r][0] !== targetAlign || weights[r][0] !== targetWeight) {
             for (var c = 0; c < numCols; c++) {
               alignments[r][c] = targetAlign;
               weights[r][c] = targetWeight;
             }
             changed = true;
          }

          // B. CLEANUP EXTRA ROWS
          if (rowNum > lastRow) {
            if (!isSeparator && currentBg !== '#ffffff' && currentBg !== 'white') {
                for (var c = 0; c < numCols; c++) backgrounds[r][c] = '#ffffff';
                changed = true;
            }
            continue;
          }

          // C. APPLY COLORS
          var targetBg = isSeparator ? separatorBg : (((r + startRow) % 2 === 0) ? colorA : colorB);

          if (targetBg && currentBg !== targetBg) {
            for (var c = 0; c < numCols; c++) {
              backgrounds[r][c] = targetBg;
            }
            changed = true;
          }
        }

        // 5. Update UI in Batch
        if (changed) {
          range.setBackgrounds(backgrounds);
          range.setHorizontalAlignments(alignments);
          range.setFontWeights(weights);
          range.setWrapStrategies(wrapStrategies);
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
    var startRow = CFG.DATA_START_ROW;

    if (lastRow >= startRow && lastCol > 0) {
      sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).setBackground(null);
    }
  }

  return {
    applyZebraAll: applyZebraAll,
    clearZebraAll: clearZebraAll
  };

})();
