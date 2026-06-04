import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseEntries } from '@/lib/curriculum.mjs';
import { Cards } from './Cards';
import type { CardsWeek } from './Cards';

const WEEKS = [1, 2, 3, 4, 5, 6] as const;

export const dynamic = 'force-static';

export const metadata = {
  title: 'Cards · English Interview Coach',
  description: 'Tap-to-flip flashcards for the curriculum vocabulary.',
};

export default async function CardsPage() {
  const cwd = process.cwd();
  const weeks: CardsWeek[] = await Promise.all(
    WEEKS.map(async (week) => {
      const fp = path.join(cwd, 'curriculum', `week${week}.md`);
      const text = await readFile(fp, 'utf8').catch(() => '');
      return { week, entries: parseEntries(text) };
    }),
  );
  return <Cards weeks={weeks} />;
}
