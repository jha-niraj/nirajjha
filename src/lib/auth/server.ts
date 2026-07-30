import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

/**
 * Auth for the admin panel, and nothing else.
 *
 * The public site has no accounts: comments key on an anonymous localStorage id
 * and nothing else on the site is gated. So this exists purely so one person
 * can reach /admin, which is why there is no signup route, no social provider
 * and no email verification. `pnpm admin:seed` is the only way an account comes
 * into existence.
 *
 * `db` is nullable because the whole site is designed to build without a
 * database. Better Auth is not, so this throws at call time rather than at
 * import time: importing it during a build that has no DATABASE_URL must not
 * take the build down.
 */
function client() {
	if (!db) {
		throw new Error(
			"DATABASE_URL is not set, so authentication is unavailable."
		);
	}
	return db;
}

export const auth = betterAuth({
	database: drizzleAdapter(client(), {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),

	// Long-lived, refreshed on use. This is a dashboard one person opens every
	// few days; a short session would just mean retyping a password constantly
	// for no security gain on a single-account surface.
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
	},

	emailAndPassword: {
		enabled: true,
		// No self-serve signup: the handler still exposes /sign-up/email, so
		// this is enforced again in the route handler. Belt and braces, because
		// an open signup on an admin panel is the whole ballgame.
		disableSignUp: true,
		requireEmailVerification: false,
		minPasswordLength: 10,
	},

	user: {
		additionalFields: {
			role: { type: "string", defaultValue: "admin", input: false },
		},
	},

	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
