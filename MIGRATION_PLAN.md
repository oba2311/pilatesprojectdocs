# Sync Feature Migration Plan

## Overview

This document outlines the detailed plan for safely migrating the Pilates Studio application from the existing Firebase setup to the new sync-enabled structure without data loss. The sync feature introduces real-time synchronization between multiple users, with substantial changes to how session data is handled.

## Migration Challenges

The sync feature fundamentally changes how session data is handled:

1. **New Required Fields**: Adds fields like `lastUpdated`, `studioId`, and properly formatted `tempId` values
2. **New Collection**: Introduces a dedicated `temp_sessions` collection for temporary sessions
3. **Collection Naming Strategy**: Supports both prefixed (`${BUSINESS_ID}:sessions`) and non-prefixed (`sessions`) collection names
4. **Data Flow Changes**: Modifies how data persists between Redux, localStorage, and Firestore
5. **Conflict Resolution**: Implements a last-write-wins strategy based on timestamps

## Pre-Deployment Phase

### 1. Create Complete Backups

First, we need to ensure we have full backups of both Firestore data and application state:

```bash
# Enable the commented-out GH workflow to run a backup
cd pilates-studio-app
git checkout -b enable-backup-workflow
```

1. Edit `.github/workflows/firestore-backup.yml` to uncomment the backup workflow
2. Push this change and run the backup manually via GitHub UI

Alternatively, run a manual backup:

```bash
# Run the backup script directly (requires proper credentials)
NODE_ENV=production PROJECT_ID=your-project-id node scripts/backup-firestore.js
```

### 2. Create a Staging Environment for Testing

```bash
# Create a temporary branch for testing the migration
git checkout -b sync-migration-test main
git merge --no-ff feat-sync-between-users

# Deploy to a staging environment in Vercel
# This can be done via Vercel UI or CLI
vercel
```

### 3. Implement Migration Script

Create a new script at `scripts/migrate-sync-feature.ts` with the following content:

```typescript
#!/usr/bin/env tsx

/**
 * Sync Feature Migration Script
 *
 * This script handles migration from the old session storage to the new sync-enabled structure.
 * It performs the following tasks:
 * 1. Creates backups of current Firestore data
 * 2. Migrates existing sessions to include required fields
 * 3. Updates collection naming if needed
 * 4. Verifies data integrity after migration
 */

import { db } from "../src/firebase";
import {
	collection,
	getDocs,
	doc,
	setDoc,
	writeBatch,
	deleteDoc,
} from "firebase/firestore";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Constants
const BUSINESS_ID = process.env.VITE_BUSINESS_ID;
const USE_BUSINESS_ID = process.env.VITE_USE_BUSINESS_ID === "true";

// Old collection name with business ID prefix
const OLD_COLLECTION_NAME = `${BUSINESS_ID}:sessions`;
const TEMP_OLD_COLLECTION_NAME = `${BUSINESS_ID}:temp_sessions`;

// New collection name without prefix
const NEW_COLLECTION_NAME = "sessions";
const TEMP_NEW_COLLECTION_NAME = "temp_sessions";

// Use the appropriate collection name based on the environment variable
const CURRENT_COLLECTION_NAME = USE_BUSINESS_ID
	? OLD_COLLECTION_NAME
	: NEW_COLLECTION_NAME;
const TEMP_CURRENT_COLLECTION_NAME = USE_BUSINESS_ID
	? TEMP_OLD_COLLECTION_NAME
	: TEMP_NEW_COLLECTION_NAME;

// Helper to create backup directory
const createBackupDir = async () => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const backupDir = path.join(__dirname, "../backups");
	await fs.mkdir(backupDir, { recursive: true });
	return backupDir;
};

// Create backup of existing Firestore data
const backupFirestoreCollection = async (collectionName: string) => {
	try {
		console.log(`📦 Backing up collection: ${collectionName}`);
		const backupDir = await createBackupDir();
		const timestamp = new Date().toISOString().replace(/:/g, "-");
		const backupPath = path.join(
			backupDir,
			`${collectionName.replace(":", "-")}-${timestamp}.json`
		);

		const snapshot = await getDocs(collection(db, collectionName));
		const data = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
		console.log(`✅ Backup created at: ${backupPath}`);
		return data;
	} catch (error) {
		console.error(`❌ Error backing up collection ${collectionName}:`, error);
		throw error;
	}
};

// Create backup of localStorage data
const backupLocalStorage = async () => {
	// Can only be done in browser context
	console.log(`⚠️ Local storage backup must be done manually in browser`);
	console.log(
		`📋 Please run the following in browser console and save the output:`
	);
	console.log(`   copy(localStorage.getItem('pilates_studio_sessions'))`);
	console.log(
		`📋 Then paste and save to a file named 'localStorage-backup.json'`
	);
};

// Migrate sessions collection if needed
const migrateSessionsCollection = async () => {
	try {
		console.log(`🔄 Migrating sessions collection...`);

		const snapshot = await getDocs(collection(db, CURRENT_COLLECTION_NAME));
		let migratedCount = 0;
		const batch = writeBatch(db);

		for (const document of snapshot.docs) {
			const sessionData = document.data();
			let needsUpdate = false;

			// Add lastUpdated if missing
			if (!sessionData.lastUpdated) {
				sessionData.lastUpdated = Date.now();
				needsUpdate = true;
			}

			// Add studioId if missing
			if (!sessionData.studioId) {
				sessionData.studioId = BUSINESS_ID;
				needsUpdate = true;
			}

			if (needsUpdate) {
				const docRef = doc(db, CURRENT_COLLECTION_NAME, document.id);
				batch.set(docRef, sessionData, { merge: true });
				migratedCount++;
			}
		}

		if (migratedCount > 0) {
			await batch.commit();
			console.log(`✅ Updated ${migratedCount} sessions with required fields`);
		} else {
			console.log(`ℹ️ No sessions needed migration`);
		}

		return migratedCount;
	} catch (error) {
		console.error(`❌ Error migrating sessions:`, error);
		throw error;
	}
};

// Migrate temporary sessions if needed
const migrateTemporarySessions = async () => {
	try {
		console.log(`🔄 Checking temp_sessions collection...`);

		// First create the collection if it doesn't exist
		const tempRef = doc(db, TEMP_CURRENT_COLLECTION_NAME, "migration-check");
		await setDoc(tempRef, {
			migrationCheck: true,
			timestamp: Date.now(),
			studioId: BUSINESS_ID,
		});
		await deleteDoc(tempRef);

		console.log(`✅ Verified temp_sessions collection exists and is writable`);
		return true;
	} catch (error) {
		console.error(`❌ Error verifying temp_sessions collection:`, error);
		throw error;
	}
};

// Migrate localStorage sessions to Firestore
const migrateLocalStorageSessions = async () => {
	try {
		console.log(
			`🔄 Migration from localStorage must be done in browser context`
		);
		console.log(
			`📋 Please run the following code in the browser console after deployment:`
		);
		console.log(`
    (async () => {
      // Get sessions from localStorage
      const storedData = localStorage.getItem('pilates_studio_sessions');
      if (!storedData) return;
      
      const sessions = JSON.parse(storedData);
      if (!sessions.temporary || !Array.isArray(sessions.temporary)) return;
      
      // Filter for sessions that should be synced (have traineeId and not empty)
      const syncableSessions = sessions.temporary.filter(
        s => s.traineeId && s.tempId && !s.tempId.startsWith('empty-')
      );
      
      console.log(\`Found \${syncableSessions.length} sessions to migrate\`);
      
      // Import sessions service
      const sessionsService = await import('./services/sessions.js');
      
      // Migrate each session
      for (const session of syncableSessions) {
        // Add required fields if missing
        const sessionToMigrate = {
          ...session,
          lastUpdated: session.lastUpdated || Date.now(),
          studioId: session.studioId || '${BUSINESS_ID}'
        };
        
        try {
          await sessionsService.addTemporary(sessionToMigrate);
          console.log(\`✅ Migrated session \${session.tempId}\`);
        } catch (error) {
          console.error(\`❌ Failed to migrate session \${session.tempId}:\`, error);
        }
      }
      
      console.log(\`✅ Migration completed\`);
    })();
    `);

		return true;
	} catch (error) {
		console.error(`❌ Error with localStorage migration guidance:`, error);
		throw error;
	}
};

// Run the migration
const runMigration = async () => {
	try {
		console.log(`🚀 Starting sync feature migration...`);

		// 1. Create backups
		await backupFirestoreCollection(CURRENT_COLLECTION_NAME);

		try {
			await backupFirestoreCollection(TEMP_CURRENT_COLLECTION_NAME);
		} catch (e) {
			console.log(`ℹ️ No existing temp_sessions collection to backup`);
		}

		await backupLocalStorage();

		// 2. Migrate sessions
		await migrateSessionsCollection();

		// 3. Set up temporary sessions collection
		await migrateTemporarySessions();

		// 4. Provide guidance for localStorage migration
		await migrateLocalStorageSessions();

		console.log(`✅ Migration completed successfully!`);
	} catch (error) {
		console.error(`❌ Migration failed:`, error);
		process.exit(1);
	}
};

// Run the migration
runMigration();
```

### 4. Verify Test Coverage

```bash
# Run the sync-specific tests
cd pilates-studio-app
npm run test:sync -- --coverage=true

# Verify user sync functionality works
npm run test:sync -- --file=user-sync

# Verify critical flows work with sync
npm run test:sync -- --project=critical
```

## Deployment Process

### 1. Create a Clean Merge Branch

```bash
# Create a clean merge branch for the final deployment
git checkout -b sync-feature-deploy main
git merge --no-ff feat-sync-between-users
```

### 2. Run Pre-Deployment Checks

Use a checklist approach to verify all is ready:

```bash
# Verify tests and linting pass
npm run test
npm run lint

# Verify the migration script works correctly by running against a copy of the database
# (This should be done in the development environment)
NODE_ENV=development npm run migrate-sync
```

### 3. Gradual Rollout Plan

#### Stage 1: Limited deployment (1-2 days)

1. **Deploy to a small subset of users first**

   - Create a preview deployment in Vercel
   - Use feature flags if available to limit rollout
   - Monitor for any issues before full deployment

2. **Monitor for Issues**
   - Watch Firestore read/write operations for any unusual spikes
   - Check error logs for any sync-related issues
   - Verify session persistence works correctly
   - Test conflict resolution with multiple simultaneous edits

#### Stage 2: Full deployment (1-2 days)

```bash
# 1. Run one final backup before deployment
npm run backup-firestore

# 2. Push the merge branch to trigger the GitHub deployment workflow
git push origin sync-feature-deploy

# 3. In Vercel dashboard, promote the preview deployment to production
```

### 4. Post-Deployment Verification

After deployment, run verification tests:

```bash
# Run tests against production environment
npm run test:prod

# Manually verify key functionality:
# - Create a new session
# - Edit a session from multiple browsers
# - Verify synchronization works
```

### 5. Monitor for Issues

Set up monitoring in Vercel and Firebase to watch for:

- Increased error rates
- Performance degradation
- Firestore read/write spikes
- Session conflicts
- User reports of data synchronization issues

Implement additional monitoring for:

- Collection size growth
- Sync latency between devices
- Temporary session cleanup effectiveness

## Rollback Plan

In case of critical issues, have a rollback plan ready:

### Immediate Rollback

```bash
# 1. Revert to the previous production deployment in Vercel
# (This can be done through the Vercel dashboard)

# 2. If needed, restore Firestore data from backup
NODE_ENV=production npm run restore-firestore -- backups/backup-YYYY-MM-DD.json
```

### Selective Rollback

If issues only affect specific components:

1. **Disable sync temporarily**: Set `USE_SYNC_FEATURE` environment variable to 'false'
2. **Update middleware**: Deploy a hotfix that disables the Firebase sync middleware
3. **Restore previous persistence**: Roll back to local storage only if needed

## Timeline

Based on the merge plan documents, we recommend the following timeline:

1. **Pre-Deployment Testing (1 day)**

   - Create backups
   - Run all tests
   - Implement and test migration script

2. **Deployment (1-2 days)**

   - Deploy to staging/preview environment
   - Verify functionality with limited users
   - Deploy to production with careful monitoring

3. **Post-Deployment (1 week)**
   - Monitor for issues
   - Gather user feedback
   - Make adjustments as needed

## Risk Assessment

| Risk                       | Likelihood | Impact | Mitigation                                          |
| -------------------------- | ---------- | ------ | --------------------------------------------------- |
| Data loss during migration | Low        | High   | Complete backups, test migration on copy first      |
| Synchronization failures   | Medium     | Medium | Extensive tests, monitoring, fallback to local-only |
| Performance issues         | Low        | Medium | Performance tests, monitoring                       |
| User confusion             | Medium     | Low    | Documentation, tooltips, gradual rollout            |
| Conflict resolution issues | Medium     | Medium | Test multiple simultaneous edits, monitor logs      |

## Success Criteria

The migration can be considered successful when:

1. All existing sessions have been migrated with required fields
2. Synchronization works between multiple users
3. No data loss occurs during migration
4. Performance remains within acceptable limits
5. Users report no significant issues with the new sync functionality

## Conclusion

By following this carefully planned approach, we can safely migrate to the new sync feature while minimizing risks. The key aspects are:

1. **Complete backups** before any changes
2. **Thorough testing** in a staging environment
3. **Gradual rollout** to catch issues early
4. **Continuous monitoring** to quickly address any problems
5. **Ready rollback plan** in case of critical issues

## Answers

1. Why is it important to add the lastUpdated field to all sessions?

   - [ ] A. For sorting sessions by date
   - [ ] B. For display purposes in the UI
   - [ ] C. For conflict resolution between simultaneous edits
   - [ ] D. To track session creation time

2. What is the purpose of the debounce mechanism in the sync feature?

   - [ ] A. To improve UI responsiveness
   - [ ] B. To prevent excessive Firestore operations
   - [ ] C. To reduce network bandwidth usage
   - [ ] D. To delay user input processing

3. Why are sessions with tempId starting with "empty-" not synced?

   - [ ] A. They consume too much storage
   - [ ] B. They're intended for local use only
   - [ ] C. They're automatically deleted after use
   - [ ] D. They contain sensitive information

4. What strategy is used for conflict resolution in the sync feature?

   - [ ] A. First-write-wins
   - [ ] B. Last-write-wins
   - [ ] C. Merge conflicting changes
   - [ ] D. Ask the user to resolve conflicts

5. What is the main benefit of the gradual rollout approach?
   - [ ] A. Reduced server load
   - [ ] B. Early detection of issues with minimal impact
   - [ ] C. Faster deployment overall
   - [ ] D. Better user training

## Answers

1. C - The lastUpdated timestamp is essential for conflict resolution when multiple users edit the same session simultaneously.
2. B - The debounce mechanism prevents excessive Firestore operations by limiting how frequently sessions are synced.
3. B - Empty sessions are intended for local use only and don't need to be synchronized across users.
4. B - The sync feature uses a last-write-wins strategy based on the lastUpdated timestamp.
5. B - Gradual rollout allows for early detection of issues while minimizing the impact on users.
