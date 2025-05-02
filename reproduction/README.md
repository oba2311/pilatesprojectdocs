# React State Race Condition Reproduction

This is a minimal reproduction of a race condition in React state management, similar to the one encountered in the Pilates Studio app.

## The Bug

The bug demonstrates a common race condition that occurs when:

1. A parent component manages state and passes it to a child
2. The child component maintains local state that should stay in sync with parent
3. Both components perform async operations that update the same state
4. The child component uses useEffect to react to prop changes

The race condition manifests as:

- State getting out of sync between parent and child
- Updates being lost or overwritten
- Inconsistent UI state

## Running the Reproduction

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Open your browser to http://localhost:3000

## How to Observe the Bug

1. Click either "User 1" or "User 2" button
2. Watch the Debug Info panel and the Child Component's state
3. Notice how the local state and props can get out of sync
4. Try clicking between users quickly to exacerbate the race condition

## Key Files

- `src/App.tsx`: Parent component that manages user selection and preferences
- `src/components/ChildComponent.tsx`: Child component that demonstrates the race condition
- Console logs are added throughout to help understand the sequence of events

## The Fix

The fix involves:

1. Properly handling the dependency array in useEffect
2. Ensuring state updates happen in the correct order
3. Using proper cleanup in effects
4. Deep copying objects to prevent reference issues

See the comments in the code for more details on the specific issues and how to fix them.
