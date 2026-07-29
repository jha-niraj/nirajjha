/**
 * Finds or creates the Resend segment that broadcasts send to, and prints its
 * id so it can be pinned in the env.
 *
 *   pnpm resend:setup
 *
 * Pinning RESEND_SEGMENT_ID is optional. Without it the app resolves the
 * segment by name on first subscribe, which costs two extra API calls per
 * cold start and nothing else.
 */
import { config } from "dotenv";
import { Resend } from "resend";

config({ path: ".env.local" });
config({ path: ".env" });

const key = process.env.RESEND_API_KEY;
if (!key) {
	console.error("RESEND_API_KEY is not set. Add it to .env.local or .env.");
	process.exit(1);
}

const NAME = process.env.RESEND_SEGMENT_NAME ?? "nirajjha.in";
const resend = new Resend(key);

const { data: list, error: listError } = await resend.audiences.list();
if (listError) {
	console.error("Could not list segments:", listError);
	process.exit(1);
}

const segments = list?.data ?? [];
console.log(`Existing segments (${segments.length}):`);
for (const a of segments) console.log(`  ${a.id}  ${a.name}`);

let segment = segments.find((a) => a.name === NAME);

if (!segment) {
	const { data, error } = await resend.audiences.create({ name: NAME });
	if (error || !data) {
		console.error("Could not create segment:", error);
		process.exit(1);
	}
	segment = data;
	console.log(`\nCreated segment "${NAME}".`);
} else {
	console.log(`\nFound existing segment "${NAME}".`);
}

console.log(`\nAdd this to .env.local (optional but faster):\n`);
console.log(`RESEND_SEGMENT_ID=${segment.id}`);
console.log(
	`\nThen: pnpm blog:sync, and pnpm blog:broadcast to preview the email.`
);
