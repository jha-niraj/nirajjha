/**
 * The one definition of what a visitor id is, shared by middleware, server
 * actions and the browser.
 *
 * Deliberately free of both `server-only` and `"use client"`: middleware runs
 * on the edge, the actions run on the server, and the components run in the
 * browser, and all three have to agree on the cookie name and the shape of a
 * valid id. Anything that would pin it to one environment belongs in
 * `visitor-server.ts` or `visitor.ts` instead.
 */

export const VISITOR_COOKIE = "nj_vid";

/** One year. Long enough that a regular reader keeps the same identity. */
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ids are validated everywhere they cross a boundary. The cookie is writable by
 * the client, so its value is untrusted input the same as anything else in a
 * request, and it reaches a `varchar(64)` column.
 */
export function isVisitorId(value: string | undefined | null): value is string {
	return typeof value === "string" && UUID.test(value);
}
