import "server-only";

import { CONTENT_ROOT } from "@/lib/content-path";
import fs from "fs";
import path from "path";
import { cache } from "react";

/**
 * The set of valid post slugs, read straight off the filesystem.
 *
 * Deliberately separate from data/blog.ts: that module pulls in shiki and the
 * whole unified pipeline, and the only thing a server action needs in order to
 * validate an incoming slug is the list of filenames. Importing the renderer
 * for that would drag a megabyte of syntax highlighter into the action bundle
 * (and trip Terser on shiki's top-level await).
 */
export const getPostSlugs = cache(async (): Promise<Set<string>> => {
	const dir = CONTENT_ROOT;
	if (!fs.existsSync(dir)) return new Set();

	return new Set(
		fs
			.readdirSync(dir)
			.filter((f) => path.extname(f) === ".mdx")
			.map((f) => path.basename(f, ".mdx"))
	);
});
