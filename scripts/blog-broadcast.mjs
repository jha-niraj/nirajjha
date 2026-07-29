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
 * not already sent, not skipped, not a draft, and published on or before today.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
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

const SITE = process.env.SITE_URL ?? "https://nirajjha.in";

for (const key of ["DATABASE_URL", "RESEND_API_KEY", "RESEND_FROM_EMAIL"]) {
	if (!process.env[key]) {
		console.error(`${key} is not set. See .env.example.`);
		process.exit(1);
	}
}

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL;

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
 * Inline styles only, and a table for the button. Email clients strip <style>
 * blocks, ignore most modern CSS, and Outlook will not render a styled anchor
 * as a block. Same monochrome palette as the site.
 */
function renderEmail(post) {
	const url = `${SITE}/${post.slug}`;
	const meta = [
		post.category,
		post.kind,
		`${post.reading_time} min read`,
	].filter(Boolean);

	return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f5f5f5;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(post.summary)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e0e0e0;border-radius:16px;">
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0;font:600 12px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">
            ${esc(meta.join("  /  "))}
          </p>
          <h1 style="margin:16px 0 0;font:600 28px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-0.5px;color:#0f0f0f;">
            ${esc(post.title)}
          </h1>
          <p style="margin:16px 0 0;font:400 16px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#4d4d4d;">
            ${esc(post.summary)}
          </p>
        </td></tr>
        <tr><td style="padding:28px 32px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="background:#0f0f0f;border-radius:999px;">
              <a href="${url}" style="display:inline-block;padding:13px 28px;font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;">
                Read the post
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 32px;border-top:1px solid #ededed;">
          <p style="margin:24px 0 0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#6b6b6b;">
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

function renderText(post) {
	return [
		post.title,
		"",
		post.summary,
		"",
		`Read it: ${SITE}/${post.slug}`,
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
			  and draft = false
			  and published_at <= to_char(now(), 'YYYY-MM-DD')
			order by published_at asc`;

if (pending.length === 0) {
	console.log("Nothing to broadcast.");
	console.log("Run `pnpm blog:sync` first if you just added a post.");
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
	console.log(`  ${post.slug}`);
	console.log(`    subject: ${subject}`);
	console.log(`    url:     ${SITE}/${post.slug}`);

	if (!SEND) {
		console.log(`    (dry run, nothing sent)\n`);
		continue;
	}

	const { data, error } = await resend.broadcasts.create({
		segmentId,
		from: FROM,
		subject,
		html: renderEmail(post),
		text: renderText(post),
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
