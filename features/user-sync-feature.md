# User Synchronization Feature

## Description

The User Synchronization feature enables real-time data synchronization between multiple users of the Pilates Studio App. This ensures that all users have access to the most up-to-date information about trainees, sessions, and schedules regardless of which user made the changes.

Key capabilities:

- Real-time session updates across multiple clients
- Persistence of temporary data during synchronization
- Conflict resolution for simultaneous edits
- Automatic session data refresh when changes are detected

## Tech Description and Schemas

The synchronization system is built on Firebase Firestore's real-time capabilities, enhanced with Redux for local state management. The architecture follows a middleware pattern where Redux actions are intercepted, processed, and synchronized with Firestore.

### Architecture

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
    A[User Interface] --> B[Redux Actions]
    B --> C[Sessions Reducer]
    C --> D[Local State]
    B --> E[Firebase Middleware]
    E --> F[Firestore Database]
    F --> G[Firestore Listeners]
    G --> H[Sync Actions]
    H --> C
    D --> A
</graph>
```

### Data Flow

1. **User Interaction**: A user interacts with the application (e.g., creates, updates, or deletes a session)
2. **Redux Action**: The interaction dispatches a Redux action
3. **Middleware Interception**: The Firebase middleware intercepts the action
4. **Firestore Update**: The middleware updates the Firestore database
5. **Real-time Listener**: Other clients' Firestore listeners detect the change
6. **State Update**: The listeners dispatch synchronization actions to update the local Redux state
7. **UI Refresh**: The UI updates to reflect the changes

### Session Schema

```typescript
interface Session {
	id?: string; // Firestore document ID (if saved)
	tempId: string; // Temporary ID for unsaved sessions
	traineeId: string; // ID of the trainee
	trainee: Trainee; // Trainee object
	instructorId?: string; // ID of the instructor (optional)
	instructor?: Instructor; // Instructor object (optional)
	datetime: string; // Combined date and time "YYYY-MM-DD HH:MM"
	room: string; // Room identifier
	studioId: string; // Studio identifier
	categories: {
		// Exercise categories with completion status
		[categoryId: string]: {
			completed: boolean;
			exercises: {
				[exerciseId: string]: {
					completed: boolean;
					notes?: string;
				};
			};
		};
	};
	comments?: string; // Session comments
	lastUpdated: number; // Timestamp of last update
	lastSynced?: number; // Timestamp of last sync with Firestore
}
```

## Implementation Details

### 1. Redux Middleware

The synchronization is primarily implemented through a custom Redux middleware that:

- Intercepts session-related actions
- Updates Firestore when local state changes
- Maintains a record of pending changes
- Handles conflict resolution

```typescript
// Simplified version of the middleware
const sessionsFirebaseMiddleware = (store) => (next) => (action) => {
	// First, let the action go through the normal Redux flow
	const result = next(action);

	// Then, based on the action type, sync with Firestore
	if (action.type === "sessions/updateSession") {
		const { session } = action.payload;
		syncSessionToFirestore(session);
	}

	return result;
};
```

### 2. Real-time Listeners

Firestore listeners are established to watch for remote changes:

```typescript
// Simplified listener setup
const setupFirestoreListeners = (dispatch) => {
	const sessionsRef = collection(db, "sessions");

	return onSnapshot(sessionsRef, (snapshot) => {
		snapshot.docChanges().forEach((change) => {
			if (change.type === "added" || change.type === "modified") {
				const session = {
					id: change.doc.id,
					...change.doc.data(),
				};

				dispatch(syncRemoteSession(session));
			}

			if (change.type === "removed") {
				dispatch(removeSession(change.doc.id));
			}
		});
	});
};
```

### 3. Conflict Resolution

When conflicts occur (e.g., two users edit the same session simultaneously), the system uses a last-write-wins strategy based on timestamps:

```typescript
// Simplified conflict resolution
const resolveConflict = (localSession, remoteSession) => {
	// If remote session is newer, use it
	if (remoteSession.lastUpdated > localSession.lastUpdated) {
		return remoteSession;
	}

	// If local session is newer or same age, keep local changes
	return localSession;
};
```

### 4. Temporary Data Handling

Temporary sessions (those not yet saved to Firestore) are managed in Redux state and aren't synchronized until explicitly saved:

```typescript
// Determining if a session should be synced
const shouldSyncSession = (session) => {
	// Only sync sessions with a valid ID (no temp-only sessions)
	return !session.tempId.startsWith("temp-") || session.id;
};
```

## Testing

### Unit Tests

- Test Redux reducers for proper state management
- Test middleware for correct Firestore interaction
- Test conflict resolution logic with various scenarios

### Integration Tests

- Test synchronization between multiple Redux stores
- Test Firestore interaction with the emulator
- Test error handling and recovery

### End-to-End Tests

- Test multi-user scenarios with Playwright
- Simulate network conditions and disconnections
- Verify data integrity across different sessions

## Multiple Choice Questions

1. What happens when two users edit the same session simultaneously?

   - [ ] A. The first edit is always preserved
   - [ ] B. Both edits are merged automatically
   - [ ] C. The most recent edit (by timestamp) wins
   - [ ] D. Users are shown a conflict resolution UI

2. How are temporary (unsaved) sessions handled in the synchronization process?

   - [ ] A. They are immediately synchronized to Firestore
   - [ ] B. They are only stored locally and not synchronized until saved
   - [ ] C. They are synchronized but marked as temporary in Firestore
   - [ ] D. They are never synchronized and are lost on page refresh

3. What is the primary benefit of using Redux middleware for synchronization?

   - [ ] A. It's the only way to connect to Firestore
   - [ ] B. It centralizes synchronization logic and separates it from UI components
   - [ ] C. It's faster than direct Firestore updates
   - [ ] D. It allows offline functionality without additional code

4. How does the system handle network disconnections during synchronization?
   - [ ] A. It discards all unsaved changes
   - [ ] B. It retries indefinitely until connection is restored
   - [ ] C. It leverages Firebase's offline capabilities to queue changes
   - [ ] D. It alerts the user and prevents further edits

## Answers

1. C - The most recent edit (by timestamp) wins
2. B - They are only stored locally and not synchronized until saved
3. B - It centralizes synchronization logic and separates it from UI components
4. C - It leverages Firebase's offline capabilities to queue changes
