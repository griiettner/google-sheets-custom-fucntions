var LibSections = (function () {

  /**
   * Scans the header row to determine the layout of sections.
   * Defined by non-empty blocks separated by empty columns (delimiters).
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 
   * @returns {Object} Layout object containing range definitions for sections and delimiters
   */
  function getLayout(sheet) {
    if (!sheet) throw new Error("LibSections.getLayout: Sheet is required");

    var lastCol = sheet.getLastColumn();
    // Fallback if sheet is virtually empty (no headers typed yet)
    if (lastCol < 1) {
      return _createDefaultLayout();
    }
    
    var headerValues = sheet.getRange(CFG.HEADER_ROW, 1, 1, lastCol).getValues()[0];

    // We treat col 1 as Primary by default if headers are empty
    if (_isEmptyArray(headerValues)) {
         return _createDefaultLayout();
    }
    
    // --- PRIMARY SECTION ---
    // Starts at 1. Ends at first blank.
    var pStart = 1;
    var pEnd = _findEndOfBlock(headerValues, pStart - 1);

    // --- DELIMITER 1 ---
    // The column immediately following Primary, if it exists and is blank
    var d1Col = null;
    if (pEnd < lastCol) {
      d1Col = pEnd + 1;
    }

    // --- SECONDARY SECTION ---
    var sStart = null;
    var sEnd = null;
    var d2Col = null;

    if (d1Col && d1Col < lastCol) {
       // Secondary starts after D1
       // Check if there is actual content from here to the end
       // We need to look for ANY non-empty value after d1Col
       var hasContentStart = -1;
       for (var k = d1Col + 1; k <= lastCol; k++) {
           if (headerValues[k-1] !== '') {
               hasContentStart = k;
               break;
           }
       }

       if (hasContentStart !== -1) {
           sStart = hasContentStart; // Actual content starts here
           // D1 is valid because stuff exists after it
           // If there was a gap between D1 and sStart, that's just part of the "gap" or implicit D1 width?
           // For simplicity in this logic: if D1 is Col 5, and content starts at Col 7, Col 6 is just blank.
           // But usually D1 is the *immediate* blank. 
           // Let's stick to strict blocks: sStart is d1Col + 1.
           sStart = d1Col + 1;
           sEnd = _findEndOfBlock(headerValues, sStart - 1);
           
           if (sEnd < sStart) { 
               // Should not happen if we checked hasContentStart, but just in case
               sStart = null; sEnd = null; d1Col = null; 
           } else {
               // Check for D2
               if (sEnd < lastCol) d2Col = sEnd + 1;
           }
       } else {
           // No content found after D1
           sStart = null;
           sEnd = null;
           d1Col = null; // No secondary means no delimiter needed
       }
    } else {
       d1Col = null;
    }

    // --- TERTIARY SECTION ---
    var tStart = null;
    var tEnd = null;
    
    if (d2Col && d2Col < lastCol) {
       tStart = d2Col + 1;
       var tCheck = _findEndOfBlock(headerValues, tStart - 1);
       
       if (tCheck >= tStart) {
          tEnd = tCheck;
       } else {
          tStart = null;
          tEnd = null;
          d2Col = null;
       }
    } else {
       d2Col = null;
    }

    return {
      primary: { start: pStart, end: pEnd },
      delimiter1: d1Col ? { col: d1Col } : null,
      secondary: (sStart) ? { start: sStart, end: sEnd } : null,
      delimiter2: d2Col ? { col: d2Col } : null,
      tertiary: (tStart) ? { start: tStart, end: tEnd } : null,
      lastCol: lastCol
    };
  }

  /**
   * Helper to find index of last non-empty value in a continuous block
   */
  function _findEndOfBlock(values, startIndex) {
    for (var i = startIndex; i < values.length; i++) {
        var val = values[i];
        if (val === "" || val == null) {
            return i; 
        }
    }
    return values.length; // No blanks found, block goes to end
  }
  
  function _isEmptyArray(arr) {
      if (!arr || arr.length === 0) return true;
      for(var i=0; i<arr.length; i++) {
          if (arr[i] !== '') return false;
      }
      return true;
  }

  function _createDefaultLayout() {
      return {
          primary: { start: 1, end: 1 },
          delimiter1: null,
          secondary: null,
          delimiter2: null,
          tertiary: null,
          lastCol: 1
      };
  }

  /**
   * Validates if a range is strictly contained within a single section.
   * Returns false if the range crosses a delimiter or spans multiple sections.
   */
  function validateRange(sheet, range) {
    var layout = getLayout(sheet);
    var start = range.getColumn();
    var end = range.getLastColumn(); // Inclusive

    // Check inclusion in Primary
    if (layout.primary && start >= layout.primary.start && end <= layout.primary.end) {
        return { valid: true, section: 'PRIMARY' };
    }

    // Check inclusion in Secondary
    if (layout.secondary && start >= layout.secondary.start && end <= layout.secondary.end) {
        return { valid: true, section: 'SECONDARY' };
    }

    // Check inclusion in Tertiary
    if (layout.tertiary && start >= layout.tertiary.start && end <= layout.tertiary.end) {
        return { valid: true, section: 'TERTIARY' };
    }

    // If we are here, it's either in a delimiter or crossing boundaries
    return { valid: false, reason: 'Range crosses section boundaries or is in a delimiter.' };
  }

  /**
   * Enforces physical boundaries:
   * 1. Protects delimiter columns (remove editors).
   * 2. Sets delimiter width.
   * 3. Freezes columns after Primary.
   */
  function enforceBoundaries(sheet) {
    var layout = getLayout(sheet);

    // 1. Freeze Pane
    // Only freeze if we have a secondary section (splitter concept)
    // If secondary exists, freeze at end of Primary
    if (layout.secondary) {
        // If there is a delimiter, freeze BEFORE the delimiter? Or AFTER?
        // Usually splitters are the frozen line.
        // If we freeze at primary.end, the delimiter is the first column of the SCROLLABLE area?
        // Or if we freeze at primary.end, Columns 1..pEnd are frozen.
        // User likely wants Primary to be the "frozen" part.
        sheet.setFrozenColumns(layout.primary.end);
    } else {
        // No secondary -> No splitter needed
        sheet.setFrozenColumns(0);
    }

    // 2. Protect Delimiters
    // Logic update: Only protect D1 if Secondary exists. Only protect D2 if Tertiary exists.
    var delsToProtect = [];
    if (layout.secondary && layout.delimiter1) {
        delsToProtect.push(layout.delimiter1);
    }
    if (layout.tertiary && layout.delimiter2) {
        delsToProtect.push(layout.delimiter2);
    }
    
    // CLEANUP: We must remove old delimiter protections/styles from columns that are no longer delimiters.
    // Iterating all columns is expensive. But critical for "removal" to work.
    // Optimization: Check protections on the sheet.
    try {
        var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
        protections.forEach(function(p) {
             if (p.getDescription() === 'Section Delimiter') {
                 var range = p.getRange();
                 var col = range.getColumn();
                 
                 // Check if this column is still a valid delimiter
                 var isStillDelimiter = delsToProtect.some(function(d) { return d.col === col; });
                 
                 if (!isStillDelimiter) {
                     // Remove protection
                     p.remove();
                     // Reset style (width, bg) - Optional but good for UX
                     // We default width to standard (100) or let it be. 
                     // IMPORTANT: setBackground(null) might remove Primary/Secondary theme?
                     // No, because changeHeaderTheme runs AFTER this and will repaint valid headers.
                     sheet.setColumnWidth(col, 100); 
                     sheet.getRange(1, col, sheet.getMaxRows(), 1).setBackground(null);
                 }
             }
        });
    } catch(e) {
        Logger.log("Error cleaning protections: " + e);
    }
    
    // APPLY NEW PROTECTIONS
    delsToProtect.forEach(function(d) {
        if (!d) return;

        var range = sheet.getRange(1, d.col, sheet.getMaxRows(), 1);
        
        // Style: Small width, Clean BG
        try {
            sheet.setColumnWidth(d.col, DELIMITER.WIDTH);
            range.setBackground(DELIMITER.BG);
            range.clearContent(); // Ensure empty
        } catch (e) {
            Logger.log("Error styling delimiter: " + e);
        }

        // Protection
        var protection = range.getProtections(SpreadsheetApp.ProtectionType.RANGE)[0];
        if (!protection) {
            protection = range.protect().setDescription('Section Delimiter');
        }
        
        if (protection.canEdit()) { 
             protection.setWarningOnly(true); 
        }
    });
  }

  return {
    getLayout: getLayout,
    validateRange: validateRange,
    enforceBoundaries: enforceBoundaries
  };

})();
