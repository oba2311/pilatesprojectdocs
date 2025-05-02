# Technical Guide: Sync Feature Testing

## Introduction

This technical guide details how to properly test the synchronization feature in the Pilates Studio application. The sync feature enables real-time data sharing between multiple users, and testing it effectively requires specialized approaches.

## Test Infrastructure

### Required Dependencies

- Playwright for browser automation and multi-user testing
- Firebase emulators for isolated testing environment
- Test utilities for consistent login, navigation, and verification

### Test Environment Setup

Before running sync tests, ensure the Firebase emulators are running:

```bash
# Start Firebase emulators
npm run start
```

The tests depend on the following emulator services:

- Firestore emulator (port 8081)
- Auth emulator (port 9099)

## Test Structure

### Multi-User Testing Approach

Testing the sync feature requires simulation of multiple users interacting with the application simultaneously. This is achieved using Playwright's browser contexts:

```typescript
// Create two browser contexts for two different users
const userContext1 = await browser.newContext();
const userContext2 = await browser.newContext();

const page1 = await userContext1.newPage();
const page2 = await userContext2.newPage();
```

### General Test Flow

Sync tests typically follow this pattern:

1. Set up two user contexts
2. Log in both users to the application
3. User 1 performs an action (create/edit a session)
4. Wait for synchronization to complete
5. User 2 verifies the changes made by User 1
6. Clean up resources

## Key Sync Feature Components to Test

### 1. Firestore Collection Structure

Verify that the application is using the correct Firestore collections:

```typescript
// Test to verify collection structure
test("should use the correct Firestore collections", async () => {
	// Check for temp_sessions collection existence
	const db = getFirestore();
	const tempCollectionRef = collection(db, "temp_sessions");

	// Verify it works with the emulator
	expect(tempCollectionRef).toBeDefined();

	// Verify collection is used correctly when adding a session
	// ... test code here ...
});
```

### 2. Session Synchronization Rules

Test the rules that determine which sessions are synchronized:

```typescript
test("should only sync non-empty sessions with traineeId", async () => {
	// Create an empty session (should not sync)
	const emptySession = { tempId: "empty-123" /* other fields */ };

	// Create a session without traineeId (should not sync)
	const noTraineeSession = { tempId: "test-456" /* no traineeId */ };

	// Create a valid session (should sync)
	const validSession = {
		tempId: "test-789",
		traineeId: "trainee-123",
		/* other required fields */
	};

	// Test sync behavior
	// ... test code here ...
});
```

### 3. Debounce Mechanism

Verify that the debounce mechanism prevents excessive Firestore operations:

```typescript
test("should debounce multiple rapid updates", async ({ browser }) => {
	// Set up test
	const page = await browser.newPage();
	await login(page);

	// Create a session and make multiple rapid updates
	// ... test code here ...

	// Verify that only a limited number of Firestore operations occurred
	// ... verification code here ...
});
```

## Best Practices for Sync Tests

1. **Use Robust Selectors**: Always use multiple selector strategies with fallbacks

```typescript
const element =
	page.getByRole("button", { name: /save/i }) ||
	page.locator('[data-testid="save-button"]') ||
	page.getByText(/save/i);
```

2. **Handle Already-Logged-In States**: Check for existing sessions before attempting login

```typescript
const url = page.url();
if (url.includes("/sessions")) {
	console.log("✅ Already logged in, on sessions page");
	return;
}
```

3. **Implement Thorough Error Handling**: Wrap actions in try/catch blocks

```typescript
try {
	await element.click();
} catch (error) {
	console.error(`Failed to click element: ${error.message}`);
	await page.screenshot({ path: `error-${Date.now()}.png` });
	throw error;
}
```

4. **Use Intelligent Waiting**: Wait for specific conditions rather than fixed timeouts

```typescript
// Instead of:
await page.waitForTimeout(2000);

// Use:
await waitForSyncToComplete(page);
```

5. **Provide Fallbacks for UI Interactions**: Always have a backup plan

```typescript
if ((await specificOption.count()) > 0) {
	await specificOption.click();
} else {
	console.log("⚠️ Specific option not found, selecting first available");
	await firstOption.click();
}
```

## Common Test Scenarios

### 1. Testing Session Creation Sync

Test that a session created by one user is visible to another:

```typescript
test("created session should be visible to other users", async ({
	browser,
}) => {
	// Create browser contexts for two users
	const context1 = await browser.newContext();
	const context2 = await browser.newContext();

	const page1 = await context1.newPage();
	const page2 = await context2.newPage();

	// Login both users
	await login(page1);
	await login(page2);

	// User 1 creates a session
	const sessionData = {
		title: `Test Session ${Date.now()}`,
		traineeId: "trainee-123",
		hour: "10:00",
		date: new Date().toISOString().split("T")[0],
		room: "Room A",
	};

	// Navigate to create session page
	await page1.getByText("New Session").click();

	// Fill session details
	await fillSessionForm(page1, sessionData);

	// Save the session
	await page1.getByText("Save").click();

	// Wait for sync to complete
	await waitForSyncToComplete(page1);

	// User 2 navigates to the same date/hour/room
	await selectView(page2, sessionData.date, sessionData.hour, sessionData.room);

	// Verify User 2 can see the session
	const sessionVisible = await page2.getByText(sessionData.title).isVisible();
	expect(sessionVisible).toBeTruthy();
});
```

### 2. Testing Exercise Selection Sync

Test that exercise selections synchronize between users:

```typescript
test("exercise selection should sync between users", async ({ browser }) => {
	// Set up test with two users viewing the same session
	// ... setup code ...

	// User 1 selects exercises
	await page1.getByText("Exercise 1").click();
	await page1.getByText("Exercise 2").click();

	// Wait for sync
	await waitForSyncToComplete(page1);

	// Verify session state in Firestore directly (optional)
	const db = getFirestore();
	const sessionDoc = await getDoc(doc(db, "temp_sessions", sessionId));
	const sessionData = sessionDoc.data();
	expect(sessionData.categories["cat1"].exercises["exercise1"].completed).toBe(
		true
	);

	// User 2 should see the selections
	const exercise1Selected = await page2
		.locator('[data-testid="exercise-1"]')
		.getAttribute("data-selected");
	const exercise2Selected = await page2
		.locator('[data-testid="exercise-2"]')
		.getAttribute("data-selected");

	expect(exercise1Selected).toBe("true");
	expect(exercise2Selected).toBe("true");
});
```

### 3. Testing Session Deletion Sync

Test that session deletion synchronizes between users:

```typescript
test("deleted session should be removed for other users", async ({
	browser,
}) => {
	// ... setup code ...

	// User 1 deletes a session
	await page1.getByText("Delete").click();
	await page1.getByText("Confirm").click();

	// Wait for sync
	await waitForSyncToComplete(page1);

	// Verify document is removed from Firestore
	const db = getFirestore();
	const sessionDoc = await getDoc(doc(db, "temp_sessions", sessionId));
	expect(sessionDoc.exists()).toBe(false);

	// User 2 should not see the session
	const sessionVisible = await page2.getByText("Session Title").isVisible();
	expect(sessionVisible).toBeFalsy();
});
```

### 4. Testing Conflict Resolution

Test that conflicts are resolved correctly using the timestamp-based strategy:

```typescript
test("should resolve conflicts using last-updated timestamp", async ({
	browser,
}) => {
	// ... setup code ...

	// Create a session with User 1
	const sessionId = await createSessionAndGetId(page1);

	// Both users edit the same session
	await editSessionTitle(page1, sessionId, "User 1 Edit", Date.now());

	// User 2 edits with a newer timestamp
	const newerTimestamp = Date.now() + 1000;
	await editSessionTitle(page2, sessionId, "User 2 Edit", newerTimestamp);

	// Wait for sync
	await waitForSyncToComplete(page1);
	await waitForSyncToComplete(page2);

	// Both users should see User 2's edit (the newer one)
	expect(await getSessionTitle(page1, sessionId)).toBe("User 2 Edit");
	expect(await getSessionTitle(page2, sessionId)).toBe("User 2 Edit");
});
```

## Troubleshooting Common Issues

### 1. Session Not Syncing

If a session isn't syncing between users:

1. Check that the session has a traineeId (sessions without traineeId aren't synced)
2. Verify the session isn't an "empty" session (tempId starting with "empty-")
3. Confirm the session's lastUpdated timestamp is being set
4. Verify that the Firestore emulator is running and accessible
5. Check for errors in the middleware that might be preventing synchronization

### 2. Test Flakiness

If tests are flaky:

1. Increase timeouts for sync operations
2. Add more robust selectors with multiple fallback strategies
3. Ensure tests are properly cleaning up after themselves
4. Check for race conditions in the test flow
5. Verify that the debounce mechanism isn't causing unexpected delays

### 3. Firebase Emulator Connection Issues

If tests can't connect to Firebase emulators:

1. Verify emulators are running (ports 8081 and 9099)
2. Check that the app is configured to use emulators via environment variables
3. Ensure the test environment is using the correct Firebase config
4. Check firewall settings that might block connections
5. Verify that the emulator initialization function is being called

## Verifying Direct Firestore Interactions

For more thorough testing, you may want to check the Firestore state directly:

```typescript
// Helper function to check Firestore state
async function verifyFirestoreState(sessionId: string, expectedData: any) {
	const db = getFirestore();
	const sessionDoc = await getDoc(doc(db, "temp_sessions", sessionId));

	if (!sessionDoc.exists()) {
		throw new Error(`Session ${sessionId} not found in Firestore`);
	}

	const sessionData = sessionDoc.data();

	// Compare critical fields
	expect(sessionData.traineeId).toBe(expectedData.traineeId);
	expect(sessionData.datetime).toBe(expectedData.datetime);
	expect(sessionData.room).toBe(expectedData.room);

	// Compare nested data if needed
	if (expectedData.categories) {
		// Deep comparison logic here
	}
}
```

## Multiple Choice Questions

1. When should you use `waitForSyncToComplete` instead of `waitForTimeout`?

   - [ ] A. Only when waiting for more than 5 seconds
   - [ ] B. Only for critical flow tests
   - [ ] C. Whenever waiting for synchronization between users
   - [ ] D. Only in the beforeEach hook

2. What is the recommended approach for selecting UI elements in tests?

   - [ ] A. Always use data-testid selectors
   - [ ] B. Use getByRole selectors only
   - [ ] C. Use XPath selectors for performance
   - [ ] D. Use multiple selector strategies with fallbacks

3. What should be done when a specific UI element option can't be found?

   - [ ] A. Fail the test immediately
   - [ ] B. Log a warning and fall back to a default option
   - [ ] C. Skip the rest of the test
   - [ ] D. Refresh the page and try again

4. How can test reliability be improved when handling login?
   - [ ] A. Always clear cookies before login
   - [ ] B. Check if already logged in before attempting login
   - [ ] C. Use a headless browser for login only
   - [ ] D. Implement custom authentication bypassing the UI

## Answers

1. C - Whenever waiting for synchronization between users - The `waitForSyncToComplete` function is specifically designed to wait for synchronization to complete, making it more reliable than fixed timeouts.
2. D - Use multiple selector strategies with fallbacks - This approach provides the most resilience to UI changes and variations.
3. B - Log a warning and fall back to a default option - This allows the test to continue with a reasonable alternative while still providing information for debugging.
4. B - Check if already logged in before attempting login - This prevents unnecessary login attempts and reduces test flakiness.
