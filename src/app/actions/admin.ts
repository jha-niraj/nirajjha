"use server";

import { db } from "@/db";
import { contributorApplications } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const STATUSES = ["pending", "reviewing", "invited", "declined"] as const;
type Status = (typeof STATUSES)[number];

/**
 * Records a decision on an application.
 *
 * `requireAdmin` runs inside the action, not just on the page that renders the
 * button. A server action is a public endpoint: anything that only checks
 * authorisation in the page it was rendered from is not checking it at all.
 *
 * The reason is mandatory. Six months from now the only way to know whether
 * these calls were any good is to have written down the thinking at the time,
 * and a field nobody is forced to fill is a field nobody fills.
 */
export async function decideApplication(
	id: string,
	status: string,
	reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	await requireAdmin();

	if (!STATUSES.includes(status as Status)) {
		return { ok: false, error: "Unknown status." };
	}
	const note = reason.trim().slice(0, 2000);
	if (note.length < 3) {
		return { ok: false, error: "Write down why. Future you needs it." };
	}
	if (!db) return { ok: false, error: "Database unavailable." };

	await db
		.update(contributorApplications)
		.set({ status, reviewNote: note, decidedAt: new Date() })
		.where(eq(contributorApplications.id, id));

	revalidatePath("/admin/applications");
	revalidatePath("/admin/overview");
	return { ok: true };
}
