'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setError('That secret did not match.');
        setBusy(false);
        return;
      }
      const raw = new URLSearchParams(window.location.search).get('next') ?? '/';
      // Allow only same-origin absolute paths; reject //host and /\host.
      const next = /^\/(?![/\\])/.test(raw) ? raw : '/';
      router.replace(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">English Interview Coach</h1>
      <p className="mt-2 text-sm text-neutral-400">Enter your access secret to continue.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <label htmlFor="secret" className="sr-only">
          Access secret
        </label>
        <input
          id="secret"
          type="password"
          autoComplete="current-password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Access secret"
          className="rounded-xl bg-neutral-900 px-4 py-3 outline-none ring-1 ring-neutral-800 focus:ring-blue-500"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy || !secret}
          className="rounded-2xl bg-blue-600 px-6 py-4 text-base font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
