import { getBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { SITE_DOMAIN } from "@/lib/site";
import { ImageResponse } from "next/og";

export const alt = "Note";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
	const posts = await getBlogPosts();
	return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostOpengraphImage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = await getPost(slug);
	const title = post?.metadata.title ?? "Blog";
	const tags = post?.metadata.tags.slice(0, 3) ?? [];

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					background: "#0a0a0a",
					color: "#fafafa",
					padding: 80,
					fontFamily: "sans-serif",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<div
						style={{
							width: 14,
							height: 14,
							borderRadius: 99,
							background: "#fafafa",
						}}
					/>
					<div style={{ fontSize: 26, color: "#a1a1a1", letterSpacing: 1 }}>
						{SITE_DOMAIN}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						fontSize: title.length > 60 ? 60 : 72,
						fontWeight: 700,
						letterSpacing: -2,
						lineHeight: 1.15,
						maxWidth: 1000,
					}}
				>
					{title}
				</div>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<div style={{ fontSize: 28, color: "#a1a1a1" }}>{DATA.name}</div>
					<div style={{ display: "flex", gap: 12, fontSize: 22, color: "#737373" }}>
						{tags.map((t) => (
							<div
								key={t}
								style={{
									border: "1px solid #2e2e2e",
									borderRadius: 99,
									padding: "8px 20px",
								}}
							>
								{t}
							</div>
						))}
					</div>
				</div>
			</div>
		),
		size
	);
}
