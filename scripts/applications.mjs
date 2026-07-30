/**
 * The review queue, in a terminal.
 *
 *   pnpm apply:list                    # everything pending
 *   pnpm apply:list --all              # every status
 *   pnpm apply:show <email>            # one application in full
 *   pnpm apply:decide <email> invited  "reason"
 *   pnpm apply:decide <email> declined "reason"
 *
 * A page behind a login would be the obvious thing to build, and it is not
 * worth it: this is one person reading a handful of applications. A script has
 * no auth surface, cannot leak anybody's email to the internet, and took ten
 * minutes.
 *
 * The reason is mandatory on a decision. Six months from now the only way to
 * know whether these calls were any good is to have written down the thinking
 * at the time, and a field nobody is forced to fill is a field nobody fills.
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
	console.error("DATABASE_URL is not set.");
	process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const [command, ...args] = process.argv.slice(2);

const STATUSES = ["pending", "reviewing", "invited", "declined"];

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

function ago(date) {
	const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
	if (days === 0) return "today";
	if (days === 1) return "yesterday";
	return `${days}d ago`;
}

async function list() {
	const all = args.includes("--all");
	const rows = all
		? await sql`select * from contributor_applications order by created_at desc`
		: await sql`select * from contributor_applications where status = 'pending' order by created_at asc`;

	if (rows.length === 0) {
		console.log(all ? "No applications yet." : "Nothing pending.");
		return;
	}

	console.log(`\n${rows.length} application${rows.length === 1 ? "" : "s"}\n`);
	for (const r of rows) {
		console.log(
			`${bold(r.name)} ${dim(`<${r.email}>`)}  ${dim(`[${r.status}]`)} ${dim(ago(r.created_at))}`
		);
		console.log(`  github    https://github.com/${r.github}?tab=overview`);
		if (r.link_url) console.log(`  sent      ${r.link_url}`);
		if (r.background) console.log(`  where     ${r.background}`);
		console.log(
			`  found via ${r.source ?? "unknown"}${r.source_detail ? ` (${r.source_detail})` : ""}`
		);
		console.log(`  answered  ${r.challenge_id ?? "-"}`);
		console.log(dim(`  ${r.pitch.replace(/\s+/g, " ").slice(0, 150)}...`));
		console.log();
	}
	console.log(dim(`pnpm apply:show <email>  for the full answer\n`));
}

async function show() {
	const email = args[0]?.toLowerCase();
	if (!email) {
		console.error("Usage: pnpm apply:show <email>");
		process.exit(1);
	}
	const [r] = await sql`select * from contributor_applications where email = ${email}`;
	if (!r) {
		console.error(`No application from ${email}.`);
		process.exit(1);
	}

	console.log(`\n${bold(r.name)} <${r.email}>   ${dim(`[${r.status}]`)}`);
	console.log(`\nContributions  https://github.com/${r.github}?tab=overview`);
	console.log(`Repositories   https://github.com/${r.github}?tab=repositories`);
	if (r.link_url) console.log(`They sent      ${r.link_url}`);
	if (r.background) console.log(`Where          ${r.background}`);
	console.log(
		`Found via      ${r.source ?? "unknown"}${r.source_detail ? ` (${r.source_detail})` : ""}`
	);
	console.log(`Applied        ${ago(r.created_at)}`);
	console.log(`\n${bold(`Question: ${r.challenge_id ?? "-"}`)}\n`);
	console.log(r.pitch);
	if (r.review_note) {
		console.log(`\n${dim("--- your note ---")}`);
		console.log(r.review_note);
	}
	console.log();
}

async function decide() {
	const [email, status, ...rest] = args;
	const reason = rest.join(" ").trim();

	if (!email || !STATUSES.includes(status)) {
		console.error(
			`Usage: pnpm apply:decide <email> <${STATUSES.join("|")}> "reason"`
		);
		process.exit(1);
	}
	if (!reason) {
		console.error(
			"A reason is required. Future you needs to know why this call was made."
		);
		process.exit(1);
	}

	const rows = await sql`
		update contributor_applications
		set status = ${status},
		    review_note = ${reason},
		    decided_at = now()
		where email = ${email.toLowerCase()}
		returning name, status`;

	if (rows.length === 0) {
		console.error(`No application from ${email}.`);
		process.exit(1);
	}
	console.log(`${rows[0].name} -> ${rows[0].status}`);
	if (status === "invited") {
		console.log(dim("Now invite them in SyncHq and email them the link."));
	}
}

const commands = { list, show, decide };
const run = commands[command];

if (!run) {
	console.error(`Usage: pnpm apply:<${Object.keys(commands).join("|")}>`);
	process.exit(1);
}

await run();
