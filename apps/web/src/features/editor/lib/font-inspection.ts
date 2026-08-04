import type { ProjectFontEntity } from "@kerning/shared";
import type { Font } from "opentype.js";

export type CoverageStatus = "Complete" | "Partial" | "Not included";

export type FontInspectionData = {
	overview: Array<{ label: string; value: string }>;
	family: string;
	metrics: Array<{ label: string; value: number }>;
	unitsPerEm: number;
	coverage: Array<{ label: string; status: CoverageStatus }>;
	capabilities: Array<{ label: string; value: string }>;
	rawMetadata: Array<{ label: string; value: string }>;
};

type NameRecord = string | Record<string, string> | undefined;
type InspectionTables = {
	os2?: {
		sCapHeight?: number;
		sxHeight?: number;
		usWeightClass?: number;
		fsSelection?: number;
	};
	hhea?: { lineGap?: number };
	post?: { italicAngle?: number };
	head?: { fontRevision?: number };
	fvar?: {
		axes?: Array<{
			tag?: string;
			name?: NameRecord;
			minValue?: number;
			defaultValue?: number;
			maxValue?: number;
		}>;
	};
	gsub?: { features?: Array<{ tag?: string; feature?: { tag?: string } }> };
	gpos?: { features?: Array<{ tag?: string; feature?: { tag?: string } }> };
	kern?: unknown;
};

const COVERAGE_RANGES = [
	{ label: "Basic Latin uppercase", ranges: [[0x41, 0x5a]] },
	{ label: "Basic Latin lowercase", ranges: [[0x61, 0x7a]] },
	{ label: "Numbers", ranges: [[0x30, 0x39]] },
	{
		label: "Basic punctuation",
		ranges: [
			[0x21, 0x2f],
			[0x3a, 0x40],
			[0x5b, 0x60],
			[0x7b, 0x7e],
		],
	},
	{
		label: "Symbols",
		ranges: [
			[0x20a0, 0x20cf],
			[0x2190, 0x21ff],
			[0x2200, 0x22ff],
		],
	},
	{ label: "Latin-1 Supplement", ranges: [[0xa0, 0xff]] },
	{ label: "Latin Extended", ranges: [[0x100, 0x24f]] },
	{ label: "Greek", ranges: [[0x370, 0x3ff]] },
	{ label: "Cyrillic", ranges: [[0x400, 0x4ff]] },
] as const;

function nameValue(value: NameRecord) {
	if (typeof value === "string") return value;
	if (!value) return undefined;
	return value.en ?? Object.values(value)[0];
}

function getNames(font: Font) {
	return font.names as unknown as Record<string, NameRecord>;
}

function featureTags(tables: InspectionTables) {
	const tags = new Set<string>();
	for (const table of [tables.gsub, tables.gpos]) {
		for (const feature of table?.features ?? []) {
			const tag = feature.tag ?? feature.feature?.tag;
			if (tag) tags.add(tag);
		}
	}
	return tags;
}

export function inspectCharacterCoverage(codePoints: Iterable<number>) {
	const supported = new Set(codePoints);
	return COVERAGE_RANGES.map(({ label, ranges }) => {
		let found = 0;
		let total = 0;
		for (const [start, end] of ranges) {
			for (let codePoint = start; codePoint <= end; codePoint += 1) {
				total += 1;
				if (supported.has(codePoint)) found += 1;
			}
		}
		return {
			label,
			status: (found === total
				? "Complete"
				: found
					? "Partial"
					: "Not included") as CoverageStatus,
		};
	});
}

export function inspectFont(
	font: Font,
	entity: ProjectFontEntity,
): FontInspectionData {
	const tables = font.tables as unknown as InspectionTables;
	const names = getNames(font);
	const tags = featureTags(tables);
	const unitsPerEm = font.unitsPerEm;
	const family = nameValue(names.fontFamily) ?? entity.family;
	const subfamily = nameValue(names.fontSubfamily);
	const italic =
		(tables.post?.italicAngle ?? 0) !== 0 || /italic/i.test(subfamily ?? "");
	const oblique = /oblique/i.test(subfamily ?? "");
	const axes = tables.fvar?.axes ?? [];
	const outlinesFormat = (font as unknown as { outlinesFormat?: string })
		.outlinesFormat;
	const stylisticSets = [...tags].filter((tag) =>
		/^ss(?:0[1-9]|1\d|20)$/.test(tag),
	).length;
	const capabilities = [
		{
			label: "Kerning",
			value: tags.has("kern") || tables.kern ? "Available" : "Not detected",
		},
		{
			label: "Standard ligatures",
			value: tags.has("liga") ? "Available" : "Not detected",
		},
		{
			label: "Discretionary ligatures",
			value: tags.has("dlig") ? "Available" : "Not detected",
		},
		{
			label: "Contextual alternates",
			value: tags.has("calt") ? "Available" : "Not detected",
		},
		{
			label: "Stylistic alternates",
			value: tags.has("salt") ? "Available" : "Not detected",
		},
		{
			label: "Stylistic sets",
			value: stylisticSets ? `${stylisticSets} sets` : "Not detected",
		},
		{
			label: "Small caps",
			value:
				tags.has("smcp") || tags.has("c2sc") ? "Available" : "Not detected",
		},
		{
			label: "Old-style numerals",
			value: tags.has("onum") ? "Available" : "Not detected",
		},
		{
			label: "Tabular numerals",
			value: tags.has("tnum") ? "Available" : "Not detected",
		},
		{
			label: "Variable axes",
			value: axes.length ? `${axes.length} axes` : "Not detected",
		},
	];
	const overviewValues: Array<[string, string | number | undefined]> = [
		["Family name", family],
		["Subfamily", subfamily],
		["Full font name", nameValue(names.fullName)],
		["PostScript name", nameValue(names.postScriptName)],
		["Weight", tables.os2?.usWeightClass],
		["Style", oblique ? "Oblique" : italic ? "Italic" : "Normal"],
		["Font format", outlinesFormat],
		["Glyph count", font.glyphs.length],
		["Font type", axes.length ? "Variable" : "Static"],
		["Version", nameValue(names.version) ?? entity.version],
		["Designer", nameValue(names.designer)],
		["Manufacturer", nameValue(names.manufacturer)],
	];
	const metricValues: Array<[string, number | undefined]> = [
		["Units per em", unitsPerEm],
		["Ascender", font.ascender],
		["Cap height", tables.os2?.sCapHeight],
		["X-height", tables.os2?.sxHeight],
		["Baseline", 0],
		["Descender", font.descender],
		["Line gap", tables.hhea?.lineGap],
	];
	const rawValues: Array<[string, string | number | undefined]> = [
		["Copyright", nameValue(names.copyright)],
		["Trademark", nameValue(names.trademark)],
		["License", nameValue(names.license)],
		["License URL", nameValue(names.licenseURL)],
		["Description", nameValue(names.description)],
		["Preferred family", nameValue(names.preferredFamily)],
		["Preferred subfamily", nameValue(names.preferredSubfamily)],
		["Font revision", tables.head?.fontRevision],
		...axes.map(
			(axis) =>
				[
					`Axis ${axis.tag ?? "unknown"}`,
					`${axis.minValue} / ${axis.defaultValue} / ${axis.maxValue}`,
				] as [string, string],
		),
	];
	return {
		family,
		overview: overviewValues
			.filter((row): row is [string, string | number] => row[1] !== undefined)
			.map(([label, value]) => ({ label, value: String(value) })),
		metrics: metricValues
			.filter((row): row is [string, number] => row[1] !== undefined)
			.map(([label, value]) => ({ label, value })),
		unitsPerEm,
		coverage: inspectCharacterCoverage(
			Array.from({ length: font.glyphs.length }, (_, index) =>
				font.glyphs.get(index),
			).flatMap((glyph) => glyph.unicodes ?? []),
		),
		capabilities,
		rawMetadata: rawValues
			.filter(
				(row): row is [string, string | number] =>
					row[1] !== undefined && row[1] !== "",
			)
			.map(([label, value]) => ({ label, value: String(value) })),
	};
}
