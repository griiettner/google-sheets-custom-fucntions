function utilNormalizeText(v) {
  return String(v == null ? '' : v).trim();
}

function utilGetTheme(name) {
  if (name === 'OPT') return { bg: CFG.OPT_BG, fg: CFG.OPT_FG };
  if (name === 'GREY') return { bg: CFG.GREY_BG, fg: CFG.GREY_FG };
  return { bg: CFG.MAIN_BG, fg: CFG.MAIN_FG };
}

function utilApplyHeaderStyle(range, theme) {
  range.setBackground(theme.bg).setFontColor(theme.fg);
}

function utilClearHeaderStyle(range) {
  range.setBackground(null).setFontColor(null);
}

function utilRowStyle(sheet) {

}

function utilComputeLayout_(values, lastCol) {
  // MAIN ends at first blank
  var mainEnd = 0;
  for (var c = 1; c <= lastCol; c++) {
    if (utilNormalizeText(values[c - 1]) === '') {
      mainEnd = c - 1;
      break;
    }
    mainEnd = c; // if none blank, it will become lastCol
  }

  var gapStart = 0;
  var gapEnd = 0;

  var optStart = 0;
  var optEnd = 0;

  // If MAIN consumes the whole row (no blanks), there is no gap/optional
  if (mainEnd >= lastCol) {
    return { mainEnd: mainEnd, gapStart: 0, gapEnd: 0, optStart: 0, optEnd: 0 };
  }

  // GAP starts right after MAIN
  gapStart = mainEnd + 1;

  // Find OPTIONAL start = first non-empty after the gapStart
  for (var s = gapStart; s <= lastCol; s++) {
    if (utilNormalizeText(values[s - 1]) !== '') {
      optStart = s;
      break;
    }
  }

  // If no OPTIONAL header exists, gap runs to end
  if (!optStart) {
    gapEnd = lastCol;
    return { mainEnd: mainEnd, gapStart: gapStart, gapEnd: gapEnd, optStart: 0, optEnd: 0 };
  }

  // gapEnd is just before optStart
  gapEnd = optStart - 1;

  // OPTIONAL end:
  // scan from optStart forward; when you hit a blank that has text later -> OPTIONAL ends before that blank
  optEnd = lastCol;
  var lastNonEmptyInOpt = optStart;

  for (var i = optStart; i <= lastCol; i++) {
    var cur = utilNormalizeText(values[i - 1]);
    if (cur !== '') {
      lastNonEmptyInOpt = i;
      continue;
    }

    // cur is blank; see if any text exists to the right
    var hasTextLater = false;
    for (var r = i + 1; r <= lastCol; r++) {
      if (utilNormalizeText(values[r - 1]) !== '') {
        hasTextLater = true;
        break;
      }
    }

    if (hasTextLater) {
      // OPTIONAL stops at last non-empty before this blank run
      optEnd = lastNonEmptyInOpt;
      break;
    }
  }

  return {
    mainEnd: mainEnd,
    gapStart: gapStart,
    gapEnd: gapEnd,
    optStart: optStart,
    optEnd: optEnd
  };
}

function utilChooseGapTheme_(layout, col) {
  var hasMain = layout.mainEnd > 0;
  var hasOpt = !!layout.optStart;

  if (!hasMain && !hasOpt) return '';

  // Distance to MAIN edge is distance to mainEnd (rightmost main col)
  var distMain = hasMain ? Math.abs(col - layout.mainEnd) : 999999;

  // Distance to OPT edge is distance to optStart (leftmost optional col)
  var distOpt = hasOpt ? Math.abs(layout.optStart - col) : 999999;

  if (distMain < distOpt) return 'MAIN';
  if (distOpt < distMain) return 'OPT';

  // tie
  // Special cases: adjacent to one side
  if (hasMain && col === layout.mainEnd + 1) return 'MAIN';
  if (hasOpt && col === layout.optStart - 1) return 'OPT';

  return '';
}

function utilApplyRowTemplate_(sheet, templateRow, targetRow, lastCol) {
  var templateRange = sheet.getRange(templateRow, 1, 1, lastCol);
  var targetRange = sheet.getRange(targetRow, 1, 1, lastCol);

  // Preserve anything the user already typed in that row
  var existingValues = targetRange.getValues();

  // 1) Copy formatting from template row -> target row
  templateRange.copyFormatToRange(sheet, 1, lastCol, targetRow, targetRow);

  // 2) Copy data validations (dropdowns)
  var dvs = templateRange.getDataValidations(); // 2D array
  targetRange.setDataValidations(dvs);

  // 3) Restore user-entered values (so we don't overwrite what they just typed)
  targetRange.setValues(existingValues);
}

