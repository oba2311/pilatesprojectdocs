# Trainee Knowledge Tracking System

This document explains the implementation of the trainee knowledge tracking system, which visualizes and manages exercises that trainees have learned over time.

## Data Structure Design

### Knowledge Map Structure

```typescript
// From types/traineeKnowledge.ts
export interface traineeKnowledge {
	traineeId: string;
	knowledge: Map<string, Set<string>>;
}
```

We chose a Map structure for several reasons:

1. **Fast Lookups**: O(1) access time for checking if an exercise is known
2. **Memory Efficient**: Sets prevent duplicate exercise entries
3. **Flexible Updates**: Easy to add/remove exercises without restructuring

Example structure:

```typescript
knowledgeMap = {
	traineeId: "123",
	knowledge: new Map([
		["Warm Up", new Set(["Exercise A", "Exercise B"])],
		["Foot Work", new Set(["Exercise C", "Exercise D"])],
	]),
};
```

### Category Management System

The system uses three key constants for category handling:

```typescript
// From consts.ts - actual implementation
const CATEGORIES = {
	WU: { label: "Warm Up", category: "Warm Up" },
	FW: { label: "Foot Work", category: "Foot Work" },
};

const CATEGORY_MAPPING = {
	"Warm Up": "WU",
	"Foot Work": "FW",
};

const CATEGORY_ORDER = ["Warm Up", "Foot Work"];
```

## Implementation Details

### Knowledge Accumulation

The actual implementation in `useTraineeSessions.ts`:

```typescript
sessionList.forEach((session) => {
	if (!session.categories) return;

	// Convert session categories to the format processExercises expects
	const sessionExercises = Object.entries(session.categories).map(
		([category, exercise]) => ({
			category,
			subcategory: "Other", // Default subcategory
			exercise: exercise,
		})
	);

	// Process the exercises using the existing function
	const processedSessionExercises = processExercises(sessionExercises);

	// Merge into our knowledge map
	Object.entries(processedSessionExercises).forEach(
		([category, subcategories]) => {
			if (!knowledge.has(category)) {
				knowledge.set(category, new Map());
			}
			Object.entries(subcategories).forEach(([subcategory, exercises]) => {
				if (!knowledge.get(category)!.has(subcategory)) {
					knowledge.get(category)!.set(subcategory, new Set());
				}
				exercises.forEach((exercise) => {
					knowledge.get(category)!.get(subcategory)!.add(exercise);
				});
			});
		}
	);
});
```

### Flexible Category Lookup

The actual implementation in `TraineeView.tsx`:

```typescript
const knownCategory =
	traineeKnowledgeMap.knowledge.get(category) || // Direct lookup
	traineeKnowledgeMap.knowledge.get(CATEGORIES[category]?.category) || // Via CATEGORIES
	traineeKnowledgeMap.knowledge.get(CATEGORY_MAPPING[category]); // Via mapping
```

## Best Practices & Potential Improvements

### Current Implementation Challenges

1. **Category Consistency**: Manual maintenance of multiple category mappings
2. **Type Safety**: Limited TypeScript enforcement of category relationships
3. **Data Redundancy**: Multiple representations of the same category information

### Recommended Improvements

1. **Single Source of Truth**:

```typescript
interface Category {
	code: string;
	name: string;
	order: number;
}

const CATEGORY_DEFINITIONS: Record<string, Category> = {
	WU: {
		code: "WU",
		name: "Warm Up",
		order: 1,
	},
};
```

2. **Type Generation**:

```typescript
type CategoryCode = keyof typeof CATEGORY_DEFINITIONS;
type CategoryName = (typeof CATEGORY_DEFINITIONS)[CategoryCode]["name"];
```

## Practice Questions

1. **Data Structure Choice**
   Q: What is the primary benefit of using Map<string, Set<string>> for the knowledge tracking?

   - A) Easier database integration
   - B) O(1) lookups and automatic exercise deduplication
   - C) Better memory management
   - D) Simpler serialization

   Answer: B - The Map provides O(1) category lookups while Set automatically handles exercise uniqueness within categories.

2. **Category Management**
   Q: How does the actual implementation handle category name conversions?

   - A) Through database queries
   - B) Using a three-part system (CATEGORIES, CATEGORY_MAPPING, CATEGORY_ORDER)
   - C) Through dynamic generation
   - D) Using enum values

   Answer: B - The implementation uses three coordinated constants: CATEGORIES for metadata, CATEGORY_MAPPING for conversions, and CATEGORY_ORDER for UI organization.

3. **Knowledge Processing**
   Q: How are exercises from new sessions integrated into the knowledge map?

   - A) Direct database updates
   - B) Simple array merging
   - C) Through processExercises and Map/Set operations
   - D) Manual category assignment

   Answer: C - New session data is processed using processExercises function and merged into the knowledge map using Map and Set operations.

4. **Category Lookup**
   Q: What makes the category lookup system flexible?

   - A) Dynamic category creation
   - B) Three-step fallback chain (direct, CATEGORIES, CATEGORY_MAPPING)
   - C) Automatic type conversion
   - D) Runtime validation

   Answer: B - The system tries three different ways to match categories: direct lookup, via CATEGORIES object, and via CATEGORY_MAPPING.

5. **Architecture Decision**
   Q: Why does the system store exercises in Sets within the knowledge Map?

   - A) For sorting purposes
   - B) To maintain exercise order
   - C) To prevent duplicate exercises and enable fast lookups
   - D) For easier database synchronization

   Answer: C - Sets automatically prevent duplicate exercises while maintaining O(1) lookup time for checking if an exercise is known.

---

## Navigation

- Previous: [Trainee Availability](./trainee-availability.md)
- Next: [Session Management](./session-management.md)
- [Back to Home](../../README.md)
