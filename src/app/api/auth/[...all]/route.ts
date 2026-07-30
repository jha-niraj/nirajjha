import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

/**
 * POST is wrapped rather than re-exported: `disableSignUp` is set in the config,
 * but this is the one endpoint where a mistake creates an account on a panel
 * that has no other authorisation, so it is refused here as well.
 */
export async function POST(request: Request) {
	if (new URL(request.url).pathname.includes("/sign-up")) {
		return new Response("Signup is disabled.", { status: 403 });
	}
	return handler.POST(request);
}
