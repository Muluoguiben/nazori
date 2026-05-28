// Apply db/schema.sql to the database in DATABASE_URL.
// Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Set it to your Neon connection string and retry.');
  process.exit(1);
}

const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);
for (const statement of statements) {
  await sql.query(statement);
  console.log('applied:', statement.split('\n')[0].slice(0, 60), '…');
}
console.log(`Done. Applied ${statements.length} statements.`);
