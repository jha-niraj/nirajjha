/**
 * Mirrors the frontmatter of every MDX file into the `posts` table.
 *
 *   pnpm blog:sync                 # upsert every post
 *   pnpm blog:sync --mark-sent     # ...and mark everything as already emailed
 *
 * Posts are static files, so nothing in the database knows they exist. This is
 * the step that makes "which posts have not been emailed yet?" answerable in
 * SQL. It is idempotent: run it on every deploy.
 *
 * `--mark-sent` is the backfill escape hatch. Run it once before your first
 * real broadcast so the existing archive is not mailed out in one go.
 */
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import matter from "gray-matter";
import readingTime from "reading-time";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
	// Runs as a postbuild step, so a clone without secrets must not fail the
	// build. Nothing to mirror into means nothing to do.
	console.log("DATABASE_URL is not set, skipping post sync.");
	process.exit(0);
}

const markSent = process.argv.includes("--mark-sent");
const sql = neon(process.env.DATABASE_URL);
const dir = path.join(process.cwd(), "content");

if (!fs.existsSync(dir)) {
	console.error(`No content directory at ${dir}`);
	process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => path.extname(f) === ".mdx");
console.log(`Found ${files.length} post file(s).\n`);

let created = 0;
let updated = 0;
let unchanged = 0;

for (const file of files) {
	const slug = path.basename(file, ".mdx");
	const raw = fs.readFileSync(path.join(dir, file), "utf-8");
	const { data, content } = matter(raw);

	const hash = crypto.createHash("sha256").update(content).digest("hex");
	const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
	const minutes = Math.max(1, Math.ceil(readingTime(content).minutes));

	const [before] = await sql`
		select content_hash, broadcast_sent_at from posts where slug = ${slug}`;

	await sql`
		insert into posts (
			slug, title, summary, category, kind, tags, art, reading_time,
			published_at, updated_at, draft, featured, content_hash,
			broadcast_skipped
		) values (
			${slug},
			${String(data.title ?? slug)},
			${String(data.summary ?? "")},
			${data.category ? String(data.category).trim().toLowerCase() : null},
			${data.kind ? String(data.kind) : null},
			${tags},
			${data.art ? String(data.art) : null},
			${minutes},
			${String(data.publishedAt ?? "1970-01-01")},
			${data.updatedAt ? String(data.updatedAt) : null},
			${data.draft === true},
			${data.featured === true},
			${hash},
			false
		)
		on conflict (slug) do update set
			title            = excluded.title,
			summary          = excluded.summary,
			category         = excluded.category,
			kind             = excluded.kind,
			tags             = excluded.tags,
			art              = excluded.art,
			reading_time     = excluded.reading_time,
			published_at     = excluded.published_at,
			updated_at       = excluded.updated_at,
			draft            = excluded.draft,
			featured         = excluded.featured,
			content_hash     = excluded.content_hash`;

	if (!before) {
		created++;
		console.log(`  + ${slug.padEnd(28)} new`);
	} else if (before.content_hash !== hash) {
		updated++;
		console.log(`  ~ ${slug.padEnd(28)} content changed`);
	} else {
		unchanged++;
		console.log(`    ${slug.padEnd(28)} unchanged`);
	}
}

if (markSent) {
	const rows = await sql`
		update posts
		set broadcast_skipped = true
		where broadcast_sent_at is null and broadcast_skipped = false
		returning slug`;
	console.log(
		`\nMarked ${rows.length} post(s) as already handled, they will not be emailed.`
	);
	for (const r of rows) console.log(`  · ${r.slug}`);
}

const [{ pending }] = await sql`
	select count(*)::int as pending from posts
	where broadcast_sent_at is null
	  and broadcast_skipped = false
	  and draft = false`;

console.log(
	`\n${created} new, ${updated} changed, ${unchanged} unchanged. ${pending} awaiting broadcast.`
);
if (pending > 0 && !markSent) {
	console.log(`Run \`pnpm blog:broadcast\` to preview the email.`);
}
