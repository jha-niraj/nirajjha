"use client";

import { useEffect, useState } from "react";

const KEY = "nj.visitor";

/**
 * An anonymous, browser-local id used to keep one person from liking a post
 * fifty times and to let them delete their own comments.
 *
 * It is deliberately not identity. Anyone who clears storage becomes a new
 * visitor, which is the correct trade for a personal site with no login.
 */
export function readVisitorId(): string {
	if (typeof window === "undefined") return "";
	try {
		const existing = window.localStorage.getItem(KEY);
		if (existing) return existing;
		const fresh = crypto.randomUUID();
		window.localStorage.setItem(KEY, fresh);
		return fresh;
	} catch {
		// Private mode or storage disabled. Fall back to a per-session id so
		// reactions still work for the length of the visit.
		return crypto.randomUUID();
	}
}

/** Empty on the first render so server and client markup agree. */
export function useVisitorId() {
	const [id, setId] = useState("");
	useEffect(() => setId(readVisitorId()), []);
	return id;
}

const NAME_KEY = "nj.name";

/** Remembers the name someone typed so they don't retype it on every reply. */
export function useRememberedName(): [string, (v: string) => void] {
	const [name, setName] = useState("");

	useEffect(() => {
		try {
			setName(window.localStorage.getItem(NAME_KEY) ?? "");
		} catch {
			/* storage unavailable */
		}
	}, []);

	const update = (value: string) => {
		setName(value);
		try {
			window.localStorage.setItem(NAME_KEY, value);
		} catch {
			/* storage unavailable */
		}
	};

	return [name, update];
}
