import { readFile } from "node:fs/promises";
import type { ProjectFontFace } from "@kerning/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	EDITOR_TEMPLATES,
	getTemplateFontType,
	resolveTemplateFonts,
	resolveTemplateFontType,
} from "#/features/editor/lib/editor-templates";
import {
	extractGoogleFontUrls,
	extractGlyphs,
	getFontSourceUrls,
	loadGlyphFont,
	normalizeGlyphMetrics,
	prepareFontBuffer,
	selectPreferredFace,
} from "#/features/editor/lib/glyph-font";

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

function face(
	id: string,
	weight: number,
	style: ProjectFontFace["style"] = "normal",
	kind: ProjectFontFace["kind"] = "static",
): ProjectFontFace {
	return {
		id,
		fileName: `${id}.woff2`,
		size: 100,
		sizeLabel: "100 B",
		format: "woff2",
		kind,
		weight,
		style,
	};
}

describe("editor font helpers", () => {
	it("prefers a regular 400 face before variable and nearby weights", () => {
		expect(
			selectPreferredFace([
				face("italic", 400, "italic"),
				face("variable", 400, "normal", "variable"),
				face("regular", 400),
			]),
		).toMatchObject({ id: "regular" });

		expect(
			selectPreferredFace([
				face("medium", 500),
				face("variable", 400, "normal", "variable"),
			]),
		).toMatchObject({ id: "variable" });
	});

	it("extracts and deduplicates subset URLs from Google font CSS", () => {
		const css = `
			@font-face { src: url(https://fonts.gstatic.com/latin.woff2) format('woff2'); }
			@font-face { src: url('https://fonts.gstatic.com/ext.woff2') format('woff2'); }
			@font-face { src: url(https://fonts.gstatic.com/latin.woff2) format('woff2'); }
		`;
		expect(extractGoogleFontUrls(css)).toEqual([
			"https://fonts.gstatic.com/latin.woff2",
			"https://fonts.gstatic.com/ext.woff2",
		]);
	});

	it("normalizes font metrics to a 1000-unit display", () => {
		expect(
			normalizeGlyphMetrics({
				unitsPerEm: 2000,
				ascender: 1600,
				capHeight: 1420,
				xHeight: 1060,
				descender: -300,
			}),
		).toEqual({
			ascender: 800,
			capHeight: 710,
			xHeight: 530,
			baseline: 0,
			descender: -150,
		});
	});

	it("decompresses WOFF2 fonts before outline parsing", async () => {
		const source = await readFile(
			new URL("../../../../public/fonts/geist.woff2", import.meta.url),
		);
		const prepared = await prepareFontBuffer(
			source.buffer.slice(
				source.byteOffset,
				source.byteOffset + source.byteLength,
			) as ArrayBuffer,
		);

		expect([...new Uint8Array(prepared, 0, 4)]).toEqual([0, 1, 0, 0]);
	});

	it("shares decoder initialization across parallel WOFF2 preparations", async () => {
		const source = await readFile(
			new URL("../../../../public/fonts/geist.woff2", import.meta.url),
		);
		const buffer = source.buffer.slice(
			source.byteOffset,
			source.byteOffset + source.byteLength,
		) as ArrayBuffer;
		const prepared = await Promise.all(
			Array.from({ length: 4 }, () => prepareFontBuffer(buffer.slice(0))),
		);

		expect(prepared).toHaveLength(4);
		for (const result of prepared) {
			expect([...new Uint8Array(result, 0, 4)]).toEqual([0, 1, 0, 0]);
		}
	});

	it("prefers a stored face URL for Google and uploaded fonts", async () => {
		for (const source of ["google", "upload"] as const) {
			const storedFace = {
				...face("regular", 400),
				fileUrl: "https://cdn.test/font.ttf",
			};
			expect(
				await getFontSourceUrls({
					dbId: source,
					id: source,
					source,
					family: "Example",
					faces: [storedFace],
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-01T00:00:00.000Z",
				}),
			).toEqual([storedFace.fileUrl]);
		}
	});

	it("uses Google CSS2 only when no stored face exists", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(
				new Response(
					"@font-face { src: url(https://fonts.gstatic.com/fallback.woff2) }",
				),
			);
		const urls = await getFontSourceUrls({
			dbId: "legacy-google",
			id: "legacy-google",
			source: "google",
			family: "Legacy",
			faces: [],
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		});

		expect(urls).toEqual(["https://fonts.gstatic.com/fallback.woff2"]);
		expect(fetchMock.mock.calls[0]?.[0].toString()).toContain(
			"fonts.googleapis.com/css2",
		);
	});

	it("rejects instead of hanging when a font download times out", async () => {
		vi.useFakeTimers();
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
		const request = loadGlyphFont({
			dbId: "timeout-font",
			id: "timeout-font",
			source: "upload",
			family: "Timeout",
			faces: [
				{ ...face("timeout", 400), fileUrl: "https://cdn.test/timeout.ttf" },
			],
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		});
		const rejection = expect(request).rejects.toThrow("could not be parsed");
		await vi.dynamicImportSettled();
		await vi.advanceTimersByTimeAsync(10_001);
		await rejection;
	});

	it("extracts printable glyphs and excludes control and separator characters", () => {
		const glyphs = [
			{ unicodes: [], unicode: undefined },
			{ unicodes: [65], unicode: 65 },
			{ unicodes: [10], unicode: 10 },
			{ unicodes: [32], unicode: 32 },
		];
		const font = {
			glyphs: { length: glyphs.length, get: (index: number) => glyphs[index] },
		} as never;

		expect(extractGlyphs([font]).map(({ character }) => character)).toEqual([
			"A",
		]);
	});

	it("assigns semantic template roles and resolves missing fonts", () => {
		expect(getTemplateFontType("poster-title")).toBe("primary");
		expect(getTemplateFontType("poster-sub")).toBe("sec1");
		expect(getTemplateFontType("poster-credit")).toBe("sec2");

		expect(
			resolveTemplateFontType("sec2", {
				primary: true,
				sec1: true,
				sec2: false,
			}),
		).toBe("sec1");
		expect(
			resolveTemplateFontType("sec1", {
				primary: true,
				sec1: false,
				sec2: true,
			}),
		).toBe("primary");
	});

	it("mixes all three font roles across templates with enough text", () => {
		const available = { primary: true, sec1: true, sec2: true };

		for (const template of EDITOR_TEMPLATES) {
			const textNodes = resolveTemplateFonts(
				template.card,
				available,
			).nodes.filter((node) => node.type === "text");
			if (textNodes.length < 3) continue;
			expect(new Set(textNodes.map((node) => node.fontType))).toEqual(
				new Set(["primary", "sec1", "sec2"]),
			);
		}
	});
});
