"use server";

import { db } from "@/db";
import { contributorApplications } from "@/db/schema";
import { CHALLENGE_IDS, SOURCE_IDS, findChallenge, sourceLabel } from "@/data/challenges";
import { FROM_EMAIL, resend } from "@/lib/resend";
import { DATA } from "@/data/resume";
import { SITE_URL } from "@/lib/site";

export type ApplyResult =
	| { ok: true; message: string }
	| { ok: false; error: string; field?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** GitHub's own rule: alphanumeric with single hyphens, 39 characters max. */
const GITHUB = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const LIMITS = {
	name: 120,
	email: 254,
	github: 39,
	link: 500,
	answer: 2000,
	background: 200,
	sourceDetail: 200,
};

const MIN_ANSWER = 80;

export async function applyToContribute(input: {
	name: string;
	email: string;
	github: string;
	linkUrl?: string;
	background?: string;
	challengeId: string;
	pitch: string;
	source?: string;
	sourceDetail?: string;
}): Promise<ApplyResult> {
	const name = input.name.trim().slice(0, LIMITS.name);
	const email = input.email.trim().toLowerCase().slice(0, LIMITS.email);
	// Accept a pasted profile URL and reduce it to the handle, because plenty of
	// people will paste the URL however the field is labelled.
	const github = input.github
		.trim()
		.replace(/^https?:\/\/(www\.)?github\.com\//i, "")
		.replace(/\/+$/, "")
		.slice(0, LIMITS.github);
	const linkUrl = input.linkUrl?.trim().slice(0, LIMITS.link) || null;
	const background = input.background?.trim().slice(0, LIMITS.background) || null;
	const challengeId = input.challengeId?.trim() ?? "";
	const pitch = input.pitch.trim().slice(0, LIMITS.answer);
	const source = input.source?.trim() || null;
	const sourceDetail =
		input.sourceDetail?.trim().slice(0, LIMITS.sourceDetail) || null;

	if (name.length < 2) {
		return { ok: false, error: "Add your name.", field: "name" };
	}
	if (!EMAIL.test(email)) {
		return { ok: false, error: "That email does not look right.", field: "email" };
	}
	if (!GITHUB.test(github)) {
		return {
			ok: false,
			error: "That is not a valid GitHub username.",
			field: "github",
		};
	}
	if (linkUrl && !/^https?:\/\/\S+\.\S+/.test(linkUrl)) {
		return {
			ok: false,
			error: "The link needs to start with http:// or https://",
			field: "linkUrl",
		};
	}
	if (!CHALLENGE_IDS.includes(challengeId)) {
		return { ok: false, error: "Pick a question to answer.", field: "challengeId" };
	}
	if (pitch.length < MIN_ANSWER) {
		return {
			ok: false,
			error: `A few more sentences, at least ${MIN_ANSWER} characters. This is the only part I actually score.`,
			field: "pitch",
		};
	}
	if (source && !SOURCE_IDS.includes(source)) {
		return { ok: false, error: "Pick one of the options.", field: "source" };
	}

	if (!db) {
		return {
			ok: false,
			error: "Applications are closed right now. Try again later.",
		};
	}

	try {
		await db
			.insert(contributorApplications)
			.values({
				name,
				email,
				github,
				linkUrl,
				background,
				challengeId,
				pitch,
				source,
				sourceDetail,
			})
			// Re-applying updates the existing row rather than queueing a second
			// one. `status`, `reviewNote` and `decidedAt` are deliberately left
			// alone: somebody already declined must not be able to move
			// themselves back into the queue by resubmitting.
			.onConflictDoUpdate({
				target: contributorApplications.email,
				set: {
					name,
					github,
					linkUrl,
					background,
					challengeId,
					pitch,
					source,
					sourceDetail,
				},
			});
	} catch (error) {
		console.error("[apply] insert failed:", error);
		return { ok: false, error: "Could not save that. Try again in a moment." };
	}

	// Best effort. The row is already stored, so a Resend outage must never tell
	// the applicant their submission failed.
	if (resend && FROM_EMAIL) {
		const challenge = findChallenge(challengeId);
		try {
			await resend.emails.send({
				from: FROM_EMAIL,
				to: DATA.contact.email,
				replyTo: email,
				subject: `Contributor application: ${name} (@${github})`,
				text: [
					`${name} <${email}>`,
					background ? `Background: ${background}` : null,
					`Found via: ${sourceLabel(source)}${sourceDetail ? ` (${sourceDetail})` : ""}`,
					"",
					// Straight to the tab that shows what they have actually
					// shipped, which is worth more than the rest of the form.
					`Contributions: https://github.com/${github}?tab=overview`,
					`Repositories:  https://github.com/${github}?tab=repositories`,
					linkUrl ? `They sent:     ${linkUrl}` : null,
					"",
					`Question: ${challenge?.label ?? challengeId}`,
					"",
					pitch,
					"",
					"---",
					`Applications: ${SITE_URL}/contribute`,
				]
					.filter((line) => line !== null)
					.join("\n"),
			});
		} catch (error) {
			console.warn("[apply] notification email failed:", error);
		}
	}

	return {
		ok: true,
		message:
			"Got it. I read every one of these myself, so give me a few days. If it is a fit I will email you an invite to the workspace.",
	};
}
