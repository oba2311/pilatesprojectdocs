# Trainee Availability System

The trainee availability system manages which trainees can be selected for sessions in specific time slots. This document explains the key data structures and workflows that handle trainee availability.

## Key Data Structures

### dailyHourToSessions

```typescript
dailyHourToSessions = {
    "05/01/2024": {                    // Date
        "10:00": [                     // Hour
            { id: 1, traineeId: "A1", ...},  // Saved sessions
            { id: 2, traineeId: "B1", ...}
        ],
        "11:00": [ ... ]
    }
}
```

This is the source of truth for all saved sessions, organized by date and hour.

### getTraineesForHour Function

```typescript
getTraineesForHour("10:00") {
    1. Gets existing sessions from dailyHourToSessions["05/01/2024"]["10:00"]
    2. Gets new sessions from newSessionsSummary
    3. Combines and returns all trainees for that hour
    Returns: [Alice, Bob]  // All trainees in that hour slot
}
```

This function combines both saved and new (unsaved) sessions to determine which trainees are scheduled for a specific hour.

### sameHourPeople

```typescript
sameHourPeople = [
    // Result of getTraineesForHour()
    // Used by TraineeDropdown to filter out unavailable trainees
    {id: "A1", firstName: "Alice", ...},
    {id: "B1", firstName: "Bob", ...}
]
```

This array contains all trainees who are currently scheduled for a specific hour, used to determine who should be unavailable in the dropdown.

## Workflow Example

### Starting State (10:00 slot)

```typescript
dailyHourToSessions["05/01/2024"]["10:00"] = [
    {id: 1, traineeId: "A1", trainee: Alice},    // Saved session
    {id: 2, traineeId: "B1", trainee: Bob}       // Saved session
]

newSessionsSummary = [
    {tempId: "temp1", traineeId: "C1", trainee: Charlie}  // New unsaved session
]

getTraineesForHour("10:00") => [Alice, Bob, Charlie]
sameHourPeople = [Alice, Bob, Charlie]
availableTrainees = [David, Eve]  // Filtered by TraineeDropdown
```

### When Removing a Session

When Alice's session is removed:

1. `removeSession(session1)` is called
2. `dailyHourToSessions` is updated to remove Alice's session
3. `getTraineesForHour("10:00")` recalculates, now returning `[Bob, Charlie]`
4. `sameHourPeople` is updated to `[Bob, Charlie]`
5. TraineeDropdown recalculates `availableTrainees`, now showing `[Alice, David, Eve]`

## Key Points

- `dailyHourToSessions` maintains the source of truth for saved sessions
- `getTraineesForHour` combines both saved and new sessions
- `sameHourPeople` is used by TraineeDropdown to filter available trainees
- Removing a session triggers a chain reaction that makes the trainee available again
- The system automatically updates all dropdowns when changes occur

---

## Navigation

- Previous: [Refactoring Journey](../architecture/refactoring-journey.md)
- Next: [Data Structures](../technical/data-structures.md)
- [Back to Home](../../README.md)
