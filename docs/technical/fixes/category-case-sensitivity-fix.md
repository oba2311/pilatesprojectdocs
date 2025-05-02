# Category Case Sensitivity Fix

## Overview

This document outlines a critical fix for the exercise category case sensitivity issue that was causing exercises in the "Side" category to be missing from the application.

## Issue Description

The application was not displaying all exercises in the "Side" category due to a case sensitivity mismatch between the data in Firestore and the expected category names in the application code.

## Problem Details

### Root Cause

1. In the exercises data, some entries used `"Category": "Side"` (capital 'S') while others used `"Category": "side"` (lowercase 's').
2. The application's `CATEGORY_ORDER` constant defined in `src/consts.ts` only recognized the proper case version (`"Side"`).
3. The exercise processing function in `src/lib/exercises.ts` was checking for exact category matches without normalizing case:

```typescript
// Only include categories that are in our order list
if (!category || !categorizedExercises.has(category)) {
	return;
}
```

4. As a result, exercises with lowercase "side" were being filtered out during processing.

### Data Analysis

- 14 exercises had `Category: "Side"` (capital 'S')
- 11 exercises had `Category: "side"` (lowercase 's')
- This meant approximately 44% of Side exercises were not being displayed

## Fix Implementation

### 1. Category Normalization in Exercise Processing

Modified `src/lib/exercises.ts` to include case-insensitive category matching:

```typescript
// Create a map for case-insensitive category lookup
const categoryNormalizationMap = new Map<string, string>();
categoryOrder.forEach((category) => {
	categoryNormalizationMap.set(category.toLowerCase(), category);
});

exercises.forEach((ex) => {
	// Handle both camelCase and PascalCase keys
	let category = ex.Category || ex.category;

	// Normalize category case to match CATEGORY_ORDER
	const normalizedCategory = categoryNormalizationMap.get(
		category.toLowerCase()
	);
	if (normalizedCategory) {
		category = normalizedCategory;
	}

	// Rest of processing...
});
```

### 2. Case-Insensitive Subcategory Order Lookup

Updated the `getSubcategoryOrder` function to be case-insensitive:

```typescript
const getSubcategoryOrder = (category: string) => {
	switch (category.toLowerCase()) {
		case "warm up":
			return WARMUP_SUBCATEGORY_ORDER;
		case "side":
			return SIDE_SUBCATEGORY_ORDER;
		// Other cases...
	}
};
```

### 3. Updated Verification Script

Enhanced `scripts/verify/categories.ts` to handle case sensitivity with warnings:

```typescript
// Create a map for case-insensitive category lookup
const categoryNormalizationMap = new Map<string, string>();
CATEGORY_ORDER.forEach((category) => {
	categoryNormalizationMap.set(category.toLowerCase(), category);
});

// During verification, check for case mismatches
if (!CATEGORY_ORDER.includes(category)) {
	// Check if it's a case sensitivity issue
	const normalizedCategory = categoryNormalizationMap.get(
		category?.toLowerCase()
	);

	if (normalizedCategory) {
		// It's a case sensitivity issue
		caseWarnings.add(`${category} (should be ${normalizedCategory})`);
	} else {
		// It's a completely invalid category
		invalidCategories.add(category);
	}
}
```

## Technical Implementation Details

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
  A[Raw Exercise Data] --> B[Category Normalization Map]
  B --> C{Case Match?}
  C -->|Yes| D[Use Original Category]
  C -->|No| E[Normalize to Standard Case]
  E --> F[Process Exercise]
  D --> F
  F --> G[Include in Results]
```

## Testing and Verification

To verify that the fix works correctly:

1. Run the application and check that all Side category exercises are displayed
2. Run the verification script to identify any other case sensitivity issues in the data
3. Monitor the console logs for any category normalizations happening during processing

## Best Practices and Lessons Learned

1. **Data Normalization**: Always normalize data when dealing with case-sensitive fields, especially when using values as keys in Maps or objects.

2. **Case-Insensitive Lookups**: For user-facing data like categories, implement case-insensitive lookups to prevent missing entries.

3. **Verification Scripts**: Have verification scripts that check for and warn about case inconsistencies in the data.

4. **Defensive Programming**: Use a more tolerant approach for matching strings in user-generated or imported data.

## Answers

1. What was the root cause of the missing Side category exercises?

   - [ ] A. The exercises were missing from the database
   - [ ] B. The Side category was not included in CATEGORY_ORDER
   - [x] C. Case sensitivity mismatch between data and application code
   - [ ] D. The exercises had incorrect order values

2. Why does the fix create a categoryNormalizationMap?

   - [ ] A. To improve performance
   - [x] B. To enable case-insensitive category lookups
   - [ ] C. To add new categories dynamically
   - [ ] D. To support multiple languages

3. What percentage of Side exercises were affected by this issue?

   - [ ] A. 25%
   - [ ] B. 33%
   - [x] C. 44%
   - [ ] D. 50%

4. Why modify the verification script to add warnings rather than errors for case mismatches?

   - [ ] A. To avoid fixing the data
   - [x] B. To distinguish between completely invalid categories and case issues
   - [ ] C. To improve verification script performance
   - [ ] D. To comply with TypeScript requirements

5. What would be the best long-term solution for this issue?
   - [ ] A. Always use lowercase for all categories in code and data
   - [ ] B. Create duplicate entries for different cases
   - [x] C. Normalize case during processing and standardize the data
   - [ ] D. Modify the application to require exact case matches
