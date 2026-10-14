import { describe, expect, test } from 'vitest';
import { loadConfig } from './config';

const validEnv = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  GEMINI_API_KEY: 'k',
  GEMINI_MODEL: 'model-a',
  WEB_ORIGIN: 'https://a.vercel.app',
};

describe('loadConfig', () => {
  test('missing GEMINI_MODEL fails fast', () => {
    expect(() =>
      loadConfig({ DATABASE_URL: 'x', GEMINI_API_KEY: 'k', WEB_ORIGIN: 'https://a.vercel.app' }),
    ).toThrow(/GEMINI_MODEL/);
  });

  test('error lists every missing variable', () => {
    expect(() => loadConfig({})).toThrow(
      /DATABASE_URL[\s\S]*GEMINI_API_KEY[\s\S]*GEMINI_MODEL[\s\S]*WEB_ORIGIN/,
    );
  });

  test('version comes from RENDER_GIT_COMMIT', () => {
    expect(loadConfig({ ...validEnv, RENDER_GIT_COMMIT: 'abc123' }).version).toBe('abc123');
    expect(loadConfig(validEnv).version).toBe('dev');
  });

  test('port defaults to 3000 and is coerced to a number', () => {
    expect(loadConfig(validEnv).port).toBe(3000);
    expect(loadConfig({ ...validEnv, PORT: '8080' }).port).toBe(8080);
  });

  test('fallback model is null when absent or empty', () => {
    expect(loadConfig(validEnv).geminiFallbackModel).toBeNull();
    expect(loadConfig({ ...validEnv, GEMINI_FALLBACK_MODEL: '' }).geminiFallbackModel).toBeNull();
    expect(loadConfig({ ...validEnv, GEMINI_FALLBACK_MODEL: 'model-b' }).geminiFallbackModel).toBe(
      'model-b',
    );
  });

  test('maps env to config fields', () => {
    expect(loadConfig(validEnv)).toEqual({
      databaseUrl: validEnv.DATABASE_URL,
      geminiApiKey: 'k',
      geminiModel: 'model-a',
      geminiFallbackModel: null,
      webOrigin: validEnv.WEB_ORIGIN,
      port: 3000,
      version: 'dev',
    });
  });
});
