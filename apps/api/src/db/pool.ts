import pg from 'pg';
import type { Pool } from 'pg';

/**
 * One shared pool of connections for the whole API.
 * SSL comes from the URL itself: local docker URLs have none; the Supabase session-pooler URL ends with
 * ?uselibpqcompat=true&sslmode=require (encrypted; plain sslmode=require makes pg demand a verified certificate chain).
 */
export function createPool(databaseUrl: string): Pool {
  return new pg.Pool({ connectionString: databaseUrl, max: 5 });
}
