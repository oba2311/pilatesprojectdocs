# Testing with Firebase Emulators

This document explains how to properly run tests with Firebase emulators, especially when dealing with Firestore security rules.

## Problem: Security Rules in Tests

When running tests against Firebase emulators, we encountered the following error:

```
Error fetching all temporary sessions: FirebaseError: false for 'list' @ L22
```

This occurs because:

1. Our production Firestore security rules restrict operations to authenticated admin users.
2. In tests, we do not always authenticate with admin credentials before attempting Firestore operations.
3. The Firebase emulator enforces these security rules, resulting in "permission denied" errors.

## Solution: Using Test-Specific Security Rules

We've created a special testing workflow that temporarily replaces the strict production security rules with more permissive test rules. This allows tests to run without authentication concerns while preserving the security of the production rules.

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
    A[Run Test Script] --> B[Backup Production Rules]
    B --> C[Apply Test Rules]
    C --> D[Run Tests]
    D --> E[Restore Production Rules]
    E --> F[Clean Up Backup]
```

## How It Works

The test setup process follows these steps:

1. **Before Tests**: Backup the current production Firestore rules and replace them with test rules
2. **During Tests**: Run tests with permissive rules that allow all operations
3. **After Tests**: Restore the original production rules, regardless of whether tests passed or failed

This ensures the security rules are always restored to their proper state, even if tests fail or are interrupted.

## Running Tests with Test Rules

The standard test command automatically uses permissive Firestore rules while preserving the original test functionality:

```bash
pnpm test
```

This command:

1. Backs up the current production Firestore rules
2. Applies permissive test rules
3. Runs `npx playwright test`
4. Displays the test report with `npx playwright show-report`
5. Restores the original production rules

You can also pass additional Playwright test arguments:

```bash
pnpm test tests/your-specific-test.spec.ts --headed
```

All test commands (including `test:duplicate-sessions` and others) now use this approach to ensure consistent test behavior.

## Test Rules vs. Production Rules

### Production Rules

```
// Only allow authenticated admins to access data
allow read, write: if isAdmin();
```

### Test Rules

```
// Allow all operations during testing
allow read, write: if true;
```

## Why We Need Different Rules

In a testing environment, we want to:

1. Verify functionality without authentication concerns
2. Focus on business logic rather than security rules
3. Provide predictable test behavior

In production, we need to:

1. Strictly enforce authentication and authorization
2. Protect sensitive data
3. Prevent unauthorized access

## Running Tests

There are two ways to run tests:

1. **Running All Tests**:

   ```bash
   npm test
   ```

   This will run all tests and show the full report when complete.

2. **Running Specific Tests**:
   ```bash
   npm run test:file -- tests/navigation.spec.ts
   ```
   This will run only the specified test file. For showing the report after running specific tests:
   ```bash
   npm run test:file -- tests/navigation.spec.ts && npx playwright show-report
   ```

> **Note:** When using `npm test -- tests/navigation.spec.ts`, the additional argument may incorrectly pass to the report command. The `test:file` script avoids this issue.

## Firebase Security Rules Implementation

We've simplified our approach to Firebase security rules:

1. We maintain a single set of security rules in `firestore.rules`
2. These rules explicitly allow admin access to all collections, including special collections like `temp_sessions` and `{businessId}:temp_sessions`
3. All tests run directly against these rules using the Firebase emulator

This simplified approach ensures:

- Consistent behavior between tests and production
- Less maintenance overhead (no swapping between different rule sets)
- Tests properly verify that admin authentication is working
- Clear permissions model where admin users have access to all collections

## Answers

1. Why do tests fail without proper Firebase rules?

   - [ ] A. Tests are running against production instead of emulators
   - [ ] B. The Firebase emulator is not starting properly
   - [x] C. The security rules require authentication but tests aren't authenticated properly
   - [ ] D. The collection names are different in test and production

2. What's the current approach to Firebase security rules?

   - [ ] A. Using separate rule sets for testing and production
   - [x] B. Using a single consistent rule set that grants admin access to all collections
   - [ ] C. Disabling security rules during tests
   - [ ] D. Using database-level permissions instead of collection-level

3. Why explicitly specify permissions for collections like `temp_sessions`?

   - [ ] A. It's faster than using wildcard rules
   - [x] B. It makes the permissions model clearer and more explicit
   - [ ] C. It uses less memory
   - [ ] D. It's required by Firebase

4. What is the main benefit of our current approach?
   - [ ] A. It makes tests run faster
   - [ ] B. It allows testing on production data
   - [ ] C. It removes authentication as a dependency for tests
   - [x] D. It ensures tests run with the same security model as production
