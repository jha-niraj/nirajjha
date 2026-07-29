import { NextResponse, type NextRequest } from "next/server";
import { VISITOR_COOKIE, VISITOR_MAX_AGE, isVisitorId } from "@/lib/visitor-id";

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
