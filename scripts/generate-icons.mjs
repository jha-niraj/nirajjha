/**
 * Regenerates every icon + the hero portrait from the single source photo.
 *
 *   pnpm icons
 *
 * Drop a new photo at SOURCE, adjust FACE / PORTRAIT if the framing moves, and
 * re-run - everything downstream (favicon, PWA icons, Apple touch icon, hero)
 * is derived, so the site never ends up with a stale icon that disagrees with
 * the photo on the page.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "public/nirajjha.jpeg";

/** Tight head crop - a favicon is 16-32px, so anything wider turns to mush. */
const FACE = { left: 545, top: 440, width: 250, height: 250 };

/** Head-and-shoulders crop for the hero frame. */
const PORTRAIT = { left: 423, top: 460, width: 480, height: 480 };

const OUT = "public";

/**
 * Packs PNGs into an .ico container. Every browser in use supports PNG-encoded
 * ICO entries (Vista+ / all modern engines), so there is no reason to emit the
 * legacy BMP-with-AND-mask form.
 */
function buildIco(pngs) {
	const HEADER = 6;
	const ENTRY = 16;
	const header = Buffer.alloc(HEADER);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(1, 2); // type: 1 = icon
	header.writeUInt16LE(pngs.length, 4);

	let offset = HEADER + ENTRY * pngs.length;
	const entries = [];

	for (const { size, data } of pngs) {
		const entry = Buffer.alloc(ENTRY);
		entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 encodes 256
		entry.writeUInt8(size >= 256 ? 0 : size, 1);
		entry.writeUInt8(0, 2); // palette size
		entry.writeUInt8(0, 3); // reserved
		entry.writeUInt16LE(1, 4); // colour planes
		entry.writeUInt16LE(32, 6); // bits per pixel
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		entries.push(entry);
		offset += data.length;
	}

	return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
	await fs.access(SOURCE);

	const face = () => sharp(SOURCE).extract(FACE);
	const portrait = () => sharp(SOURCE).extract(PORTRAIT);

	// --- favicon.ico (16 / 32 / 48) -----------------------------------------
	const icoSizes = [16, 32, 48];
	const pngs = await Promise.all(
		icoSizes.map(async (size) => ({
			size,
			data: await face()
				.resize(size, size, { fit: "cover" })
				.png({ compressionLevel: 9 })
				.toBuffer(),
		}))
	);
	await fs.writeFile(path.join(OUT, "favicon.ico"), buildIco(pngs));

	// --- webp icons ----------------------------------------------------------
	// Chrome, Firefox and Edge all accept a WebP favicon; the .ico above stays
	// as the fallback for anything that does not.
	await face()
		.resize(96, 96, { fit: "cover" })
		.webp({ quality: 92 })
		.toFile(path.join(OUT, "favicon.webp"));

	for (const size of [192, 512]) {
		await face()
			.resize(size, size, { fit: "cover" })
			.webp({ quality: 90 })
			.toFile(path.join(OUT, `icon-${size}.webp`));
	}

	// --- Apple touch icon ----------------------------------------------------
	// iOS ignores WebP here, so this one stays PNG. Flattened onto white
	// because iOS composites the icon over a black home-screen background.
	await face()
		.resize(180, 180, { fit: "cover" })
		.flatten({ background: "#ffffff" })
		.png({ compressionLevel: 9 })
		.toFile(path.join(OUT, "apple-icon.png"));

	// --- hero portrait -------------------------------------------------------
	await portrait()
		.resize(640, 640, { fit: "cover" })
		.webp({ quality: 88 })
		.toFile(path.join(OUT, "niraj-portrait.webp"));

	const written = [
		"favicon.ico",
		"favicon.webp",
		"icon-192.webp",
		"icon-512.webp",
		"apple-icon.png",
		"niraj-portrait.webp",
	];

	for (const file of written) {
		const { size } = await fs.stat(path.join(OUT, file));
		console.log(`  ${file.padEnd(22)} ${(size / 1024).toFixed(1)} kB`);
	}
}

await main();
