var LibSections = (function () {

  // Helper inside the library to ensure we don't depend on external 'utils' if they change
  function _clean(v) {
    return String(v == null ? '' : v).trim();
  }

  /**
   * Scans the header row to determine the layout of sections.
   * Defined by non-empty blocks separated by empty columns (delimiters).
   */
  function getLayout(sheet) {
    if (!sheet) return _createDefaultLayout();

    var lastCol = sheet.getLastColumn();
    var maxCols = sheet.getMaxColumns();
    var scanLimit = Math.min(Math.max(lastCol, 100), maxCols); 

    var headerValues = sheet.getRange(CFG.HEADER_ROW, 1, 1, scanLimit).getValues()[0];
    
    // 1. Find all continuous blocks of content
    var blocks = [];
    var currentBlock = null;

    for (var i = 0; i < headerValues.length; i++) {
        var val = _clean(headerValues[i]);
        var col = i + 1;

        if (val !== '') {
            if (!currentBlock) {
                currentBlock = { start: col, end: col };
            } else {
                currentBlock.end = col;
            }
        } else {
            if (currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
        }
    }
    if (currentBlock) blocks.push(currentBlock);

    // 2. Map blocks to sections (Primary is ALWAYS Block 1 or at least starts at 1)
    var primary = null;
    var secondary = null;
    var tertiary = null;
    var d1Col = null;
    var d2Col = null;

    if (blocks.length > 0) {
        // Block 1 is ALWAYS Primary
        primary = blocks[0];
        // Special case: if Primary doesn't start at Col 1, we force it to encompass the start
        if (primary.start > 1) primary.start = 1;

        if (blocks.length > 1) {
            secondary = blocks[1];
            // Delimiter 1 is the column immediately before Secondary start
            d1Col = secondary.start - 1;

            if (blocks.length > 2) {
                tertiary = blocks[2];
                // Delimiter 2 is the column immediately before Tertiary start
                d2Col = tertiary.start - 1;
            }
        }
    } else {
        // Sheet is entirely empty
        primary = { start: 1, end: 1 };
    }

    return {
      primary: primary,
      secondary: secondary,
      tertiary: tertiary,
      delimiter1: d1Col ? { col: d1Col } : null,
      delimiter2: d2Col ? { col: d2Col } : null
    };
  }

  /**
   * Physical enforcement of splitters, protection, and cleanup.
   */
  function enforceBoundaries(sheet) {
    try {
        var layout = getLayout(sheet);

        // 1. Splitter (Frozen Columns)
        // Anchor at end of primary if secondary exists
        if (layout.secondary) {
            sheet.setFrozenColumns(layout.primary.end);
        } else {
            sheet.setFrozenColumns(0);
        }

        // 2. Delimiter Identification
        var activeDelCols = [];
        if (layout.delimiter1) activeDelCols.push(layout.delimiter1.col);
        if (layout.delimiter2) activeDelCols.push(layout.delimiter2.col);
        
        // CLEANUP: Unprotect/Reset columns that are no longer delimiters
        var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
        protections.forEach(function(p) {
             if (p.getDescription() === 'Section Delimiter') {
                 var col = p.getRange().getColumn();
                 if (activeDelCols.indexOf(col) === -1) {
                     p.remove();
                     sheet.setColumnWidth(col, 100); 
                     sheet.getRange(1, col, sheet.getMaxRows(), 1).setBackground(null);
                 }
             }
        });

        // APPLY: Style and Protect current delimiters
        activeDelCols.forEach(function(colIndex) {
            // Set Width
            sheet.setColumnWidth(colIndex, DELIMITER.WIDTH);
            
            // Set Visuals: Only set background, do NOT clear content to prevent race-condition data loss
            var range = sheet.getRange(1, colIndex, sheet.getMaxRows(), 1);
            range.setBackground(DELIMITER.BG);
            
            // Set Protection
            var existing = range.getProtections(SpreadsheetApp.ProtectionType.RANGE);
            if (!existing || existing.length === 0) {
                range.protect().setDescription('Section Delimiter').setWarningOnly(true);
            }
        });
        
    } catch (err) {
        Logger.log('[enforceBoundaries] Error: ' + err.message);
    }
  }

  function _createDefaultLayout() {
      return { primary: { start: 1, end: 1 }, delimiter1: null, secondary: null, delimiter2: null, tertiary: null };
  }

  /**
   * Validates if a range is strictly contained within a single section.
   */
  function validateRange(sheet, range) {
    var layout = getLayout(sheet);
    var start = range.getColumn();
    var end = range.getLastColumn();
    
    if (layout.primary && start >= layout.primary.start && end <= layout.primary.end) return { valid: true, section: 'PRIMARY' };
    if (layout.secondary && start >= layout.secondary.start && end <= layout.secondary.end) return { valid: true, section: 'SECONDARY' };
    if (layout.tertiary && start >= layout.tertiary.start && end <= layout.tertiary.end) return { valid: true, section: 'TERTIARY' };
    
    return { valid: false, reason: 'Range crosses section boundaries or is in a delimiter.' };
  }

  return { getLayout: getLayout, validateRange: validateRange, enforceBoundaries: enforceBoundaries };

})();
