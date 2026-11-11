import pg from 'pg';
import type { Pool } from 'pg';

/**
 * One shared pool of connections for the whole API.
 * SSL comes from the URL itself: Neon URLs end with ?sslmode=require, local docker URLs have none.
 */
export function createPool(databaseUrl: string): Pool {
  return new pg.Pool({ connectionString: databaseUrl, max: 5 });
}
