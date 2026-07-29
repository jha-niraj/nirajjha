import { DATA } from "@/data/resume";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: `${DATA.name} - ${DATA.role}`,
		short_name: DATA.shortName,
		description: DATA.description,
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#0a0a0a",
		icons: [
			{ src: "/icon-192.webp", sizes: "192x192", type: "image/webp" },
			{
				src: "/icon-512.webp",
				sizes: "512x512",
				type: "image/webp",
				purpose: "any",
			},
			{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
		],
	};
}
