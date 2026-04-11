import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";

export const DATA = {
	name: "Niraj Jha",
	initials: "NJ",
	url: "https://nirajjha.xyz",
	location: "Punjab, India",
	locationLink: "https://www.google.com/maps/place/punjab+india",
	description:
		"Full Stack Engineer. Product builder. Ships fast.",
	summary:
		"Full Stack Engineer currently working at **Creatr**. I build SaaS products and developer tools end-to-end — from auth systems to real-time features to CRM integrations. I care about shipping working software quickly, designing good abstractions, and making things production-ready. Currently deep-diving into **Golang**, **system design**, and **distributed systems** on the side.",
	avatarUrl: "/me.jpeg",
	resumeUrl:
		"https://drive.google.com/file/d/1yKhT8_dMVJQPfFZNyK9_UWihTGHrm5Bt/view",
	skills: {
		frontend: [
			"Next.js",
			"React.js",
			"TypeScript",
			"TailwindCSS",
			"Shadcn UI",
			"Framer Motion",
			"Zustand",
		],
		backend: [
			"Node.js",
			"Express",
			"Golang",
			"REST APIs",
			"WebSockets",
		],
		databases: [
			"PostgreSQL",
			"MongoDB",
			"Redis",
			"Prisma",
			"Drizzle",
			"Supabase",
		],
		devops: [
			"Docker",
			"AWS S3",
			"Cloudflare",
			"Vercel",
			"Git",
		],
	},
	currentlyLearning: [
		"Golang — concurrency, goroutines, production APIs",
		"Backend Systems — distributed systems, scalability",
		"Software Architecture — SOLID, DDD, event-driven patterns",
	],
	navbar: [
		{ href: "/", icon: HomeIcon, label: "Home" },
		{
			href: "https://vichar-space.vercel.app",
			icon: NotebookIcon,
			label: "Blog",
		},
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
			href: "#",
			badges: ["Current"],
			location: "Remote",
			title: "Full Stack Engineer",
			logoUrl: "/creatr.png",
			start: "2026",
			end: "Present",
			description: [
				"Building SaaS products and developer tools end-to-end.",
				"Working on auth systems, real-time features, and CRM integrations.",
				"Designing scalable abstractions and shipping production-ready software.",
			],
		},
		{
			company: "xAGI",
			href: "https://xagi.in",
			badges: [],
			location: "Remote",
			title: "Full Stack Developer Intern",
			logoUrl: "/xagi.png",
			start: "January 2025",
			end: "Early 2026",
			description: [
				"Integrated Clerk authentication to require sign-in before users can write prompts.",
				"Rebuilt the platform UI from scratch to enhance user experience.",
				"Developed AI agent showcase features with detailed descriptions.",
				"Designed a step-by-step card-based onboarding guide for new users.",
			],
		},
		{
			company: "Pratibha Innovations",
			badges: [],
			href: "https://pratibhainnovations.com",
			location: "Remote",
			title: "Software Engineer Intern",
			logoUrl: "/pratibha.png",
			start: "June 2024",
			end: "August 2024",
			description: [
				"Built a job listing platform from scratch, reducing job search time by 40%.",
				"Implemented real-time chat with Pusher, boosting user engagement by 60%.",
				"Developed an admin dashboard with real-time analytics and user management.",
			],
		},
	],
	education: [
		{
			school: "Lovely Professional University",
			href: "https://www.lpu.in",
			degree: "Bachelor of Technology — Computer Science",
			logoUrl: "/lpu.png",
			start: "2022",
			end: "2026",
		},
		{
			school: "Kathmandu Model Higher Secondary School",
			href: "#",
			degree: "10+2",
			logoUrl: "/kmhss.png",
			start: "2019",
			end: "2022",
		},
	],
	projects: [
		{
			title: "Vani",
			href: "#",
			dates: "2025",
			active: true,
			featured: false,
			description:
				"An MVP for processing and learning from large audio files. Built to explore audio processing pipelines and technology integrations.",
			technologies: [
				"Next.js",
				"TypeScript",
				"Audio Processing",
				"AI",
			],
			links: [
				{
					type: "Website",
					href: "https://vani.nirajjha.xyz",
					icon: <Icons.globe className="size-3" />
				},
				{
					type: "Source",
					href: "https://github.com/jha-niraj/Vani",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/vaniproject.png",
			video: "",
		},
		{
			title: "AfterClass",
			href: "https://afterclass-nine.vercel.app",
			dates: "2025 - Present",
			active: true,
			featured: true,
			description:
				"Float between rooms. Your people are already there. A campus-first social and study platform with real-time rooms, live hangouts, and college community features.",
			technologies: [
				"Next.js",
				"TypeScript",
				"WebSockets",
				"PostgreSQL",
				"Prisma",
				"NextAuth",
				"Cloudinary",
				"TailwindCSS",
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
			title: "The Coder'z",
			href: "https://coderzai.xyz",
			dates: "Sep 2024 - Present",
			active: true,
			featured: true,
			description:
				"Engineering intelligence suite for developers. A practical project-based learning platform with pathways, open source, and AI tools to empower developers.",
			technologies: [
				"Next.js",
				"TypeScript",
				"PostgreSQL",
				"Prisma",
				"TailwindCSS",
				"Shadcn UI",
				"NextAuth",
				"AWS S3",
			],
			links: [
				{
					type: "Website",
					href: "https://coderzai.xyz",
					icon: <Icons.globe className="size-3" />,
				},
				{
					type: "Source",
					href: "https://github.com/jha-niraj/coderzofficial",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/coderzproject.png",
			video: "",
		},
		{
			title: "ValidateX",
			href: "https://validatex.nirajjha.xyz",
			dates: "2025 - Present",
			active: true,
			featured: true,
			description:
				"Community-driven idea validation platform with blockchain rewards. Users vote on startup ideas and earn tokens for quality feedback.",
			technologies: [
				"Next.js",
				"TypeScript",
				"Web3",
				"PostgreSQL",
				"Prisma",
				"TailwindCSS",
				"Shadcn UI",
			],
			links: [
				{
					type: "Website",
					href: "https://validatex.nirajjha.xyz",
					icon: <Icons.globe className="size-3" />,
				},
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
			title: "Gurukul",
			href: "https://gurukul.nirajjha.xyz",
			dates: "2025 - Present",
			active: true,
			featured: false,
			description:
				"School management SaaS platform providing all features at one place — from billing to examination, question paper generation, and communication.",
			technologies: [
				"Next.js",
				"TypeScript",
				"PostgreSQL",
				"Prisma",
				"TailwindCSS",
				"Shadcn UI",
			],
			links: [
				{
					type: "Website",
					href: "https://gurukul.nirajjha.xyz",
					icon: <Icons.globe className="size-3" />,
				},
				{
					type: "Source",
					href: "https://github.com/jha-niraj/Gurukul",
					icon: <Icons.github className="size-3" />,
				},
			],
			image: "/projects/gurukulproject.png",
			video: "",
		}
	],
} as const;