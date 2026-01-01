function changeZebraThemeAll(ctx) {
  var ss = ctx && ctx.ss ? ctx.ss : SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    changeZebraTheme({ sheet: sheets[i] });
  }
}

function changeZebraTheme(ctx) {
  var sheet = ctx.sheet;

  var headerRow = CFG.HEADER_ROW;
  var startDataRow = headerRow + 1;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow < startDataRow) return;
  if (lastCol < 1) return;

  // Read header row values and compute layout using your existing utilComputeLayout_
  var headerValues = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  var layout = utilComputeLayout_(headerValues, lastCol);

  // MAIN columns: 1..mainEnd
  var mainStartCol = 1;
  var mainEndCol = layout.mainEnd;

  // GAP columns: gapStart..gapEnd (NEVER zebra)
  var gapStartCol = layout.gapStart;
  var gapEndCol = layout.gapEnd;

  // OPTIONAL columns: optStart..optEnd (only if optStart exists)
  var optStartCol = layout.optStart;
  var optEndCol = layout.optEnd;

  // OTHERS columns: (optEnd+1..lastCol) if OPTIONAL exists,
  // otherwise (mainEnd+1..lastCol) — but we must also exclude GAP.
  var othersStartCol = optStartCol ? (optEndCol + 1) : (mainEndCol + 1);
  var othersEndCol = lastCol;

  // --- MAIN zebra ---
  if (mainEndCol >= mainStartCol && mainEndCol > 0) {
    var mainLastData = utilLastDataRow_(
      sheet,
      startDataRow,
      mainStartCol,
      lastRow - startDataRow + 1,
      mainEndCol - mainStartCol + 1
    );

    if (mainLastData >= startDataRow) {
      utilApplyZebra_(sheet, startDataRow, mainLastData, mainStartCol, mainEndCol, ZEBRA.MAIN_A, ZEBRA.MAIN_B);
    }
  }

  // --- OPTIONAL zebra ---
  if (optStartCol && optEndCol && optEndCol >= optStartCol) {
    var optLastData = utilLastDataRow_(
      sheet,
      startDataRow,
      optStartCol,
      lastRow - startDataRow + 1,
      optEndCol - optStartCol + 1
    );

    if (optLastData >= startDataRow) {
      utilApplyZebra_(sheet, startDataRow, optLastData, optStartCol, optEndCol, ZEBRA.OPT_A, ZEBRA.OPT_B);
    }
  }

  // --- OTHERS zebra (FIXED: do NOT chunk using MAIN gap) ---
  // After OPTIONAL: any blank header columns are separators (never zebra).
  if (othersEndCol >= othersStartCol) {

    var othRowCount = lastRow - startDataRow + 1;

    var c = othersStartCol;
    while (c <= othersEndCol) {
      // Skip separator columns (blank header)
      while (c <= othersEndCol && utilNormalizeText(headerValues[c - 1]) === '') {
        c++;
      }
      if (c > othersEndCol) break;

      // Start of a run of non-empty headers
      var runStart = c;
      while (c <= othersEndCol && utilNormalizeText(headerValues[c - 1]) !== '') {
        c++;
      }
      var runEnd = c - 1;

      // Find last data row within this run
      var othLastData = utilLastDataRow_(
        sheet,
        startDataRow,
        runStart,
        othRowCount,
        runEnd - runStart + 1
      );

      if (othLastData >= startDataRow) {
        utilApplyZebra_(
          sheet,
          startDataRow,
          othLastData,
          runStart,
          runEnd,
          ZEBRA.OTH_A,
          ZEBRA.OTH_B
        );
      }
    }
  }

  // GAP is intentionally untouched (no zebra)
}
