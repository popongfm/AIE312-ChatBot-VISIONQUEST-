import { describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import type pg from 'pg';
import { createApp } from '../app';
import { deps } from '../../test/helpers/deps';

const noPool = {} as pg.Pool;

describe('health', () => {
  test('health returns version', async () => {
    const res = await request(createApp(deps(noPool, { version: 'abc123' }))).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, version: 'abc123' });
  });
});

describe('app plumbing', () => {
  const app = createApp(deps(noPool));

  test('CORS allows WEB_ORIGIN and localhost:5173 only', async () => {
    const allow = async (origin: string) =>
      (await request(app).get('/api/health').set('Origin', origin)).headers['access-control-allow-origin'];
    expect(await allow('https://vq.vercel.app')).toBe('https://vq.vercel.app');
    expect(await allow('http://localhost:5173')).toBe('http://localhost:5173');
    expect(await allow('https://evil.example')).toBeUndefined();
  });

  test('unknown path → 404 error JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(typeof res.body.error.message).toBe('string');
  });

  test('oversized body → 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(app).post('/api/anything').send({ text: 'x'.repeat(20_000) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  test('malformed JSON → 400 BAD_JSON', async () => {
    const res = await request(app).post('/api/anything').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_JSON');
  });

  test('unexpected error → 500 INTERNAL without leaking message', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deps(noPool);
    d.portfolio = { get: () => Promise.reject(new Error('secret db detail')) };
    const res = await request(createApp(d)).get('/api/portfolio');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL');
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
