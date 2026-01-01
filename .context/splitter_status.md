# Section Splitter & Independence Logic

## Overview

As of Jan 1, 2026, the codebase handles **Primary**, **Secondary**, and **Tertiary** sections as independent, isolated blocks. This independence is enforced physically via "Space Splitters" (protected empty columns) and logically via strict event handlers.

## 1. Physical Independence (The "Splitter")

Implemented in `libSections.js`, the splitter system ensures sections are visually and functionally separated.

### Dynamic Layout Parsing

The `getLayout(sheet)` function scans the header row (Row 1) to identify blocks of content separated by empty columns.

- **Primary**: Starts at Column 1. Extends until the first blank header.
- **Secondary**: Starts after the first blank column, **IF AND ONLY IF** there is actual content following it. If the header row is empty after the Primary block, the Secondary section is considered non-existent.
- **Tertiary**: Follows the same logic, appearing after the second blank column.

### Boundary Enforcement

The `enforceBoundaries(sheet)` function runs on every structure change (`INSERT_ROW`, `REMOVE_COLUMN`, etc.) and enforces:

1.  **Frozen Pane**:
    - **If Secondary Exists**: The pane freezes at the end of the Primary section (or purely at the splitter). This makes the Primary section "sticky" while you scroll horizontally through Secondary/Tertiary.
    - **If No Secondary**: The pane unfreezes (`setFrozenColumns(0)`).
2.  **Delimiters (The Splitter Column)**:
    - The empty column between Primary and Secondary (and Secondary/Tertiary) is automatically:
      - **Protected**: Locked so users cannot accidentally type in it.
      - **Styled**: Width set to `25px`, Background set to White.
    - **Cleanup**: If a section is deleted (e.g., Secondary content removed), the system detects the "orphan" delimiter and unprotects/resets it back to a normal column.

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
