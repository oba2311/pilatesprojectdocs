# Async Patterns and Component Chain

This document outlines the async patterns and component chain interactions in the Pilates Studio application, focusing on how data flows between components and how async operations are handled.

## Component Chain Overview

The application follows a hierarchical component chain for session management:

```
SessionsContainer
└── SessionCard
    ├── TraineeDropdown
    └── InstructorDropdown
```

## Async Patterns

### 1. Trainee Selection Flow

The trainee selection process involves multiple async operations that flow through the component chain:

```typescript
// SessionsContainer
const handleTraineeSelect = async (sessionSummary, traineeId) => {
	await updateFormField(sessionSummary, "traineeId", traineeId);
};

// TraineeDropdown
const onTraineeSelect = async (traineeId: string) => {
	await handleTraineeSelect(traineeId);
};
```

Key points:

- Async operations are properly chained to ensure data consistency
- State updates are handled after async operations complete
- Error boundaries are maintained throughout the chain

### 2. Form Field Updates

The `updateFormField` function in `SessionsContainer` handles async updates to session data:

```typescript
const updateFormField = async (session, field, value) => {
	// Handle immediate state updates
	let updatedForm = { ...session };

	switch (field) {
		case "traineeId":
			const selectedTrainee = traineeIdToTrainee[value];
			// Create new session when trainee is selected from empty card
			if (!session.id && !session.tempId) {
				const newSession = {
					...updatedForm,
					traineeId: value,
					datetime: `${selectedDate} ${selectedHour}`,
					categories: selectedTrainee?.nextSession?.categories || {},
					comments: selectedTrainee?.nextSession?.comments || "",
					tempId: Date.now().toString(),
				};
				setNewSessionsSummary((prev) => [...prev, newSession]);
				return newSession;
			}
			break;
	}

	// Handle async state updates
	if (session.id) {
		// Update existing session
		const [date, hour] = session.datetime.split(" ");
		setDailyHourToSessions((prev) => ({
			...prev,
			[date]: {
				...prev[date],
				[hour]: prev[date][hour].map((s) =>
					s.id === session.id ? updatedForm : s
				),
			},
		}));
	}

	return updatedForm;
};
```

### 3. Save Operations

Session saving follows an async pattern with proper state management:

```typescript
const handleSave = async () => {
	if (isSaving) return;

	try {
		setIsSaving(true);
		await onSaveSession?.();
	} catch (error) {
		console.error("Save failed:", error);
		throw error;
	} finally {
		setIsSaving(false);
	}
};
```

## Best Practices

1. **State Management**

   - Always use state setters with functional updates for concurrent operations
   - Maintain loading states during async operations
   - Handle errors appropriately

2. **Component Communication**

   - Pass async callbacks down the component tree
   - Use proper TypeScript types for async functions
   - Maintain consistent error handling throughout the chain

3. **Performance Considerations**
   - Use `useCallback` for async function props
   - Implement proper loading states to prevent UI jank
   - Handle race conditions in async operations

## Common Patterns

### Async Callback Props

```typescript
interface Props {
	onTraineeSelect?: (traineeId: string) => Promise<void>;
	onSaveSession?: () => Promise<void>;
	changeInstructor: (id: string) => Promise<void>;
}
```

### Loading State Management

```typescript
const [isSaving, setIsSaving] = useState(false);
const [isLoading, setIsLoading] = useState(false);

// Usage in async operations
try {
	setIsLoading(true);
	await asyncOperation();
} finally {
	setIsLoading(false);
}
```

### Error Handling

```typescript
const handleAsyncOperation = async () => {
	try {
		await operation();
	} catch (error) {
		console.error("Operation failed:", error);
		// Handle error appropriately
	}
};
```

## Debugging Tips

1. Use console logs strategically in async operations
2. Monitor state changes during async operations
3. Check for proper error handling in the component chain
4. Verify loading states are properly managed

## Common Issues and Solutions

1. **Race Conditions**

   - Use cleanup functions in useEffect
   - Implement proper loading states
   - Cancel unnecessary operations

2. **State Updates**

   - Use functional updates for state setters
   - Verify state updates after async operations
   - Handle edge cases properly

3. **Error Handling**
   - Implement proper error boundaries
   - Handle errors at appropriate levels
   - Provide user feedback for failures

---

## Navigation

- Previous: [Memoization Patterns](./memoization-patterns.md)
- Next: [Session Management](./session-management.md)
- [Back to Home](../../README.md)
