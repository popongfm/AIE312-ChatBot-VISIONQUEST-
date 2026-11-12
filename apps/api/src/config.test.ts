import { expect, test } from 'vitest';
import { loadConfig } from './config';

const base = { DATABASE_URL: 'postgres://u:p@localhost:5432/db' };

test('defaults: port 3000, gemini settings null', () =>
  expect(loadConfig(base)).toEqual({
    port: 3000,
    databaseUrl: base.DATABASE_URL,
    geminiApiKey: null,
    geminiModel: null,
    geminiFallbackModel: null,
    webDir: null,
    version: null,
  }));
test('reads PORT and gemini settings, trimming spaces', () =>
  expect(loadConfig({ ...base, PORT: '8080', GEMINI_API_KEY: ' k ', GEMINI_MODEL: 'm', GEMINI_FALLBACK_MODEL: '' }))
    .toMatchObject({ port: 8080, geminiApiKey: 'k', geminiModel: 'm', geminiFallbackModel: null }));
test('missing or blank DATABASE_URL throws', () => {
  expect(() => loadConfig({})).toThrow('DATABASE_URL');
  expect(() => loadConfig({ DATABASE_URL: '   ' })).toThrow('DATABASE_URL');
});
test('invalid PORT throws', () => {
  for (const PORT of ['abc', '0', '70000', '3.5']) expect(() => loadConfig({ ...base, PORT })).toThrow('PORT');
});
test('reads WEB_DIR (built web app to serve) and GIT_SHA (shown by /api/health)', () =>
  expect(loadConfig({ ...base, WEB_DIR: ' /app/apps/web/dist ', GIT_SHA: 'abc123' }))
    .toMatchObject({ webDir: '/app/apps/web/dist', version: 'abc123' }));
