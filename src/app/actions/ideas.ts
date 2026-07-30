"use server";

import { db } from "@/db";
import { projectIdeas } from "@/db/schema";
import { toggleVote } from "@/db/ideas";
import { ART_KINDS } from "@/components/post-art";
import { DATA } from "@/data/resume";
import { FROM_EMAIL, resend } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";
import { getVisitorId } from "@/lib/visitor-server";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ProposeResult =
	| { ok: true; message: string }
	| { ok: false; error: string; field?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GITHUB = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

const LIMITS = {
	title: 160,
	problem: 1500,
	proposal: 1500,
	audience: 200,
	name: 120,
	email: 254,
};

const MIN_PROBLEM = 60;
const MIN_PROPOSAL = 60;
/** A person takes longer than this to fill the form. A bot does not. */
const MIN_SECONDS = 6;
const SCOPES = ["weekend", "weeks", "big"];

function slugify(title: string) {
	return title
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 90);
}

/** Stable art choice per slug, so a card never looks randomly assigned. */
function artFor(slug: string) {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
	}
	return ART_KINDS[hash % ART_KINDS.length];
}

export async function proposeIdea(input: {
	title: string;
	problem: string;
	proposal: string;
	audience?: string;
	stack?: string;
	scope: string;
	proposerName: string;
	proposerEmail: string;
	proposerGithub?: string;
	/** Honeypot. Real people never see it, so anything here is a bot. */
	website?: string;
	/** ms since the form mounted. */
	elapsed?: number;
}): Promise<ProposeResult> {
	if (input.website) {
		// Answer as though it worked. Telling a bot it was caught only teaches
		// whoever wrote it what to change.
		return { ok: true, message: "Thanks, I will read it." };
	}
	if (typeof input.elapsed === "number" && input.elapsed < MIN_SECONDS * 1000) {
		return { ok: false, error: "That was quick. Give it another look?" };
	}

	const title = input.title.trim().slice(0, LIMITS.title);
	const problem = input.problem.trim().slice(0, LIMITS.problem);
	const proposal = input.proposal.trim().slice(0, LIMITS.proposal);
	const audience = input.audience?.trim().slice(0, LIMITS.audience) || null;
	const proposerName = input.proposerName.trim().slice(0, LIMITS.name);
	const proposerEmail = input.proposerEmail
		.trim()
		.toLowerCase()
		.slice(0, LIMITS.email);
	const proposerGithub =
		input.proposerGithub
			?.trim()
			.replace(/^https?:\/\/(www\.)?github\.com\//i, "")
			.replace(/\/+$/, "") || null;
	const scope = SCOPES.includes(input.scope) ? input.scope : "weeks";
	const stack = (input.stack ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.slice(0, 10);

	if (title.length < 6) {
		return { ok: false, error: "Give it a title.", field: "title" };
	}
	if (problem.length < MIN_PROBLEM) {
		return {
			ok: false,
			error: `Describe the problem in a bit more detail, at least ${MIN_PROBLEM} characters.`,
			field: "problem",
		};
	}
	if (proposal.length < MIN_PROPOSAL) {
		return {
			ok: false,
			error: `What should exist? At least ${MIN_PROPOSAL} characters.`,
			field: "proposal",
		};
	}
	if (proposerName.length < 2) {
		return { ok: false, error: "Add your name.", field: "proposerName" };
	}
	if (!EMAIL.test(proposerEmail)) {
		return {
			ok: false,
			error: "That email does not look right.",
			field: "proposerEmail",
		};
	}
	if (proposerGithub && !GITHUB.test(proposerGithub)) {
		return {
			ok: false,
			error: "That is not a valid GitHub username.",
			field: "proposerGithub",
		};
	}

	if (!db) {
		return { ok: false, error: "Proposals are closed right now." };
	}

	// One per person per day. Cheap, and it is the rate that matters: the
	// failure mode is somebody pasting the same idea five times, not a flood.
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const [recent] = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(projectIdeas)
		.where(
			and(
				eq(projectIdeas.proposerEmail, proposerEmail),
				gte(projectIdeas.createdAt, since)
			)
		);

	if ((recent?.n ?? 0) >= 1) {
		return {
			ok: false,
			error: "You already proposed something today. Send the next one tomorrow.",
		};
	}

	// Slug collisions are resolved with a numeric suffix rather than failing,
	// because two people proposing "AI note taker" is likely, not exceptional.
	const base = slugify(title) || "idea";
	let slug = base;
	for (let i = 2; i < 40; i++) {
		const [clash] = await db
			.select({ id: projectIdeas.id })
			.from(projectIdeas)
			.where(eq(projectIdeas.slug, slug));
		if (!clash) break;
		slug = `${base}-${i}`;
	}

	try {
		await db.insert(projectIdeas).values({
			slug,
			title,
			problem,
			proposal,
			audience,
			stack,
			scope,
			proposerName,
			proposerEmail,
			proposerGithub,
			art: artFor(slug),
			// Invisible until reviewed. Nothing a stranger submits reaches the
			// board on its own.
			status: "pending",
		});
	} catch (error) {
		console.error("[ideas] insert failed:", error);
		return { ok: false, error: "Could not save that. Try again in a moment." };
	}

	if (resend && FROM_EMAIL) {
		try {
			await resend.emails.send({
				from: FROM_EMAIL,
				to: DATA.contact.email,
				replyTo: proposerEmail,
				subject: `Idea: ${title}`,
				text: [
					`${proposerName} <${proposerEmail}>`,
					proposerGithub ? `GitHub: https://github.com/${proposerGithub}` : null,
					`Scope: ${scope}`,
					stack.length ? `Stack: ${stack.join(", ")}` : null,
					audience ? `For: ${audience}` : null,
					"",
					`PROBLEM\n${problem}`,
					"",
					`PROPOSAL\n${proposal}`,
					"",
					`Review: ${SITE_URL}/admin/ideas`,
				]
					.filter((line) => line !== null)
					.join("\n"),
			});
		} catch (error) {
			console.warn("[ideas] notification failed:", error);
		}
	}

	return {
		ok: true,
		message:
			"Got it. I read every one of these. If it goes on the board you will see it appear, and if I build it you will get an email.",
	};
}

export type VoteResult =
	| { ok: true; votes: number; voted: boolean }
	| { ok: false; error: string };

export async function voteForIdea(slug: string): Promise<VoteResult> {
	// From the cookie, never from an argument: a visitor id passed by the
	// caller is a visitor id anyone can pick.
	const visitorId = await getVisitorId();
	if (!visitorId) {
		return { ok: false, error: "Enable cookies to vote." };
	}

	try {
		const result = await toggleVote(slug, visitorId);
		revalidatePath("/ideas");
		revalidatePath(`/ideas/${slug}`);
		return { ok: true, ...result };
	} catch {
		return { ok: false, error: "Could not record that vote." };
	}
}
