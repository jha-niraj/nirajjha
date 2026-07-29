"use client";

import {
	VISITOR_COOKIE,
	VISITOR_MAX_AGE,
	isVisitorId,
} from "@/lib/visitor-id";
import { useCallback, useSyncExternalStore } from "react";

/**
 * The browser half of visitor identity.
 *
 * The cookie set by middleware is the source of truth, because it is the only
 * copy the server can see. localStorage is kept purely as a migration path:
 * everyone who reacted or commented before this change has an id in
 * `nj.visitor`, and dropping it would orphan their likes and their ability to
 * delete their own comments. If that key exists and no cookie does, the old id
 * is promoted into the cookie so their history follows them.
 *
 * Values are read through `useSyncExternalStore` rather than "useState plus an
 * effect that sets it". Cookies and localStorage are external stores, which is
 * what the hook is for, and it avoids the extra render pass on mount that React
 * 19 now warns about.
 */

const LEGACY_KEY = "nj.visitor";

function readCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	for (const part of document.cookie.split("; ")) {
		const eq = part.indexOf("=");
		if (eq > 0 && part.slice(0, eq) === name) {
			return decodeURIComponent(part.slice(eq + 1));
		}
	}
	return null;
}

function writeCookie(name: string, value: string) {
	const secure = window.location.protocol === "https:" ? "; Secure" : "";
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${VISITOR_MAX_AGE}; SameSite=Lax${secure}`;
}

/** `getSnapshot` has to be referentially stable, so the result is memoised. */
let cachedVisitorId: string | null = null;

/**
 * An anonymous id used to keep one person from liking a post fifty times and to
 * let them delete their own comments.
 *
 * It is deliberately not identity. Anyone who clears their cookies becomes a
 * new visitor, which is the correct trade for a personal site with no login.
 */
export function readVisitorId(): string {
	if (typeof document === "undefined") return "";
	if (cachedVisitorId) return cachedVisitorId;

	const fromCookie = readCookie(VISITOR_COOKIE);
	if (isVisitorId(fromCookie)) {
		cachedVisitorId = fromCookie;
		return fromCookie;
	}

	// No usable cookie. Adopt the pre-cookie id if there is one, so an existing
	// reader keeps their reactions, otherwise mint a fresh id. Either way it is
	// written to the cookie so the server can see it from here on.
	let id: string | null = null;
	try {
		const legacy = window.localStorage.getItem(LEGACY_KEY);
		if (isVisitorId(legacy)) id = legacy;
	} catch {
		/* storage unavailable */
	}

	cachedVisitorId = id ?? crypto.randomUUID();
	writeCookie(VISITOR_COOKIE, cachedVisitorId);
	return cachedVisitorId;
}

function subscribeToStorage(onChange: () => void) {
	window.addEventListener("storage", onChange);
	return () => window.removeEventListener("storage", onChange);
}

const emptyString = () => "";

/**
 * Empty on the first render so server and client markup agree, then the real
 * id on the pass straight after hydration.
 */
export function useVisitorId() {
	return useSyncExternalStore(subscribeToStorage, readVisitorId, emptyString);
}

/* -------------------------------------------------------------------------- */
/* Remembered name                                                             */
/* -------------------------------------------------------------------------- */

const NAME_KEY = "nj.name";

/**
 * Typing in this tab does not fire a `storage` event, so this store keeps its
 * own listeners as well as watching for changes from other tabs.
 */
const nameListeners = new Set<() => void>();
let cachedName: string | null = null;

function readName(): string {
	if (typeof window === "undefined") return "";
	if (cachedName !== null) return cachedName;
	try {
		cachedName = window.localStorage.getItem(NAME_KEY) ?? "";
	} catch {
		cachedName = "";
	}
	return cachedName;
}

function subscribeToName(onChange: () => void) {
	nameListeners.add(onChange);
	window.addEventListener("storage", onChange);
	return () => {
		nameListeners.delete(onChange);
		window.removeEventListener("storage", onChange);
	};
}

/** Remembers the name someone typed so they don't retype it on every reply. */
export function useRememberedName(): [string, (v: string) => void] {
	const name = useSyncExternalStore(subscribeToName, readName, emptyString);

	const update = useCallback((value: string) => {
		cachedName = value;
		try {
			window.localStorage.setItem(NAME_KEY, value);
		} catch {
			/* storage unavailable */
		}
		for (const listener of nameListeners) listener();
	}, []);

	return [name, update];
}

/* -------------------------------------------------------------------------- */
/* Own-reaction cache                                                          */
/* -------------------------------------------------------------------------- */

const REACTION_KEY = "nj.reactions";

type ReactionMap = Record<string, "like" | "dislike">;

/**
 * Remembers which way this browser voted on each post.
 *
 * A post page is statically generated and its HTML is shared by every reader,
 * so it physically cannot carry "you liked this" for one person. Without a
 * local copy the button always paints neutral and only lights up once the
 * server round trip returns, which reads as a flicker on every page load.
 *
 * This is a display cache, never the source of truth. The server's answer
 * always replaces it, so clearing it or editing it changes nothing except what
 * is shown for the few milliseconds before the real tally arrives.
 */
function readReactions(): ReactionMap {
	if (typeof window === "undefined") return {};
	try {
		const raw = window.localStorage.getItem(REACTION_KEY);
		return raw ? (JSON.parse(raw) as ReactionMap) : {};
	} catch {
		return {};
	}
}

export function readCachedReaction(slug: string): "like" | "dislike" | null {
	return readReactions()[slug] ?? null;
}

export function writeCachedReaction(
	slug: string,
	reaction: "like" | "dislike" | null
) {
	try {
		const all = readReactions();
		if (reaction) all[slug] = reaction;
		else delete all[slug];
		window.localStorage.setItem(REACTION_KEY, JSON.stringify(all));
	} catch {
		/* storage unavailable */
	}
}

/* -------------------------------------------------------------------------- */

const subscribeNoop = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

/**
 * True once the client has taken over. Portals and anything else that touches
 * `document` need this so the first client render still matches the server's.
 */
export function useIsHydrated() {
	return useSyncExternalStore(subscribeNoop, alwaysTrue, alwaysFalse);
}
