# Sync Feature Migration Instructions

This document provides a comprehensive step-by-step guide for executing the migration of the Pilates Studio application to the sync-enabled architecture.

## Prerequisites

Before beginning the migration process, ensure you have:

1. **Proper Credentials**: You need appropriate Firebase credentials with access to both development and production environments:

   - `GOOGLE_CLOUD_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT` environment variable properly set
   - `PROJECT_ID` environment variable set

2. **Repository Access**: Full access to both main repositories:

   - `pilates-studio-app` (code repository)
   - `pilates-studio-docs` (documentation repository)

3. **Environment Variables**: Correctly configured environment variables in `.env` file

## Step 1: Create Backups

The first step in any migration is to create comprehensive backups:

```bash
# 1. Enable the GitHub backup workflow
git checkout -b enable-backup-workflow
git add .github/workflows/firestore-backup.yml
git commit -m "Enable automated Firestore backup workflow"
git push origin enable-backup-workflow

# 2. Create a pull request to merge this change
# 3. After merging, manually trigger the backup workflow from GitHub UI

# 4. Create an additional local backup
npm run backup:firestore
```

This creates a backup in the `backups/` directory with timestamp in the filename.

## Step 2: Test the Migration Process

Before applying the migration to production, thoroughly test it:

```bash
# Run the migration test script
npm run test:migration
```

This script:

1. Starts Firebase emulators
2. Seeds test data
3. Runs the migration script
4. Verifies the migration with sync-specific tests
5. Cleans up resources

The test results will be logged in the `logs/` directory.

## Step 3: Create a Staging Environment

Once the tests pass locally, set up a staging environment:

```bash
# Create a migration branch
git checkout -b sync-migration-staging main
git merge --no-ff feat-sync-between-users

# Deploy to staging
npx vercel
```

In Vercel, add the necessary environment variables (same as production but with `NODE_ENV=staging`).

## Step 4: Verify in Staging

Perform manual verification steps in the staging environment:

1. Create a new session
2. View it from multiple browsers
3. Make changes and verify synchronization
4. Test all critical flows identified in the test plans

Document any issues found and resolve them before proceeding.

## Step 5: Run Production Migration

When everything is verified in staging, proceed with the production migration:

```bash
# 1. Create final deployment branch
git checkout -b sync-feature-deploy main
git merge --no-ff feat-sync-between-users

# 2. Run one final backup
npm run backup:firestore

# 3. Run the migration script
npm run migrate

# 4. Verify migration success
npm run verify:migration
```

## Step 6: Deploy to Production

```bash
# Deploy to production through your CI/CD pipeline
git push origin sync-feature-deploy
```

Monitor the deployment in Vercel dashboard.

## Step 7: Post-Deployment Verification

After deploying, run verification checks:

1. Monitor error rates in Vercel and Firebase consoles
2. Run tests against production: `NODE_ENV=production npm run test`
3. Manually verify key functionality
4. Check for any performance degradation

## Rollback Procedure

If issues are detected, use the rollback plan:

```bash
# Rollback in Vercel dashboard by selecting a previous deployment

# If needed, restore Firestore data
NODE_ENV=production npm run restore:firestore -- backups/firestore-backup-YYYY-MM-DD_HH-MM-SS.json
```

## Monitoring Plan

After migration, monitor these aspects:

1. **Performance**:

   - Check Firebase read/write operations
   - Monitor sync latency between devices
   - Watch for any UI performance issues

2. **Data Integrity**:

   - Verify sessions appear consistently across devices
   - Check for duplicate sessions or missing data
   - Ensure temporary session cleanup works correctly

3. **Error Rates**:
   - Watch for increased error rates in logs
   - Check for sync-specific errors
   - Monitor user reports of synchronization issues

## Resources

- Complete migration plan: [MIGRATION_PLAN.md](../MIGRATION_PLAN.md)
- Sync feature documentation: [user-sync-feature-consolidated.md](../features/user-sync-feature-consolidated.md)
- Sync testing guide: [sync-testing-guide.md](../testing/sync-testing-guide.md)

## Completion Checklist

Use this checklist to verify all migration steps are completed:

- [ ] Backups created and verified
- [ ] Migration tested in development environment
- [ ] Staging environment created and tested
- [ ] Production backup created
- [ ] Migration script executed successfully
- [ ] Verification tests pass
- [ ] Production deployment completed
- [ ] Post-deployment verification completed
- [ ] User experience monitored for 48 hours

## Answers

1. What should you do first before running the migration?

   - [ ] A. Deploy to production
   - [ ] B. Run the migration script
   - [ ] C. Create a comprehensive backup
   - [ ] D. Update the codebase

2. Why is testing the migration in a development environment important?

   - [ ] A. It's faster than testing in production
   - [ ] B. It allows identifying and fixing issues before affecting users
   - [ ] C. It's required by Firebase
   - [ ] D. It improves documentation quality

3. What happens if an error occurs during migration?
   - [ ] A. The application will automatically rollback
   - [ ] B. Data will be permanently lost
   - [ ] C. You should execute the rollback plan
   - [ ] D. Firebase will handle recovery automatically

## Answers

1. C - Always create a comprehensive backup first before making any changes to ensure you can restore data if needed.
2. B - Testing in development allows you to identify and fix issues before they impact actual users.
3. C - You should execute the rollback plan, which includes reverting to a previous deployment and potentially restoring from backup.
