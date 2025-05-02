# Seeding Process

This document outlines the seeding process for the Pilates Studio App.

## Flow Diagram

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

graph TD
    subgraph Init ["Initialization"]
        A[pnpm start-emulators] -->|Starts| B[start-emulators.ts]
        B -->|1. Cleans ports| C[cleanupPorts]
        B -->|2. Starts Firebase| D[firebase emulators:start]
    end

    subgraph Auth ["Authentication"]
        D -->|When emulators ready| E[createTestUser]
        E -->|After user created| F[pnpm seed-data]
    end

    subgraph Seeding ["Data Seeding"]
        F -->|Executes| G[seed-data.ts]
        G -->|Seeds collections| H[Seed Trainees]
        G -->|Seeds collections| I[Seed Instructors]
        G -->|Seeds collections| J[Seed Exercises]
    end

    subgraph Dev ["Development Mode"]
        K[Development Mode] -->|Auto-connects to emulator| L[src/firebase.ts]
        L -->|Uses seeded data| M[Application]
    end

    %% Manual seeding connection
    N[pnpm seed-data] -->|Manual seeding| G
```

## Process Description

1. **Automatic Seeding (Development)**

   - Triggered by: `pnpm start-emulators`
   - Order:
     1. Cleans up existing emulator processes
     2. Starts Firebase emulators
     3. Creates test user
     4. Runs seed-data script

2. **Manual Seeding**

   - Triggered by: `pnpm seed-data`
   - Directly runs the seeding script
   - Useful for resetting data or adding new sample data

3. **Development Mode Connection**
   - When the app starts in development mode
   - Automatically connects to emulators
   - Uses the seeded data

The seeding process is designed to be idempotent, meaning you can run it multiple times safely without creating duplicate data.
