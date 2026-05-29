'use client';

import { useEffect, useState } from 'react';

type Stats = { streak: number; today: number; total: number };

export function StreakBadge() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    fetch(`/api/stats?tz=${encodeURIComponent(tz)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Stats | null) => {
        if (active) setStats(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!stats || stats.total === 0) return null;

  return (
    <p className="mt-3 text-center text-sm text-neutral-400">
      <span className="font-semibold text-blue-300">{stats.streak}</span> day streak
      {stats.today > 0 ? ` · ${stats.today} today` : ''}
    </p>
  );
}
