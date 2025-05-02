# Simplified Session Card Refactoring Plan

## Step 1: Move API Calls to Container

First, let's move all trainee data fetching to the container level:

```typescript
// src/containers/SessionsContainer.tsx
const SessionsContainer = () => {
	const [sessions, setSessions] = useState<SessionForm[]>([]);
	const [unsavedSessions, setUnsavedSessions] = useState<Set<string>>(
		new Set()
	);

	const handleTraineeSelect = async (sessionId: string, traineeId: string) => {
		try {
			// Fetch trainee data at container level
			const traineeData = await traineesService.get(traineeId);

			// Update session
			setSessions((prev) =>
				prev.map((session) =>
					session.id === sessionId
						? { ...session, traineeId, ...traineeData.nextSession }
						: session
				)
			);

			// Mark as unsaved
			setUnsavedSessions((prev) => new Set(prev).add(sessionId));
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to select trainee",
			});
		}
	};

	const handleSave = async (sessionId: string) => {
		try {
			const session = sessions.find((s) => s.id === sessionId);
			if (!session) return;

			await sessionsService.save(session);

			// Clear unsaved state
			setUnsavedSessions((prev) => {
				const next = new Set(prev);
				next.delete(sessionId);
				return next;
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to save session",
			});
		}
	};

	return sessions.map((session) => (
		<SessionCard
			key={session.id}
			session={session}
			hasUnsavedChanges={unsavedSessions.has(session.id)}
			onTraineeSelect={(traineeId) =>
				handleTraineeSelect(session.id, traineeId)
			}
			onSave={() => handleSave(session.id)}
		/>
	));
};
```

## Step 2: Simplify Session Card

Convert SessionCard to a simple display component:

```typescript
// src/components/SessionCard.tsx
interface SessionCardProps {
	session: SessionForm;
	hasUnsavedChanges: boolean;
	onTraineeSelect: (traineeId: string) => void;
	onSave: () => void;
}

const SessionCard = ({
	session,
	hasUnsavedChanges,
	onTraineeSelect,
	onSave,
}: SessionCardProps) => (
	<Card
		className={cn(
			"shadow-xl border-4",
			hasUnsavedChanges ? "border-yellow-400" : "border-slate-600"
		)}
	>
		<CardHeader>
			<TraineeDropdown trainee={session.trainee} onSelect={onTraineeSelect} />
			{hasUnsavedChanges && (
				<Button onClick={onSave}>
					<Save className="h-4 w-4" />
				</Button>
			)}
		</CardHeader>
		<CardContent>{/* Rest of the card UI remains the same */}</CardContent>
	</Card>
);
```

## Testing

Add a simple test to verify the core functionality:

```typescript
// src/__tests__/session-card.test.ts
it("handles trainee selection correctly", async () => {
	const onTraineeSelect = vi.fn();
	const { getByRole } = render(
		<SessionCard
			session={mockSession}
			hasUnsavedChanges={false}
			onTraineeSelect={onTraineeSelect}
			onSave={() => {}}
		/>
	);

	await userEvent.click(getByRole("button", { name: /select trainee/i }));
	expect(onTraineeSelect).toHaveBeenCalled();
});
```

## Migration Steps

1. Update one session type at a time (e.g., start with empty sessions)
2. Verify everything works
3. Move on to the next session type
4. Remove old code once all types are migrated

That's it! This simplified approach:

- Moves data fetching to container
- Makes SessionCard a display component
- Uses simple state for tracking unsaved changes
- Can be implemented incrementally
