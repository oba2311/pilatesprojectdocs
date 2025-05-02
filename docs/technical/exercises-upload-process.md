# Exercises Upload Process

This document explains how the exercise upload script works and how it validates and fixes session categories to ensure consistency across the application.

## Overview

The `uploadExe.js` script is responsible for:

1. Converting exercise data from a CSV file to JSON format
2. Uploading the exercise data to Firestore
3. Validating existing session data against the new exercise data
4. Fixing any category mismatches in session cards

## Workflow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
'primaryColor': '#ffffff',
'primaryTextColor': '#597ef7',
'primaryBorderColor': '#597ef7',
'lineColor': '#597ef7',
'textColor': '#597ef7',
'mainBkg': 'transparent',
'nodeBorder': '#597ef7',
'clusterBkg': 'transparent',
'labelTextColor': '#597ef7',
'titleColor': '#597ef7',
'clusterBorder': '#fff',
'edgeLabelBackground': 'transparent'
}}}%%

graph LR
    CSV["Exercises.csv"] --> Convert["Convert to JSON"]
    Convert --> Upload["Upload to Firestore"]
    Upload --> Delete["Delete Old Exercises"]
    Delete --> AddNew["Add New Exercises"]
    AddNew --> Validate["Validate Session Categories"]
    Validate --> Fix["Fix Mismatches"]
```

## Category Normalization

The script ensures consistent category names by normalizing the categories in both the exercise data and session data:

1. It creates a normalization map based on the `CATEGORY_ORDER` constant
2. When processing exercise data, it normalizes category names to ensure correct casing
3. When checking session data, it identifies and corrects category case mismatches

## Session Category Validation

After uploading the new exercise data, the script validates session categories across all session collections:

1. It builds a reference map of all valid exercises by category and subcategory
2. It checks each session document in both regular and temporary session collections
3. For each session category, it verifies:
   - The category exists and has correct casing
   - The exercise value exists within that category

## Automatic Fixes

The script automatically applies the following fixes:

1. **Category Case Corrections**: If a session uses a category with incorrect casing (e.g., "warm up" instead of "Warm Up"), it updates it to the correct case
2. **Invalid Category Reporting**: It logs any completely invalid categories to help with manual cleanup

## Implementation Details

The script processes sessions in batches to ensure efficient Firestore updates:

1. It processes up to 500 sessions in each batch
2. It adds a timestamp to each updated session
3. It provides detailed logs of all changes made

## Running the Script

To run the script:

```bash
node scripts/uploadExe.js
```

The script requires:

- A `service-account.json` file in the scripts directory
- An `Exercises.csv` file in the scripts directory
- Proper environment variables set (PROJECT_ID, VITE_BUSINESS_ID)

## Output

The script provides a detailed summary at the end, including:

- Total sessions checked
- Total category errors found
- Total sessions fixed
- Total categories fixed

## Common Issues and Resolution

| Issue                                | Resolution                                             |
| ------------------------------------ | ------------------------------------------------------ |
| Category case mismatch               | Automatically fixed by normalizing to the correct case |
| Invalid category that doesn't exist  | Logged for manual review                               |
| Exercise value not found in category | Logged for manual review                               |

## Answers

1. What is the primary purpose of the uploadExe.js script?

   - [ ] A. To back up exercises to CSV
   - [ ] B. To validate session data
   - [x] C. To update the exercise database and fix session category mismatches
   - [ ] D. To generate reports on exercise usage

2. How does the script handle category case sensitivity?

   - [ ] A. It ignores case differences
   - [x] B. It normalizes categories to match the CATEGORY_ORDER constant
   - [ ] C. It converts all categories to lowercase
   - [ ] D. It requires manual correction

3. Which collections does the script check for session categories?

   - [ ] A. Only the sessions collection
   - [ ] B. Only collections with the business ID prefix
   - [x] C. Both regular and temporary sessions, with and without business ID prefix
   - [ ] D. None, it only updates exercises

4. What happens when an invalid exercise value is found in a session?

   - [ ] A. It's automatically removed
   - [ ] B. It's replaced with a default value
   - [x] C. It's logged for manual review but not automatically modified
   - [ ] D. The entire session is deleted

5. How does the script ensure consistency between category names?
   - [ ] A. By using a database lookup
   - [x] B. By using a case-insensitive normalization map built from CATEGORY_ORDER
   - [ ] C. By converting all names to a standard format
   - [ ] D. By requiring exact matches only

## Answers

1. C - The script updates the exercise database from CSV and fixes category mismatches in sessions
2. B - It normalizes categories using a map built from CATEGORY_ORDER for consistent casing
3. C - It checks all session collections to ensure comprehensive validation
4. C - Invalid exercises are logged but require manual review to determine appropriate action
5. B - A case-insensitive normalization map ensures consistent category naming
