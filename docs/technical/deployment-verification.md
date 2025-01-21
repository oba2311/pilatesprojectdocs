# Deployment Verification System

This document outlines our deployment verification system, which ensures data integrity and schema compliance before deployments.

## System Architecture

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

graph TB
    A[verify-deployment.ts] --> B[Collection Prefixes]
    A --> C[Categories]
    A --> D[Data References]
    A --> E[Data Structures]

    subgraph "Verification Modules"
        B --> F[Business ID Prefixes]
        C --> G[Exercise Categories]
        C --> H[Category Order]
        C --> I[Subcategories]
        D --> J[Trainee References]
        D --> K[Instructor References]
        E --> L[Trainee Schema]
        E --> M[Session Schema]
    end
```

## Verification Process

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

sequenceDiagram
    participant M as Main Script
    participant C as Collection Check
    participant R as References Check
    participant S as Schema Check
    participant D as Database

    M->>C: Verify Collection Prefixes
    C->>D: Check Collections
    D-->>C: Collection Data
    C-->>M: Prefix Results

    M->>R: Verify References
    R->>D: Check References
    D-->>R: Reference Data
    R-->>M: Reference Results

    M->>S: Verify Schemas
    S->>D: Check Schemas
    D-->>S: Schema Data
    S-->>M: Schema Results
```

## Module Structure

```
scripts/
├── verify-deployment.ts     # Main verification script
└── verify/
    ├── types.ts            # Shared types
    ├── firebase-config.ts  # Firebase initialization
    ├── collection-prefixes.ts
    ├── categories.ts
    ├── references.ts
    └── data-structures.ts
```

## Verification Types

### 1. Collection Prefixes

- Verifies business ID prefixes in collection names
- Ensures proper data isolation between businesses
- Example: `${BUSINESS_ID}:trainees`

### 2. Categories

- Validates exercise categories against predefined list
- Checks category order in exercises
- Verifies Warm Up subcategories
- Example categories: 'Warm Up', 'Foot Work', etc.

### 3. Data References

- Ensures trainee references exist
- Validates instructor references
- Prevents dangling references in sessions

### 4. Data Structures

- Validates trainee document schema
- Checks session document schema
- Verifies optional and required fields
- Type checks for all fields

## Running Verifications

```bash
pnpm run verify-deployment
```

### Success Output Example

```
🚀 Starting pre-deployment verification...

📋 Running Collection Prefixes verification...
✅ Collection Prefixes verification passed

📋 Running Categories verification...
✅ Categories verification passed

📋 Running Data References verification...
✅ Data References verification passed

📋 Running Data Structures verification...
✅ Data Structures verification passed

✅ All verifications passed! Safe to deploy.
```

### Error Output Example

```
❌ Categories verification failed:
  - Invalid category found: Side Work
  - Categories not in correct order: FBI, Arm

⚠️  Warnings:
  - Trainee 1234 nextSession missing optional comments field
```

## Best Practices

1. **Run Before Deployment**

   - Always run verification before deploying
   - Fix all errors before proceeding
   - Review warnings for potential issues

2. **Error Handling**

   - All verifications include detailed error messages
   - Warnings for non-critical issues
   - Clear distinction between errors and warnings

3. **Schema Validation**
   - Strict type checking for all fields
   - Required fields must be present
   - Optional fields must match expected types
