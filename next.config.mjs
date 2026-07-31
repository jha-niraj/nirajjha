/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	// Nothing gained by advertising the framework in every response header.
	poweredByHeader: false,

	// Emits /blog/foo instead of /blog/foo/ so the canonical URL, the sitemap
	// entry and the JSON-LD @id are all byte-identical. Mismatched trailing
	// slashes are one of the quieter ways to split link equity across two URLs.
	trailingSlash: false,

	images: {
		formats: ["image/avif", "image/webp"],
	},

	// `/<slug>.md` serves the post's markdown source. Stripe's llms.txt works
	// because every link in it resolves to a plain-text page, not because the
	// index itself is clever, so the whole convention rests on this rewrite.
	async rewrites() {
		return [{ source: "/:slug.md", destination: "/md/:slug" }];
	},

	// The index settled at /blogs after passing through /blog and /notes, and
	// posts moved from /blog/<slug> to /<slug>. Permanent redirects so any link
	// already out in the world keeps working and passes its ranking through.
	async redirects() {
		return [
			// The blog index is the site root now; the profile moved to /portfolio.
			{ source: "/blogs", destination: "/", permanent: true },
			{ source: "/blog", destination: "/", permanent: true },
			{ source: "/blog/:slug", destination: "/:slug", permanent: true },
			// The index was briefly called /notes.
			{ source: "/notes", destination: "/", permanent: true },
			// The very first post shipped under a longer slug.
			{
				source: "/hello-im-niraj-jha",
				destination: "/hello",
				permanent: true,
			},
			// The ideas board and the contributor programme moved to BuildrHQ, which
			// is where the accounts and the auth live. These paths were public here,
			// so they redirect rather than 404: a 404 drops whatever ranking and
			// inbound links they had, a 301 hands both to the new home.
			{
				source: "/ideas",
				destination: "https://buildrhq.com/ideas",
				permanent: true,
			},
			{
				source: "/ideas/:slug",
				destination: "https://buildrhq.com/ideas/:slug",
				permanent: true,
			},
			{
				source: "/contribute",
				destination: "https://buildrhq.com/contribute",
				permanent: true,
			},
		];
	},

	// shiki ships ESM with top-level await, which the minifier cannot parse once
	// the bundler has wrapped it. It only ever runs on the server during the MDX
	// render, so keep it out of the bundle entirely.
	//
	// This was `experimental.serverComponentsExternalPackages` on Next 14. It
	// graduated to a top-level option and the old key is no longer read, so
	// leaving it nested would have silently stopped excluding anything.
	serverExternalPackages: [
		"shiki",
		"rehype-pretty-code",
		"@neondatabase/serverless",
	],

	experimental: {
		// react-icons and lucide-react are barrel files; without this every icon
		// import drags a large chunk of the package into the bundle.
		optimizePackageImports: ["react-icons", "lucide-react"],
	},
};

export default nextConfig;
