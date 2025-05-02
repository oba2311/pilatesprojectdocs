# Multi-Business Setup

This document describes how the application is set up to handle multiple businesses using the same codebase.

## Architecture Overview

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
    subgraph Codebase[Shared Codebase]
        direction TB
        Config[business-config.ts]
        Collections[collections.ts]
        Services[services/*.ts]
        Components[components/*.tsx]
        Pages[pages/*.tsx]

        Config --> Collections
        Collections --> Services
        Services --> Components
        Components --> Pages
    end

    subgraph ENV[Environment Files]
        Env1[.env.bsns1]
        Env2[.env.bsns2]
    end

    subgraph GH[GitHub CI/CD]
        Actions[GitHub Actions]
        Tests[E2E Tests]
    end

    subgraph Vercel[Vercel Deployment]
        V1[Business 1 Project]
        V2[Business 2 Project]
    end

    subgraph Firebase[Firebase Backend]
        direction TB
        Trainees1[trainees_1]
        Trainees2[trainees_2]
        Instructors1[instructors_1]
        Instructors2[instructors_2]
        Sessions[sessions]
        Exercises[exercises]
    end

    subgraph Domains[Production Domains]
        D1[studio-one.pilates-app.com]
        D2[studio-two.pilates-app.com]
    end

    Codebase --> GH
    ENV --> GH
    GH --> Tests
    Tests --> Actions
    Actions --> V1
    Actions --> V2
    V1 --> D1
    V2 --> D2
    D1 --> Firebase
    D2 --> Firebase

    classDef configNode fill:#e6f7ff,stroke:#597ef7,stroke-width:2px
    classDef envNode fill:#f6ffed,stroke:#597ef7,stroke-width:2px
    classDef deployNode fill:#fff7e6,stroke:#597ef7,stroke-width:2px
    classDef dbNode fill:#fff1f0,stroke:#597ef7,stroke-width:2px

    class Config,Collections,Services,Components,Pages configNode
    class Env1,Env2 envNode
    class V1,V2,D1,D2 deployNode
    class Trainees1,Trainees2,Instructors1,Instructors2,Sessions,Exercises dbNode
```

## Collection Structure

- `trainees_1` and `trainees_2`: Business-specific trainee collections
- `instructors_1` and `instructors_2`: Business-specific instructor collections
- `sessions`: Shared sessions collection
- `exercises`: Shared exercises collection

## Environment Configuration

Each business has its own environment configuration file:

- `.env.bsns1` for Business 1
- `.env.bsns2` for Business 2

The key environment variables are:

- `VITE_BUSINESS_ID`: Identifies the business ("1" or "2")
- `VITE_APP_NAME`: Business-specific app name
- `VITE_APP_DOMAIN`: Business-specific domain

## Deployment

The application is deployed using GitHub Actions and Vercel:

1. Two separate Vercel projects are maintained
2. GitHub Actions workflow deploys to both projects on main branch updates
3. Each deployment uses business-specific environment variables

## Local Development

To run the app locally for a specific business:

```bash
# For Business 1
cp .env.bsns1 .env
npm run dev

# For Business 2
cp .env.bsns2 .env
npm run dev
```

## Security Considerations

1. Each business's data is isolated in separate collections
2. Sessions collection is shared but filtered by business ID
3. Environment variables are securely stored in Vercel

## Testing

When running tests:

1. Use the emulator with both business configurations
2. Test data isolation between businesses
3. Verify shared collection access patterns
