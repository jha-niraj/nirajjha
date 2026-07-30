import "server-only";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Every admin page calls this first.
 *
 * Not middleware. Middleware can only see the cookie, not whether the session
 * behind it is still valid or whether the user is actually an admin, so it
 * would be a redirect rule masquerading as authorisation. This hits the session
 * on the server and is the real gate.
 */
export async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) redirect("/admin");
	if ((session.user as { role?: string }).role !== "admin") {
		redirect("/admin?denied=1");
	}

	return session;
}

/** For the login page: send an already-signed-in visitor straight through. */
export async function getOptionalSession() {
	try {
		return await auth.api.getSession({ headers: await headers() });
	} catch {
		return null;
	}
}
