# Project Discoveries

## Overview

This project is a Google Apps Script (GAS) application designed to enhance Google Sheets functionality. It is managed locally using `clasp` (Command Line Apps Script Projects). The script focuses on automating spreadsheet styling, row management, and interactive cell behaviors based on user events.

## Key Features

### 1. Event-Driven Architecture

The application relies on core trigger functions to execute logic:

- **`onEdit(e)`**: Triggers when a user modifies a cell. It handles:
  - Contextual header styling.
  - Zebra striping updates.
  - Row template application.
  - **Dependent Logic**: Specifically watches an "Action Column" (Col D) to reset or modify a "Dependent Column" (Col E).
- **`onChange(e)`**: Triggers on structural changes (e.g., inserting/removing rows or columns). It ensures global styles (headers, zebra striping) remain consistent after structure updates.

### 2. Dynamic Styling

- **Header Themes**: intelligently applies background and font colors to header rows based on content "regions" (Main vs. Optional columns).
- **Zebra Striping**: Automates alternating row colors for better readability (`ZEBRA` config).

### 3. Advanced Row Management

- **Template System**: Uses a specific "Template Row" (Row 2 by default) to copy formatting and data validations (dropdowns) to new or modified rows. This ensures consistency across the sheet without manual setup.
- **Layout Computation**: The script calculates "Main" and "Optional" column sections dynamically based on empty header cells, allowing for flexible sheet layouts.

### 4. Interactive Cell behaviors

The script implements a "Router" pattern in `onEdit` to handle different input types in the Action Column:

- **Custom Select**: Triggers specific logic for custom dropdowns.
- **Text Match / Text Plain**: Specific handling for text inputs.
- **Dependent Cells**: Automatically clears and resets validations in dependent cells when the parent action changes.

## Configuration

All hardcoded values are centralized in `config.js` under the `CFG` and `ZEBRA` objects. This makes the script easily maintainable. Key configurations include:

- **Colors**: Hex codes for Main, Optional, and Grey themes.
- **Dimensions**: Header and row heights.
- **Column Indices**: Defines which columns act as triggers (Action Col) and targets (Dependent Col).
- **Keywords**: specific string constants for logic (e.g., 'Custom Select', 'Options Match').

## Project Structure

- **`.clasp.json`**: Clasp configuration connecting to Script ID `1pYVyg6LA_u1LfDOz05eIwcU_AadB-8TsWfBkm4DMn0vDIpsBsNAmczLi`.
- **`appsscript.json`**: Manifest file defining timezone (America/New_York) and runtime (V8).
- **`utils.js`**: Contains pure helper functions for logic that doesn't directly interact with the spreadsheet service (text normalization, layout calculation) and reusable sheet operations (applying styles).
- **`onEdit*.js` / `onChange*.js`**: Modularized logic files handling specific aspects of the event triggers.

## Recommendations for Context

- **Modularization**: The project is already well-structured with separate files for different handlers (`onChangeRows.js`, `onEditHeaderTheme.js`), which is excellent for maintainability.
- **Deployment**: Ensure `clasp push` is used to sync local changes to the Apps Script editor.
