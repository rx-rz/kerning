import type { LoadedGlyphFont } from "#/features/editor/lib/glyph-font";
import {
	getOpenTypeFeatureDefinition,
	type OpenTypeFeatureCategory,
} from "#/features/editor/lib/open-type-feature-definitions";

export type DetectedOpenTypeFeature = {
	tag: string;
	label: string;
	description: string;
	category: OpenTypeFeatureCategory;
	source: "gsub" | "gpos" | "kern" | "metadata";
};

type UnknownRecord = Record<string, unknown>;
type FeatureRecord = { tag?: unknown };

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null;
}

function featureTags(table: unknown) {
	if (!isRecord(table) || !Array.isArray(table.features)) return [];
	return table.features.flatMap((feature: unknown) => {
		if (!isRecord(feature)) return [];
		const tag = (feature as FeatureRecord).tag;
		return typeof tag === "string" && /^[a-z0-9]{4}$/i.test(tag)
			? [tag.toLowerCase()]
			: [];
	});
}

/** Keeps access to incompletely typed opentype.js tables out of React code. */
export function getOpenTypeFeatures(
	loadedFont: LoadedGlyphFont,
): DetectedOpenTypeFeature[] {
	const detected = new Map<string, DetectedOpenTypeFeature["source"]>();
	for (const font of loadedFont.fonts) {
		const tables: unknown = font.tables;
		if (!isRecord(tables)) continue;
		for (const tag of featureTags(tables.gsub)) detected.set(tag, "gsub");
		for (const tag of featureTags(tables.gpos)) {
			if (!detected.has(tag)) detected.set(tag, "gpos");
		}
		if (
			isRecord(tables.kern) ||
			Object.keys(font.kerningPairs ?? {}).length > 0
		) {
			detected.set("kern", "kern");
		}
	}

	return [...detected]
		.map(([tag, source]) => ({
			tag,
			source,
			...getOpenTypeFeatureDefinition(tag),
		}))
		.sort(
			(a, b) =>
				a.category.localeCompare(b.category) || a.tag.localeCompare(b.tag),
		);
}
