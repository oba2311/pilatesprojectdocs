# Development Environment Database Structure Update

## Overview

To ensure proper testing of migration scripts and sync features, we've updated the development environment database structure to match the production environment. This includes creating the required `temp_sessions` collections for all business IDs and ensuring all data contains the necessary fields (`lastUpdated` and `studioId`).

## Changes Made

### 1. Added Support for Studio 2 Data

- Added instructors and trainees for Studio 2
- Created Studio 2 sessions in both prefixed (`2:sessions`) and non-prefixed collections
- Added data with proper `studioId` values to identify which studio each record belongs to

### 2. Added Required Fields

- Added `lastUpdated` field to all data records
- Ensured `studioId` is consistently set across all collections

### 3. Created Temp Sessions Collections

- Created all three required temp_sessions collections:
  - `1:temp_sessions` (Studio 1)
  - `2:temp_sessions` (Studio 2)
  - `temp_sessions` (non-prefixed)
- Added verification documents to ensure collections exist
- Added sample sessions to each collection for testing

### 4. Fixed Exercise Categories

- Consolidated to a single source of truth by using only the exercises.json file in the project root
- Removed the duplicate exercises.json from the scripts directory to avoid confusion
- Updated the seed script to use the comprehensive exercise list which includes "Side" category exercises
- Added logging to show which categories are included in the seed data

## Technical Details

### Updated Data Structure

The seed data was updated to include:

1. Studio 1 and Studio 2 instructors:

```typescript
instructors: [
	{ id: "instructor1", firstName: "John", lastName: "Doe", studioId: "1" },
	{ id: "instructor2", firstName: "Jane", lastName: "Smith", studioId: "1" },
	{
		id: "instructor3",
		firstName: "Robert",
		lastName: "Johnson",
		studioId: "2",
	},
	{ id: "instructor4", firstName: "Emily", lastName: "Brown", studioId: "2" },
];
```

2. Studio 1 and Studio 2 trainees with `lastUpdated` field:

```typescript
{
  id: '2001',
  firstName: 'Sarah',
  lastName: 'Matthews',
  // ...other fields...
  studioId: '2',
  lastUpdated: Date.now()
}
```

3. Studio 1 and Studio 2 sessions with `lastUpdated` field:

```typescript
{
  traineeId: '2001',
  instructorId: 'instructor3',
  // ...other fields...
  studioId: '2',
  lastUpdated: Date.now()
}
```

4. Side category exercises:

```typescript
{
  category: "Side",
  subcategory: "",
  series: "",
  exercise: "Lift M"
}
```

### Verification Documents

For each temp sessions collection, we create a verification document to ensure the collection exists even if it doesn't contain any sessions:

```typescript
const verificationDoc = {
	migrationCheck: true,
	timestamp: timestamp,
	studioId: collectionName.includes(":") ? collectionName.split(":")[0] : "1",
};
```

## Why This Is Important

These changes are critical because:

1. **Testing Migration Scripts**: The migration process needs to operate on all collections, so we need to match the production environment structure exactly
2. **Verifying Sync Features**: The sync feature will transfer data between collections, requiring all collections to exist
3. **Validating Field Updates**: The migration adds `lastUpdated` and `studioId` fields, which need to be tested properly
4. **Ensuring Consistency**: Both development and production environments should have the same structure for reliable testing
5. **Complete Exercise Data**: Ensuring all exercise categories, including "Side" category exercises, are available in the development environment
6. **Single Source of Truth**: Having only one exercises.json file eliminates confusion and ensures consistent data across environments

## Compatibility with Firebase Emulator

All these changes work seamlessly with the Firebase emulator:

1. Both prefixed and non-prefixed collections are correctly created
2. All necessary indices are automatically generated
3. Test data is appropriate for verifying migration and sync functionality
4. Complete exercise data is included from a single authoritative source

## Questions and Answers

1. Why do we need both prefixed and non-prefixed collections?

   - [ ] A. It's a legacy requirement
   - [x] B. To support both older and newer data structures during migration
   - [ ] C. Only for testing purposes
   - [ ] D. It's more efficient

2. Why are verification documents important?

   - [ ] A. They hold important data
   - [ ] B. They're required by Firebase
   - [x] C. They ensure collections exist even when empty
   - [ ] D. They help with database indexing

3. What fields were added to ensure compatibility with the migration script?

   - [ ] A. Only studioId
   - [ ] B. Only lastUpdated
   - [x] C. Both studioId and lastUpdated
   - [ ] D. Neither - they were already there

4. Why was the exercises data source simplified?

   - [ ] A. To improve performance
   - [ ] B. Because the script path was incorrect
   - [x] C. To establish a single source of truth and avoid duplication
   - [ ] D. To reduce the database size

## Answers

1. B - The prefixed collections (`1:sessions`, `2:sessions`) support studios with existing data using the studio prefix, while non-prefixed collections support the new unified structure.
2. C - Firebase console and some APIs don't display empty collections, but the verification documents ensure they exist and are visible.
3. C - Both `studioId` and `lastUpdated` are required for the migration and sync process.
4. C - Having duplicate files with the same name but different content in different directories caused confusion. Using only the complete file from the project root establishes a single source of truth.
