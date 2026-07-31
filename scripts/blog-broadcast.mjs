/**
 * Emails posts that have not been broadcast yet.
 *
 *   pnpm blog:broadcast                  # DRY RUN: show what would be sent
 *   pnpm blog:broadcast --send           # actually create + send
 *   pnpm blog:broadcast --slug=hello     # target one post
 *   pnpm blog:broadcast --send --schedule="in 1 hour"
 *   pnpm blog:broadcast --draft          # create in Resend but do not send
 *
 * Dry run is the default on purpose. Sending mail to a list is irreversible,
 * so the destructive path has to be typed out explicitly every time.
 *
 * Selection is pure SQL against the `posts` table that `pnpm blog:sync` fills:
 * not already sent, not skipped, live, and published on or before today.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Resend } from "resend";

config({ path: ".env.local" });
config({ path: ".env" });

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const value = (name) => {
	const hit = argv.find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : null;
};

const SEND = has("--send");
const DRAFT_ONLY = has("--draft");
const ONLY_SLUG = value("slug");
const SCHEDULE = value("schedule");
/** Write the rendered email to a file and stop. Never contacts Resend. */
const PREVIEW = has("--preview");

const SITE = process.env.SITE_URL ?? "https://nirajjha.in";

for (const key of ["DATABASE_URL", "RESEND_API_KEY", "RESEND_FROM_EMAIL"]) {
	if (!process.env[key]) {
		console.error(`${key} is not set. See .env.example.`);
		process.exit(1);
	}
}

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Gmail shows the sender's *display name* in the message list, not the address.
 * A bare "noreply@nirajjha.in" therefore renders as "noreply", which is what a
 * reader sees before anything else and reads like an automated system.
 *
 * If RESEND_FROM_EMAIL is just an address, wrap it in a human name. Setting the
 * env var to `Niraj Jha <hello@nirajjha.in>` skips this entirely.
 */
const SENDER_NAME = process.env.RESEND_FROM_NAME ?? "Niraj Jha";

function normalizeFrom(raw) {
	const value = String(raw).trim();
	// Already "Name <addr@host>" - leave it alone.
	if (value.includes("<") && value.endsWith(">")) return value;
	return `${SENDER_NAME} <${value}>`;
}

const FROM = normalizeFrom(process.env.RESEND_FROM_EMAIL);

/* -------------------------------------------------------------------------- */
/* Segment                                                                     */
/* -------------------------------------------------------------------------- */

async function resolveSegmentId() {
	const pinned =
		process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID;
	if (pinned) return pinned;

	const name = process.env.RESEND_SEGMENT_NAME ?? "nirajjha.in";
	const { data, error } = await resend.audiences.list();
	if (error) throw new Error(`Could not list segments: ${error.message}`);

	const found = data?.data?.find((a) => a.name === name);
	if (!found) {
		throw new Error(
			`No segment named "${name}". Run \`pnpm resend:setup\` first.`
		);
	}
	return found.id;
}

/* -------------------------------------------------------------------------- */
/* Email                                                                       */
/* -------------------------------------------------------------------------- */

const esc = (s) =>
	String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/**
 * The opening paragraph of the post, as plain text.
 *
 * The `posts` table mirrors frontmatter only, so the body has to come off disk.
 * Markdown is flattened rather than rendered: link syntax becomes its label,
 * emphasis markers are dropped, and inline code loses its backticks. Anything
 * fancier would need a real renderer, and an email lead paragraph does not
 * justify one.
 */
function firstParagraph(slug) {
	const file = path.join(process.cwd(), "content", `${slug}.mdx`);
	if (!fs.existsSync(file)) return "";

	const { content } = matter(fs.readFileSync(file, "utf-8"));

	for (const block of content.split(/\n{2,}/)) {
		const text = block.trim();
		if (!text) continue;
		// Skip anything that is not prose: headings, fences, images, quotes,
		// list items, tables, and HTML.
		if (/^(#|```|!\[|>|[-*+]\s|\d+\.\s|\||<)/.test(text)) continue;

		return text
			.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [label](url) -> label
			.replace(/`([^`]+)`/g, "$1") // `code` -> code
			.replace(/(\*\*|__|\*|_)/g, "") // emphasis markers
			.replace(/\s+/g, " ")
			.trim();
	}

	return "";
}

/** Trims to a whole word, so a preview never ends mid-syllable. */
function truncate(text, max) {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(" ");
	return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}...`;
}

const FONT =
	"-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/**
 * Inline styles only, and tables for layout. Email clients strip <style>
 * blocks, ignore most modern CSS, and Outlook will not render a styled anchor
 * as a block. Same monochrome palette as the site.
 *
 * The hero is the post's Open Graph card, which already exists as a per-post
 * PNG at /<slug>/opengraph-image and carries the title and tags in the site's
 * own typography. The animated SVG artwork from the site cannot be used here:
 * Gmail strips SVG entirely, and no mail client runs CSS keyframes.
 *
 * Everything still reads with images turned off, which is Gmail's default for
 * a sender you have not corresponded with before, so the hero is decoration
 * rather than the only place information lives.
 */
function renderEmail(post, lead) {
	const url = `${SITE}/${post.slug}`;
	const hero = `${url}/opengraph-image`;
	const meta = [post.category, post.kind, `${post.reading_time} min read`]
		.filter(Boolean)
		.join("  /  ");

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(post.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <!-- Preheader: the grey text Gmail shows after the subject in the list. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(truncate(lead || post.summary, 140))}</div>
  <!-- Stops Gmail padding the snippet with whatever markup follows. -->
  <div style="display:none;max-height:0;overflow:hidden;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e4;border-radius:16px;overflow:hidden;">

        <tr><td style="padding:0;">
          <a href="${url}" style="display:block;text-decoration:none;">
            <img src="${hero}" alt="${esc(post.title)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;outline:none;text-decoration:none;background:#0a0a0a;">
          </a>
        </td></tr>

        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0;font:600 11px/1 ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">
            ${esc(meta)}
          </p>
          <h1 style="margin:14px 0 0;font:600 27px/1.28 ${FONT};letter-spacing:-0.6px;color:#0f0f0f;">
            ${esc(post.title)}
          </h1>
          <p style="margin:14px 0 0;font:400 16px/1.6 ${FONT};color:#4d4d4d;">
            ${esc(post.summary)}
          </p>
        </td></tr>
${
	lead
		? `
        <tr><td style="padding:24px 32px 0;">
          <div style="height:1px;background:#ededed;line-height:1px;font-size:0;">&nbsp;</div>
          <p style="margin:24px 0 0;font:400 15px/1.75 ${FONT};color:#3d3d3d;">
            ${esc(truncate(lead, 420))}
          </p>
        </td></tr>`
		: ""
}
        <tr><td style="padding:28px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:#0f0f0f;border-radius:999px;">
              <a href="${url}" style="display:inline-block;padding:13px 28px;font:600 14px/1 ${FONT};color:#ffffff;text-decoration:none;">
                Read the full post
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 32px;">
          <div style="height:1px;background:#ededed;line-height:1px;font-size:0;">&nbsp;</div>
          <p style="margin:24px 0 0;font:400 13px/1.6 ${FONT};color:#6b6b6b;">
            You are getting this because you subscribed at
            <a href="${SITE}" style="color:#0f0f0f;">nirajjha.in</a>.
            <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6b6b6b;">Unsubscribe</a>.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderText(post, lead) {
	return [
		post.title,
		"",
		post.summary,
		...(lead ? ["", truncate(lead, 420)] : []),
		"",
		`Read the full post: ${SITE}/${post.slug}`,
		"",
		"Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}",
	].join("\n");
}

/* -------------------------------------------------------------------------- */

const pending = ONLY_SLUG
	? await sql`select * from posts where slug = ${ONLY_SLUG}`
	: await sql`
			select * from posts
			where broadcast_sent_at is null
			  and broadcast_skipped = false
			  and live = true
			  and published_at <= to_char(now(), 'YYYY-MM-DD')
			order by published_at asc`;

if (pending.length === 0) {
	console.log("Nothing to broadcast.");
	console.log("Run `pnpm blog:sync` first if you just added a post.");
	process.exit(0);
}

/**
 * Preview writes the exact HTML that would be sent to a file and stops. It runs
 * before the "already broadcast" guard on purpose, so the template can be
 * checked against a post that has already gone out.
 */
if (PREVIEW) {
	for (const post of pending) {
		const lead = firstParagraph(post.slug);
		const out = path.join(process.cwd(), `.preview-${post.slug}.html`);
		fs.writeFileSync(out, renderEmail(post, lead), "utf-8");

		console.log(`  ${post.slug}`);
		console.log(`    subject:   ${post.title}`);
		console.log(`    preheader: ${truncate(lead || post.summary, 140)}`);
		console.log(`    lead:      ${lead ? `${lead.length} chars` : "NOT FOUND"}`);
		console.log(`    written:   ${out}\n`);
	}
	console.log("Open those files in a browser. Nothing was sent.");
	process.exit(0);
}

if (ONLY_SLUG && pending[0].broadcast_sent_at) {
	console.log(
		`"${ONLY_SLUG}" was already broadcast on ${pending[0].broadcast_sent_at}.`
	);
	console.log("Clear broadcast_sent_at in the database to resend.");
	process.exit(0);
}

const segmentId = await resolveSegmentId();
const [{ count: recipients }] = await sql`
	select count(*)::int as count from subscribers where unsubscribed = false`;

console.log(`Segment:    ${segmentId}`);
console.log(`From:       ${FROM}`);
console.log(`Recipients: ~${recipients} subscriber(s)`);
console.log(`Mode:       ${SEND ? (DRAFT_ONLY ? "DRAFT" : "SEND") : "DRY RUN"}`);
if (SCHEDULE) console.log(`Scheduled:  ${SCHEDULE}`);
console.log(`\n${pending.length} post(s) queued:\n`);

for (const post of pending) {
	const subject = post.title;
	const lead = firstParagraph(post.slug);
	// Resend lists broadcasts by `name`. Without one the dashboard row renders
	// as "Undefined", which makes a list of past sends unreadable.
	const name = `${post.published_at} ${post.slug}`;
	const preheader = truncate(lead || post.summary, 140);

	console.log(`  ${post.slug}`);
	console.log(`    name:      ${name}`);
	console.log(`    subject:   ${subject}`);
	console.log(`    preheader: ${preheader}`);
	console.log(`    url:       ${SITE}/${post.slug}`);
	console.log(`    hero:      ${SITE}/${post.slug}/opengraph-image`);
	if (!lead) {
		console.log(`    note:      no lead paragraph found, sending summary only`);
	}

	if (!SEND) {
		console.log(`    (dry run, nothing sent)\n`);
		continue;
	}

	const { data, error } = await resend.broadcasts.create({
		name,
		segmentId,
		from: FROM,
		subject,
		html: renderEmail(post, lead),
		text: renderText(post, lead),
		...(DRAFT_ONLY ? {} : { send: true }),
		...(SCHEDULE ? { scheduledAt: SCHEDULE } : {}),
	});

	if (error || !data) {
		console.error(`    FAILED: ${error?.message ?? "unknown error"}\n`);
		continue;
	}

	// Only stamp sent_at when it actually went out. A draft stores the id so a
	// rerun does not create a duplicate draft, but leaves it eligible to send.
	if (DRAFT_ONLY) {
		await sql`update posts set broadcast_id = ${data.id} where slug = ${post.slug}`;
		console.log(`    draft created: ${data.id}\n`);
	} else {
		await sql`
			update posts
			set broadcast_id = ${data.id}, broadcast_sent_at = now()
			where slug = ${post.slug}`;
		console.log(`    sent: ${data.id}\n`);
	}
}

if (!SEND) {
	console.log("Dry run. Add --send to actually deliver.");
}
