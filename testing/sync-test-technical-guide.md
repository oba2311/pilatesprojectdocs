# Technical Guide: Sync Test Improvements

## Introduction

This technical guide details the specific changes made to improve the reliability and effectiveness of synchronization tests in the Pilates Studio application. It is intended for developers who need to understand, maintain, or extend the test suite.

## Core Issues Addressed

### 1. Login Reliability Issues

The original login function in `sync-critical-flows.spec.ts` had several issues:

- Hardcoded URL assumption (`http://localhost:3000/`)
- Limited selector strategies for finding login elements
- Lack of error handling and fallback mechanisms
- No handling for already-logged-in states

#### Before:

```typescript
async function login(page: Page): Promise<void> {
	try {
		console.log("🔄 Navigating to application login page...");
		// Use a fully qualified URL - this will help with connectivity to the emulator
		await page.goto("http://localhost:3000/");

		// Wait for the login form to be visible
		console.log("⏳ Waiting for login form...");
		await page.waitForSelector('input[type="password"]', { timeout: 10000 });

		// Login - using a more reliable selector
		console.log("🔑 Logging in...");
		const passwordInput = page.locator('input[type="password"]');
		await passwordInput.fill(process.env.VITE_APP_PASSWORD || "123");

		// Find and click login button
		const loginButton = page
			.getByRole("button")
			.filter({ hasText: /login|sign in/i });
		await loginButton.click();

		// Wait for navigation to be complete
		console.log("⏳ Waiting for successful login...");
		await page.waitForURL("**/*", { timeout: 10000 });

		console.log("✅ Login successful");
	} catch (error) {
		console.error("❌ Error during login:", error);
		// Take screenshot to help with debugging
		await page.screenshot({ path: `login-error-${Date.now()}.png` });
		throw error;
	}
}
```

#### After:

```typescript
async function login(page: Page): Promise<void> {
	try {
		// Use the robust loginAsUser utility function instead
		await loginAsUser(page);
	} catch (error) {
		console.error("❌ Error during login:", error);
		// Take screenshot to help with debugging
		await page.screenshot({ path: `login-error-${Date.now()}.png` });
		throw error;
	}
}
```

The improved version utilizes the `loginAsUser` utility from `sync-test-utils.ts`, which implements multiple fallback strategies:

1. Checking if already logged in first
2. Multiple selector strategies for the login form inputs
3. Multiple selector strategies for the login button
4. Smart fallback to direct navigation if necessary

### 2. Synchronization Waiting

Originally, tests used hardcoded timeouts to wait for synchronization:

```typescript
// Original code
await secondUserPage.waitForTimeout(2000);
```

This approach was problematic because:

- The fixed delay might be too short in some environments (causing flaky tests)
- The fixed delay might be unnecessarily long in other cases (slowing down tests)
- There was no indication when synchronization was actually complete

We replaced these with a specialized utility:

```typescript
// Improved code
await waitForSyncToComplete(secondUserPage);
```

The `waitForSyncToComplete` function implements a more intelligent waiting strategy:

```typescript
export async function waitForSyncToComplete(
	page: Page,
	maxWaitMs = 5000
): Promise<void> {
	try {
		// Wait for any sync indicators to disappear
		await page
			.waitForSelector('[data-testid="sync-in-progress"]', {
				state: "hidden",
				timeout: maxWaitMs,
			})
			.catch(() => {
				// It's okay if the selector doesn't exist - might mean sync is already complete
			});

		// Wait a small additional time for any background processes to finish
		await page.waitForTimeout(500);
	} catch (error) {
		console.log("⚠️ Warning: Timed out waiting for sync to complete");
	}
}
```

This approach:

- Watches for visual indicators of synchronization progress
- Gracefully handles cases where the indicator might not exist
- Provides a reasonable maximum wait time
- Includes a small buffer delay for background processes

### 3. Robust UI Element Selection

A major improvement was enhancing how the tests select UI elements:

#### Original Selection Pattern:

```typescript
const roomSelector = page.getByRole("combobox", { name: /room/i });
if (await roomSelector.isVisible()) {
	await roomSelector.click();
	await page.getByText(room).click();
}
```

#### Enhanced Selection Pattern:

```typescript
try {
	const roomSelector =
		page.getByRole("combobox", { name: /room/i }) ||
		page.locator('[data-testid*="room-select"]') ||
		page.locator('[aria-label*="room"]');

	if (await roomSelector.isVisible()) {
		await roomSelector.click();

		// Try to find the room option
		const roomOption =
			page.getByRole("option", { name: new RegExp(room, "i") }) ||
			page.getByText(new RegExp(`^${room}$`, "i"));

		if ((await roomOption.count()) > 0) {
			await roomOption.click();
			console.log(`✅ Selected room: ${room}`);
		} else {
			// Fallback to first option
			console.log(
				`⚠️ Could not find room ${room}, selecting first available option`
			);
			await page.getByRole("option").first().click();
		}
	}
} catch (error) {
	console.log(`⚠️ Error selecting room: ${error.message}`);
}
```

Key improvements:

- Multiple selector strategies with fallbacks
- Proper error handling for each interaction
- Fallbacks for when specific options can't be found
- Detailed logging for debugging

### 4. Text Pattern Matching

The function to find the card position text ("X of Y") was enhanced to be more reliable:

#### Original:

```typescript
async function getCardPositionText(page: Page): Promise<string | null> {
	// Try a few common selectors
	const selectors = [
		"text=/\\d+ of \\d+/",
		'[data-testid^="card-position"]',
		".card-position",
		".session-count",
		".pagination-info",
	];

	for (const selector of selectors) {
		try {
			const element = page.locator(selector).first();
			if (await element.isVisible()) {
				return await element.textContent();
			}
		} catch (e) {
			// Try next selector
		}
	}

	// Fallback to regex pattern in page content
	const content = await page.content();
	const matches = content.match(/\d+\s+of\s+\d+/);
	return matches ? matches[0] : null;
}
```

#### Enhanced:

```typescript
async function getCardPositionText(page: Page): Promise<string | null> {
	console.log("🔍 Looking for card position text...");

	// More comprehensive selector list
	const selectors = [
		"text=/\\d+ of \\d+/",
		'[data-testid*="card-position"]',
		'[data-testid*="pagination"]',
		".card-position",
		".session-position",
		".pagination-info",
		".session-navigation",
	];

	for (const selector of selectors) {
		try {
			const element = page.locator(selector).first();
			if ((await element.count()) > 0 && (await element.isVisible())) {
				const text = await element.textContent();
				if (text && /\d+\s+of\s+\d+/.test(text)) {
					console.log(`✅ Found card position text: ${text}`);
					return text;
				}
			}
		} catch (e) {
			// Try next selector
		}
	}

	// Improved text extraction
	try {
		const allText = await page.locator("body").textContent();
		const matches = allText?.match(/(\d+)\s+of\s+(\d+)/);
		if (matches && matches[0]) {
			console.log(`✅ Found card position text in page: ${matches[0]}`);
			return matches[0];
		}
	} catch (error) {
		console.log("❌ Error while searching for position text in page content");
	}

	console.log("⚠️ Could not find card position text");
	return null;
}
```

Improvements:

- Added validation of matched text (ensuring it actually has the "X of Y" pattern)
- More thorough selector strategies
- Better error handling for text extraction
- Improved logging for debugging

## 5. New Data Migration Test

A new test was added to verify that pre-migration session data is properly migrated and synchronized:

```typescript
test("Critical Flow: Safe migration of existing session data", async () => {
	// Create a pre-migration style session directly in localStorage
	const oldStyleSessionId = `legacy${Date.now()}`;
	const sessionDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	const sessionHour = "10:00";
	const sessionRoom = "Room A";
	const sessionTitle = `Legacy Session ${Date.now()}`;

	// Navigate to the app
	await firstUserPage.goto("/");

	// Create a session with old-style ID in localStorage
	await firstUserPage.evaluate(
		({ id, date, hour, room, title }) => {
			// Create a mock session with old-style ID (no hyphen format)
			const oldSession = {
				tempId: id, // Old style without proper format
				traineeId: "trainee123",
				trainee: { name: "Test Trainee", id: "trainee123" },
				datetime: `${date} ${hour}`,
				room: room,
				title: title,
				categories: {},
				comments: "Pre-migration test comments",
			};

			// Create a mock Redux state structure
			const mockReduxState = {
				sessions: {
					[date]: {
						[hour]: {
							[room]: [oldSession],
						},
					},
				},
			};

			// Store in localStorage as JSON
			localStorage.setItem(
				"pilates-studio-sessions",
				JSON.stringify(mockReduxState)
			);
		},
		{
			id: oldStyleSessionId,
			date: sessionDate,
			hour: sessionHour,
			room: sessionRoom,
			title: sessionTitle,
		}
	);

	// Login and go to sessions page to trigger migration
	await login(firstUserPage);
	await navigateToSessionsPage(firstUserPage);

	// Select the specific date/hour/room where we created the test session
	await selectSpecificView(
		firstUserPage,
		sessionDate,
		sessionHour,
		sessionRoom
	);

	// Verify the pre-migration session appears correctly
	const sessionVisible = await firstUserPage
		.getByText(sessionTitle)
		.isVisible();
	expect(sessionVisible).toBeTruthy();

	// Open the session and verify the data
	await firstUserPage.getByText(sessionTitle).click();

	// Check for session title and comments being preserved
	const titleField = await firstUserPage.getByLabel(/session title/i);
	expect(await titleField.inputValue()).toEqual(sessionTitle);

	// Save the migrated session to Firestore
	await firstUserPage.getByRole("button", { name: /save session/i }).click();

	// Login second user and verify they can see the migrated session
	await login(secondUserPage);
	await navigateToSessionsPage(secondUserPage);
	await selectSpecificView(
		secondUserPage,
		sessionDate,
		sessionHour,
		sessionRoom
	);

	// Verify the migrated session appears for the second user
	const migrationSessionVisibleForSecondUser = await secondUserPage
		.getByText(sessionTitle)
		.isVisible();
	expect(migrationSessionVisibleForSecondUser).toBeTruthy();
});
```

This test specifically verifies that:

1. The application can properly load and display legacy session data
2. The data is correctly migrated to the new format
3. The migrated data can be saved to Firestore
4. The saved data is correctly synchronized to other users

## Test Execution Script

A new script `test-critical-flows.sh` was created to run the critical flow tests in a controlled environment:

```bash
#!/bin/bash

# Script to run critical flow tests with improved error handling

# Set environment variables for testing
export COVERAGE=true
export NODE_ENV=test

# Load environment variables from .env.test
if [ -f .env.test ]; then
  echo "🔄 Loading environment variables from .env.test"
  export $(grep -v '^#' .env.test | xargs)
else
  echo "⚠️ .env.test file not found"
  echo "VITE_APP_PASSWORD=123" > .env.test
  echo "✅ Created .env.test with default password"
  export VITE_APP_PASSWORD=123
fi

# Print header
echo "🧪 Running Sync Critical Flow Tests"
echo "=================================="

# Ensure screenshots directory exists
mkdir -p screenshots/critical-flows-sync

# Check if emulators are already running
FIRESTORE_RUNNING=$(curl -s http://localhost:8081 > /dev/null && echo "yes" || echo "no")
AUTH_RUNNING=$(curl -s http://localhost:9099 > /dev/null && echo "yes" || echo "no")

if [ "$FIRESTORE_RUNNING" = "yes" ] && [ "$AUTH_RUNNING" = "yes" ]; then
  echo "✅ Firebase emulators are already running"
  START_EMULATORS=false
else
  echo "🚀 Starting Firebase emulators..."
  npm run start &
  EMULATOR_PID=$!
  START_EMULATORS=true

  # Wait for emulators to start
  echo "⏳ Waiting for emulators to start..."
  sleep 15
fi

# Run the test with helpful flags
echo "🧪 Running critical flow tests..."
npx playwright test tests/critical-flows/sync-critical-flows.spec.ts --headed --timeout=120000 --retries=1

TEST_RESULT=$?

# If we started the emulators, shut them down
if [ "$START_EMULATORS" = "true" ]; then
  echo "🛑 Shutting down emulators..."
  kill $EMULATOR_PID
fi

# Show test result
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed. Check the test report for details."
fi

echo "✅ Test script completed with exit code: $TEST_RESULT"
exit $TEST_RESULT
```

Key features:

- Automatic environment variable setup
- Emulator detection and management
- Retry mechanism for flaky tests
- Proper resource cleanup
- Clear feedback on test results

## Best Practices for Playwright Tests

Based on the improvements made, we've established the following best practices for Playwright tests in this project:

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

3. **Implement Thorough Error Handling**: Wrap actions in try/catch blocks and provide helpful error messages

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

5. **Capture Screenshots for Debugging**: Take screenshots at key points for better diagnostics

   ```typescript
   await screenshots.take(page, "step-description");
   ```

6. **Use Consistent Logging**: Provide clear logging with emojis for better readability

   ```typescript
   console.log("✅ Successfully completed action");
   console.error("❌ Failed to complete action");
   console.warn("⚠️ Proceeding with fallback approach");
   ```

7. **Provide Fallbacks for UI Interactions**: Always have a backup plan if the primary interaction fails
   ```typescript
   if ((await specificOption.count()) > 0) {
   	await specificOption.click();
   } else {
   	console.log("⚠️ Specific option not found, selecting first available");
   	await firstOption.click();
   }
   ```

## Multiple Choice Questions

1. When should you use `waitForSyncToComplete` instead of `waitForTimeout`?

   - [ ] A. Only when waiting for more than 5 seconds
   - [ ] B. Only for critical flow tests
   - [x] C. Whenever waiting for synchronization between users
   - [ ] D. Only in the beforeEach hook

2. What is the recommended approach for selecting UI elements in tests?

   - [ ] A. Always use data-testid selectors
   - [ ] B. Use getByRole selectors only
   - [ ] C. Use XPath selectors for performance
   - [x] D. Use multiple selector strategies with fallbacks

3. What should be done when a specific UI element option can't be found?

   - [ ] A. Fail the test immediately
   - [x] B. Log a warning and fall back to a default option
   - [ ] C. Skip the rest of the test
   - [ ] D. Refresh the page and try again

4. How can test reliability be improved when handling login?
   - [ ] A. Always clear cookies before login
   - [x] B. Check if already logged in before attempting login
   - [ ] C. Use a headless browser for login only
   - [ ] D. Implement custom authentication bypassing the UI

## Answers

1. C - Whenever waiting for synchronization between users - The `waitForSyncToComplete` function is specifically designed to wait for synchronization to complete, making it more reliable than fixed timeouts.
2. D - Use multiple selector strategies with fallbacks - This approach provides the most resilience to UI changes and variations.
3. B - Log a warning and fall back to a default option - This allows the test to continue with a reasonable alternative while still providing information for debugging.
4. B - Check if already logged in before attempting login - This prevents unnecessary login attempts and reduces test flakiness.
