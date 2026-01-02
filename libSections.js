/**
 * LibSections: A Library for Managing Spreadsheet Sections
 * 
 * This library provides logic to identify and enforce structured sections (Primary, Secondary, Tertiary)
 * within a Google Sheet based on header row content blocks and empty delimiter columns.
 * 
 * Key Features:
 * - Dynamic Layout Parsing: Identifies sections by continuous blocks of header text.
 * - Splitter Enforcement: Manages frozen panes and protected narrow delimiter columns.
 * - Range Validation: Ensures user edits (like merges) stay within a single section.
 */
var LibSections = (function () {

  /**
   * Internal helper to normalize cell values for comparison.
   */
  function _clean(v) {
    return String(v == null ? '' : v).trim();
  }

  /**
   * Scans the header row (defined in CFG) to determine the layout of sections.
   * 
   * Logic:
   * 1. Iterates through the header row to find continuous islands of non-empty cells (Blocks).
   * 2. Maps the first block to 'Primary', the second to 'Secondary', and the third to 'Tertiary'.
   * 3. Defines delimiters as the gap columns between these blocks.
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to analyze.
   * @returns {Object} A layout object containing start/end indices for each section.
   */
  function getLayout(sheet) {
    if (!sheet) return _createDefaultLayout();

    var lastCol = sheet.getLastColumn();
    var maxCols = sheet.getMaxColumns();
    // Safety scan limit to ensure we capture enough breadth without hitting limits
    var scanLimit = Math.min(Math.max(lastCol, 100), maxCols); 

    var headerValues = sheet.getRange(CFG.HEADER_ROW, 1, 1, scanLimit).getValues()[0];
    
    // 1. Identify all continuous blocks of content
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

    // 2. Assign blocks to the three-section library model
    var primary = null;
    var secondary = null;
    var tertiary = null;
    var d1Col = null;
    var d2Col = null;

    if (blocks.length > 0) {
        // Block 1 is the core 'Primary' section
        primary = blocks[0];
        // Enforce that Primary starts at column 1 even if A1 is empty
        if (primary.start > 1) primary.start = 1;

        if (blocks.length > 1) {
            secondary = blocks[1];
            // Delimiter 1 is the empty column immediately before Secondary starts
            d1Col = secondary.start - 1;

            if (blocks.length > 2) {
                tertiary = blocks[2];
                // Delimiter 2 is the empty column immediately before Tertiary starts
                d2Col = tertiary.start - 1;
            }
        }
    } else {
        // Fallback for completely empty sheets: treat column 1 as an empty Primary section
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
   * Manages the physical constraints and visual styling of the sheet sections.
   * 
   * Actions:
   * 1. Frozen Pane: Pins Row 1 to the top and Column(s) of the Primary section.
   * 2. Protections: Applies 'Section Delimiter' soft-locks to the gap columns.
   * 3. Styling: Sets narrow widths and clean backgrounds for delimiters.
   * 4. Cleanup: Removes protections and resets styling if a section is removed.
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to enforce.
   */
  function enforceBoundaries(sheet) {
    try {
        var layout = getLayout(sheet);

        // --- 1. SET FROZEN PANE ---
        // Header row is always sticky
        sheet.setFrozenRows(CFG.HEADER_ROW);

        // Sidebar (Primary) - Disabled frozen columns to allow free horizontal scrolling
        sheet.setFrozenColumns(0);

        // --- 2. MANAGE DELIMITERS ---
        var activeDelCols = [];
        if (layout.delimiter1) activeDelCols.push(layout.delimiter1.col);
        if (layout.delimiter2) activeDelCols.push(layout.delimiter2.col);
        
        // CLEANUP: Remove protections from columns that are no longer serving as delimiters
        var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
        protections.forEach(function(p) {
             if (p.getDescription() === 'Section Delimiter') {
                 var col = p.getRange().getColumn();
                 if (activeDelCols.indexOf(col) === -1) {
                     p.remove();
                     sheet.setColumnWidth(col, 100); // Standard reset
                     sheet.getRange(1, col, sheet.getMaxRows(), 1).setBackground(null);
                 }
             }
        });

        // APPLY: Format the active gap columns
        activeDelCols.forEach(function(colIndex) {
            // Section delimiters are narrow (mobile/web optimized experience)
            sheet.setColumnWidth(colIndex, DELIMITER.WIDTH);
            
            var range = sheet.getRange(1, colIndex, sheet.getMaxRows(), 1);
            range.setBackground(DELIMITER.BG);
            // NOTE: We no longer clearContent() here to prevent accidental data loss during edits
            
            // Protection: Add a warning lock to prevent accidental typing in gaps
            var existing = range.getProtections(SpreadsheetApp.ProtectionType.RANGE);
            if (!existing || existing.length === 0) {
                range.protect().setDescription('Section Delimiter').setWarningOnly(true);
            }
        });
        
    } catch (err) {
        Logger.log('[LibSections.enforceBoundaries] Runtime Error: ' + err.message);
    }
  }

  /**
   * Internal helper for empty/uninitialized layout states.
   */
  function _createDefaultLayout() {
      return { primary: { start: 1, end: 1 }, delimiter1: null, secondary: null, delimiter2: null, tertiary: null };
  }

  /**
   * Validates if the provided range is strictly contained within a single section.
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet containing the range.
   * @param {GoogleAppsScript.Spreadsheet.Range} range The range to validate.
   * @returns {Object} Validation result { valid: boolean, section: string|null, reason: string|null }
   */
  function validateRange(sheet, range) {
    var layout = getLayout(sheet);
    var start = range.getColumn();
    var end = range.getLastColumn();
    
    // Check coverage in Primary Section
    if (layout.primary && start >= layout.primary.start && end <= layout.primary.end) {
        return { valid: true, section: 'PRIMARY' };
    }
    // Check coverage in Secondary Section
    if (layout.secondary && start >= layout.secondary.start && end <= layout.secondary.end) {
        return { valid: true, section: 'SECONDARY' };
    }
    // Check coverage in Tertiary Section
    if (layout.tertiary && start >= layout.tertiary.start && end <= layout.tertiary.end) {
        return { valid: true, section: 'TERTIARY' };
    }
    
    return { valid: false, reason: 'Range crosses section boundaries or resides in a delimiter.' };
  }

  // Public Interface
  return { 
    getLayout: getLayout, 
    validateRange: validateRange, 
    enforceBoundaries: enforceBoundaries 
  };

})();
