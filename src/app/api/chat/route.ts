import { getPost } from "@/data/blog";
import { getPostSlugs } from "@/lib/slugs";
import fs from "node:fs";
import { postFilePath } from "@/lib/content-path";
import { SITE_URL } from "@/lib/site";
import OpenAI from "openai";

export const runtime = "nodejs";

const MODEL = "gpt-4o-mini";
const MAX_QUESTION = 1000;
const MAX_QUOTE = 2000;
const MAX_TURNS = 12;

type Turn = { role: "user" | "assistant"; content: string };

/**
 * Streaming answers about one post.
 *
 * The whole post is sent as context rather than retrieved in pieces. At a few
 * thousand words that is cheaper and far more accurate than embedding and
 * chunking: retrieval only starts to pay once the corpus is bigger than the
 * context window, and it introduces a failure mode (right answer, wrong
 * paragraph) that a full-text prompt simply does not have.
 *
 * Streams as plain text rather than SSE. The client only needs the tokens in
 * order, and `response.body` is already a readable stream, so a framing format
 * would be two layers of parsing for nothing.
 */
function systemPrompt(title: string, slug: string, body: string) {
	return `You are the reading assistant on ${SITE_URL}, a personal engineering blog by Niraj Kumar Jha. You are helping someone who is reading one specific post.

POST TITLE: ${title}
POST URL: ${SITE_URL}/${slug}

FULL POST CONTENT:
"""
${body}
"""

How to answer:
- Answer from the post above whenever it covers the question. Be specific and quote its numbers and terms rather than generalising.
- If the reader quotes a passage, answer about that passage specifically.
- If the question is not covered by the post, say so in one short clause ("The post does not cover this, but...") and then answer from your own knowledge. Never blur the two.
- If you do not know, say you do not know.
- Be brief. Two or three short paragraphs at most unless asked for more. This is a side panel, not an essay.
- Plain language. Explain jargon the first time you use it.
- Never invent a fact about Niraj, his employers, or his projects that is not in the post.
- Plain prose and short markdown only: bold, bullets, inline code, fenced code. No headings.
- Never use em-dashes. Use commas, colons or separate sentences.`;
}

export async function POST(request: Request) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return new Response(
			"The assistant is not configured yet: OPENAI_API_KEY is missing.",
			{ status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
		);
	}

	let payload: {
		slug?: string;
		question?: string;
		quote?: string;
		history?: Turn[];
	};

	try {
		payload = await request.json();
	} catch {
		return new Response("Malformed request.", { status: 400 });
	}

	const slug = String(payload.slug ?? "");
	const question = String(payload.question ?? "").trim().slice(0, MAX_QUESTION);
	const quote = payload.quote
		? String(payload.quote).trim().slice(0, MAX_QUOTE)
		: null;

	if (!question) return new Response("Empty question.", { status: 400 });

	// Checked against the published set, so the slug cannot be used to read a
	// file outside the content directory.
	const slugs = await getPostSlugs();
	if (!slugs.has(slug)) return new Response("Unknown post.", { status: 404 });

	const post = await getPost(slug);
	if (!post) return new Response("Unknown post.", { status: 404 });

	const raw = fs.readFileSync(postFilePath(slug), "utf-8");
	const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();

	const history = Array.isArray(payload.history)
		? payload.history
				.filter(
					(t) =>
						t &&
						(t.role === "user" || t.role === "assistant") &&
						typeof t.content === "string"
				)
				// Only the tail: the post itself dominates the prompt, and an
				// unbounded thread is how a cheap endpoint becomes an expensive one.
				.slice(-MAX_TURNS)
				.map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }))
		: [];

	const openai = new OpenAI({ apiKey });

	const userContent = quote
		? `The reader highlighted this passage:\n\n"""\n${quote}\n"""\n\nTheir question: ${question}`
		: question;

	let stream;
	try {
		stream = await openai.chat.completions.create({
			model: MODEL,
			stream: true,
			temperature: 0.3,
			max_tokens: 700,
			messages: [
				{ role: "system", content: systemPrompt(post.metadata.title, slug, body) },
				...history,
				{ role: "user", content: userContent },
			],
		});
	} catch (error) {
		console.error("[chat] upstream failed:", error);
		return new Response("The assistant could not be reached. Try again.", {
			status: 502,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}

	const encoder = new TextEncoder();
	const readable = new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of stream) {
					const token = chunk.choices[0]?.delta?.content;
					if (token) controller.enqueue(encoder.encode(token));
				}
			} catch (error) {
				console.error("[chat] stream broke:", error);
				controller.enqueue(
					encoder.encode("\n\n(The answer was cut short by an error.)")
				);
			} finally {
				controller.close();
			}
		},
	});

	return new Response(readable, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-store",
			// Stops proxies buffering the whole answer and delivering it at once,
			// which would defeat the point of streaming.
			"X-Accel-Buffering": "no",
		},
	});
}
