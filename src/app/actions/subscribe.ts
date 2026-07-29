"use server";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { resolveSegmentId, resend } from "@/lib/resend";
import { eq } from "drizzle-orm";

/**
 * What happened to the address, so the UI can say something true rather than a
 * single catch-all "thanks".
 *
 * - `new`         first time we have seen it
 * - `already`     on the list, still subscribed, nothing to do
 * - `resubscribed` had unsubscribed before and is now back on
 */
export type SubscribeStatus = "new" | "already" | "resubscribed";

export type SubscribeResult =
	| { ok: true; status: SubscribeStatus; message: string }
	| { ok: false; error: string };

/**
 * Deliberately strict but not clever. Long regexes for RFC 5322 reject real
 * addresses; the only reliable validation is sending mail, which Resend does.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MAX_EMAIL = 254;
const MAX_SOURCE = 120;

export async function subscribe(
	rawEmail: string,
	source?: string
): Promise<SubscribeResult> {
	const email = rawEmail.trim().toLowerCase().slice(0, MAX_EMAIL);

	if (!EMAIL.test(email)) {
		return { ok: false, error: "That does not look like an email address." };
	}

	if (!db) {
		return {
			ok: false,
			error: "Signup is not available right now. Try again later.",
		};
	}

	// Look first, so we can tell "already on the list" from "welcome". An upsert
	// alone cannot distinguish the two: ON CONFLICT DO UPDATE returns a row
	// either way, and there is nothing in it that says whether it was inserted.
	let existing;
	try {
		[existing] = await db
			.select({
				id: subscribers.id,
				syncedAt: subscribers.syncedAt,
				unsubscribed: subscribers.unsubscribed,
			})
			.from(subscribers)
			.where(eq(subscribers.email, email));
	} catch (error) {
		console.error("[subscribe] lookup failed:", error);
		return { ok: false, error: "Could not save that. Try again in a moment." };
	}

	// On the list and never left. Say so and stop: no write, no Resend call.
	if (existing && !existing.unsubscribed) {
		return {
			ok: true,
			status: "already",
			message: "You are already on the list.",
		};
	}

	const status: SubscribeStatus = existing ? "resubscribed" : "new";

	// Store first. If Resend is down, the address is still captured and can be
	// pushed to the segment later by re-running the sync.
	let row;
	try {
		[row] = await db
			.insert(subscribers)
			.values({ email, source: source?.slice(0, MAX_SOURCE) })
			.onConflictDoUpdate({
				// Re-subscribing after unsubscribing should just work.
				target: subscribers.email,
				set: { unsubscribed: false },
			})
			.returning({
				id: subscribers.id,
				syncedAt: subscribers.syncedAt,
			});
	} catch (error) {
		console.error("[subscribe] insert failed:", error);
		return { ok: false, error: "Could not save that. Try again in a moment." };
	}

	const message =
		status === "resubscribed"
			? "Welcome back. You are on the list again."
			: "You are on the list. Thanks.";

	// Already in the Resend segment from a previous signup, so there is nothing
	// left to push. The local row has just been un-unsubscribed above.
	if (row?.syncedAt) {
		return { ok: true, status, message };
	}

	const segmentId = await resolveSegmentId();

	if (!resend || !segmentId) {
		// Captured locally but not in the broadcast segment yet. Do not tell the
		// reader it failed, because from their side it did not.
		console.warn("[subscribe] stored locally, Resend segment unavailable");
		return { ok: true, status, message };
	}

	try {
		// contacts.create still uses the pre-rename `audienceId` key; it is the
		// same id that broadcasts.create takes as `segmentId`.
		const { data, error } = await resend.contacts.create({
			audienceId: segmentId,
			email,
			unsubscribed: false,
		});

		if (error) {
			console.warn("[subscribe] resend contact create failed:", error);
			return { ok: true, status, message };
		}

		await db
			.update(subscribers)
			.set({ resendContactId: data?.id, syncedAt: new Date() })
			.where(eq(subscribers.id, row!.id));
	} catch (error) {
		console.warn("[subscribe] resend threw:", error);
	}

	return { ok: true, status, message };
}
