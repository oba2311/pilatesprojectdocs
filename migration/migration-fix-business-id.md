# Migration Script Fix: Missing BUSINESS_ID Variable

## Description

The sync feature migration script (`migrate-sync.ts`) was failing because it referenced a variable named `BUSINESS_ID` that was not defined. This variable is used to create collection names for the migration process.

## Steps to reproduce

1. Run the migration script with `npm run migrate`
2. Observe the error message:

```
ReferenceError: BUSINESS_ID is not defined
    at <anonymous> (/Users/obamain/Code/2025-code/pilates-studio-app/scripts/migrate-sync.ts:86:29)
```

## Expected behavior

The script should run without errors and successfully migrate all sessions with the required fields.

## Actual behavior

The script failed with a reference error at line 86 because `BUSINESS_ID` was not defined.

## Fix

Added a definition for `BUSINESS_ID` in the script, using the first business ID from the `BUSINESS_IDS` array:

```typescript
// Constants - handle all business IDs and non-prefixed collections
const BUSINESS_IDS = ["1", "2"];
const USE_BUSINESS_ID = true;
// Default business ID for operations that need a single ID reference
const BUSINESS_ID = BUSINESS_IDS[0]; // Using the first business ID as default
```

## Migration Results

After fixing the issue, the migration script ran successfully with the following results:

1. Created backups of all Firestore collections (10 collections in total)
2. Created separate backups for each sessions collection
3. Migrated 422 sessions across all collections:
   - 23 sessions in `1:sessions`
   - 5 sessions in `2:sessions`
   - 394 sessions in `sessions`
4. Set up temporary sessions collections for all business IDs
5. Verified all sessions have the required fields

## Tech Description

The migration script is designed to handle multiple business IDs and both prefixed and non-prefixed collections. It ensures all sessions have the `lastUpdated` and `studioId` fields, which are required for the sync feature.

The migration process follows these steps:

1. Backup all Firestore data
2. Backup each sessions collection separately
3. Migrate sessions to include required fields
4. Set up temporary sessions collections
5. Verify the migration results

## Questions and Answers

1. Why was the BUSINESS_ID variable needed?

   - [ ] A. It's used only for logging purposes
   - [x] B. It's used to construct collection names for migration
   - [ ] C. It's required by Firebase Admin SDK
   - [ ] D. It's only used for backward compatibility

2. What fields were added to sessions during migration?

   - [ ] A. Only lastUpdated
   - [ ] B. Only studioId
   - [x] C. Both lastUpdated and studioId
   - [ ] D. Neither - they were already present

3. Why use a default business ID from the array?
   - [ ] A. To save memory
   - [x] B. To have a consistent reference for operations that require a single business ID
   - [ ] C. Because Firebase requires it
   - [ ] D. It's not actually needed

## Answers

1. B - The BUSINESS_ID variable is used to construct collection names like `${BUSINESS_ID}:sessions` which are needed for the migration process.
2. C - Both fields (lastUpdated and studioId) were added to sessions that didn't have them.
3. B - A default business ID provides a consistent reference point for operations that require a single business ID, such as naming collections.
