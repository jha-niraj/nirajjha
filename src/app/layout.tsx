import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import {
	BING_SITE_VERIFICATION,
	GOOGLE_SITE_VERIFICATION,
	SITE_URL,
} from "@/lib/site";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Self-hosted rather than `next/font/google`.
 *
 * The Google loader fetches the stylesheet and the woff2 at build time, so any
 * network hiccup, proxy, or offline build prints "Failed to download Inter from
 * Google Fonts. Using fallback font instead." and silently ships the wrong
 * typeface. The files are 48kB and 15kB; committing them removes an external
 * dependency from every build and every dev server start.
 */
const fontSans = localFont({
	src: "./fonts/Inter-Variable-latin.woff2",
	variable: "--font-sans",
	display: "swap",
	weight: "100 900",
	// Metric-matched to Inter, so the swap when it loads does not reflow.
	adjustFontFallback: "Arial",
	fallback: ["system-ui", "-apple-system", "Segoe UI", "Helvetica", "sans-serif"],
});

/**
 * Display face for big headings.
 *
 * Bricolage Grotesque, self-hosted rather than pulled through
 * `next/font/google`. The Google loader fetches the file at build time, and
 * when that fetch fails it does not fail the build: it prints a warning and
 * silently ships the fallback, which is the exact bug that was hit with Inter
 * earlier. `next/font/local` gives the identical API and `--font-display`
 * variable with no network dependency.
 *
 * Variable on both axes (optical size 12-96, weight 200-800), so a 48px title
 * and a 14rem wordmark each get letterforms drawn for their size rather than
 * one master scaled up.
 */
const fontDisplay = localFont({
	src: "./fonts/BricolageGrotesque-Variable-latin.woff2",
	variable: "--font-display",
	display: "swap",
	weight: "200 800",
	fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

/** The footer wordmark only. Kept separate so headings can change without it. */
const fontWordmark = localFont({
	src: "./fonts/InstrumentSerif-Regular-latin.woff2",
	variable: "--font-wordmark",
	display: "swap",
	weight: "400",
	// Decorative and below the fold, so it must never block first paint.
	preload: false,
	fallback: ["Georgia", "Times New Roman", "serif"],
});

const TITLE = `${DATA.name} - ${DATA.role}`;

export const metadata: Metadata = {
	// Note: SITE_URL already carries the scheme. Passing a bare domain here is
	// the classic way to end up with `https://https://…` in every OG tag.
	metadataBase: new URL(SITE_URL),
	title: {
		default: TITLE,
		template: `%s - ${DATA.shortName}`,
	},
	description: DATA.description,
	applicationName: DATA.shortName,
	authors: [{ name: DATA.name, url: SITE_URL }],
	creator: DATA.name,
	publisher: DATA.name,
	keywords: [...DATA.seoKeywords],
	category: "technology",
	alternates: {
		canonical: "/",
		types: {
			"application/rss+xml": [
				{ url: "/feed.xml", title: `${DATA.shortName} - Writing` },
			],
		},
	},
	openGraph: {
		type: "profile",
		siteName: DATA.name,
		title: TITLE,
		description: DATA.description,
		url: SITE_URL,
		locale: "en_US",
		firstName: DATA.firstName,
		lastName: "Jha",
		username: "jha-niraj",
	},
	twitter: {
		card: "summary_large_image",
		title: TITLE,
		description: DATA.description,
		creator: "@iamnirajjha",
		site: "@iamnirajjha",
	},
	// All icons live in /public and are declared here rather than via the
	// app-router `favicon.ico` file convention - having both an app/favicon.ico
	// and a public/favicon.ico is a route collision and returns a 500.
	// Regenerate them from the source photo with `pnpm icons`.
	icons: {
		icon: [
			{ url: "/favicon.webp", type: "image/webp", sizes: "96x96" },
			{ url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
		],
		shortcut: ["/favicon.ico"],
		apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
		...(BING_SITE_VERIFICATION
			? { other: { "msvalidate.01": BING_SITE_VERIFICATION } }
			: {}),
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
	colorScheme: "light dark",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		/*
		 * `data-scroll-behavior="smooth"` is not decorative. globals.css sets
		 * `scroll-behavior: smooth` on <html> so in-page heading links glide,
		 * and without this attribute Next cannot tell that apart from a route
		 * change, so it animates the jump to the top of every new page. The
		 * attribute tells the router to force an instant scroll on navigation
		 * and leave anchor links smooth.
		 */
		<html
			lang="en"
			suppressHydrationWarning
			className="h-full"
			data-scroll-behavior="smooth"
		>
			<body
				className={cn(
					"h-full bg-background font-sans antialiased selection:bg-foreground selection:text-background",
					fontSans.variable,
					fontDisplay.variable,
					fontWordmark.variable
				)}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{/* Only the providers live here. The site chrome (header, footer,
					    dock) belongs to the (site) group. */}
					<TooltipProvider delayDuration={0}>
						<ToastProvider>{children}</ToastProvider>
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
