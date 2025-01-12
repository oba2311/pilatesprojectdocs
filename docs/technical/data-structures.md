# Data Structures in Pilates Studio App

This document covers the key data structures used in the application and explains their implementation and use cases.

## Trainee Knowledge System

### Overview

The trainee knowledge system efficiently tracks and summarizes a trainee's exercise history using modern JavaScript data structures and React optimization patterns.

### Implementation Details

```typescript
function useTraineeSessions(sessions: Session[], traineeId?: string) {
	const traineeSessionList = useMemo(() => {
		if (!traineeId) return [];
		return sessions
			.filter((session) => session.traineeId === traineeId)
			.sort((a, b) => b.timestamp - a.timestamp);
	}, [sessions, traineeId]);

	const getTraineeKnowledge = useMemo(() => {
		const categorizedExercises = new Map();
		// ... implementation
		return categorizedExercises;
	}, [traineeSessionList]);

	return {
		traineeSessionList,
		getLastCategories,
		getTraineeKnowledge,
	};
}
```

### Key Data Structures Used

1. **Map for Category-Exercise Relationships**

   - Purpose: Store exercises by category
   - Benefits:
     - O(1) lookups
     - Maintains insertion order
     - Dynamic keys
   - Example:
     ```typescript
     const exercises = new Map();
     exercises.set("mat-work", new Set(["roll-up", "hundred"]));
     exercises.set("reformer", new Set(["footwork", "short-box"]));
     ```

2. **Set for Unique Exercises**
   - Purpose: Store unique exercises within each category
   - Benefits:
     - Automatic deduplication
     - O(1) operations
     - Built-in set operations
   - Example:
     ```typescript
     const matExercises = new Set();
     matExercises.add("roll-up"); // Added
     matExercises.add("roll-up"); // Ignored (duplicate)
     ```

### Performance Considerations

1. **Memoization Strategy**

   ```typescript
   const memoizedValue = useMemo(
   	() => {
   		// Expensive computation here
   	},
   	[
   		/* dependencies */
   	]
   );
   ```

2. **Time Complexity**
   - Session filtering: O(n)
   - Exercise categorization: O(n \* m)
     - n = number of sessions
     - m = average exercises per session

### Common Operations

1. **Adding New Exercises**

   ```typescript
   function addExercise(category: string, exercise: string) {
   	if (!categorizedExercises.has(category)) {
   		categorizedExercises.set(category, new Set());
   	}
   	categorizedExercises.get(category).add(exercise);
   }
   ```

2. **Retrieving Category Exercises**
   ```typescript
   function getCategoryExercises(category: string): Set<string> {
   	return categorizedExercises.get(category) || new Set();
   }
   ```

### Best Practices

1. **Type Safety**

   ```typescript
   interface ExerciseMap {
   	categories: Map<string, Set<string>>;
   	lastUsed: string[];
   }
   ```

2. **Error Handling**
   ```typescript
   try {
   	const exercises = getCategoryExercises(category);
   } catch (error) {
   	console.error("Failed to get exercises:", error);
   	return new Set();
   }
   ```

### Related Patterns

1. **Observer Pattern**

   - Track changes in exercise history
   - Update UI when new exercises are added

2. **Factory Pattern**
   - Create new exercise categories
   - Initialize with default exercises

### Future Improvements

1. **Caching**

   ```typescript
   const cache = new Map<string, Map<string, Set<string>>>();
   ```

2. **Pagination**
   ```typescript
   function getPagedExercises(category: string, page: number, size: number) {
   	const exercises = Array.from(categorizedExercises.get(category) || []);
   	return exercises.slice(page * size, (page + 1) * size);
   }
   ```

## Other Data Structures

### Session Management

[Link to session management documentation]

### Scheduling System

[Link to scheduling system documentation]

---

## Navigation

- Previous: [Trainee Availability](../features/trainee-availability.md)
- Next: [Refactoring Journey](../architecture/refactoring-journey.md)
- [Back to Home](../../README.md)
