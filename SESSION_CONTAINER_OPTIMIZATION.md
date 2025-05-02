# Detailed Implementation Guide: Optimizing Render Performance in Pilates Studio App

This guide provides step-by-step instructions for optimizing render performance in the Pilates Studio application, focusing on safety and backward compatibility.

## Phase 1: Apply React.memo() to Session Card Components

### Target Files:

- `src/components/session-card/SessionCard.tsx`
- Any other card-like components that render frequently

### Implementation Steps:

1. **Analyze the Component Props**

First, analyze the component's props to understand what might trigger unnecessary re-renders:

```typescript
// Look for props like these in SessionCard.tsx
interface SessionCardProps {
	session?: Session;
	traineeOptions?: Trainee[];
	instructorOptions?: Instructor[];
	onSaveSession?: (sessionForm: SessionForm) => Promise<void>;
	// ... other props
}
```

2. **Create a Custom Comparison Function**

```typescript
// Add at the bottom of SessionCard.tsx
const arePropsEqual = (
	prevProps: SessionCardProps,
	nextProps: SessionCardProps
) => {
	// Primary comparisons - check if critical props have changed
	const sessionIdChanged =
		prevProps.session?.id !== nextProps.session?.id ||
		prevProps.session?.tempId !== nextProps.session?.tempId;

	const savingStateChanged = prevProps.isSaving !== nextProps.isSaving;

	// Only do deep comparisons if necessary for critical workflow states
	if (sessionIdChanged || savingStateChanged) {
		return false;
	}

	// Check if trainee/instructor selection has changed
	const traineeChanged =
		prevProps.session?.traineeId !== nextProps.session?.traineeId;
	const instructorChanged =
		prevProps.session?.instructorId !== nextProps.session?.instructorId;

	// For options arrays, just check if the references changed
	// (This assumes options arrays don't change frequently)
	const optionsChanged =
		prevProps.traineeOptions !== nextProps.traineeOptions ||
		prevProps.instructorOptions !== nextProps.instructorOptions;

	// Check if UI state that affects appearance has changed
	const uiStateChanged =
		prevProps.title !== nextProps.title ||
		prevProps.className !== nextProps.className;

	return !(
		traineeChanged ||
		instructorChanged ||
		optionsChanged ||
		uiStateChanged
	);
};

// Export memoized component
export const MemoizedSessionCard = React.memo(SessionCard, arePropsEqual);
```

3. **Safety Modification: Create a Safe Export**

To ensure backward compatibility, update the export:

```typescript
// At the bottom of SessionCard.tsx
export default SessionCard; // Keep original export
export const MemoizedSessionCard = React.memo(SessionCard, arePropsEqual); // Add memoized version
```

4. **Update Imports in Consuming Components**

```typescript
// In files using SessionCard, update imports one by one
// import SessionCard from '@/components/session-card/SessionCard';
import { MemoizedSessionCard as SessionCard } from "@/components/session-card/SessionCard";
```

### GOTCHAS and Edge Cases:

- **Function Props:** Functions created inline will be new references on each render. Wrap callback functions in useCallback.
- **Object Identity:** For objects like `session`, shallow comparison might not be enough. Focus on comparing IDs.
- **Stale Closures:** Memoized components might capture old values of props. Use function form of state updates.

## Phase 2: Implement useMemo() for Expensive Calculations

### Target Files:

- `src/pages/sessions-container.tsx`
- Any component that calculates derived data

### Implementation Steps:

1. **Identify Expensive Calculations**

Look for:

- Filtering/mapping large arrays
- Transforming data for display
- Any function that processes multiple session objects

2. **Apply useMemo to SessionsContainer.tsx**

```typescript
// Find calculation like this:
const currentSessions = getCurrentSessions(
	selectedDate,
	selectedHour,
	selectedRoom,
	selectedStudio
);

// Replace with memoized version:
const currentSessions = useMemo(() => {
	console.log("🧮 Calculating current sessions");
	return getCurrentSessions(
		selectedDate,
		selectedHour,
		selectedRoom,
		selectedStudio
	);
}, [
	selectedDate,
	selectedHour,
	selectedRoom,
	selectedStudio,
	getCurrentSessions,
	refreshKey,
]);
```

3. **Memoize Session Grid Calculations**

```typescript
// Find code that prepares sessions for display
const sessionsForDisplay = currentSessions.temporary.map(/* transformation */);

// Replace with:
const sessionsForDisplay = useMemo(() => {
	console.log("🧮 Preparing sessions for display");
	return currentSessions.temporary.map(/* transformation */);
}, [currentSessions.temporary]);
```

4. **Memoize Filter Functions**

```typescript
// Look for filtering functions:
const filteredOptions = traineeOptions.filter(/* some condition */);

// Replace with:
const filteredOptions = useMemo(() => {
	console.log("🧮 Filtering trainee options");
	return traineeOptions.filter(/* some condition */);
}, [traineeOptions /* and other dependencies */]);
```

### GOTCHAS and Edge Cases:

- **Dependency Arrays:** Missing dependencies will cause stale data; too many will negate the benefit.
- **Primitive vs. Reference Types:** Be careful with objects in dependencies - they may change identity even when content is the same.
- **Complex Calculations:** For very complex operations, consider moving them to a web worker.

## Phase 3: Add Comprehensive Render Tracking

### Target Files:

- `src/pages/sessions-container.tsx`
- `src/components/session-card/SessionCard.tsx`
- Any component with suspected re-rendering issues

### Implementation Steps:

1. **Create a Custom Hook for Tracking**

Create a new file: `src/hooks/useRenderTracker.ts`

```typescript
import { useRef, useEffect } from "react";

export const useRenderTracker = (
	componentName: string,
	propsToTrack?: Record<string, any>
) => {
	const renderCountRef = useRef(0);

	useEffect(() => {
		renderCountRef.current += 1;

		// Only log in development
		if (process.env.NODE_ENV === "development") {
			const count = renderCountRef.current;

			// Add emoji based on render count to make it easier to spot problems
			let emoji = "🔄";
			if (count > 5) emoji = "⚠️";
			if (count > 10) emoji = "🔥";

			console.group(`${emoji} ${componentName} render #${count}`);

			if (propsToTrack) {
				console.log("Props that may have triggered render:");
				Object.entries(propsToTrack).forEach(([key, value]) => {
					// For arrays, show length instead of full content
					if (Array.isArray(value)) {
						console.log(`  ${key}: Array(${value.length})`);
					} else if (typeof value === "object" && value !== null) {
						console.log(`  ${key}: Object`, value);
					} else {
						console.log(`  ${key}: ${value}`);
					}
				});
			}

			console.groupEnd();
		}

		// Clean up logic for component unmount
		return () => {
			if (process.env.NODE_ENV === "development") {
				console.log(
					`🧹 ${componentName} unmounted after ${renderCountRef.current} renders`
				);
			}
		};
	});

	return renderCountRef.current;
};
```

2. **Apply the Hook to SessionsContainer**

```typescript
// In SessionsContainer.tsx
import { useRenderTracker } from "@/hooks/useRenderTracker";

const SessionsContainer = () => {
	// Add at the top of the component
	const renderCount = useRenderTracker("SessionsContainer", {
		selectedDate,
		selectedHour,
		selectedRoom,
		selectedStudio,
		hasCurrentSessions:
			!!sessions?.[selectedDate]?.[selectedHour]?.[selectedRoom]?.[
				selectedStudio
			],
		refreshKey,
	});

	// Rest of component code...
};
```

3. **Apply the Hook to SessionCard**

```typescript
// In SessionCard.tsx
import { useRenderTracker } from "@/hooks/useRenderTracker";

export const SessionCard = ({ className, session /* other props */ }) => {
	// Add render tracking
	useRenderTracker("SessionCard", {
		tempId: session?.tempId,
		traineeId: session?.traineeId,
		isSaving,
		hasTraineeOptions: !!traineeOptions?.length,
	});

	// Rest of component code...
};
```

4. **Create a Development-Only Render Profile Button**

```typescript
// Add to SessionsContainer.tsx
const [showRenderProfile, setShowRenderProfile] = useState(false);

// Add somewhere in the UI for development builds only
{
	process.env.NODE_ENV === "development" && (
		<Button
			onClick={() => setShowRenderProfile((prev) => !prev)}
			variant="outline"
			size="sm"
			className="absolute top-2 right-2"
		>
			{showRenderProfile ? "Hide" : "Show"} Render Stats
		</Button>
	);
}

// Profile display
{
	showRenderProfile && process.env.NODE_ENV === "development" && (
		<div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-md z-50 max-w-sm">
			<h3 className="font-bold">Render Stats:</h3>
			<p>Container: {renderCount} renders</p>
			<button onClick={() => console.clear()} className="text-xs">
				Clear Console
			</button>
		</div>
	);
}
```

### GOTCHAS and Edge Cases:

- **Performance Impact:** Remove render tracking in production builds.
- **Console Overflow:** High render counts can flood the console - add filtering.
- **Component Hierarchy:** Track renders at different levels to identify where re-renders cascade from.

## Phase 4: Refactor Redux Actions to Use Batching

### Target Files:

- `src/store/sessionsSlice.ts`
- `src/hooks/usePersistentSessions.ts`
- `src/pages/sessions-container.tsx`

### Implementation Steps:

1. **Set Up Batching in Redux Store**

The good news is that Redux Toolkit already has batching built-in. Let's make sure it's properly utilized:

```typescript
// In src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
// Existing imports...

export const store = configureStore({
	// Existing configuration...
});

// Add utility for batch dispatching
export const batchedDispatch = (actions) => {
	actions.forEach((action) => store.dispatch(action));
};
```

2. **Create Batch Actions in Sessions Slice**

```typescript
// In src/store/sessionsSlice.ts
export const batchUpdateSessions = (actions) => ({
	type: "sessions/batchUpdate",
	payload: actions,
});

// Modify the reducer to handle batch updates
const sessionsSlice = createSlice({
	name: "sessions",
	initialState,
	reducers: {
		// ... existing reducers

		// Add a new case for batch updates
		batchUpdate: (state, action) => {
			// Each action in the payload is processed in order
			action.payload.forEach((subAction) => {
				// Find the appropriate reducer based on the subAction type
				const actionType = subAction.type.replace("sessions/", "");
				if (sessionsSlice.caseReducers[actionType]) {
					sessionsSlice.caseReducers[actionType](state, subAction);
				}
			});
		},
	},
});
```

3. **Use Batching in usePersistentSessions Hook**

```typescript
// In src/hooks/usePersistentSessions.ts
import { batch } from "react-redux";

// Find places where multiple actions are dispatched in sequence
// For example:

// Before:
const resetCurrentHour = useCallback(
	(date: string, hour: string, room: string, studio: string) => {
		console.log("🔄 Resetting hour:", { date, hour, room, studio });
		dispatch(resetHour({ date, hour, room, studio }));
		// Force a re-render by updating the refresh key
		setRefreshKey((prev) => prev + 1);
	},
	[dispatch]
);

// After:
const resetCurrentHour = useCallback(
	(date: string, hour: string, room: string, studio: string) => {
		console.log("🔄 Resetting hour:", { date, hour, room, studio });
		batch(() => {
			dispatch(resetHour({ date, hour, room, studio }));
			dispatch(someOtherAction()); // If you have other actions to dispatch
		});
		// Force a re-render by updating the refresh key - keep outside batch
		setRefreshKey((prev) => prev + 1);
	},
	[dispatch]
);
```

4. **Look for Batch Opportunities in SessionsContainer**

```typescript
// In SessionsContainer
const handleTraineeSelection = async (traineeId) => {
	// Before: Multiple individual dispatches

	// After: Group related updates
	batch(() => {
		// Update session with trainee
		dispatch(
			updateTemporarySession({
				date: selectedDate,
				hour: selectedHour,
				room: selectedRoom,
				studio: selectedStudio,
				session: {
					...updatedSession,
				},
			})
		);

		// Any other related state updates
		dispatch(otherActions());
	});
};
```

### GOTCHAS and Edge Cases:

- **Order Matters:** Actions in a batch are processed in order, so dependent changes need correct sequencing.
- **Component State:** Batch only affects Redux; component-local state needs separate handling.
- **Async Actions:** Batching works for synchronous dispatches; async needs careful handling.

## Phase 5: Implement Memoized Selectors

### Target Files:

- `src/store/sessionsSelectors.ts` (create if not exists)
- `src/hooks/usePersistentSessions.ts`

### Implementation Steps:

1. **Create a Dedicated Selectors File**

Create `src/store/sessionsSelectors.ts`:

```typescript
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./storeTypes";

// Base selectors
const selectSessionsState = (state: RootState) => state.sessions;
const selectUIState = (state: RootState) => state.sessions.ui;
const selectSessionsData = (state: RootState) => state.sessions.sessions;

// Primary UI selectors
export const selectSelectedDate = (state: RootState) =>
	selectUIState(state).selectedDate;
export const selectSelectedHour = (state: RootState) =>
	selectUIState(state).selectedHour;
export const selectSelectedRoom = (state: RootState) =>
	selectUIState(state).selectedRoom;
export const selectSelectedStudio = (state: RootState) =>
	selectUIState(state).selectedStudio;

// Combined selectors
export const selectCurrentPath = createSelector(
	[
		selectSelectedDate,
		selectSelectedHour,
		selectSelectedRoom,
		selectSelectedStudio,
	],
	(date, hour, room, studio) => ({
		date,
		hour,
		room,
		studio,
	})
);

// Sessions selectors
export const selectSessionsForCurrentView = createSelector(
	[selectSessionsData, selectCurrentPath],
	(sessions, { date, hour, room, studio }) => {
		console.log("🔍 Computing sessions for current view");
		const result = {
			permanent: sessions[date]?.[hour]?.[room]?.[studio]?.permanent || [],
			temporary: sessions[date]?.[hour]?.[room]?.[studio]?.temporary || [],
		};
		return result;
	}
);

export const selectNonEmptySessionsCount = createSelector(
	[selectSessionsForCurrentView],
	(sessions) => {
		const nonEmptySessions = sessions.temporary.filter(
			(s) => s.traineeId && !s.tempId?.startsWith("empty-")
		);
		return nonEmptySessions.length;
	}
);
```

2. **Update usePersistentSessions to Use Selectors**

```typescript
// In src/hooks/usePersistentSessions.ts
import {
	selectCurrentPath,
	selectSelectedDate,
	selectSelectedHour,
	selectSelectedRoom,
	selectSelectedStudio,
	selectSessionsForCurrentView,
} from "@/store/sessionsSelectors";

export const usePersistentSessions = () => {
	const dispatch = useDispatch();
	const [refreshKey, setRefreshKey] = useState(0);

	// Use selectors instead of direct state access
	const selectedDate = useSelector(selectSelectedDate);
	const selectedHour = useSelector(selectSelectedHour);
	const selectedRoom = useSelector(selectSelectedRoom);
	const selectedStudio = useSelector(selectSelectedStudio);
	const currentPath = useSelector(selectCurrentPath);
	const sessions = useSelector((state: RootState) => state.sessions);

	// Use the memoized selector for current sessions
	const currentSessions = useSelector(selectSessionsForCurrentView);

	// Update the getCurrentSessions method to use the selector
	const getCurrentSessions = useCallback(
		(date: string, hour: string, room: string, studio: string) => {
			// If requesting current view, use the memoized result
			if (
				date === selectedDate &&
				hour === selectedHour &&
				room === selectedRoom &&
				studio === selectedStudio
			) {
				return currentSessions;
			}

			// Otherwise, compute for the requested path
			const result = {
				permanent:
					sessions.sessions[date]?.[hour]?.[room]?.[studio]?.permanent || [],
				temporary:
					sessions.sessions[date]?.[hour]?.[room]?.[studio]?.temporary || [],
			};
			return result;
		},
		[
			sessions,
			currentSessions,
			selectedDate,
			selectedHour,
			selectedRoom,
			selectedStudio,
		]
	);

	// Rest of the hook implementation...
};
```

### GOTCHAS and Edge Cases:

- **Selector Dependencies:** Ensure selectors depend only on relevant parts of state to avoid unnecessary recalculations.
- **Nested Selectors:** Be careful with selector composition to avoid unnecessary recalculations.
- **Debugging:** Add console.logs inside selectors during development to verify memoization is working.

## Phase 6: Review useEffect Dependencies

### Target Files:

- All components with useEffect hooks, especially:
  - `src/pages/sessions-container.tsx`
  - `src/components/session-card/SessionCard.tsx`
  - `src/hooks/usePersistentSessions.ts`

### Implementation Steps:

1. **Create an Effect Dependency Checker**

Create a utility to track dependency changes (for development):

```typescript
// In src/utils/dev-tools.ts
export const trackDependencyChanges = (
	name: string,
	deps: any[],
	depNames: string[]
) => {
	if (process.env.NODE_ENV !== "development") return;

	// Create a copy of the current dependencies
	const currentDeps = [...deps];

	// Return a function to check what changed
	return (prevDeps: any[] | null) => {
		if (!prevDeps) return currentDeps;

		// Check which dependencies changed
		const changedDeps = depNames.filter(
			(_, i) => !Object.is(prevDeps[i], currentDeps[i])
		);

		if (changedDeps.length > 0) {
			console.log(`📊 [${name}] Effect triggered by changes in:`, changedDeps);
		}

		return currentDeps;
	};
};
```

2. **Audit useEffect in SessionsContainer**

```typescript
// In SessionsContainer.tsx
import { trackDependencyChanges } from "@/utils/dev-tools";

// Find effects like this:
useEffect(() => {
	// Effect code...
}, [selectedDate, selectedHour, selectedRoom, selectedStudio]);

// Replace with instrumented version (dev only):
useEffect(() => {
	// Effect code...

	// DEV-only cleanup
	return () => {
		if (process.env.NODE_ENV === "development") {
			console.log("🧹 Clean-up for data loading effect");
		}
	};
}, [selectedDate, selectedHour, selectedRoom, selectedStudio]);

// Add DEV-only tracker
const prevDepsRef = useRef(null);
if (process.env.NODE_ENV === "development") {
	const trackDeps = trackDependencyChanges(
		"SessionsContainer data loader",
		[selectedDate, selectedHour, selectedRoom, selectedStudio],
		["selectedDate", "selectedHour", "selectedRoom", "selectedStudio"]
	);

	useEffect(() => {
		prevDepsRef.current = trackDeps(prevDepsRef.current);
	}, [selectedDate, selectedHour, selectedRoom, selectedStudio]);
}
```

3. **Fix Common useEffect Issues**

Look for these common patterns that may cause unnecessary re-renders:

```typescript
// Issue 1: Object literals in dependencies
useEffect(() => {
	// Effect code
}, [{ prop: value }]); // 🚫 New object created each render

// Fix 1: Move object outside effect
const options = useMemo(() => ({ prop: value }), [value]);
useEffect(() => {
	// Effect code
}, [options]);

// Issue 2: Inline functions in dependencies
useEffect(() => {
	// Effect code
}, [() => {}]); // 🚫 New function created each render

// Fix 2: Use useCallback
const handler = useCallback(() => {}, []);
useEffect(() => {
	// Effect code
}, [handler]);

// Issue 3: Missing dependencies
useEffect(() => {
	console.log(value); // Uses value but doesn't list it
}, []); // 🚫 Missing dependency

// Fix 3: Add all dependencies
useEffect(() => {
	console.log(value);
}, [value]);
```

4. **Add useCallback to Event Handlers**

```typescript
// Before:
const handleTraineeSelection = (traineeId) => {
	// Handler code
};

// After:
const handleTraineeSelection = useCallback(
	(traineeId) => {
		// Handler code
	},
	[
		/* dependencies needed by the handler */
	]
);
```

### GOTCHAS and Edge Cases:

- **Stale Closures:** Be careful with values captured in closures - they may be stale.
- **Over-optimization:** Not every function needs to be memoized - focus on those passed as props or dependencies.
- **ESLint Exhaustive Deps:** Consider using the eslint-plugin-react-hooks to catch missing dependencies.

## Important Files to Focus On

1. **Primary UI Components with High Render Counts:**

   - `src/pages/sessions-container.tsx`
   - `src/components/session-card/SessionCard.tsx`

2. **Core State Management:**

   - `src/store/sessionsSlice.ts`
   - `src/hooks/usePersistentSessions.ts`
   - `src/store/store.ts`

3. **Data Services:**
   - `src/services/sessions.ts`

## Major Edge Cases to Consider

1. **Redux Connected Components:**
   Changes to Redux state trigger re-renders of all connected components. Use precise selectors.

2. **Real-time Updates:**
   If implementing real-time features (like collaborative editing), managing re-renders becomes even more critical.

3. **Backward Compatibility:**
   When memoizing components, keep both original and memoized exports available during the transition.

4. **Development vs. Production:**
   Make sure performance tracking code doesn't run in production.

5. **Cleanup on Component Unmount:**
   Ensure all event listeners, subscriptions, and timeouts are properly cleaned up.

## Implementation Strategy for Safety

1. **Incremental Approach:**

   - Apply changes one component at a time, starting with the most problematic ones
   - Test thoroughly after each change
   - Have rollback plans for each change

2. **Feature Flagging:**

   - Consider using feature flags to enable/disable optimizations
   - This allows for easy rollback if issues arise

3. **Metrics Before and After:**

   - Measure render counts before changes
   - Compare with counts after changes
   - Document improvements

4. **Controlled Testing:**
   - Test on different devices (especially lower-end ones)
   - Test with varying amounts of data
   - Test with multiple concurrent users if applicable
