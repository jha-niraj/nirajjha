import "server-only";

import path from "node:path";

/**
 * Where the MDX lives, resolved with a literal Turbopack can see.
 *
 * The directory name has to appear as a string literal inside `path.join`.
 * Passing an imported constant instead makes the join opaque to the bundler's
 * static analysis, so it cannot tell which subtree is being read and traces the
 * entire project into the server bundle. That is what produced the
 * "Encountered unexpected file in NFT list" warning: nothing was broken, but
 * every file in the repo was being considered a dependency of the routes that
 * read a post.
 *
 * Keeping the literal in exactly one place means the scoping cannot be lost
 * again by a caller that reaches for the constant out of habit.
 */
export const CONTENT_ROOT = path.join(process.cwd(), "content");

/** Absolute path to one post's source file. */
export function postFilePath(slug: string): string {
	return path.join(CONTENT_ROOT, `${slug}.mdx`);
}
