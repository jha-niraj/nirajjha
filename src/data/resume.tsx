import { Icons } from "@/components/icons";
import { SITE_URL } from "@/lib/site";
import { HomeIcon, NotebookIcon } from "lucide-react";

export const DATA = {
	name: "Niraj Kumar Jha",
	shortName: "Niraj Jha",
	firstName: "Niraj",
	initials: "NJ",
	url: SITE_URL,
	role: "Full Stack Engineer",
	location: "Punjab, India",
	locationLink: "https://www.google.com/maps/place/punjab+india",
	availability: "Open to interesting problems",

	/**
	 * Hero portrait - a square head-and-shoulders crop of public/nirajjha.jpeg,
	 * produced by `pnpm icons`. To swap the photo: replace public/nirajjha.jpeg,
	 * adjust the PORTRAIT crop box in scripts/generate-icons.mjs, and re-run.
	 * That regenerates the favicons from the same face so they never disagree.
	 * Or just point this at any square image you drop in /public.
	 */
	avatarUrl: "/niraj-portrait.webp",

	description:
		"Full Stack Engineer building AI products end to end - pipelines, integrations, and the boring plumbing that makes them survive production.",

	summary:
		"I'm a Full Stack Engineer at **Creatr**, where I build the AI systems behind DeepBuild - an email pipeline wired into Gmail webhooks, M365 and MSP integrations, and a retrieval-backed pipeline for long-form reports. Before that I was the founding engineer at **EventEye**, taking an event management and discovery platform from an empty repo to 15,000+ users.\n\nOn the side I ship products: **SyncHq**, an intelligence operating system for organizations, and **Gurukul**, a multi-tenant school management platform. I care about designing the data model before writing the code, keeping AI behind guardrails instead of hoping for the best, and shipping things people actually use.",

	resumeUrl:
		"https://drive.google.com/file/d/1yKhT8_dMVJQPfFZNyK9_UWihTGHrm5Bt/view",

	/** Feeds the JSON-LD Person node and the metadata keyword list. */
	seoKeywords: [
		"Niraj Jha",
		"Niraj Kumar Jha",
		"nirajjha",
		"Full Stack Engineer India",
		"AI engineer portfolio",
		"Next.js developer",
		"TypeScript engineer",
		"RAG pipelines",
		"SyncHq",
		"Gurukul school management",
		"Creatr DeepBuild",
		"Lovely Professional University",
	],

	stats: [
		{ label: "Years shipping", value: "3+" },
		{ label: "Products in production", value: "6" },
		{ label: "Users served", value: "15k+" },
	],

	skills: {
		languages: ["TypeScript", "JavaScript", "C++", "C", "SQL"],
		frontend: [
			"Next.js",
			"React.js",
			"Remix",
			"TailwindCSS",
			"Shadcn UI",
			"TanStack Query",
			"Framer Motion",
		],
		backend: [
			"Node.js",
			"Express",
			"Server Actions",
			"REST APIs",
			"WebSockets",
			"Background Workers",
		],
		databases: ["PostgreSQL", "pgvector", "MongoDB", "Redis", "Prisma"],
		ai: ["Claude", "OpenAI", "RAG & Embeddings", "Agent Pipelines", "Cursor"],
		infra: ["Docker", "AWS", "Vercel", "Git", "Postman", "PostHog"],
	},

	currentlyLearning: [
		"Distributed systems - consensus, replication, and failure modes under real load",
		"Retrieval quality - chunking, reranking, and evaluating RAG instead of eyeballing it",
		"System design - designing for the second year of a product, not just the first launch",
	],

	navbar: [
		{ href: "/", icon: HomeIcon, label: "Home" },
		{ href: "/blogs", icon: NotebookIcon, label: "Blog" },
	],

	contact: {
		email: "jhaniraj45@gmail.com",
		tel: "+919503517330",
		social: {
			GitHub: {
				name: "GitHub",
				url: "https://github.com/jha-niraj",
				icon: Icons.github,
				navbar: true,
			},
			LinkedIn: {
				name: "LinkedIn",
				url: "https://www.linkedin.com/in/nirajjha31/",
				icon: Icons.linkedin,
				navbar: true,
			},
			X: {
				name: "X",
				url: "https://x.com/iamnirajjha",
				icon: Icons.x,
				navbar: true,
			},
			email: {
				name: "Send Email",
				url: "mailto:jhaniraj45@gmail.com",
				icon: Icons.email,
				navbar: false,
			},
		},
	},

	work: [
		{
			company: "Creatr",
			href: "https://getcreatr.com",
			badges: ["Current"],
			location: "Remote",
			title: "Full Stack Engineer",
			start: "April 2026",
			end: "Present",
			description: [
				"Built the AI email pipeline on Gmail webhooks: form intake routes to the right sender identity, gathers evidence, and has Claude draft an on-brand email in ~1 minute for admin approval - with pixel-tracked opens.",
				"Built DeepBuild core modules and reusable integration packages - Gmail webhooks, email tracking, full M365 (auth, email, calendar), Atera and Freshdesk.",
				"Owned MSP integrations and onboarding end to end, including M365 email and license provisioning plus a self-healing agent that auto-handles software tasks and falls back to human review when unsafe.",
				"Shipped a long-form report pipeline that embeds uploaded documents so Claude retrieves sections on demand while writing, plus a guarded product assistant with multi-layer checks on every write action.",
			],
		},
		{
			company: "EventEye",
			href: "#",
			badges: ["Founding Engineer"],
			location: "Remote",
			title: "Founding Engineer",
			start: "June 2025",
			end: "Feb 2026",
			description: [
				"Built and scaled a full-stack event management and discovery platform from scratch, serving 15,000+ users.",
				"Designed the backend for listings, ticketing, and team-based registrations, plus admin dashboards, real-time workflows, secure payment flows, and queue-backed certification pipelines.",
				"Worked with a team of 3-4 engineers on feature planning, code review, and system design decisions.",
			],
		},
		{
			company: "xAGI",
			href: "https://xagi.in",
			badges: [],
			location: "Remote",
			title: "Growth Engineer Intern",
			start: "Jan 2025",
			end: "May 2025",
			description: [
				"Built and deployed 4-5 customer-facing AI products, including podcast generation and poster creation.",
				"Developed LLM-powered workflows for personalized content delivery in an e-learning platform, and multi-step AI pipelines integrating external tools and APIs.",
				"Improved reliability through API optimization and debugging, and implemented secure authentication for a text-to-code platform.",
			],
		},
	],

	education: [
		{
			school: "Lovely Professional University",
			href: "https://www.lpu.in",
			degree: "B.Tech, Computer Science",
			note: "7.5 / 10 GPA",
			start: "May 2022",
			end: "May 2026",
		},
		{
			school: "Kathmandu Model Higher Secondary School",
			href: "#",
			degree: "Higher Secondary (10+2)",
			note: "Science",
			start: "Apr 2020",
			end: "May 2021",
		},
	],

	credentials: [
		"Meta Front-End Developer Certification",
		"Master Data Structures & Algorithms in C/C++ - Abdul Bari",
		"Winner - Intra-University Public Speaking Competition",
		"Languages: English, Hindi, Nepali",
	],

	projects: [
		{
			title: "SyncHq",
			href: "https://sync.gurukulhq.com",
			dates: "Jan 2026 - Present",
			active: true,
			featured: true,
			tagline: "Intelligence operating system for organizations",
			description:
				"A two-tier AI knowledge layer - an org-wide 'Nucleus' plus per-project pgvector KBs - that grounds every AI tool in company-specific data and cuts proposal and spec drafting from hours to minutes.",
			highlights: [
				"Multi-org identity on a single login: signed active-org cookie, /[orgSlug] routing, and permission-first RBAC with audit logging across 127+ server actions.",
				"15+ AI go-to-market tools (lead finder, proposals, campaigns, roadmaps, conversational intake) on an instant-navigation frontend built with TanStack Query and Suspense.",
			],
			technologies: [
				"Next.js",
				"TypeScript",
				"PostgreSQL",
				"pgvector",
				"Prisma",
				"TanStack Query",
				"Claude",
			],
			links: [
				{
					type: "Website",
					href: "https://sync.gurukulhq.com",
					icon: <Icons.globe className="size-3" />,
				},
			],
			image: "",
			video: "",
		},
		{
			title: "Gurukul",
			href: "https://gurukulhq.com",
			dates: "Oct 2025 - Present",
			active: true,
			featured: true,
			tagline: "Multi-tenant school management platform",
			description:
				"A school operating system built on Next.js 15 and a Prisma monorepo, with per-school data isolation and role-based access across staff, student, and parent portals.",
			highlights: [
				"250+ server actions and background-worker pipelines spanning exams, answer-sheet analytics, billing, fees, and timetabling - secured with NextAuth and role-driven server-side authorization.",
				"AI features for automated question-paper generation, exam analytics, and a 'Saathi' assistant, plus PostHog, Resend, and Cloudinary wiring.",
			],
			technologies: [
				"Next.js 15",
				"TypeScript",
				"PostgreSQL",
				"Prisma",
				"NextAuth",
				"PostHog",
			],
			links: [
				{
					type: "Website",
					href: "https://gurukulhq.com",
					icon: <Icons.globe className="size-3" />,
				},
			],
			image: "/projects/gurukulproject.png",
			video: "",
		},
		{
			title: "The Coder'z",
			href: "https://coderzofficial.vercel.app",
			dates: "Jun 2025 - Jan 2026",
			active: false,
			featured: true,
			tagline: "AI-powered ed-tech platform for developers",
			description:
				"A learning platform with structured pathways, project generation, and portfolio tooling, built around a RAG system called 'KnowMe' that turns a developer's own work into a personal AI agent.",
			highlights: [
				"End-to-end pipeline: data → embeddings → retrieval → LLM response generation.",
				"Tuned context retrieval to reduce hallucination and improve answer accuracy.",
			],
			technologies: [
				"Next.js",
				"TypeScript",
				"PostgreSQL",
				"Prisma",
				"Embeddings",
				"Vector Search",
			],
			links: [
				{
					type: "Website",
					href: "https://coderzofficial.vercel.app",
					icon: <Icons.globe className="size-3" />,
				},
				{
					type: "Source",
					href: "https://github.com/jha-niraj/buildrhqofficial",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/coderzproject.png",
			video: "",
		},
		{
			title: "ValidateX",
			hidden: true,
			href: "https://github.com/jha-niraj/Validate-X",
			dates: "2025",
			active: false,
			featured: false,
			tagline: "Idea validation with on-chain rewards",
			description:
				"A community-driven platform where people vote on startup ideas and earn tokens for feedback that actually holds up.",
			highlights: [],
			technologies: ["Next.js", "TypeScript", "Web3", "PostgreSQL", "Prisma"],
			links: [
				{
					type: "Source",
					href: "https://github.com/jha-niraj/Validate-X",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/validatex.png",
			video: "",
		},
		{
			title: "AfterClass",
			hidden: true,
			href: "https://afterclass-nine.vercel.app",
			dates: "2025",
			active: false,
			featured: false,
			tagline: "Campus-first social and study rooms",
			description:
				"Float between rooms - your people are already there. Real-time study rooms, live hangouts, and college community features.",
			highlights: [],
			technologies: [
				"Next.js",
				"TypeScript",
				"WebSockets",
				"PostgreSQL",
				"NextAuth",
			],
			links: [
				{
					type: "Website",
					href: "https://afterclass-nine.vercel.app",
					icon: <Icons.globe className="size-3" />,
				},
				{
					type: "Source",
					href: "https://github.com/jha-niraj/AfterClass",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/afterclassproject.png",
			video: "",
		},
		{
			title: "Vani",
			hidden: true,
			href: "https://github.com/jha-niraj/Vani",
			dates: "2025",
			active: false,
			featured: false,
			tagline: "Learning from long-form audio",
			description:
				"An MVP for processing large audio files and turning them into something you can actually search and learn from.",
			highlights: [],
			technologies: ["Next.js", "TypeScript", "Audio Processing", "AI"],
			links: [
				{
					type: "Source",
					href: "https://github.com/jha-niraj/Vani",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/vaniproject.png",
			video: "",
		},
	],
} as const;

/**
 * Projects that are actually shown.
 *
 * `hidden: true` parks a project without deleting it: the entry, its links and
 * its copy all stay here, ready to switch back on by removing one line. Filter
 * through this rather than reading `DATA.projects` directly, so a hidden
 * project stays out of the page, the JSON-LD and `llms.txt` together. A project
 * that is hidden on screen but still listed in structured data is worse than
 * either, because search engines surface a thing the site does not show.
 */
export const VISIBLE_PROJECTS = DATA.projects.filter(
	(p) => !("hidden" in p && p.hidden)
);
