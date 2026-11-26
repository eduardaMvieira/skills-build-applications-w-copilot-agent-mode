import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason: string;
};

export default function Workouts() {
  const [items, setItems] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((data) => {
        if (active) setItems(Array.isArray(data.suggestions) ? data.suggestions : []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? `Unable to load Workout suggestions: ${reason.message}` : 'Unable to load Workout suggestions');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      items={items}
      error={error}
      emptyText="No workout suggestions found."
      renderItem={(suggestion) => `${suggestion.title}: ${suggestion.reason}`}
    />
  );
}
