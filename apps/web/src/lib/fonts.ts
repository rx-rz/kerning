// lib/font-upload.ts

import {
	type FontFormat,
	type FontStyle,
	getAllFontFamilies,
	type StoredFontAxis,
	type StoredFontFace,
	type StoredFontFamily,
	saveFontFamily,
	toFontFamilyMeta,
} from "#/db/font-db";

const WEIGHT_MAP: Record<string, number> = {
	thin: 100,
	hairline: 100,
	extralight: 200,
	ultralight: 200,
	light: 300,
	regular: 400,
	normal: 400,
	book: 400,
	medium: 500,
	semibold: 600,
	demibold: 600,
	bold: 700,
	extrabold: 800,
	ultrabold: 800,
	black: 900,
	heavy: 900,
};

const WEIGHT_WORDS = Object.keys(WEIGHT_MAP);

type ParsedFontFile = Pick<
	StoredFontFace,
	"kind" | "weight" | "weightRange" | "axes" | "style"
> & {
	familyName: string;
};

type UploadFontFilesOptions = {
	maxFamilies?: number;
};

export function isFontFile(file: File) {
	return /\.(ttf|otf|woff|woff2)$/i.test(file.name);
}

export function getFontFormat(fileName: string): FontFormat {
	const format = fileName.split(".").pop()?.toLowerCase();

	if (
		format === "ttf" ||
		format === "otf" ||
		format === "woff" ||
		format === "woff2"
	) {
		return format;
	}

	throw new Error("Unsupported font format");
}

export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createCssFontFamily(id: string) {
	return `kerning-font-family-${id}`;
}

/**
 * Fallback filename parser.
 *
 * This is still useful because opentype.js may fail on some files,
 * especially depending on format/browser/build setup.
 */
export function parseFontFileName(fileName: string): ParsedFontFile {
	const withoutExtension = fileName.replace(/\.(ttf|otf|woff|woff2)$/i, "");
	const lowerName = withoutExtension.toLowerCase();

	const isVariable =
		lowerName.includes("variable") ||
		lowerName.includes("vf") ||
		lowerName.includes("[wght]") ||
		lowerName.includes("opsz") ||
		lowerName.includes("wdth");

	const style: FontStyle =
		lowerName.includes("italic") || lowerName.includes("oblique")
			? "italic"
			: "normal";

	const compactName = lowerName.replace(/[\s_-]/g, "");

	const weightWord = WEIGHT_WORDS.find((word) => compactName.includes(word));
	const weight = weightWord ? WEIGHT_MAP[weightWord] : 400;

	let familyName = withoutExtension
		.replace(/\[.*?\]/g, "")
		.replace(/variable/gi, "")
		.replace(/vf/gi, "")
		.replace(/italic/gi, "")
		.replace(/oblique/gi, "");

	for (const word of WEIGHT_WORDS) {
		familyName = familyName.replace(new RegExp(word, "gi"), "");
	}

	familyName = familyName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

	return {
		familyName: normalizeFontFamilyName(
			toTitleCase(familyName || withoutExtension),
		),
		kind: isVariable ? "variable" : "static",
		weight,
		weightRange: isVariable
			? {
					min: 100,
					max: 900,
				}
			: undefined,
		axes: isVariable
			? [
					{
						tag: "wght",
						name: "Weight",
						min: 100,
						max: 900,
						defaultValue: weight,
					},
				]
			: undefined,
		style,
	};
}

/**
 * Proper parser.
 *
 * Tries to read real font metadata using opentype.js.
 * If it fails, we gracefully fall back to the filename parser.
 */
export async function parseFontFile(file: File): Promise<ParsedFontFile> {
	const fallback = parseFontFileName(file.name);

	try {
		const opentypeModule = await import("opentype.js");
		const opentype = opentypeModule.default ?? opentypeModule;

		const buffer = await file.arrayBuffer();
		const font = opentype.parse(buffer);

		const names = font.names as unknown as Record<string, unknown>;

		const familyName =
			getFontName(names.preferredFamily) ||
			getFontName(font.names.fontFamily) ||
			fallback.familyName;

		const subfamily =
			getFontName(names.preferredSubfamily) ||
			getFontName(font.names.fontSubfamily) ||
			"";

		const lowerSubfamily = subfamily.toLowerCase();

		const style: FontStyle =
			lowerSubfamily.includes("italic") || lowerSubfamily.includes("oblique")
				? "italic"
				: fallback.style;

		const weight =
			typeof font.tables?.os2?.usWeightClass === "number"
				? font.tables.os2.usWeightClass
				: fallback.weight;

		const axes = getVariableAxes(font);

		const weightAxis = axes.find((axis) => axis.tag === "wght");
		const isVariable = axes.length > 0;

		return {
			familyName: normalizeFontFamilyName(familyName),
			kind: isVariable ? "variable" : "static",
			weight,
			weightRange: weightAxis
				? {
						min: weightAxis.min,
						max: weightAxis.max,
					}
				: isVariable
					? fallback.weightRange
					: undefined,
			axes: isVariable ? axes : undefined,
			style,
		};
	} catch {
		return fallback;
	}
}

function getFontName(nameRecord: unknown): string | undefined {
	if (!nameRecord || typeof nameRecord !== "object") return undefined;

	const record = nameRecord as Record<string, string | undefined>;

	return (
		record.en ||
		record["en-US"] ||
		Object.values(record).find((value) => typeof value === "string")
	);
}

type ParsedOpenTypeFont = {
	tables?: {
		fvar?: {
			axes?: unknown;
		};
	};
};

type ParsedOpenTypeAxis = {
	tag?: unknown;
	name?: {
		en?: string;
	};
	minValue?: unknown;
	maxValue?: unknown;
	defaultValue?: unknown;
};

function getVariableAxes(font: ParsedOpenTypeFont): StoredFontAxis[] {
	const axes = font.tables?.fvar?.axes;

	if (!Array.isArray(axes)) return [];

	return axes.map((axis: ParsedOpenTypeAxis) => {
		const tag = String(axis.tag);

		return {
			tag,
			name: axis.name?.en || getAxisFallbackName(tag),
			min: Number(axis.minValue),
			max: Number(axis.maxValue),
			defaultValue: Number(axis.defaultValue),
		};
	});
}

function getAxisFallbackName(tag: string) {
	const axisNames: Record<string, string> = {
		wght: "Weight",
		wdth: "Width",
		opsz: "Optical Size",
		slnt: "Slant",
		ital: "Italic",
	};

	return axisNames[tag] ?? tag;
}

function toTitleCase(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeFontFamilyName(value: string) {
	let familyName = value
		.replace(/\.(ttf|otf|woff|woff2)$/i, "")
		.replace(/\[.*?\]/g, "")
		.replace(/\b(variable|vf|italic|oblique)\b/gi, "");

	for (const word of WEIGHT_WORDS) {
		familyName = familyName.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
	}

	familyName = familyName
		.replace(/(?:^|[\s_-])(?:bf)?[a-f0-9]{10,}$/i, "")
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	return familyName || value.trim();
}

/**
 * Prevents registering the same face twice in one browser session.
 */
const loadedFaces = new Set<string>();

export async function loadFontFamilyIntoDocument(fontFamily: StoredFontFamily) {
	for (const face of fontFamily.faces) {
		if (loadedFaces.has(face.id)) continue;

		const url = URL.createObjectURL(face.blob);

		try {
			const weight =
				face.kind === "variable" && face.weightRange
					? `${face.weightRange.min} ${face.weightRange.max}`
					: String(face.weight);

			const fontFace = new FontFace(fontFamily.cssFamily, `url(${url})`, {
				weight,
				style: face.style,
			});

			await fontFace.load();

			document.fonts.add(fontFace);
			loadedFaces.add(face.id);
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	return fontFamily.cssFamily;
}

export async function uploadFontFiles(
	files: FileList | null,
	options: UploadFontFilesOptions = {},
) {
	if (!files?.length) return [];

	const validFiles = Array.from(files).filter(isFontFile);

	if (!validFiles.length) return [];

	const existingFamilies = await getAllFontFamilies();

	const familyMap = new Map<string, StoredFontFamily>();

	for (const family of existingFamilies) {
		const familyName = normalizeFontFamilyName(family.name);
		const familyKey = familyName.toLowerCase();
		const existingFamily = familyMap.get(familyKey);

		if (existingFamily) {
			existingFamily.faces = dedupeFontFaces([
				...existingFamily.faces,
				...family.faces,
			]);
			existingFamily.updatedAt =
				existingFamily.updatedAt > family.updatedAt
					? existingFamily.updatedAt
					: family.updatedAt;
			continue;
		}

		familyMap.set(familyKey, {
			...family,
			name: familyName,
			faces: dedupeFontFaces(family.faces),
		});
	}

	for (const file of validFiles) {
		const parsed = await parseFontFile(file);
		const familyKey = parsed.familyName.toLowerCase();

		let family = familyMap.get(familyKey);

		if (!family) {
			if (options.maxFamilies && familyMap.size >= options.maxFamilies) {
				continue;
			}

			const familyId = crypto.randomUUID();
			const now = new Date().toISOString();

			family = {
				id: familyId,
				name: parsed.familyName,
				cssFamily: createCssFontFamily(familyId),
				faces: [],
				createdAt: now,
				updatedAt: now,
			};

			familyMap.set(familyKey, family);
		}

		const duplicateFace = family.faces.some((face) => {
			if (parsed.kind === "variable") {
				return face.kind === "variable" && face.style === parsed.style;
			}

			return (
				face.kind === "static" &&
				face.weight === parsed.weight &&
				face.style === parsed.style
			);
		});

		if (duplicateFace) continue;

		family.faces.push({
			id: crypto.randomUUID(),
			family: family.cssFamily,
			kind: parsed.kind,
			weight: parsed.weight,
			weightRange: parsed.weightRange,
			axes: parsed.axes,
			style: parsed.style,
			fileName: file.name,
			size: file.size,
			sizeLabel: formatBytes(file.size),
			format: getFontFormat(file.name),
			blob: file,
			createdAt: new Date().toISOString(),
		});

		family.updatedAt = new Date().toISOString();
	}

	const updatedFamilies = Array.from(familyMap.values());

	for (const family of updatedFamilies) {
		await saveFontFamily(family);
		await loadFontFamilyIntoDocument(family);
	}

	return updatedFamilies.map(toFontFamilyMeta);
}

function dedupeFontFaces(faces: StoredFontFace[]) {
	const faceMap = new Map<string, StoredFontFace>();

	for (const face of faces) {
		faceMap.set(face.id, face);
	}

	return Array.from(faceMap.values());
}
