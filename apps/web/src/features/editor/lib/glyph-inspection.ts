import type { GlyphEntry } from "./glyph-font";

export type GlyphInspectionData = {
	character: string;
	name?: string;
	codePoint: number;
	unicode: string;
	index: number;
	advanceWidth: number;
	leftSideBearing: number;
	rightSideBearing: number;
	bounds: { xMin: number; yMin: number; xMax: number; yMax: number };
	contourCount?: number;
	pointCount?: number;
};

type GlyphPath = { commands?: Array<{ type?: string }> };

export function inspectGlyph(
	entry?: GlyphEntry,
): GlyphInspectionData | undefined {
	if (!entry) return undefined;
	const bounds = entry.glyph.getBoundingBox();
	const advanceWidth = entry.glyph.advanceWidth ?? entry.font.unitsPerEm;
	const leftSideBearing = bounds.x1;
	const rightSideBearing = advanceWidth - bounds.x2;
	const commands = (entry.glyph.path as unknown as GlyphPath).commands ?? [];
	return {
		character: entry.character,
		name: entry.glyph.name ?? undefined,
		codePoint: entry.codePoint,
		unicode: `U+${entry.codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
		index: entry.glyph.index,
		advanceWidth,
		leftSideBearing,
		rightSideBearing,
		bounds: {
			xMin: bounds.x1,
			yMin: bounds.y1,
			xMax: bounds.x2,
			yMax: bounds.y2,
		},
		contourCount: commands.filter((command) => command.type === "M").length,
		pointCount: commands.filter((command) => command.type !== "Z").length,
	};
}
