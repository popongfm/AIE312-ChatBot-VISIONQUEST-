import { z } from 'zod';

export interface Config {
  databaseUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  geminiFallbackModel: string | null;
  webOrigin: string;
  port: number;
  version: string;
}

const required = (name: string) =>
  z.string({ error: `${name} is required` }).min(1, `${name} is required`);

const envSchema = z.object({
  DATABASE_URL: required('DATABASE_URL'),
  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  GEMINI_MODEL: required('GEMINI_MODEL'),
  GEMINI_FALLBACK_MODEL: z.string().optional(),
  WEB_ORIGIN: required('WEB_ORIGIN'),
  PORT: z.coerce.number().int().positive().default(3000),
  RENDER_GIT_COMMIT: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`);
  }
  const e = parsed.data;
  return {
    databaseUrl: e.DATABASE_URL,
    geminiApiKey: e.GEMINI_API_KEY,
    geminiModel: e.GEMINI_MODEL,
    geminiFallbackModel: e.GEMINI_FALLBACK_MODEL || null,
    webOrigin: e.WEB_ORIGIN,
    port: e.PORT,
    version: e.RENDER_GIT_COMMIT ?? 'dev',
  };
}
