import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * The database is optional on purpose.
 *
 * `next build` prerenders the notes index and every post, and CI or a fresh
 * clone will not have DATABASE_URL. Rather than crash the build, `db` is null
 * when the URL is absent and every caller in db/queries.ts degrades to zeroed
 * counters. Set DATABASE_URL in .env.local and engagement lights up with no
 * code change.
 */
const url = process.env.DATABASE_URL;

export const db = url ? drizzle(neon(url), { schema }) : null;

export const isDbConfigured = Boolean(url);

export { schema };
