import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

const DISALLOW = ["/api/"];

/**
 * Explicitly allowing the answer-engine crawlers matters as much as allowing
 * Googlebot now: several of them ignore the wildcard rule and look for their
 * own user-agent block before deciding whether they may index a site.
 */
const ALLOWED_BOTS = [
	"Googlebot",
	"Googlebot-Image",
	"Google-Extended",
	"Bingbot",
	"DuckDuckBot",
	"OAI-SearchBot",
	"ChatGPT-User",
	"GPTBot",
	"PerplexityBot",
	"Perplexity-User",
	"ClaudeBot",
	"Claude-User",
	"anthropic-ai",
	"Applebot",
	"Applebot-Extended",
	"CCBot",
	"cohere-ai",
	"Amazonbot",
	"meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{ userAgent: "*", allow: "/", disallow: DISALLOW },
			...ALLOWED_BOTS.map((userAgent) => ({
				userAgent,
				allow: "/",
				disallow: DISALLOW,
			})),
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
