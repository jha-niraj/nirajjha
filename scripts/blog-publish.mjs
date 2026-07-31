/**
 * Publishes one post: flips `live: false` to `live: true`, then gates.
 *
 *   pnpm blog:publish my-post
 *   pnpm blog:publish my-post --dry
 *
 * The daily step is meant to be one command, not four remembered ones. This
 * flips the flag, then runs the linter and the link checker, and puts the flag
 * back if either fails. A post cannot go live broken by forgetting to check.
 *
 * It deliberately does NOT deploy, sync or email. Those stay separate because
 * they are the irreversible half: sending to a list cannot be undone, so it has
 * to be typed on purpose.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
const dryRun = process.argv.includes("--dry");

if (!slug || slug.startsWith("--")) {
	console.error("Usage: pnpm blog:publish <slug> [--dry]");
	process.exit(1);
}

const file = path.join(process.cwd(), "content", `${slug}.mdx`);

if (!fs.existsSync(file)) {
	console.error(`No post at content/${slug}.mdx`);
	process.exit(1);
}

const before = fs.readFileSync(file, "utf-8");

// Only inside the frontmatter block, so the word "live" in the prose is safe.
const fm = before.match(/^---\n([\s\S]*?)\n---\n/);
if (!fm) {
	console.error(`content/${slug}.mdx has no frontmatter block.`);
	process.exit(1);
}

if (/^live:\s*true\s*$/m.test(fm[1])) {
	console.log(`${slug} is already live. Nothing to do.`);
	process.exit(0);
}

if (!/^live:\s*false\s*$/m.test(fm[1])) {
	console.error(`${slug} has no \`live: false\` line to flip.`);
	process.exit(1);
}

const flipped =
	before.slice(0, fm.index) +
	fm[0].replace(/^live:\s*false\s*$/m, "live: true") +
	before.slice(fm.index + fm[0].length);

if (dryRun) {
	console.log(`Would set live: true on ${slug}, then lint and check links.`);
	process.exit(0);
}

fs.writeFileSync(file, flipped);
console.log(`live: true  ->  ${slug}\n`);

/** Runs a gate, putting the post back to live: false if it fails. */
function gate(label, args) {
	const run = spawnSync("node", args, { stdio: "inherit" });
	if (run.status !== 0) {
		fs.writeFileSync(file, before);
		console.error(`\n${label} failed. Reverted ${slug} to live: false.`);
		process.exit(1);
	}
}

gate("blog:lint", ["scripts/blog-lint.mjs", slug]);
gate("links:check", ["scripts/check-links.mjs", slug]);

console.log(`
${slug} is ready.

  git add content/${slug}.mdx && git commit && git push   # deploy
  pnpm blog:sync                                          # make it emailable
  pnpm blog:broadcast --slug=${slug}                      # preview the email
  pnpm blog:broadcast --slug=${slug} --send                # send it
`);
