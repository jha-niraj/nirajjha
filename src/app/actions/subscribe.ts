"use server";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { resolveSegmentId, resend } from "@/lib/resend";
import { eq } from "drizzle-orm";

export type SubscribeResult =
	| { ok: true; message: string }
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

	// Store first. If Resend is down, the address is still captured and can be
	// pushed to the audience later by re-running the sync.
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

	// Already in the Resend segment from a previous signup: nothing more to do,
	// and saying so is friendlier than pretending it was new.
	if (row?.syncedAt) {
		return { ok: true, message: "You are already on the list." };
	}

	const segmentId = await resolveSegmentId();

	if (!resend || !segmentId) {
		// Captured locally but not in the broadcast segment yet. Do not tell the
		// reader it failed, because from their side it did not.
		console.warn("[subscribe] stored locally, Resend segment unavailable");
		return { ok: true, message: "You are on the list." };
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
			return { ok: true, message: "You are on the list." };
		}

		await db
			.update(subscribers)
			.set({ resendContactId: data?.id, syncedAt: new Date() })
			.where(eq(subscribers.id, row!.id));
	} catch (error) {
		console.warn("[subscribe] resend threw:", error);
	}

	return { ok: true, message: "You are on the list. Thanks." };
}
