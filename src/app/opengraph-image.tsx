import { DATA } from "@/data/resume";
import { SITE_DOMAIN } from "@/lib/site";
import { ImageResponse } from "next/og";

export const alt = `${DATA.name} - ${DATA.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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

				<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
					<div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3 }}>
						{DATA.name}
					</div>
					<div
						style={{
							fontSize: 36,
							color: "#a1a1a1",
							maxWidth: 900,
							lineHeight: 1.35,
						}}
					>
						{`${DATA.role} - building AI products end to end.`}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						gap: 14,
						fontSize: 24,
						color: "#737373",
					}}
				>
					{["Next.js", "TypeScript", "PostgreSQL", "AI Pipelines"].map((t) => (
						<div
							key={t}
							style={{
								border: "1px solid #2e2e2e",
								borderRadius: 99,
								padding: "10px 22px",
							}}
						>
							{t}
						</div>
					))}
				</div>
			</div>
		),
		size
	);
}
