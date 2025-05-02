# Login Test Credentials Mismatch Bug

## Description

Authentication tests were consistently failing due to two mismatches between the test credentials expected by the authentication system and the actual credentials provided in the test environment:

1. The password mismatch
2. The incorrect email format (with an extra .com suffix)

## Steps to Reproduce

1. Run the Playwright tests that include login functionality: `npm run test tests/debug-login.spec.ts`
2. Observe that tests fail with timeout errors when waiting for authenticated elements
3. Login form appears to be filled and submitted correctly, but the authentication never succeeds

## Expected Behavior

After submitting the login form with test credentials, the user should be authenticated and the test should be able to verify the authenticated state.

## Actual Behavior

The test would fill in the login form and submit it, but authentication would fail. No authenticated elements were found on the page within the timeout period, leading to test failures.

## Root Cause Analysis

Investigation revealed multiple credential mismatches:

- In `auth.ts`, the `TEST_CREDENTIALS` had two issues:
  1. The email was incorrectly formatted as 'ASDF@ASDF.com' instead of 'ASDF@ASDF'
  2. The password was set to 'asdfdsa'
- The default `.env.test` file was being created with password '123'
- These mismatches caused the login attempts to fail with invalid credentials

## Fix

1. Updated the `run-tests.ts` script to ensure the `.env.test` file is created with the correct test password:

```typescript
// In setupEnvironment function in run-tests.ts
writeFileSync(envTestPath, "VITE_APP_PASSWORD=asdfdsa\n");
process.env.VITE_APP_PASSWORD = "asdfdsa";
```

2. Fixed the email format in the `TEST_CREDENTIALS` object in `auth.ts`:

```typescript
// In auth.ts
export const TEST_CREDENTIALS = {
	email: "ASDF@ASDF", // Removed incorrect .com suffix
	password: "asdfdsa",
};
```

3. Standardized the password usage across the codebase to ensure consistent test credentials.

## Testing the Fix

1. Run the debug login test: `npm run test tests/debug-login.spec.ts`
2. Verify that the test now passes with the corrected credentials
3. Ensure that other authentication tests also pass with the standardized credentials

## Prevention

To prevent similar issues in the future:

- Document the specific test credentials needed for authentication tests
- Ensure that the test environment setup process consistently uses the same credentials
- Consider using a more automated approach to synchronize credential values across the codebase
- Add explicit validation of credential formats

## Related Issues

This issue was identified during the merge process for the sync feature and was documented in the sync-feature-merge-checklist.md file.

## Answers

1. What was the root cause of the login test failures?

   - [ ] A. The login form submission was not working
   - [ ] B. The login API endpoint was unreachable
   - [ ] C. The timeout for authentication was too short
   - [x] D. There was a mismatch between expected and actual test credentials

2. How was the issue fixed?

   - [ ] A. By increasing the test timeout duration
   - [ ] B. By fixing the login form submission logic
   - [x] C. By updating the credentials in both auth.ts and the run-tests.ts script
   - [ ] D. By modifying the auth.ts file to accept multiple passwords

3. Why is standardization of test credentials important?

   - [ ] A. It makes the tests run faster
   - [x] B. It ensures consistent behavior across different test environments
   - [ ] C. It reduces the size of the test codebase
   - [ ] D. It's required by the Playwright testing framework

4. What file was modified to fix this issue?
   - [x] A. run-tests.ts and auth.ts
   - [ ] B. auth.ts only
   - [ ] C. debug-login.spec.ts
   - [ ] D. .env.test only
