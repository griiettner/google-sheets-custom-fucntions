# Google Sheets Advanced Automation Engine

A premium Google Apps Script framework designed to transform standard Google Sheets into enterprise-grade applications with real-time styling, structural integrity, and dynamic interdependent field logic.

## 🚀 Key Features

### 🎨 Intelligent Design System

- **Section-Independent Zebra Striping**: Automatically applies alternating row colors that respect section boundaries (Primary, Secondary, Tertiary).
- **Dynamic Separators**: Styled horizontal rows that act as section dividers, maintaining centered alignment and bold typography.
- **Header Orchestration**: Automated header styling and frozen pane management across all sheets.
- **Anti-Bleeding Enforcement**: Real-time text clipping to ensure data stays within its column boundaries.

### 🧠 Custom Cells System

- **Interdependent Dropdowns**: "Actions Result" fields that transform dynamically (Dropdowns, Checkboxes, Text) based on the "Actions" selection.
- **Persistent Configuration**: User-prompted settings (like column selection for `select-custom`) are persisted in cell notes to avoid repetitive prompting.
- **Self-Healing Validation**: Automatically restores dropdowns and rules when rows are modified or separators are cleared.
- **Automatic Cleanup**: Removes validation and formatting from empty rows to maintain a clean spreadsheet.

### 🛡️ Structural Integrity

- **Boundary Enforcement**: Prevents users from merging cells across section dividers or delimiters.
- **Layout Discovery**: Automatically detects section coordinates based on header names, allowing the system to follow columns if they are relocated.

---

## 📂 Project Structure

- `onEdit.js` / `onChange.js`: Main entry points for the real-time design engine.
- `libSections.js`: The "brain" that calculates layout and validates boundaries.
- `libRows.js`: Manages row-level visuals, zebras, and alignment.
- `utilCustomCells.js`: Handles complex field logic and dependencies.
- `config.js`: Central source of truth for themes and constants.

---

## 🛠️ Getting Started

1. **Prerequisites**: [CLASP](https://github.com/google/clasp) (Command Line Apps Script Projects) is recommended for development.
2. **Setup**:
   - Clone this repository.
   - Run `clasp login` and `clasp create` (or `clasp clone`).
   - Push code to your Google Sheet: `clasp push`.
3. **Configuration**: Adjust colors and constants in `config.js` to match your organization's branding.

---

## 📄 License

Custom Project - All Rights Reserved.
