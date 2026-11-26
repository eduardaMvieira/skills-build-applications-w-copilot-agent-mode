import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (active) setItems(Array.isArray(data.activities) ? data.activities : []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? `Unable to load Activities: ${reason.message}` : 'Unable to load Activities');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      items={items}
      error={error}
      emptyText="No activities found."
      renderItem={(activity) => `${activity.type}: ${activity.minutes} minutes, ${activity.points} points`}
    />
  );
}
