/**
 * Applies the SQL migrations in ./drizzle to the database in DATABASE_URL.
 *
 *   pnpm db:migrate
 *
 * Used instead of `drizzle-kit push` because push needs an interactive TTY and
 * diffs against live state; migrations are committed files, so what runs in
 * production is the same thing that ran locally.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
	console.error(
		"DATABASE_URL is not set. Copy .env.example to .env.local and paste your Neon connection string."
	);
	process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL));

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
