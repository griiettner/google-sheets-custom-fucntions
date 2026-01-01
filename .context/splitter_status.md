# Section Splitter & Independence Logic

## Overview

As of Jan 1, 2026, the codebase handles **Primary**, **Secondary**, and **Tertiary** sections as independent, isolated blocks. This independence is enforced physically via "Space Splitters" (protected empty columns) and logically via strict event handlers.

## 1. Physical Independence (The "Splitter")

Implemented in `libSections.js`, the splitter system ensures sections are visually and functionally separated.

### Dynamic Layout Parsing

The `getLayout(sheet)` function uses a **Block-Based Detection** system. Instead of looking for the "first blank," it identifies all continuous islands of content in the header row.

- **Primary (Block 1)**: Always the first cluster of headers (or starts at Col 1).
- **Secondary (Block 2)**: The second island of content found after a gap.
- **Tertiary (Block 3)**: The third island of content found after a second gap.
- **Delimiters**: The specific columns that sit _between_ these blocks are dynamically identified as delimiters.

### Boundary Enforcement

The `enforceBoundaries(sheet)` function enforces the following with a focus on **Data Safety**:

1.  **Frozen Pane**:
    - **Header Pinning**: The Header Row (Row 1) is always pinned to the top of the sheet for consistent visibility during vertical scrolling.
    - **Single Anchor**: Google Sheets only supports one vertical freeze. The pane always freezes at the end of the **Primary** section if Secondary/Tertiary content exists.
    - **Cleanup**: If secondary content is removed, the pane unfreezes horizontally (`setFrozenColumns(0)`) but remains pinned vertically.
2.  **Delimiters (Space Splitters)**:
    - Target columns are automatically:
      - **Protected**: Soft-locked with a warning to prevent accidental edits.
      - **Styled**: Width set to `25px`, Background set to White.
    - **Non-Destructive**: The system **never** uses `clearContent()` on these columns. If a user types in a gap, the script simply detects it's no longer a delimiter and restores the column width.
    - **Cleanup**: If a section is moved or deleted, the system detects the "stale" delimiter protections and resets the columns to standard width (100px) and removes the lock.

## 2. Logical Independence

Implemented effectively via `validateRange` and strict checks in `onEditRowTemplate.js`.

### Rigid Boundaries

- **Cross-Section Blocking**: It is impossible to merge a cell that spans across a splitter. If a user attempts to merge `Primary Col` with `Secondary Col`, the script immediately detects the `INVALID` range and undoes the action with an alert.
- **Isolated Theming**:
  - **Header**: Primary headers get Blue, Secondary get Red, Tertiary get Grey.
  - **Separators**: Merging a row _within_ a section creates a "Section Separator" styled specifically for that section (Blue/Red/Grey). This styling logic only activates if the merge is fully contained within one section.

## Configuration references

- **`config.js`**:
  - `DELIMITER`: `{ WIDTH: 25, BG: '#ffffff' }`
  - `SEPARATOR`: Defines the color palette for Primary/Secondary/Tertiary separators.
