import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import Navbar from "@/components/navbar";
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
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
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
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased selection:bg-foreground selection:text-background",
					fontSans.variable
				)}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<TooltipProvider delayDuration={0}>
						<ToastProvider>
							<div className="flex min-h-screen flex-col px-5 pb-32 sm:px-8">
								<SiteHeader />
								<div className="mx-auto w-full max-w-7xl flex-1">
									{children}
								</div>
								{/* The footer tracks the profile column at 5xl rather than the
								    7xl the post pages use, so the signature and the nav line
								    up with the content above them on the page people land on. */}
								<div className="mx-auto w-full max-w-5xl">
									<SiteFooter />
								</div>
							</div>
							<Navbar />
						</ToastProvider>
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
