# Session Card State Management Analysis

## Current Implementation

The current implementation has parallel data flows that can lead to race conditions and state synchronization issues.

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
    subgraph "Session Container"
        PS[Session Form State]
        PTS[Trainee Selection]
        PSH[Save Handler]
    end

    subgraph "Session Card"
        SCS[Card State]
        SCL[Local Changes]
    end

    subgraph "API Layer"
        TS[Trainee Service]
        NS[Next Session Service]
    end

    %% Container Flow
    PTS --> TS
    TS --> PS
    PS --> SCS

    %% Card Flow
    SCL --> TS
    TS --> SCS
    SCS --> PS

    %% Save Flow
    PS --> NS
    PSH --> SCL

    classDef store fill:#e6e6ff,stroke:#597ef7,stroke-width:2px;
    classDef component fill:#ffe6e6,stroke:#597ef7,stroke-width:2px;
    classDef service fill:#e6ffe6,stroke:#597ef7,stroke-width:2px;

    class PS,SCS store;
    class PTS,SCL,PSH component;
    class TS,NS service;
```

### Current Issues

1. **Duplicate Data Fetching**

   - Both parent and child components fetch trainee data
   - Network overhead and potential race conditions

2. **Complex State Synchronization**

   - Two-way data flow between parent and child
   - Hard to track the source of truth

3. **Scattered Unsaved Changes Logic**
   - Changes tracked at card level but need to sync with parent
   - Save/delete operations need to clear unsaved state

## Proposed Solution

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
    subgraph "Session Container"
        USC[Unsaved Changes Store]
        PS[Session Forms]
        PTS[Trainee Selection]
    end

    subgraph "Session Card"
        SCD[Display Component]
        SCL[Local Edits]
    end

    subgraph "API Layer"
        TSS[Trainee Service]
        NSS[Next Session Service]
    end

    %% Main Data Flow
    PTS --> TSS
    TSS --> PS
    PS --> SCD

    %% Local Changes Flow
    SCL --> USC
    USC --> PS

    %% Save Flow
    PS --> NSS
    NSS --> USC

    classDef store fill:#e6e6ff,stroke:#597ef7,stroke-width:2px;
    classDef component fill:#ffe6e6,stroke:#597ef7,stroke-width:2px;
    classDef service fill:#e6ffe6,stroke:#597ef7,stroke-width:2px;

    class USC,PS store;
    class SCD,SCL,PTS component;
    class TSS,NSS service;
```

### Key Improvements

1. **Single Source of Truth**

   - Parent container owns all data fetching
   - Session Card becomes a controlled component
   - Clear separation between data and display logic

2. **Centralized Unsaved Changes**

   - New Unsaved Changes Store at container level
   - Tracks changes by session card ID
   - Automatically cleared on save/delete

3. **Simplified Data Flow**
   - One-way data flow from parent to child
   - Local edits tracked separately from main state
   - Clear ownership of state updates

### Implementation Details

```typescript
// Types
interface UnsavedChanges {
	[sessionId: string]: {
		traineeId: string;
		timestamp: number;
		changes: Partial<SessionForm>;
	};
}

// Container Level
const SessionContainer = () => {
	const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChanges>({});
	const [sessions, setSessions] = useState<SessionForm[]>([]);

	const handleTraineeSelect = async (sessionId: string, traineeId: string) => {
		const traineeData = await traineesService.get(traineeId);

		// Update session data
		setSessions((prev) =>
			prev.map((session) =>
				session.id === sessionId
					? { ...session, ...traineeData.nextSession }
					: session
			)
		);

		// Track as unsaved change
		setUnsavedChanges((prev) => ({
			...prev,
			[sessionId]: {
				traineeId,
				timestamp: Date.now(),
				changes: traineeData.nextSession,
			},
		}));
	};

	const handleSave = async (sessionId: string) => {
		await saveSession(sessionId);
		// Clear unsaved changes for this session
		setUnsavedChanges((prev) => {
			const { [sessionId]: _, ...rest } = prev;
			return rest;
		});
	};

	return sessions.map((session) => (
		<SessionCard
			key={session.id}
			session={session}
			hasUnsavedChanges={!!unsavedChanges[session.id]}
			onTraineeSelect={(traineeId) =>
				handleTraineeSelect(session.id, traineeId)
			}
			onSave={() => handleSave(session.id)}
		/>
	));
};

// Card Level
const SessionCard = ({
	session,
	hasUnsavedChanges,
	onTraineeSelect,
	onSave,
}: SessionCardProps) => {
	// Local state only for UI purposes
	const [isEditing, setIsEditing] = useState(false);

	return (
		<div className={`card ${hasUnsavedChanges ? "unsaved" : ""}`}>
			{/* Card UI */}
		</div>
	);
};
```

### Migration Strategy

1. **Phase 1: Centralize State**

   - Move all API calls to container level
   - Implement unsaved changes store
   - Keep existing card-level state temporarily

2. **Phase 2: Simplify Cards**

   - Convert cards to controlled components
   - Remove duplicate API calls
   - Update UI to reflect centralized state

3. **Phase 3: Cleanup**
   - Remove unused state management code
   - Update tests to reflect new data flow
   - Document new patterns

### Benefits

1. **Better Performance**

   - Reduced network calls
   - More efficient state updates
   - Better React rendering optimization

2. **Improved Reliability**

   - No race conditions
   - Predictable state updates
   - Easier to debug

3. **Enhanced User Experience**
   - Consistent unsaved changes indicator
   - Faster response to user actions
   - More reliable save/delete operations
