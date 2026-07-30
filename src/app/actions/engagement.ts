"use server";

import {
	addComment,
	deleteComment,
	getComments,
	getEngagement,
	recordView,
	setReaction,
	type CommentNode,
	type PostEngagement,
	type ReactionKind,
	EMPTY_ENGAGEMENT,
} from "@/db/queries";
import { getPostSlugs } from "@/lib/slugs";
import { getVisitorId } from "@/lib/visitor-server";

/**
 * Server actions are a public HTTP surface. Everything crossing this boundary
 * is treated as hostile: slugs are checked against the posts that actually
 * exist, and free text is length capped before it reaches the database.
 *
 * The visitor id is no longer a parameter. It comes from the request cookie, so
 * a caller cannot name someone else's id and act as them; previously anyone who
 * learned an id could delete that person's comments by passing it here.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_NAME = 60;
const MAX_BODY = 2000;

/** A thread may only hang off a post that actually exists. */
async function assertKnownSubject(slug: string) {
	const known = await getPostSlugs();
	if (!known.has(slug)) throw new Error("Unknown subject");
}

export async function trackView(slug: string): Promise<PostEngagement> {
	try {
		await assertKnownSubject(slug);
		const visitorId = await getVisitorId();
		await recordView(slug);
		return await getEngagement(slug, visitorId ?? undefined);
	} catch {
		// A dead database must never break reading the post.
		return EMPTY_ENGAGEMENT;
	}
}

export async function react(
	slug: string,
	reaction: ReactionKind
): Promise<PostEngagement> {
	await assertKnownSubject(slug);
	if (reaction !== "like" && reaction !== "dislike") {
		throw new Error("Invalid reaction");
	}

	const visitorId = await getVisitorId();
	// No cookie means middleware never ran, which in practice means a client
	// that blocks them. Reading still works; voting does not.
	if (!visitorId) throw new Error("No visitor session");

	return setReaction(slug, visitorId, reaction);
}

export async function loadComments(slug: string): Promise<CommentNode[]> {
	try {
		await assertKnownSubject(slug);
		const visitorId = await getVisitorId();
		return await getComments(slug, visitorId ?? undefined);
	} catch {
		return [];
	}
}

export type PostCommentResult =
	| { ok: true; comments: CommentNode[] }
	| { ok: false; error: string };

export async function postComment(input: {
	slug: string;
	parentId: string | null;
	authorName: string;
	body: string;
}): Promise<PostCommentResult> {
	try {
		await assertKnownSubject(input.slug);

		const visitorId = await getVisitorId();
		if (!visitorId) {
			return {
				ok: false,
				error: "Could not identify your session. Check that cookies are enabled.",
			};
		}

		const authorName = input.authorName.trim().slice(0, MAX_NAME);
		const body = input.body.trim().slice(0, MAX_BODY);

		if (authorName.length < 2) {
			return { ok: false, error: "Add a name, even a fake one." };
		}
		if (body.length < 2) {
			return { ok: false, error: "Comment is empty." };
		}
		if (input.parentId && !UUID.test(input.parentId)) {
			return { ok: false, error: "Invalid reply target." };
		}

		const comments = await addComment({
			slug: input.slug,
			parentId: input.parentId,
			authorName,
			body,
			visitorId,
		});

		return { ok: true, comments };
	} catch {
		return {
			ok: false,
			error: "Could not post that. The comment store may be offline.",
		};
	}
}

export async function removeComment(
	slug: string,
	id: string
): Promise<CommentNode[]> {
	await assertKnownSubject(slug);
	if (!UUID.test(id)) throw new Error("Invalid comment");

	const visitorId = await getVisitorId();
	if (!visitorId) throw new Error("No visitor session");

	// deleteComment scopes the update to this visitor's own rows, so the cookie
	// is what decides ownership rather than anything the caller sent.
	await deleteComment(id, visitorId);
	return getComments(slug, visitorId);
}
