import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (active) setItems(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? `Unable to load Leaderboard: ${reason.message}` : 'Unable to load Leaderboard');
      });
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      items={items}
      error={error}
      emptyText="No leaderboard scores found."
      renderItem={(entry) => `#${entry.rank} ${entry.teamName}: ${entry.totalPoints} points`}
    />
  );
}
