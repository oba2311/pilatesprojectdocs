# Firestore Security Rules

This document outlines how we implement and test Firestore security rules in our application.

## Overview

Our Firestore security rules implement a role-based access control system that ensures:

- Strict access control based on user roles
- No access for unauthenticated users
- Granular permissions per collection
- Default-deny for unspecified routes

## Testing

We use `@firebase/rules-unit-testing` to test our security rules.

### Test Categories

Our test suite covers:

1. **Unauthenticated Access**

   - Verifies that unauthenticated users cannot access protected resources
   - Tests both read and write operations

2. **Role-Based Access**

   - Tests different user roles and their permissions
   - Verifies proper access control for each role
   - Ensures roles cannot access unauthorized collections

3. **Collection-Specific Rules**
   - Tests specific rules for each collection
   - Verifies CRUD operations based on roles
   - Validates data integrity rules

### Test Implementation

The tests use the Firebase Testing SDK to:

- Create test environments
- Simulate different user contexts
- Verify access rules
- Test data validation rules

This setup allows for:

- Local development and testing
- Emulator UI for debugging
- Consistent testing environment
