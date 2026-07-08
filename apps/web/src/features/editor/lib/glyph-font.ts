import type { ProjectFontEntity, ProjectFontFace } from "@kerning/shared";
import type { Font, Glyph } from "opentype.js";

export type GlyphEntry = {
	character: string;
	codePoint: number;
	font: Font;
	glyph: Glyph;
};

export type GlyphMetrics = {
	unitsPerEm: number;
	ascender: number;
	capHeight: number;
	xHeight: number;
	descender: number;
};

export type LoadedGlyphFont = {
	fonts: Font[];
	glyphs: GlyphEntry[];
	metrics: GlyphMetrics;
};

const fontCache = new Map<string, Promise<LoadedGlyphFont>>();
const NON_PRINTING_CHARACTER = /[\p{Cc}\p{Cf}\p{Cs}\p{Cn}\p{Z}]/u;
const WOFF2_DECODER_TIMEOUT_MS = 7_000;
const FONT_OPERATION_TIMEOUT_MS = 10_000;

type Woff2Decoder = {
	decompress?: (buffer: Uint8Array) => Uint8Array | false;
	onRuntimeInitialized?: () => void;
};

let woff2DecoderPromise: Promise<Woff2Decoder> | null = null;

export function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	label: string,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error(`${label} timed out.`)),
			ms,
		);
		void promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

export const SYSTEM_GLYPHS = Array.from(
	new Set(
		[...Array.from({ length: 223 }, (_, index) => index + 33), 0x20ac]
			.filter((codePoint) => codePoint !== 127 && codePoint !== 160)
			.map((codePoint) => String.fromCodePoint(codePoint)),
	),
);

export function selectPreferredFace(faces: ProjectFontFace[]) {
	if (!faces.length) return undefined;
	const upright = faces.filter((face) => face.style === "normal");
	return (
		upright.find((face) => face.kind === "static" && face.weight === 400) ??
		upright.find((face) => face.kind === "variable") ??
		[...upright].sort(
			(a, b) => Math.abs(a.weight - 400) - Math.abs(b.weight - 400),
		)[0] ??
		faces[0]
	);
}

function getGoogleWeight(font: ProjectFontEntity) {
	const weightAxis = font.axes?.find((axis) => axis.tag === "wght");
	if (weightAxis) {
		return Math.round(
			Math.min(
				weightAxis.max,
				Math.max(weightAxis.min, weightAxis.defaultValue || 400),
			),
		);
	}

	const weights = (font.variants ?? []).flatMap((variant) => {
		if (variant === "regular") return [400];
		const match = /^(\d+)$/.exec(variant);
		return match?.[1] ? [Number(match[1])] : [];
	});
	return weights.includes(400)
		? 400
		: ([...weights].sort((a, b) => Math.abs(a - 400) - Math.abs(b - 400))[0] ??
				400);
}

function createGoogleFontCssUrl(font: ProjectFontEntity) {
	const url = new URL("https://fonts.googleapis.com/css2");
	url.searchParams.set(
		"family",
		`${font.family.trim().replace(/\s+/g, " ")}:wght@${getGoogleWeight(font)}`,
	);
	url.searchParams.set("display", "swap");
	return url.toString();
}

export function extractGoogleFontUrls(css: string) {
	const urls = new Set<string>();
	for (const match of css.matchAll(/src:\s*url\((['"]?)([^)'"]+)\1\)/g)) {
		if (match[2]) urls.add(match[2]);
	}
	return [...urls];
}

export async function getFontSourceUrls(font: ProjectFontEntity) {
	const face = selectPreferredFace(font.faces);
	if (face?.fileUrl) return [face.fileUrl];

	if (font.source === "upload") {
		if (!face?.fileUrl)
			throw new Error("This font face has no downloadable file.");
		return [face.fileUrl];
	}

	// Legacy fallback for Google fonts imported before font assets were self-hosted.
	// New imports should always have a CDN-backed face and return above.
	const response = await withTimeout(
		fetch(createGoogleFontCssUrl(font)),
		FONT_OPERATION_TIMEOUT_MS,
		"Google Fonts stylesheet download",
	);
	if (!response.ok)
		throw new Error("Google Fonts did not return a font stylesheet.");
	const urls = extractGoogleFontUrls(await response.text());
	if (!urls.length)
		throw new Error("No font files were found in the stylesheet.");
	return urls;
}

function isWoff2(buffer: ArrayBuffer) {
	const signature = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 4));
	return (
		signature.length === 4 &&
		signature[0] === 0x77 &&
		signature[1] === 0x4f &&
		signature[2] === 0x46 &&
		signature[3] === 0x32
	);
}

export async function prepareFontBuffer(buffer: ArrayBuffer) {
	if (!isWoff2(buffer)) return buffer;
	const decoder = await getWoff2Decoder();
	const decompressed = decoder.decompress?.(new Uint8Array(buffer));
	if (!decompressed) throw new Error("WOFF2 decompression failed.");
	return decompressed.buffer.slice(
		decompressed.byteOffset,
		decompressed.byteOffset + decompressed.byteLength,
	) as ArrayBuffer;
}

async function getWoff2Decoder(): Promise<Woff2Decoder> {
	if (woff2DecoderPromise) return woff2DecoderPromise;

	woff2DecoderPromise = withTimeout(
		(async () => {
			const { default: decoder } = (await import(
				"wawoff2/build/decompress_binding.js"
			)) as { default: Woff2Decoder };
			if (decoder.decompress) return decoder;

			await new Promise<void>((resolve) => {
				const existingCallback = decoder.onRuntimeInitialized;
				decoder.onRuntimeInitialized = () => {
					try {
						existingCallback?.();
					} finally {
						resolve();
					}
				};

				queueMicrotask(() => {
					if (decoder.decompress) resolve();
				});
			});

			if (!decoder.decompress) {
				throw new Error("WOFF2 decoder initialization failed.");
			}
			return decoder;
		})(),
		WOFF2_DECODER_TIMEOUT_MS,
		"WOFF2 decoder initialization",
	).catch((error: unknown) => {
		woff2DecoderPromise = null;
		throw error;
	});

	return woff2DecoderPromise;
}

function isPrintableCodePoint(codePoint: number) {
	if (codePoint <= 0 || codePoint > 0x10ffff) return false;
	return !NON_PRINTING_CHARACTER.test(String.fromCodePoint(codePoint));
}

export function extractGlyphs(fonts: Font[]) {
	const entries = new Map<number, GlyphEntry>();

	for (const font of fonts) {
		for (let index = 1; index < font.glyphs.length; index += 1) {
			const glyph = font.glyphs.get(index);
			const codePoints = glyph.unicodes.length
				? glyph.unicodes
				: glyph.unicode === undefined
					? []
					: [glyph.unicode];

			for (const codePoint of codePoints) {
				if (!isPrintableCodePoint(codePoint) || entries.has(codePoint))
					continue;
				entries.set(codePoint, {
					character: String.fromCodePoint(codePoint),
					codePoint,
					font,
					glyph,
				});
			}
		}
	}

	return [...entries.values()].sort((a, b) => a.codePoint - b.codePoint);
}

export function getGlyphMetrics(font: Font): GlyphMetrics {
	const unitsPerEm = font.unitsPerEm || 1000;
	const os2 = font.tables.os2 as
		| { sCapHeight?: number; sxHeight?: number }
		| undefined;
	const capHeight = os2?.sCapHeight || unitsPerEm * 0.7;
	const xHeight = os2?.sxHeight || unitsPerEm * 0.5;
	const descender = font.descender || unitsPerEm * -0.15;

	return {
		unitsPerEm,
		ascender: font.ascender || unitsPerEm * 0.8,
		capHeight,
		xHeight,
		descender,
	};
}

export function normalizeGlyphMetrics(metrics: GlyphMetrics) {
	const scale = 1000 / metrics.unitsPerEm;
	return {
		ascender: Math.round(metrics.ascender * scale),
		capHeight: Math.round(metrics.capHeight * scale),
		xHeight: Math.round(metrics.xHeight * scale),
		baseline: 0,
		descender: Math.round(metrics.descender * scale),
	};
}

export function loadGlyphFont(font: ProjectFontEntity, cacheBust = 0) {
	const preferredFace = selectPreferredFace(font.faces);
	const assetVersion =
		preferredFace?.fileUrl ?? preferredFace?.createdAt ?? "legacy";
	const cacheKey = `${font.dbId}:${font.updatedAt}:${assetVersion}:${cacheBust}`;
	const cached = fontCache.get(cacheKey);
	if (cached) return cached;

	const request = (async () => {
		const [sourceUrls, opentypeModule] = await Promise.all([
			getFontSourceUrls(font),
			import("opentype.js"),
		]);
		const opentype = opentypeModule.default ?? opentypeModule;
		const results = await Promise.allSettled(
			sourceUrls.map(async (sourceUrl) => {
				return withTimeout(
					(async () => {
						const response = await withTimeout(
							fetch(sourceUrl),
							FONT_OPERATION_TIMEOUT_MS,
							`Font download (${sourceUrl})`,
						);
						if (!response.ok) {
							throw new Error(
								`Font download failed (${response.status} ${response.statusText}).`,
							);
						}
						const buffer = await withTimeout(
							prepareFontBuffer(await response.arrayBuffer()),
							FONT_OPERATION_TIMEOUT_MS,
							"Font decoding",
						);
						try {
							return opentype.parse(buffer);
						} catch (error) {
							throw new Error("OpenType parse failed.", { cause: error });
						}
					})(),
					FONT_OPERATION_TIMEOUT_MS,
					"Font parsing",
				);
			}),
		);
		const fonts = results.flatMap((result) =>
			result.status === "fulfilled" ? [result.value] : [],
		);
		if (!fonts.length) {
			const failure = results.find(
				(result): result is PromiseRejectedResult =>
					result.status === "rejected",
			);
			const detail =
				failure?.reason instanceof Error
					? ` ${failure.reason.message}`
					: "";
			throw new Error(`The selected font could not be parsed.${detail}`, {
				cause: failure?.reason,
			});
		}

		return {
			fonts,
			glyphs: extractGlyphs(fonts),
			metrics: getGlyphMetrics(fonts[0]),
		};
	})();

	fontCache.set(cacheKey, request);
	void request.catch(() => fontCache.delete(cacheKey));
	return request;
}
