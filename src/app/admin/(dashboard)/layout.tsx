import { AdminShell } from "@/components/admin/shell";
import { getApplicationCounts } from "@/db/analytics";
import { requireAdmin } from "@/lib/auth/guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Admin",
	// Belt and braces alongside the route being unlinked from anywhere public.
	robots: { index: false, follow: false },
};

/** Sessions are per-request, so nothing here may be cached. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await requireAdmin();
	const counts = await getApplicationCounts();

	return (
		<AdminShell email={session.user.email} pending={counts.pending ?? 0}>
			{children}
		</AdminShell>
	);
}
