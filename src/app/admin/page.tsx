import { LoginForm } from "@/components/admin/login-form";
import { getOptionalSession } from "@/lib/auth/guard";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Admin",
	robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The sign-in screen. Already signed in, go straight through. */
export default async function AdminLoginPage() {
	const session = await getOptionalSession();
	if (session?.user) redirect("/admin/overview");

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-5">
			<LoginForm />
		</div>
	);
}
