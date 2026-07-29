import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Treats a bare `YYYY-MM-DD` as local midnight rather than UTC, so a post
 *  published "today" never renders as yesterday west of Greenwich. */
function toDate(date: string) {
	return new Date(date.includes("T") ? date : `${date}T00:00:00`);
}

/** "12 March 2026" - used in listings and cards. */
export function formatShortDate(date: string) {
	return toDate(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/** "March 12, 2026 (3mo ago)" - used on the post itself. */
export function formatDate(date: string) {
	const target = toDate(date);
	const daysAgo = Math.floor(
		Math.abs(Date.now() - target.getTime()) / (1000 * 60 * 60 * 24)
	);

	const full = target.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	if (daysAgo < 1) return "Today";
	if (daysAgo < 7) return `${full} (${daysAgo}d ago)`;
	if (daysAgo < 30) return `${full} (${Math.floor(daysAgo / 7)}w ago)`;
	if (daysAgo < 365) return `${full} (${Math.floor(daysAgo / 30)}mo ago)`;
	return `${full} (${Math.floor(daysAgo / 365)}y ago)`;
}
