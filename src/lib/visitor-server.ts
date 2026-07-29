import "server-only";

import { cookies } from "next/headers";
import { VISITOR_COOKIE, isVisitorId } from "@/lib/visitor-id";

/**
 * The visitor id for the current request, straight from the cookie.
 *
 * This is what makes server actions stop trusting their caller. They used to
 * take a `visitorId` argument, so anyone could post as, or delete the comments
 * of, any id they could observe. The id now comes from the request itself and
 * the parameter is gone, so there is nothing to forge in the call.
 *
 * A client can still send a cookie it chose, exactly as it could before. The
 * point is not that the id is unforgeable, it is that it can no longer be set
 * per call while impersonating someone else's session.
 *
 * IMPORTANT: only call this from a Server Action or a Route Handler. Reading
 * cookies inside a page's render marks the whole route dynamic, which would
 * drop every post out of static generation and off the CDN.
 */
export async function getVisitorId(): Promise<string | null> {
	const store = await cookies();
	const value = store.get(VISITOR_COOKIE)?.value;
	return isVisitorId(value) ? value : null;
}
