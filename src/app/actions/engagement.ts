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

/**
 * Server actions are a public HTTP surface. Everything crossing this boundary
 * is treated as hostile: slugs are checked against the posts that actually
 * exist, visitor ids must look like the UUIDs we mint, and free text is length
 * capped before it reaches the database.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_NAME = 60;
const MAX_BODY = 2000;

async function assertKnownSlug(slug: string) {
	const slugs = await getPostSlugs();
	if (!slugs.has(slug)) throw new Error("Unknown post");
}

function assertVisitor(visitorId: string) {
	if (!UUID.test(visitorId)) throw new Error("Invalid visitor");
}

export async function trackView(
	slug: string,
	visitorId: string
): Promise<PostEngagement> {
	try {
		await assertKnownSlug(slug);
		assertVisitor(visitorId);
		await recordView(slug);
		return await getEngagement(slug, visitorId);
	} catch {
		// A dead database must never break reading the post.
		return EMPTY_ENGAGEMENT;
	}
}

export async function react(
	slug: string,
	visitorId: string,
	reaction: ReactionKind
): Promise<PostEngagement> {
	await assertKnownSlug(slug);
	assertVisitor(visitorId);
	if (reaction !== "like" && reaction !== "dislike") {
		throw new Error("Invalid reaction");
	}
	return setReaction(slug, visitorId, reaction);
}

export async function loadComments(
	slug: string,
	visitorId: string
): Promise<CommentNode[]> {
	try {
		await assertKnownSlug(slug);
		return await getComments(slug, UUID.test(visitorId) ? visitorId : undefined);
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
	visitorId: string;
}): Promise<PostCommentResult> {
	try {
		await assertKnownSlug(input.slug);
		assertVisitor(input.visitorId);

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
			visitorId: input.visitorId,
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
	id: string,
	visitorId: string
): Promise<CommentNode[]> {
	await assertKnownSlug(slug);
	assertVisitor(visitorId);
	if (!UUID.test(id)) throw new Error("Invalid comment");
	// deleteComment scopes the update to this visitor's own rows, so a stolen
	// id cannot delete somebody else's comment.
	await deleteComment(id, visitorId);
	return getComments(slug, visitorId);
}
