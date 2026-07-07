import { readFile } from "node:fs/promises";
import type { ProjectFontFace } from "@kerning/shared";
import { describe, expect, it } from "vitest";
import {
	EDITOR_TEMPLATES,
	getTemplateFontType,
	resolveTemplateFonts,
	resolveTemplateFontType,
} from "#/features/editor/lib/editor-templates";
import {
	extractGoogleFontUrls,
	normalizeGlyphMetrics,
	prepareFontBuffer,
	selectPreferredFace,
} from "#/features/editor/lib/glyph-font";

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
