/**
 * The application question.
 *
 * A motivation letter tells you how well somebody writes motivation letters.
 * These are real problems from the project, and what they test is the thing
 * that actually predicts whether a contributor works out: can you reason about
 * a system you did not build?
 *
 * They are deliberately answerable in three or four sentences, and deliberately
 * have no single right answer. What is being read is the reasoning, not the
 * conclusion.
 *
 * The first one's answer is on this blog. That is on purpose: someone who will
 * not read the site before applying will not read the codebase after joining.
 */
export type Challenge = {
	id: string;
	label: string;
	prompt: string;
	/** Optional pointer, when the context lives somewhere on this site. */
	hint?: { text: string; href: string };
};

export const CHALLENGES: Challenge[] = [
	{
		id: "lock-queue",
		label: "The migration that took the site down",
		prompt:
			"A migration adds one nullable column to a 250 million row table. The ALTER finishes in about a millisecond, but the site is unusable for nine seconds and pages that never touch that table start timing out. What happened, and what would you change before running it again?",
		hint: {
			text: "There is a post on this site about exactly this",
			href: "/add-a-column-without-downtime",
		},
	},
	{
		id: "rag-eval",
		label: "Retrieval that is confidently wrong",
		prompt:
			"An AI feature answers questions from a company's own documents. It is fluent and confident, and sometimes it answers from the wrong paragraph entirely. Nobody notices until a customer does. How would you find out how often this happens, without reading every answer by hand?",
	},
	{
		id: "tenancy",
		label: "Where to enforce multi-tenancy",
		prompt:
			"Every row in a multi-tenant product belongs to one organisation, and no query may ever cross that line. You could enforce it in the UI, in the service layer, in the ORM, or in the database. Where would you put it, and what breaks if you only do it in one of them?",
	},
	{
		id: "review",
		label: "Reviewing a pull request",
		prompt:
			"You are reviewing a 400-line pull request from someone new. It works, and the tests pass, but it is not how you would have written it. What do you comment on, what do you let go, and how do you decide which is which?",
	},
	{
		id: "unfamiliar",
		label: "Landing in an unfamiliar codebase",
		prompt:
			"You are given a repository you have never seen and one bug report: a page is slow for some users and fine for others. You cannot ask anybody. What are the first three things you do?",
	},
];

export const CHALLENGE_IDS = CHALLENGES.map((c) => c.id);

export function findChallenge(id: string): Challenge | undefined {
	return CHALLENGES.find((c) => c.id === id);
}

/**
 * Where somebody came from. Worth capturing on day one: it is the only way to
 * know which post or channel is actually bringing people in, and it cannot be
 * reconstructed after the fact.
 */
export const SOURCES = [
	{ id: "post", label: "A post on this site" },
	{ id: "github", label: "GitHub" },
	{ id: "x", label: "X / Twitter" },
	{ id: "linkedin", label: "LinkedIn" },
	{ id: "university", label: "University or college" },
	{ id: "friend", label: "Someone told me" },
	{ id: "other", label: "Somewhere else" },
] as const;

export const SOURCE_IDS = SOURCES.map((s) => s.id) as readonly string[];

export function sourceLabel(id: string | null): string {
	return SOURCES.find((s) => s.id === id)?.label ?? "Unknown";
}
