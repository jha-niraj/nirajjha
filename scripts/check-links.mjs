/**
 * Verifies every outbound link in the MDX content.
 *
 *   pnpm links:check              # every post
 *   pnpm links:check hello        # one post
 *
 * A blog that cites things is only useful if the citations resolve. This walks
 * the markdown, pulls every http(s) URL, and checks each one. Exits non-zero if
 * anything is broken, so it can gate a deploy.
 *
 * Notes on the checks:
 * - HEAD first, GET as a fallback. Plenty of sites (GitHub included) answer
 *   405 or 403 to HEAD but serve a normal GET.
 * - A browser User-Agent, because several hosts reject unknown agents with 403
 *   and that is not a broken link.
 * - 401/403 are reported as "blocked", not failed: the page exists, it just
 *   will not talk to a script. LinkedIn and X both do this.
 */
import fs from "node:fs";
import path from "node:path";

const UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const TIMEOUT = 15000;

const only = process.argv[2];
const dir = path.join(process.cwd(), "content");

const files = fs
	.readdirSync(dir)
	.filter((f) => path.extname(f) === ".mdx")
	.filter((f) => !only || path.basename(f, ".mdx") === only);

if (files.length === 0 && only) {
	console.error(`No post named "${only}".`);
	process.exit(1);
}

/**
 * The profile page links out too: every project website and repo in
 * resume.tsx. That is exactly where a dead link hides longest, because
 * nobody re-clicks their own portfolio. Checked unless a single post was
 * named on the command line.
 */
const RESUME = path.join(process.cwd(), "src", "data", "resume.tsx");

/** Markdown links, bare autolinks, and href attributes. */
function extractUrls(md) {
	const urls = new Map(); // url -> label
	const patterns = [
		/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, // [label](url)
		/<(https?:\/\/[^\s>]+)>/g, // <url>
		/href="(https?:\/\/[^"]+)"/g, // href="url"
		/href:\s*"(https?:\/\/[^"]+)"/g, // href: "url"  (resume.tsx)
		/url:\s*"(https?:\/\/[^"]+)"/g, // url: "url"    (resume.tsx)
	];

	for (const re of patterns) {
		for (const m of md.matchAll(re)) {
			const isMarkdownLink = re.source.startsWith("\\[");
			const url = isMarkdownLink ? m[2] : m[1];
			const label = isMarkdownLink ? m[1] : url;
			if (!urls.has(url)) urls.set(url, label);
		}
	}
	return urls;
}

async function probe(url) {
	const opts = {
		redirect: "follow",
		headers: { "User-Agent": UA, Accept: "*/*" },
		signal: AbortSignal.timeout(TIMEOUT),
	};

	try {
		let res = await fetch(url, { ...opts, method: "HEAD" });
		if (res.status === 405 || res.status === 403 || res.status === 404) {
			res = await fetch(url, { ...opts, method: "GET" });
		}
		return { status: res.status, finalUrl: res.url };
	} catch (error) {
		return { status: 0, error: error.message };
	}
}

let failed = 0;
let blocked = 0;
let ok = 0;

const sources = files.map((file) => ({
	label: path.basename(file, ".mdx"),
	text: fs.readFileSync(path.join(dir, file), "utf-8"),
}));

if (!only && fs.existsSync(RESUME)) {
	sources.push({
		label: "profile (resume.tsx)",
		text: fs.readFileSync(RESUME, "utf-8"),
	});
}

for (const source of sources) {
	const slug = source.label;
	const md = source.text;
	const urls = extractUrls(md);

	console.log(`\n${slug}  (${urls.size} outbound link${urls.size === 1 ? "" : "s"})`);

	const results = await Promise.all(
		[...urls.entries()].map(async ([url, label]) => ({
			url,
			label,
			...(await probe(url)),
		}))
	);

	for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
		const redirected =
			r.finalUrl && r.finalUrl.replace(/\/$/, "") !== r.url.replace(/\/$/, "");

		if (r.status >= 200 && r.status < 400) {
			ok++;
			console.log(
				`  ok   ${String(r.status).padEnd(3)} ${r.url}` +
					(redirected ? `\n         -> ${r.finalUrl}` : "")
			);
		} else if (r.status === 401 || r.status === 403 || r.status === 999) {
			blocked++;
			console.log(
				`  bot  ${String(r.status).padEnd(3)} ${r.url}  (exists, blocks scripts)`
			);
		} else {
			failed++;
			console.log(
				`  FAIL ${String(r.status || "err").padEnd(3)} ${r.url}` +
					(r.error ? `  ${r.error}` : "")
			);
		}
	}
}

console.log(`\n${ok} ok, ${blocked} bot-blocked, ${failed} broken.`);

if (failed > 0) {
	console.error("\nFix the broken links before publishing.");
	process.exit(1);
}
