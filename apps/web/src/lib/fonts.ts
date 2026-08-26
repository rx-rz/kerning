// lib/font-upload.ts

import {
	MAX_PROJECT_FONT_FACES,
	MAX_PROJECT_FONT_FAMILIES,
	type FontAxis,
	type ProjectFont,
} from "@kerning/shared";

import {
	type FontFormat,
	type FontStyle,
	getAllFontFamilies,
	type StoredFontAxis,
	type StoredFontFace,
	type StoredFontFamily,
	saveFontFamily,
	saveFontFamilies,
	saveGoogleFont,
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
export const MAX_FONT_FILE_SIZE = 10 * 1024 * 1024;
export { MAX_PROJECT_FONT_FAMILIES };

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

export function validateFontFiles(files: File[]) {
	const unsupported = files.find((file) => !isFontFile(file));
	if (unsupported) {
		throw new Error(
			`${unsupported.name} is not a supported font. Choose TTF, OTF, WOFF, or WOFF2.`,
		);
	}

	const empty = files.find((file) => file.size === 0);
	if (empty) {
		throw new Error(`${empty.name} is empty. Choose a valid font file.`);
	}

	const oversized = files.find((file) => file.size > MAX_FONT_FILE_SIZE);
	if (oversized) {
		throw new Error(`${oversized.name} exceeds the 10 MB font file limit.`);
	}
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

export function createGoogleFontId(family: string) {
	return `google:${family
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")}`;
}

export function createGoogleFontProjectFont(input: {
	id?: string;
	family: string;
	category?: string;
	variants: string[];
	subsets?: string[];
	axes?: FontAxis[];
	version?: string;
	lastModified?: string;
	files?: Record<string, string>;
}): ProjectFont {
	return {
		id: input.id ?? createGoogleFontId(input.family),
		source: "google",
		family: input.family,
		category: input.category,
		variants: input.variants,
		subsets: input.subsets,
		axes: input.axes,
		version: input.version,
		lastModified: input.lastModified,
		files: input.files,
		createdAt: new Date().toISOString(),
	};
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
const loadedGoogleFontStylesheets = new Set<string>();

export async function loadFontFamilyIntoDocument(fontFamily: StoredFontFamily) {
	if (fontFamily.source === "google") {
		loadGoogleFontStylesheet({
			family: fontFamily.name,
			variants: fontFamily.variants ?? [],
			axes: fontFamily.axes,
		});

		return fontFamily.cssFamily;
	}

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
		} catch {
			throw new Error(
				`${face.fileName} could not be loaded. Check that it is a valid, uncorrupted font file.`,
			);
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	return fontFamily.cssFamily;
}

export async function importGoogleFont(input: {
	id?: string;
	family: string;
	category?: string;
	variants: string[];
	subsets?: string[];
	axes?: FontAxis[];
	version?: string;
	lastModified?: string;
	files?: Record<string, string>;
}) {
	const projectFont = createGoogleFontProjectFont(input);

	await saveGoogleFont(projectFont);
	loadGoogleFontStylesheet(projectFont);

	return {
		id: projectFont.id,
		source: projectFont.source,
		name: projectFont.family,
		cssFamily: projectFont.family,
		category: projectFont.category,
		variants: projectFont.variants,
		subsets: projectFont.subsets,
		axes: projectFont.axes,
		version: projectFont.version,
		lastModified: projectFont.lastModified,
		files: projectFont.files,
		faces: [],
		createdAt: projectFont.createdAt,
		updatedAt: projectFont.createdAt,
	};
}

export function loadGoogleFontStylesheet(input: {
	family: string;
	variants?: string[];
	axes?: FontAxis[];
}) {
	if (typeof document === "undefined") return;

	const cssUrl = createGoogleCssUrl(
		input.family,
		input.variants ?? [],
		input.axes,
	);
	const linkId = `google-font-${createGoogleFontId(input.family).replace(
		/[^a-z0-9-]/gi,
		"-",
	)}-${hashString(cssUrl)}`;

	if (
		loadedGoogleFontStylesheets.has(linkId) ||
		document.getElementById(linkId)
	) {
		loadedGoogleFontStylesheets.add(linkId);
		return;
	}

	const link = document.createElement("link");
	link.id = linkId;
	link.rel = "stylesheet";
	link.href = cssUrl;

	document.head.appendChild(link);
	loadedGoogleFontStylesheets.add(linkId);
}

export function getGoogleFontDefaultWeight(input: {
	variants?: string[];
	axes?: FontAxis[];
}) {
	const weightAxis = input.axes?.find((axis) => axis.tag === "wght");

	if (weightAxis) {
		if (
			weightAxis.defaultValue >= weightAxis.min &&
			weightAxis.defaultValue <= weightAxis.max
		) {
			return weightAxis.defaultValue;
		}

		return weightAxis.min;
	}

	const weights = getGoogleFontWeights(input.variants ?? []);

	return weights.includes(400) ? 400 : (weights[0] ?? 400);
}

function createGoogleCssUrl(
	familyName: string,
	variants: string[],
	axes?: FontAxis[],
) {
	const url = new URL("https://fonts.googleapis.com/css2");
	const family = familyName.trim().replace(/\s+/g, " ");
	const weightAxis = axes?.find((axis) => axis.tag === "wght");
	const hasItalic = variants.some((variant) => variant.includes("italic"));

	if (weightAxis) {
		url.searchParams.set(
			"family",
			hasItalic
				? `${family}:ital,wght@0,${weightAxis.min}..${weightAxis.max};1,${weightAxis.min}..${weightAxis.max}`
				: `${family}:wght@${weightAxis.min}..${weightAxis.max}`,
		);
	} else if (hasItalic) {
		const pairs = getGoogleFontVariantPairs(variants)
			.map(({ italic, weight }) => `${italic ? 1 : 0},${weight}`)
			.join(";");
		url.searchParams.set("family", `${family}:ital,wght@${pairs}`);
	} else {
		const weights = getGoogleFontWeights(variants);

		if (weights.length > 1) {
			url.searchParams.set("family", `${family}:wght@${weights.join(";")}`);
		} else if (weights.length === 1 && weights[0] !== 400) {
			url.searchParams.set("family", `${family}:wght@${weights[0]}`);
		} else {
			url.searchParams.set("family", family);
		}
	}

	url.searchParams.set("display", "swap");

	return url.toString();
}

function getGoogleFontVariantPairs(variants: string[]) {
	const pairs = variants.flatMap((variant) => {
		if (variant === "regular") {
			return [{ italic: false, weight: 400 }];
		}

		if (variant === "italic") {
			return [{ italic: true, weight: 400 }];
		}

		const match = /^(\d+)(italic)?$/.exec(variant);

		if (!match) return [];

		return [
			{
				italic: Boolean(match[2]),
				weight: Number(match[1]),
			},
		];
	});

	return Array.from(
		new Map(
			pairs
				.sort(
					(a, b) => Number(a.italic) - Number(b.italic) || a.weight - b.weight,
				)
				.map((pair) => [`${Number(pair.italic)}:${pair.weight}`, pair]),
		).values(),
	);
}

function getGoogleFontWeights(variants: string[]) {
	const weights = variants
		.map((variant) =>
			variant === "regular" ? 400 : Number.parseInt(variant, 10),
		)
		.filter((weight) => Number.isFinite(weight));

	return Array.from(new Set(weights)).sort((a, b) => a - b);
}

function hashString(value: string) {
	let hash = 0;

	for (let index = 0; index < value.length; index += 1) {
		hash = (hash << 5) - hash + value.charCodeAt(index);
		hash |= 0;
	}

	return Math.abs(hash).toString(36);
}

export async function uploadFontFiles(
	files: FileList | null,
	options: UploadFontFilesOptions = {},
) {
	if (!files?.length) return [];

	const validFiles = Array.from(files);
	validateFontFiles(validFiles);

	const existingFamilies = await getAllFontFamilies();

	const familyMap = new Map<string, StoredFontFamily>();
	const changedFamilyIds = new Set<string>();
	let addedFaceCount = 0;

	for (const family of existingFamilies) {
		if (family.source === "google") continue;

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
			if (
				typeof options.maxFamilies === "number" &&
				familyMap.size >= options.maxFamilies
			) {
				throw new Error(
					`Projects support up to ${options.maxFamilies} font ${options.maxFamilies === 1 ? "family" : "families"}. Remove one before adding another.`,
				);
			}

			const familyId = crypto.randomUUID();
			const now = new Date().toISOString();

			family = {
				id: familyId,
				source: "upload",
				name: parsed.familyName,
				cssFamily: createCssFontFamily(familyId),
				variants: [],
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
		changedFamilyIds.add(family.id);
		addedFaceCount += 1;
	}

	if (!addedFaceCount) {
		throw new Error("Those font faces are already in this project.");
	}

	const updatedFamilies = Array.from(familyMap.values());
	const faceCount = updatedFamilies.reduce(
		(total, family) => total + family.faces.length,
		0,
	);
	if (faceCount > MAX_PROJECT_FONT_FACES) {
		throw new Error(
			`Projects support up to ${MAX_PROJECT_FONT_FACES} font files. Remove unused faces before adding more.`,
		);
	}

	const changedFamilies = updatedFamilies.filter((item) =>
		changedFamilyIds.has(item.id),
	);

	for (const family of changedFamilies) {
		// Validate browser decoding before persisting, so a corrupt file cannot
		// poison future startup loads.
		await loadFontFamilyIntoDocument(family);
	}

	try {
		await saveFontFamilies(changedFamilies);
	} catch {
		throw new Error(
			"Fonts could not be saved in this browser. Free some site storage and try again.",
		);
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
