# Local vs Global State Tracking in React

## Overview

This document covers a common pitfall when managing local state changes that need to be tracked globally. We'll explore how to properly coordinate between local component state and global application state.

## The Problem: Local Changes vs Global Awareness

### The Restaurant Analogy

Imagine a restaurant:

- Waiters (Components) take orders on notepads (Local State)
- Kitchen (Global State) needs to know about all pending orders
- Manager (Reset Function) needs to check all orders before closing
- Order tracking system (temporarySessions) keeps track of orders not yet sent to kitchen

### State Management Architecture

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
    subgraph Global ["Global State (SessionContext)"]
        A[dailyHourToSessions]
        B[sessions]
        C[isLoading/error]
    end

    subgraph Local ["Local State (useSessions)"]
        D[temporarySessions]
        E[newSessionsSummary]
        F[emptySessionsMap]
    end

    subgraph Components ["UI Components"]
        G[SessionCard]
        H[SessionsContainer]
    end

    G -->|Updates| D
    G -->|Reads| A
    H -->|Manages| E
    H -->|Manages| F
    H -->|Reset Check| D
    H -->|Reset Check| E
    H -->|Reset Check| F
    D -.->|On Save| A
    E -.->|On Save| A
```

### Data Flow - Session Updates

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
    A[User Action] --> B[Local Update]
    B --> C{State Type?}
    C -->|New Session| D[newSessionsSummary]
    C -->|Empty Slot| E[emptySessionsMap]
    C -->|Category Change| F[temporarySessions]
    D --> G{Reset Hour?}
    E --> G
    F --> G
    G -->|Has Changes| H[Show Warning]
    G -->|No Changes| I[Reset Allowed]
```

### Reset Hour Check Flow

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
    A[Reset Hour Triggered] --> B[Check newSessionsSummary]
    B --> C[Check emptySessionsMap]
    C --> D[Check temporarySessions]
    D --> E{Any Changes?}
    E -->|Yes| F[Show Warning]
    E -->|No| G[Proceed with Reset]
    G --> H[Clear States]
    H --> I[Create New Empty Sessions]
```

## The Solution: Using Existing State Management

Instead of creating new state management, we leverage existing patterns:

1. `temporarySessions` in useSessions hook
2. `newSessionsSummary` in SessionsContainer
3. `emptySessionsMap` in SessionsContainer

### Code Example - Reset Hour Check

```typescript
const handleResetHour = () => {
	const hasUnsavedChanges =
		// Check newSessionsSummary
		newSessionsSummary.some((session) => {
			const [, sessionHour] = session.datetime.split(" ");
			return sessionHour === selectedHour && session.traineeId;
		}) ||
		// Check emptySessionsMap
		emptySessionsMap[selectedHour]?.some((session) => session.traineeId) ||
		// Check temporarySessions
		temporarySessions.some((session) => {
			const [, sessionHour] = session.datetime.split(" ");
			return (
				sessionHour === selectedHour &&
				Object.keys(session.categories || {}).length > 0
			);
		});

	if (hasUnsavedChanges) {
		toast({
			title: "Unsaved Changes",
			description: "Please save your changes before resetting.",
			variant: "destructive",
		});
		return;
	}
	// ... proceed with reset
};
```

## Comprehension Check

### Question 1: State Types

Which states need to be checked before resetting an hour?

- [ ] A) Only global state
- [ ] B) Only temporarySessions
- [x] C) temporarySessions, newSessionsSummary, and emptySessionsMap
- [ ] D) Only newSessionsSummary

### Question 2: Change Detection

What constitutes an unsaved change in temporarySessions?

- [ ] A) Any session in the selected hour
- [ ] B) Sessions with a traineeId
- [x] C) Sessions with non-empty categories
- [ ] D) All temporary sessions

### Question 3: State Management

Why do we use multiple state stores instead of one?

- [ ] A) It's a mistake that should be fixed
- [x] B) Each serves a different purpose (temporary changes, new sessions, empty slots)
- [ ] C) To improve performance
- [ ] D) To make debugging easier

## Key Takeaways

1. Use existing state management patterns when possible
2. Different states serve different purposes:
   - `temporarySessions`: Track category changes
   - `newSessionsSummary`: Track new session creation
   - `emptySessionsMap`: Track empty slot assignments
3. Check all relevant states before operations that could lose changes
4. Use proper logging to track state changes
5. Keep state management consistent across similar operations

## Related Documentation

- [Session State Management](../session-state-management.md)
- [Component State Lessons](../component-state-lessons.md)
