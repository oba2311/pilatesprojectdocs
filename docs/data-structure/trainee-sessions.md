# Trainee Sessions Data Structure

## Overview

The Pilates Studio App maintains two types of session data for trainees:

1. Historical Sessions (completed sessions)
2. Next Session (template for upcoming sessions)

## Data Structures

### Trainee Interface

```typescript
interface Trainee {
	id: string;
	firstName: string;
	lastName: string;
	nextSession?: {
		categories: Categories;
		comments?: string;
	};
	generalComments?: string;
	isTest?: boolean;
}
```

### Categories Interface

```typescript
interface Categories {
	[category: string]: string; // category -> exercise mapping
}
```

### Session Interface

```typescript
interface Session {
	id: string;
	traineeId: string;
	instructor: Instructor;
	datetime: string;
	categories: Categories;
	comments: string;
	status: "completed" | "pending";
	roomId: string;
	isTestMode: boolean;
}
```

## Data Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#e0f2fe', 'primaryBorderColor': '#0ea5e9', 'primaryTextColor': '#0369a1', 'lineColor': '#0ea5e9'}}}%%
graph TD
    A[Firestore: Trainee Collection] --> B[useTrainees Hook]
    B --> C[SessionsContainer]
    C --> D[SessionCard]
    D --> E[Selections Component]
    E --> F[CardSelection Component]

    G[Firestore: Exercises Collection] --> H[useExercises Hook]
    H --> E

    I[User Selects Exercise] --> J[handleCategoryChange]
    J --> K[updateFormField]
    K --> L[Update UI State]
    L --> M[Save Session]
    M --> N[Clear Next Session]
    N --> O[Update Trainee in Firestore]

    style A fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
    style G fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
    style I fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
```

## State Management Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#e0f2fe', 'primaryBorderColor': '#0ea5e9', 'primaryTextColor': '#0369a1', 'lineColor': '#0ea5e9', 'actorBorder': '#0ea5e9'}}}%%
sequenceDiagram
    participant U as User
    participant SC as SessionCard
    participant S as Selections
    participant CS as CardSelection
    participant SS as SessionsContainer
    participant DB as Firestore

    U->>SC: Select Exercise
    SC->>S: handleCategoryChange
    S->>CS: Update Dropdown
    CS->>SS: updateFormField
    SS->>DB: Save Session
    SS->>DB: Clear Next Session
    DB->>SC: Update UI
```

## Real-time Updates

The application maintains real-time synchronization between:

1. Exercise selections in dropdowns
2. Session state in the UI
3. Trainee's next session template in Firestore

### Update Process

1. **Initial Load**

   - Trainee data is loaded through `useTrainees` hook
   - Exercise data is loaded through `useExercises` hook
   - Next session template is populated from trainee's data

2. **Exercise Selection**

   - User selects exercise in dropdown
   - Selection is immediately reflected in UI
   - Changes are tracked in temporary state

3. **Session Save**

   - Session is saved to Firestore
   - Trainee's next session is cleared
   - UI is updated to reflect changes

4. **Next Session Template**
   - When a trainee is selected for a new session
   - Their last session's exercises are loaded as defaults
   - Template is stored in `nextSession` field

## Collection Structure

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#e0f2fe', 'primaryBorderColor': '#0ea5e9', 'primaryTextColor': '#0369a1', 'lineColor': '#0ea5e9'}}}%%
graph LR
    A[Root] --> B["BUSINESS_ID:trainees"]
    A --> C[exercises]
    A --> D["BUSINESS_ID:sessions"]
    A --> E["BUSINESS_ID:instructors"]

    %% Trainee Document Structure
    B --> T[Trainee Document]
    T --> T1[id]
    T --> T2[firstName]
    T --> T3[lastName]
    T --> T4[nextSession]
    T --> T5[generalComments]
    T --> T6[isTest]
    T4 --> T4A[categories]
    T4 --> T4B[comments]

    %% Exercise Document Structure
    C --> X[Exercise Document]
    X --> X1[id]
    X --> X2[category]
    X --> X3[subcategory]
    X --> X4[series]
    X --> X5[exercise]
    X --> X6[description]

    %% Session Document Structure
    D --> S[Session Document]
    S --> S1[id]
    S --> S2[traineeId]
    S --> S3[instructorId]
    S --> S4[datetime]
    S --> S5[categories]
    S --> S6[comments]
    S --> S7[status]
    S --> S8[roomId]
    S --> S9[isTestMode]
    S --> S10[timestamp]

    %% Instructor Document Structure
    E --> I[Instructor Document]
    I --> I1[id]
    I --> I2[firstName]
    I --> I3[lastName]

    %% Styling
    style A fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
    style B fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
    style C fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
    style D fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
    style E fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px
```

## Usage Guidelines

1. **Next Session Template**

   - Used to pre-populate new sessions
   - Cleared after each session save
   - Should reflect the trainee's most recent exercise selections

2. **Categories Management**

   - Categories must match available exercises
   - Empty categories should be handled gracefully in UI
   - Exercise names must match exactly with exercise collection

3. **State Updates**

   - All changes should be reflected immediately in UI
   - Firestore updates should be atomic
   - Error handling should preserve data consistency

4. **Performance Considerations**
   - Use batch updates when possible
   - Implement proper loading states
   - Cache frequently accessed data
