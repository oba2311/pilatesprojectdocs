import { useCallback, useState } from "react";
import ChildComponent from "./components/ChildComponent";

// Simulate an async API call
const fetchUserPreferences = async (userId: string) => {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return {
		theme: "dark",
		categories: {
			category1: "value1",
			category2: "value2",
		},
	};
};

// Code snippets to display
const CODE_SNIPPETS = {
	parentUpdate: `// In Parent (App.tsx)
const handleUserSelect = async (userId: string) => {
	setSelectedUserId(userId);
	const preferences = await fetchUserPreferences(userId);
	setUserPreferences(preferences);  // This update might be overwritten
};`,
	childEffect: `// In Child (ChildComponent.tsx)
useEffect(() => {
	const loadData = async () => {
		const additionalData = await fetchAdditionalData(userId);
		const mergedData = {
			...preferences,  // Using potentially stale props
			...additionalData,
		};
		setLocalPreferences(mergedData);
		onUpdatePreferences(mergedData);  // This might override parent's update
	};
	void loadData();
}, [userId]);  // Missing 'preferences' in deps array`,
	solution: `// Fixed Child Component
useEffect(() => {
	const loadData = async () => {
		const additionalData = await fetchAdditionalData(userId);
		// Wait for parent's state to settle
		await new Promise(resolve => setTimeout(resolve, 0));
		setLocalPreferences(prev => ({
			...preferences,  // Use latest props
			...additionalData,
			...prev,  // Preserve any local changes
		}));
	};
	void loadData();
}, [userId, preferences]); // Include all dependencies`,
};

function App() {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [userPreferences, setUserPreferences] = useState<Record<string, any>>(
		{}
	);

	// This simulates the bug where we have a race condition between
	// direct state updates and effects in the child component
	const handleUserSelect = useCallback(async (userId: string) => {
		console.log("🎯 Parent: handleUserSelect START", { userId });

		setSelectedUserId(userId);

		// Simulate the race condition by having multiple async operations
		const preferences = await fetchUserPreferences(userId);
		console.log("📥 Parent: Fetched preferences", preferences);

		setUserPreferences(preferences);
	}, []);

	return (
		<div className="layout-grid">
			<div>
				<h1>Race Condition Reproduction</h1>
				<p>This app demonstrates a race condition in React state management.</p>

				<div className="card">
					<h2>Select a User:</h2>
					<div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
						<button
							className="button"
							onClick={() => handleUserSelect("user1")}
						>
							User 1
						</button>
						<button
							className="button"
							onClick={() => handleUserSelect("user2")}
						>
							User 2
						</button>
					</div>

					{selectedUserId && (
						<ChildComponent
							userId={selectedUserId}
							preferences={userPreferences}
							onUpdatePreferences={(newPrefs) => {
								console.log("🔄 Parent: Updating preferences", newPrefs);
								setUserPreferences(newPrefs);
							}}
						/>
					)}
				</div>
			</div>

			<div>
				<div className="card">
					<h2>Problematic Code</h2>
					<div className="code-section">
						<div className="code-label">Parent Component</div>
						<pre>{CODE_SNIPPETS.parentUpdate}</pre>
					</div>
					<div className="code-section">
						<div className="code-label">Child Component</div>
						<pre>{CODE_SNIPPETS.childEffect}</pre>
					</div>
					<div className="code-section">
						<div className="code-label">Solution</div>
						<pre>{CODE_SNIPPETS.solution}</pre>
					</div>
				</div>

				<div className="card">
					<h3>Debug Info:</h3>
					<pre>
						{JSON.stringify(
							{
								selectedUserId,
								userPreferences,
							},
							null,
							2
						)}
					</pre>
				</div>
			</div>

			<div className="diagram-section">
				<h2>Component Relationship Diagram</h2>
				<div className="mermaid">
					{`
					graph TB
						subgraph "App Component"
							P[Parent State<br/>userPreferences]
							PS[selectedUserId]
							PF[handleUserSelect]
							API1[fetchUserPreferences]
						end

						subgraph "ChildComponent"
							C[Local State<br/>localPreferences]
							CE[useEffect]
							API2[fetchAdditionalData]
							CU[onUpdatePreferences]
						end

						%% Data flow relationships
						P -->|props.preferences| C
						PS -->|props.userId| C
						PF -->|calls| API1
						API1 -->|updates| P
						CE -->|calls| API2
						API2 -->|merges with| C
						C -->|triggers| CU
						CU -->|updates| P

						%% Style definitions
						classDef default fill:#fff,stroke:#597ef7,stroke-width:2px;
						classDef stateNode fill:#e6e6ff,stroke:#597ef7,stroke-width:2px;
						classDef apiNode fill:#ffe6e6,stroke:#597ef7,stroke-width:2px;
						classDef effectNode fill:#e6ffe6,stroke:#597ef7,stroke-width:2px;

						%% Apply styles
						class P,C stateNode;
						class API1,API2 apiNode;
						class CE effectNode;
					`}
				</div>

				<h2>Problem: Race Condition Flow</h2>
				<div className="mermaid">
					{`
					sequenceDiagram
						participant P as Parent
						participant C as Child
						participant API as API Calls
						
						Note over P,C: User clicks "Select User"
						P->>API: fetchUserPreferences()
						activate API
						P->>C: Update userId prop
						rect rgb(255, 200, 200)
							Note over C: Effect triggered by userId change
							C->>API: fetchAdditionalData()
							Note over C: Using stale preferences
						end
						API-->>P: Return preferences
						deactivate API
						rect rgb(255, 200, 200)
							P->>C: Update preferences prop
							Note over C: Effect doesn't react to new preferences<br/>(missing from deps array)
						end
						activate API
						API-->>C: Return additional data
						deactivate API
						rect rgb(255, 200, 200)
							C->>P: onUpdatePreferences callback
							Note over P,C: Parent state overwritten with<br/>merged stale data
						end
					`}
				</div>

				<h2>Solution: Correct State Flow</h2>
				<div className="mermaid">
					{`
					sequenceDiagram
						participant P as Parent
						participant C as Child
						participant API as API Calls
						
						Note over P,C: User clicks "Select User"
						P->>API: fetchUserPreferences()
						activate API
						P->>C: Update userId prop
						rect rgb(200, 255, 200)
							Note over C: Effect triggered by userId & preferences changes
							C->>API: fetchAdditionalData()
							Note over C: Using latest preferences
						end
						API-->>P: Return preferences
						deactivate API
						rect rgb(200, 255, 200)
							P->>C: Update preferences prop
							Note over C: Effect re-runs with new preferences<br/>(included in deps array)
						end
						activate API
						API-->>C: Return additional data
						deactivate API
						rect rgb(200, 255, 200)
							C->>P: onUpdatePreferences with latest data
							Note over P,C: States stay in sync
						end
					`}
				</div>
			</div>
		</div>
	);
}

export default App;
