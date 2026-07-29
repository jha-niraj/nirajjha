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

	// The index settled at /blogs after passing through /blog and /notes, and
	// posts moved from /blog/<slug> to /<slug>. Permanent redirects so any link
	// already out in the world keeps working and passes its ranking through.
	async redirects() {
		return [
			{ source: "/blog", destination: "/blogs", permanent: true },
			{ source: "/blog/:slug", destination: "/:slug", permanent: true },
			// The index was briefly called /notes.
			{ source: "/notes", destination: "/blogs", permanent: true },
			// The very first post shipped under a longer slug.
			{
				source: "/hello-im-niraj-jha",
				destination: "/hello",
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
