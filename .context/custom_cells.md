# Custom Cells and Fields Documentation

This document explains the logic and architecture of the Custom Cells system implemented in this Google Sheets project.

## Overview

The Custom Cells system provides automated, real-time data validation and dynamic logic for specific columns within the **PRIMARY** section of the spreadsheet. It ensures that critical fields maintain their functionality even after structural changes like row insertions or content deletion.

## Core Files

- `utilCustomCells.js`: The central library containing the logic for identifying columns and applying rules.
- `onChangeCustomCells.js`: Orchestrates the application of rules across all sheets during structural changes.
- `onEdit.js` / `onChange.js`: Integration points that fire the logic during user interactions.

---

## Supported Column Headers

The system automatically identifies columns by their header names in Row 1.

### 1. "Types"

- **Behavior**: Applies a static dropdown validation.
- **Source**: `SETTINGS_FIELD!$A$2:$A`.
- **Cleanup**: Validation is automatically removed if the row is cleared or at the bottom of the section.

### 2. "Actions"

- **Behavior**: Applies a static dropdown validation.
- **Source**: `SETTINGS_FIELD!$C$1:$Z$1` (Grabs headers of action types).
- **Dependency**: Editing this cell triggers a refresh/wipe of the "Actions Result" cell in the same row.

### 3. "Required"

- **Behavior**: Automatically transforms the cell into a **Checkbox** for boolean selection.

### 4. "Actions Result" (Dependent Field)

This is the most complex field. Its behavior changes dynamically based on the value selected in the **"Actions"** column. It identifies the target type by looking at **Row 2** of the matching column in the `SETTINGS_FIELD` sheet.

#### Supported Sub-Types:

| Type                   | Behavior                                                                                                                                                                                   |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`select`**           | Builds a dropdown using values from **Row 3+** of the corresponding settings column.                                                                                                       |
| **`bool`**             | Transforms the cell into a **Checkbox**.                                                                                                                                                   |
| **`select-custom`**    | Prompts the user to enter a **Column Letter** (e.g. "B"). It then builds a dropdown using all values from that column in the active sheet. The choice is persisted in the cell's **Note**. |
| **`options-match`**    | Prompts the user for a **Column Letter**, collects all values from that column, and writes them into the cell as a JSON array string: `["Option 1", "Option 2"]`.                          |
| **`text` / `disable`** | Clears all data validation, allowing free text entry or resetting the field.                                                                                                               |

---

## System Features

- **Self-Healing**: If a user clears the content of a row, the custom validation (dropdowns/checkboxes) is automatically cleaned up to keep the sheet tidy.
- **Persistence**: Choices made during prompts (like the column letter for `select-custom`) are stored in background cell notes, so the user only has to answer once per row.
- **Real-Time Synergy**: The system coordinates with the Header/Zebra styling engines to ensure a consistent, premium user experience.
