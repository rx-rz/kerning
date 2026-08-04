import type { GlyphEntry, LoadedGlyphFont } from "#/features/editor/lib/glyph-font";

export type KerningGlyphData = {
	character: string;
	codePoint: number;
	glyphIndex: number;
	glyphName?: string;
	advanceWidth: number;
	leftSideBearing: number;
	rightSideBearing: number;
	bounds: { xMin: number; yMin: number; xMax: number; yMax: number };
	entry: GlyphEntry;
};

export type KerningPairData = {
	left: KerningGlyphData;
	right: KerningGlyphData;
	unitsPerEm: number;
	kerningValue: number;
	normalizedKerning: number;
	unkernedAdvance: number;
	kernedAdvance: number;
};

function glyphData(entry: GlyphEntry): KerningGlyphData {
	const bounds = entry.glyph.getBoundingBox();
	const advanceWidth = entry.glyph.advanceWidth ?? entry.font.unitsPerEm;
	return {
		character: entry.character,
		codePoint: entry.codePoint,
		glyphIndex: entry.glyph.index,
		glyphName: entry.glyph.name ?? undefined,
		advanceWidth,
		leftSideBearing: bounds.x1,
		rightSideBearing: advanceWidth - bounds.x2,
		bounds: { xMin: bounds.x1, yMin: bounds.y1, xMax: bounds.x2, yMax: bounds.y2 },
		entry,
	};
}

export function getKerningPairData(
	loadedFont: LoadedGlyphFont,
	leftCodePoint: number,
	rightCodePoint: number,
): KerningPairData | null {
	const leftEntry = loadedFont.glyphs.find((glyph) => glyph.codePoint === leftCodePoint);
	const rightEntry = loadedFont.glyphs.find((glyph) => glyph.codePoint === rightCodePoint);
	if (!leftEntry || !rightEntry || leftEntry.font !== rightEntry.font) return null;
	if (leftEntry.glyph.index === 0 || rightEntry.glyph.index === 0) return null;
	const font = leftEntry.font;
	const left = glyphData(leftEntry);
	const right = glyphData(rightEntry);
	const kerningValue = font.getKerningValue(leftEntry.glyph, rightEntry.glyph);
	return {
		left,
		right,
		unitsPerEm: font.unitsPerEm,
		kerningValue,
		normalizedKerning: kerningValue / font.unitsPerEm,
		unkernedAdvance: left.advanceWidth + right.advanceWidth,
		kernedAdvance: left.advanceWidth + kerningValue + right.advanceWidth,
	};
}

export function unicodeLabel(codePoint: number) {
	return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}
