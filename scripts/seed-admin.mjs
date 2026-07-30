/**
 * Creates (or resets) the single admin account.
 *
 *   pnpm admin:seed
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment. They are
 * deliberately not defaulted in this file: a password committed to a repository
 * is a password that is already public, and this is the only credential
 * guarding the dashboard.
 *
 * Writes the rows directly rather than going through the auth instance. That
 * config imports through `@/` path aliases, which Node cannot resolve outside
 * Next's bundler, so the hash is produced with Better Auth's own `hashPassword`
 * and inserted straight into the tables its adapter reads. It is the same
 * function that verifies the password at sign-in, so the two formats cannot
 * drift apart.
 *
 * Safe to re-run. Re-running with a new password resets it, which is the
 * password-change mechanism, since there is no UI for one.
 */
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";

config({ path: ".env.local" });
config({ path: ".env" });

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";

for (const [key, value] of Object.entries({
	DATABASE_URL: process.env.DATABASE_URL,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
	ADMIN_EMAIL: email,
	ADMIN_PASSWORD: password,
})) {
	if (!value) {
		console.error(`${key} is not set. See .env.example.`);
		process.exit(1);
	}
}

if (password.length < 10) {
	console.error("ADMIN_PASSWORD must be at least 10 characters.");
	process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const now = new Date();
const hash = await hashPassword(password);

const existing = await sql`select id from "user" where email = ${email}`;
const userId = existing[0]?.id ?? randomUUID();

if (existing.length > 0) {
	await sql`delete from account where user_id = ${userId}`;
	await sql`
		update "user"
		set name = ${name}, role = 'admin', email_verified = true, updated_at = ${now}
		where id = ${userId}`;
	console.log(`Reset the password for ${email}.`);
} else {
	await sql`
		insert into "user" (id, name, email, email_verified, role, created_at, updated_at)
		values (${userId}, ${name}, ${email}, true, 'admin', ${now}, ${now})`;
	console.log(`Created ${email}.`);
}

await sql`
	insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
	values (${randomUUID()}, ${userId}, 'credential', ${userId}, ${hash}, ${now}, ${now})`;

console.log("Sign in at /admin");
