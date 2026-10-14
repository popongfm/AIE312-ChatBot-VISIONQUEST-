import pg from 'pg';

/** TLS only when the URL asks for it (Neon uses sslmode=require); local Postgres has none. */
export function sslConfigFor(url: string): false | { rejectUnauthorized: true } {
  try {
    return new URL(url).searchParams.get('sslmode') === 'require'
      ? { rejectUnauthorized: true }
      : false;
  } catch {
    return false;
  }
}

export function createPool(url: string): pg.Pool {
  // Strip sslmode so pg-connection-string does not override the explicit ssl option.
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  return new pg.Pool({ connectionString: u.toString(), ssl: sslConfigFor(url) });
}

/** Migrations use Neon's direct URL: PgBouncer (the pooled URL) drops session state. */
export function migrationUrlFrom(env: NodeJS.ProcessEnv): string | undefined {
  return env.DATABASE_URL_UNPOOLED || env.DATABASE_URL || undefined;
}
