import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet as healthGet } from '../functions/api/health';
import { onRequestGet as donkiGet } from '../functions/api/nasa/donki';
import { onRequestGet as osdrGet } from '../functions/api/nasa/osdr';
import { onRequestGet as radlabGet } from '../functions/api/nasa/radlab';

test('Cloudflare /api/health returns JSON ok payload', async () => {
  const res = await healthGet();
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type') ?? '', /application\/json/i);
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.ok, true);
  assert.equal(body.runtime, 'cloudflare-pages');
});

test('Cloudflare NASA endpoints use context.env.NASA_API_KEY, support refresh=1, and fall back to archived JSON on failure', async () => {
  const originalFetch = globalThis.fetch;
  const calledUrls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    calledUrls.push(url);
    throw new Error('Simulated network failure');
  }) as typeof fetch;

  try {
    const donkiRes = await donkiGet({
      request: new Request('https://example.pages.dev/api/nasa/donki?refresh=1'),
      env: { NASA_API_KEY: 'TEST_CF_KEY_999' },
    });
    assert.equal(donkiRes.status, 200);
    assert.match(donkiRes.headers.get('Content-Type') ?? '', /application\/json/i);
    assert.equal(donkiRes.headers.get('Cache-Control'), 'no-store');
    const donkiJson = (await donkiRes.json()) as { sourceType: string; events: unknown[] };
    assert.equal(donkiJson.sourceType, 'archived');
    assert.ok(donkiJson.events.length > 0);
    assert.ok(calledUrls.some((u) => u.includes('api_key=TEST_CF_KEY_999')));

    const osdrRes = await osdrGet({
      request: new Request('https://example.pages.dev/api/nasa/osdr?q=arabidopsis&refresh=1'),
      env: {},
    });
    assert.equal(osdrRes.status, 200);
    const osdrJson = (await osdrRes.json()) as { sourceType: string; studies: unknown[] };
    assert.equal(osdrJson.sourceType, 'archived');
    assert.ok(osdrJson.studies.length > 0);

    const radRes = await radlabGet({
      request: new Request('https://example.pages.dev/api/nasa/radlab?refresh=1'),
      env: {},
    });
    assert.equal(radRes.status, 200);
    const radJson = (await radRes.json()) as { sourceType: string; measurements: unknown[] };
    assert.equal(radJson.sourceType, 'archived');
    assert.ok(radJson.measurements.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
