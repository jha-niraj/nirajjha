import { SiteShell } from "@/components/site-shell";

/** Everything public. The site chrome lives in the shell. */
export default function SiteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <SiteShell>{children}</SiteShell>;
}
