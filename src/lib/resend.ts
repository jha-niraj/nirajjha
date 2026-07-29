import "server-only";

import { Resend } from "resend";

/**
 * Resend client and segment resolution.
 *
 * Resend renamed Audiences to Segments. The SDK still exposes `audiences.*` for
 * managing them and `contacts.create` still takes `audienceId`, but
 * `broadcasts.create` now takes `segmentId`. They are the same id, so one value
 * drives both.
 *
 * Like the database, this is optional: without RESEND_API_KEY the subscribe
 * action reports that signup is unavailable rather than throwing, so the site
 * still builds and runs on a clone with no secrets.
 */
const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const isResendConfigured = Boolean(apiKey);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";

/** Name used when the segment has to be created on the fly. */
const SEGMENT_NAME = process.env.RESEND_SEGMENT_NAME ?? "nirajjha.in";

/**
 * Resolved once per server process. RESEND_SEGMENT_ID is the fast path;
 * RESEND_AUDIENCE_ID is accepted as the pre-rename spelling of the same thing.
 * If neither is set we look it up by name and create it if missing, so the
 * first subscribe on a fresh account works without anyone opening the
 * dashboard. `pnpm resend:setup` prints the id to pin in the env, which skips
 * two API calls per cold start.
 */
let cachedSegmentId: string | null =
	process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID || null;

export async function resolveSegmentId(): Promise<string | null> {
	if (cachedSegmentId) return cachedSegmentId;
	if (!resend) return null;

	const { data: list, error: listError } = await resend.audiences.list();
	if (listError) {
		console.warn("[resend] could not list segments:", listError);
		return null;
	}

	const existing = list?.data?.find((a) => a.name === SEGMENT_NAME);
	if (existing) {
		cachedSegmentId = existing.id;
		return cachedSegmentId;
	}

	const { data: created, error: createError } = await resend.audiences.create({
		name: SEGMENT_NAME,
	});
	if (createError || !created) {
		console.warn("[resend] could not create segment:", createError);
		return null;
	}

	cachedSegmentId = created.id;
	return cachedSegmentId;
}
