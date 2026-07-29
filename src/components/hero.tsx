import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { DATA } from "@/data/resume";
import { ArrowUpRight, FileText, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DELAY = 0.04;

/**
 * The portrait frame. Fixed 1:1 so swapping the file at DATA.avatarUrl never
 * reflows the heading - any square image (800×800+ recommended) drops straight
 * in. The initials sit behind the photo as the fallback, so a missing file
 * degrades to a deliberate letter-mark instead of a broken image icon.
 */
function Portrait() {
	return (
		<div className="relative shrink-0">
			<div className="relative aspect-square w-28 overflow-hidden rounded-2xl border border-border bg-muted sm:w-36">
				<span className="absolute inset-0 flex items-center justify-center text-4xl font-semibold tracking-tight text-muted-foreground/60">
					{DATA.initials}
				</span>
				<Image
					src={DATA.avatarUrl}
					alt={`${DATA.name} - ${DATA.role}`}
					fill
					sizes="(min-width: 640px) 144px, 112px"
					className="relative object-cover"
					priority
				/>
			</div>
			{/* Offset outline - reads as a print register mark, keeps the frame from
			    looking like a floating avatar once a real photo is in. */}
			<div
				aria-hidden
				className="pointer-events-none absolute -bottom-2 -right-2 -z-10 h-full w-full rounded-2xl border border-border"
			/>
		</div>
	);
}

export function Hero() {
	return (
		<section id="hero" className="mb-20">
			<div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
				<div className="flex-1 space-y-5">
					<BlurFade delay={DELAY}>
						<div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
							<span className="relative flex size-1.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/50" />
								<span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
							</span>
							{DATA.availability}
						</div>
					</BlurFade>

					<div className="space-y-3">
						<BlurFadeText
							as="h1"
							delay={DELAY * 2}
							yOffset={8}
							className="text-5xl font-semibold tracking-tighter sm:text-6xl"
							text={DATA.name}
						/>
						<BlurFade delay={DELAY * 3}>
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-muted-foreground">
								<span className="font-medium text-foreground">
									{DATA.role}
								</span>
								<span className="text-border">/</span>
								<Link
									href={DATA.locationLink}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
								>
									<MapPin className="size-3" />
									{DATA.location}
								</Link>
							</div>
						</BlurFade>
					</div>

					<BlurFade delay={DELAY * 4}>
						<p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
							{DATA.description}
						</p>
					</BlurFade>

					<BlurFade delay={DELAY * 5}>
						<div className="flex flex-wrap items-center gap-2 pt-1">
							<Link
								href={`mailto:${DATA.contact.email}`}
								className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
							>
								<Mail className="size-3.5" />
								Get in touch
							</Link>
							<Link
								href={DATA.resumeUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
							>
								<FileText className="size-3.5" />
								Résumé
							</Link>
							{Object.entries(DATA.contact.social)
								.filter(([, s]) => s.navbar)
								.map(([key, social]) => (
									<Link
										key={key}
										href={social.url}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={social.name}
										className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
									>
										<social.icon className="size-3.5" />
										<span className="hidden sm:inline">{social.name}</span>
										<ArrowUpRight className="size-3 opacity-50" />
									</Link>
								))}
						</div>
					</BlurFade>
				</div>

				<BlurFade delay={DELAY}>
					<Portrait />
				</BlurFade>
			</div>

			<BlurFade delay={DELAY * 6}>
				<dl className="mt-10 grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
					{DATA.stats.map((stat) => (
						<div key={stat.label} className="px-4 py-4 text-center sm:px-6">
							<dt className="sr-only">{stat.label}</dt>
							<dd className="text-2xl font-semibold tracking-tight sm:text-3xl">
								{stat.value}
							</dd>
							<p className="mt-1 text-[12px] uppercase tracking-wider text-muted-foreground">
								{stat.label}
							</p>
						</div>
					))}
				</dl>
			</BlurFade>
		</section>
	);
}
