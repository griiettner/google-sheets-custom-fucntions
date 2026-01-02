# Zebra Row Styling Logic

## Overview

As of Jan 1, 2026, the codebase implements **Independent Section Zebra Striping** via the `LibRows` library. This ensures that each functional section of the spreadsheet (Primary, Secondary, Tertiary) maintains its own alternating row pattern without "bleeding" into empty areas or overwriting architectural elements like separators.

## 1. Independent Section Boundaries

The zebra logic utilizes `LibSections.getLayout()` to identify the physical columns belonging to each section.

- **Primary Section**: Column 1 through the first delimiter.
- **Secondary Section**: Content block after the first delimiter.
- **Tertiary Section**: Content block after the second delimiter.

Each section acts as an isolated "painting zone." The zebra stripes in the Primary section will not cross over the white space splitters into the Secondary section.

## 2. Smart Stopping Points (Content Awareness)

Unlike traditional sheet-wide zebra striping, this system calculates a **User-Specific Last Row** for every section individually:

- **Local Discovery**: The script scans only the columns _within_ a specific section to find the last row containing any text.
- **Isolated Lengths**: If the Primary section has 50 rows of data but the Secondary section only has 5, the Primary section will show 50 rows of stripes while the Secondary section stops at row 5.
- **Auto-Cleanup**: When rows are deleted, the system re-calculates the local "stopping point" and clears background colors from the now-empty rows.

## 3. Style & Color Palette

Colors are managed globally in `config.js` under the `ZEBRA` object:

| Section       | Variant A         | Variant B              | Logic                      |
| :------------ | :---------------- | :--------------------- | :------------------------- |
| **Primary**   | White (`#ffffff`) | Light Blue (`#eef5fb`) | `(r + startRow) % 2 === 0` |
| **Secondary** | White (`#ffffff`) | Light Red (`#fdeeee`)  | `(r + startRow) % 2 === 0` |
| **Tertiary**  | White (`#ffffff`) | Light Grey (`#f2f2f2`) | `(r + startRow) % 2 === 0` |

_Note: Stripe alignment is synchronized across sections so that Row 2 is always Variant A in all sections, ensuring a professional horizontal alignment._

## 4. Separator Preservation

The system is "Separator Aware." It respects administrative rows created via the Merge tool:

- **Color Detection**: Before applying a stripe, the script checks if the row is styled with a `SEPARATOR` background color (defined in `config.js`).
- **Skip Logic**: If a row is identified as a Separator (Merged Row), the zebra painting is skipped for that specific row to preserve the bold section divider.

## 5. Triggers & Execution

- **`onEdit`**: Fires on every cell change. Re-calculates zebra patterns to ensure stripes shift correctly when data is added or removed. It runs last in the orchestration sequence to override any formatting applied by the row template.
- **`onChange`**: Fires on structural changes (like deleting rows or adding columns). Performs a full sheet refresh of the zebra patterns.

## Configuration references

- **`config.js`**:
  - `ZEBRA`: Defines alternating color pairs.
  - `SEPARATOR`: Defines the colors identifying "don't paint" rows.
  - `TEMPLATE_ROW`: Defines where data (and thus zebra) begins (usually Row 2).
