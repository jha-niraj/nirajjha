"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Always the current origin. Hardcoding a URL breaks the moment the app runs on
 * a preview deployment or a different port, and the handler lives on this same
 * origin anyway.
 */
export const authClient = createAuthClient({
	baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

export const { signIn, signOut, useSession } = authClient;
