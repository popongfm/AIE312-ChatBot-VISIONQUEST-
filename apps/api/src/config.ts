export interface Config {
  port: number;
  databaseUrl: string;
  geminiApiKey: string | null;
  geminiModel: string | null;
  geminiFallbackModel: string | null;
  /** Folder with the built web app (index.html); the Docker image sets it. Null: API only. */
  webDir: string | null;
  /** Git commit of this deploy (Docker build arg); /api/health reports it so the deploy smoke test knows the new version is live. */
  version: string | null;
}

type Env = Record<string, string | undefined>;

const optional = (v: string | undefined) => v?.trim() || null;

/** Reads settings from environment variables. Throws early so a bad deploy fails at startup, not on the first request. */
export function loadConfig(env: Env = process.env): Config {
  const databaseUrl = optional(env.DATABASE_URL);
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const port = env.PORT?.trim() ? Number(env.PORT) : 3000;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${env.PORT}"`);
  }

  return {
    port,
    databaseUrl,
    geminiApiKey: optional(env.GEMINI_API_KEY),
    geminiModel: optional(env.GEMINI_MODEL),
    geminiFallbackModel: optional(env.GEMINI_FALLBACK_MODEL),
    webDir: optional(env.WEB_DIR),
    version: optional(env.GIT_SHA),
  };
}
