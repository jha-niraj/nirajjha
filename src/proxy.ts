import { NextResponse, type NextRequest } from "next/server";
import { VISITOR_COOKIE, VISITOR_MAX_AGE, isVisitorId } from "@/lib/visitor-id";

/**
 * Paths that require a session. Everything else on this site is public, so the
 * list is a prefix match on one branch rather than a matcher of exceptions.
 */
const PROTECTED = ["/admin"];

/** The sign-in screen itself, which obviously cannot require a session. */
const PUBLIC_WITHIN_PROTECTED = ["/admin"];

function isProtected(pathname: string) {
	if (PUBLIC_WITHIN_PROTECTED.includes(pathname)) return false;
	return PROTECTED.some(
		(base) => pathname === base || pathname.startsWith(`${base}/`)
	);
}

/**
 * Mints the anonymous visitor id.
 *
 * This is the file Next 16 calls `proxy`; it was `middleware` up to Next 15 and
 * the old name now warns on every build.
 *
 * It has to happen here rather than in a page, because a Server Component
 * cannot set a cookie during render, and because the post pages are statically
 * prerendered: their HTML is CDN-cached and shared by everyone, so nothing
 * per-visitor can be baked into it. Middleware runs per request even for a
 * static response, which makes it the one place that can attach a Set-Cookie
 * without giving up static generation.
 *
 * The id is not authentication. It is the same "discouragement, not identity"
 * trade the localStorage version made: it stops one person casually liking a
 * post fifty times, and nothing more. Anyone determined can clear it, and the
 * only thing they gain is another vote.
 */
export default function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Cheap gate only. It checks that a session cookie exists, which is enough
	// to bounce anonymous traffic before it reaches a server component, but it
	// is NOT the authorisation check: a cookie can be forged and middleware
	// cannot validate a session or read a role. `requireAdmin()` on the page is
	// the real gate, and it runs regardless of what happens here.
	if (isProtected(pathname)) {
		const hasSession =
			request.cookies.has("better-auth.session_token") ||
			request.cookies.has("__Secure-better-auth.session_token");

		if (!hasSession) {
			const url = request.nextUrl.clone();
			url.pathname = "/admin";
			url.search = "";
			return NextResponse.redirect(url);
		}
	}

	const existing = request.cookies.get(VISITOR_COOKIE)?.value;
	if (existing && isVisitorId(existing)) return NextResponse.next();

	const response = NextResponse.next();

	response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
		// Deliberately readable by JavaScript. The client needs it to show your
		// own reaction instantly, and there is nothing secret in a random id.
		httpOnly: false,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: VISITOR_MAX_AGE,
	});

	return response;
}

export const config = {
	// Static assets and images never need an identity, and running middleware
	// on them would be pure overhead on every page's worth of requests.
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|xml|txt|json)$).*)",
	],
};
