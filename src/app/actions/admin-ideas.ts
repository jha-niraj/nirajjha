"use server";

import { db } from "@/db";
import { projectIdeas } from "@/db/schema";
import { DATA } from "@/data/resume";
import { FROM_EMAIL, resend } from "@/lib/resend";
import { requireAdmin } from "@/lib/auth/guard";
import { SITE_URL } from "@/lib/site";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const STATUSES = [
	"pending",
	"published",
	"building",
	"shipped",
	"rejected",
] as const;

/**
 * Moves an idea through the board.
 *
 * `requireAdmin` runs here, not only on the page that rendered the button: a
 * server action is a public endpoint, so authorisation checked anywhere else is
 * not checked at all.
 *
 * The note is mandatory and public. It is shown on the idea itself, which is
 * what turns a rejection into something the next proposer learns from.
 */
export async function decideIdea(
	id: string,
	status: string,
	note: string,
	projectUrl?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	await requireAdmin();

	if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
		return { ok: false, error: "Unknown status." };
	}
	const reviewNote = note.trim().slice(0, 2000);
	if (reviewNote.length < 3) {
		return { ok: false, error: "Say what happened. It is shown publicly." };
	}
	const url = projectUrl?.trim() || null;
	if (url && !/^https?:\/\/\S+\.\S+/.test(url)) {
		return { ok: false, error: "Project link must start with http." };
	}
	if (!db) return { ok: false, error: "Database unavailable." };

	const [before] = await db
		.select()
		.from(projectIdeas)
		.where(eq(projectIdeas.id, id));
	if (!before) return { ok: false, error: "No such idea." };

	await db
		.update(projectIdeas)
		.set({
			status,
			reviewNote,
			projectUrl: url,
			decidedAt: new Date(),
			// Stamped once, the first time it goes public, so the board can
			// order by "when did this appear" rather than when it was submitted.
			publishedAt:
				before.publishedAt ??
				(status === "published" || status === "building" ? new Date() : null),
		})
		.where(eq(projectIdeas.id, id));

	// The one notification worth sending: their idea is being built.
	if (
		status === "building" &&
		before.status !== "building" &&
		resend &&
		FROM_EMAIL
	) {
		try {
			await resend.emails.send({
				from: FROM_EMAIL,
				to: before.proposerEmail,
				replyTo: DATA.contact.email,
				subject: `We are building "${before.title}"`,
				text: [
					`Hi ${before.proposerName},`,
					"",
					`You proposed "${before.title}" on ${SITE_URL}/ideas, and it is being built.`,
					"",
					reviewNote,
					url ? `\nProject: ${url}` : "",
					"",
					`The idea: ${SITE_URL}/ideas/${before.slug}`,
					"",
					"If you want to work on it yourself, apply here and mention this idea:",
					`${SITE_URL}/contribute`,
					"",
					DATA.shortName,
				].join("\n"),
			});
		} catch (error) {
			console.warn("[ideas] proposer notification failed:", error);
		}
	}

	revalidatePath("/admin/ideas");
	revalidatePath("/ideas");
	revalidatePath(`/ideas/${before.slug}`);
	return { ok: true };
}
