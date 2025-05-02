import { useEffect, useState } from "react";

// Simulate another async API call
const fetchAdditionalData = async (userId: string) => {
	await new Promise((resolve) => setTimeout(resolve, 500));
	return {
		additionalField: `value-${userId}`,
	};
};

interface ChildComponentProps {
	userId: string;
	preferences: Record<string, any>;
	onUpdatePreferences: (newPrefs: Record<string, any>) => void;
}

function ChildComponent({
	userId,
	preferences,
	onUpdatePreferences,
}: ChildComponentProps) {
	const [localPreferences, setLocalPreferences] = useState(preferences);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Check if states are out of sync
	const isOutOfSync =
		JSON.stringify(localPreferences) !== JSON.stringify(preferences);

	useEffect(() => {
		console.log("🔄 Child: useEffect triggered", {
			userId,
			currentLocalPrefs: localPreferences,
			incomingPrefs: preferences,
		});

		let isMounted = true;

		const loadData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const additionalData = await fetchAdditionalData(userId);
				console.log("📥 Child: Fetched additional data", additionalData);

				if (!isMounted) return;

				const mergedData = {
					...preferences,
					...additionalData,
				};

				console.log("🔄 Child: Merging data", {
					preferences,
					additionalData,
					mergedData,
				});

				setLocalPreferences(mergedData);
				onUpdatePreferences(mergedData);
			} catch (err) {
				console.error("❌ Child: Error loading data", err);
				if (!isMounted) return;
				setError("Failed to load additional data");
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void loadData();

		return () => {
			isMounted = false;
		};
	}, [userId]); // Note: we intentionally omit preferences to demonstrate the issue

	return (
		<div className="card">
			<h3>Child Component</h3>
			{isLoading && <div>Loading...</div>}
			{error && <div className="error">{error}</div>}

			<div className="state-diff">
				<div
					className={`state-container state-parent ${
						isOutOfSync ? "state-out-of-sync" : ""
					}`}
				>
					<h4>Parent State (props)</h4>
					<pre>{JSON.stringify(preferences, null, 2)}</pre>
				</div>

				<div
					className={`state-container state-local ${
						isOutOfSync ? "state-out-of-sync" : ""
					}`}
				>
					<h4>Local State</h4>
					<pre>{JSON.stringify(localPreferences, null, 2)}</pre>
				</div>
			</div>

			{isOutOfSync && (
				<div className="error">
					<strong>⚠️ State Out of Sync!</strong>
					<p>
						The local state and props are different due to the race condition.
						This happens because:
					</p>
					<ol>
						<li>The effect runs when userId changes</li>
						<li>It merges potentially stale props with new data</li>
						<li>The parent's updates might be overwritten</li>
					</ol>
				</div>
			)}
		</div>
	);
}

export default ChildComponent;
