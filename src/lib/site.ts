/**
 * Single source of truth for anything that needs the canonical origin:
 * metadata, sitemap, robots, RSS, llms.txt and every JSON-LD @id.
 *
 * Keep this the bare origin (no trailing slash) - the whole SEO layer
 * concatenates onto it.
 */
export const SITE_URL = "https://nirajjha.in";
export const SITE_DOMAIN = "nirajjha.in";

/**
 * Search-engine ownership verification.
 * Google  → https://search.google.com/search-console  (HTML tag method)
 * Bing    → https://www.bing.com/webmasters
 * Empty string = not yet verified, and the meta tag is simply omitted.
 */
export const GOOGLE_SITE_VERIFICATION = "";
export const BING_SITE_VERIFICATION = "";
