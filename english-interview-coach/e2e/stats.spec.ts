import { test, expect } from '@playwright/test';

// No DATABASE_URL in the test env, so stats are zeroed — but the endpoint and
// its response shape are still verified end-to-end.
test('stats endpoint returns a streak shape', async ({ request }) => {
  const res = await request.get('/api/stats');
  expect(res.status()).toBe(200);
  const stats = await res.json();
  expect(stats).toMatchObject({ streak: 0, today: 0, total: 0 });
});
