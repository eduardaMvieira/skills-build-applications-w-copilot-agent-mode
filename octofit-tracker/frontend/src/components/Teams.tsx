import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [items, setItems] = useState<Team[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (active) setItems(Array.isArray(data.teams) ? data.teams : []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? `Unable to load Teams: ${reason.message}` : 'Unable to load Teams');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      items={items}
      error={error}
      emptyText="No teams found."
      renderItem={(team) => `${team.name}: ${team.members.join(', ')}`}
    />
  );
}
