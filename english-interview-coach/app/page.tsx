import Link from "next/link";
import { InstallHint } from "./install-hint";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-between px-6 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <header className="w-full pt-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          English Interview Coach
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Explain one concept out loud. 90 seconds. Instant feedback.
        </p>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600/10 ring-1 ring-blue-500/30">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-12 w-12 text-blue-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" stroke="none" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </div>
        <p className="max-w-xs text-center text-sm text-neutral-500">
          Tap start, then speak as if explaining to a senior engineer.
        </p>
      </div>

      <div className="w-full">
        <Link
          href="/rep"
          className="block w-full rounded-2xl bg-blue-600 px-6 py-4 text-center text-base font-medium text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.99]"
        >
          Start session
        </Link>
        <InstallHint />
      </div>
    </main>
  );
}
