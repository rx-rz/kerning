import type { ProjectFontEntity } from "@kerning/shared";
import type { TextNode } from "#/features/editor/types";
import {
	PROJECT_FONT_ROLES,
	type FontFeatureSettings,
	type FontVariationSettings,
	type ProjectFontRole,
	type ProjectFontSystem,
	type ProjectFontVariant,
	type ResolvedProjectFont,
} from "./font-system.types";

const TAG = /^[A-Za-z0-9]{4}$/;
const GLYPH_KEY = /^(?:gid:\d+|u\+[0-9a-f]{1,6})$/i;
const PAIR_KEY = /^(?:gid:\d+|u\+[0-9a-f]{1,6})\|(?:gid:\d+|u\+[0-9a-f]{1,6})$/i;

export function isOpenTypeTag(value: string): boolean {
	return TAG.test(value);
}

export function isProjectFontRole(value: unknown): value is ProjectFontRole {
	return PROJECT_FONT_ROLES.includes(value as ProjectFontRole);
}

export function isGlyphKey(value: string): boolean {
	return GLYPH_KEY.test(value);
}

export function isKerningPairKey(value: string): boolean {
	return PAIR_KEY.test(value);
}

export function createEmptyFontSystem(): ProjectFontSystem {
	return {
		roles: { primary: null, "secondary-one": null, "secondary-two": null },
		variants: {},
	};
}

export function createVariant(fontId: string): ProjectFontVariant {
	return {
		id: `variant:${fontId}:project`,
		name: "Project Variant",
		sourceFontId: fontId,
		featureSettings: {},
		variationSettings: {},
		globalAdjustments: {},
		glyphAdjustments: {},
		kerningAdjustments: {},
	};
}

function finiteRecord(value: unknown): Record<string, number> {
	if (!value || typeof value !== "object") return {};
	return Object.fromEntries(
		Object.entries(value).filter(
			([tag, number]) => isOpenTypeTag(tag) && Number.isFinite(number),
		),
	) as Record<string, number>;
}

export function sanitizeFontSystem(value: unknown): ProjectFontSystem {
	const empty = createEmptyFontSystem();
	if (!value || typeof value !== "object") return empty;
	const input = value as Partial<ProjectFontSystem>;
	const variants: Record<string, ProjectFontVariant> = {};
	for (const [id, candidate] of Object.entries(input.variants ?? {})) {
		if (!candidate || typeof candidate !== "object" || !id) continue;
		const sourceFontId = String(candidate.sourceFontId ?? "");
		if (!sourceFontId) continue;
		variants[id] = {
			...createVariant(sourceFontId),
			id,
			name: String(candidate.name || "Project Variant"),
			featureSettings: Object.fromEntries(
				Object.entries(candidate.featureSettings ?? {}).filter(
					([tag, enabled]) => isOpenTypeTag(tag) && typeof enabled === "boolean",
				),
			),
			variationSettings: finiteRecord(candidate.variationSettings),
			globalAdjustments: Object.fromEntries(
				Object.entries(candidate.globalAdjustments ?? {}).filter(
					([key, item]) =>
						(key === "familyName" || key === "styleName")
							? typeof item === "string"
							: Number.isFinite(item),
				),
			),
			glyphAdjustments: Object.fromEntries(
				Object.entries(candidate.glyphAdjustments ?? {}).flatMap(([key, adjustment]) =>
					isGlyphKey(key) && adjustment && typeof adjustment === "object"
						? [[key, Object.fromEntries(Object.entries(adjustment).filter(([, item]) => Number.isFinite(item)))]]
						: [],
				),
			),
			kerningAdjustments: Object.fromEntries(
				Object.entries(candidate.kerningAdjustments ?? {}).filter(
					([key, adjustment]) =>
						isKerningPairKey(key) && Number.isFinite(adjustment?.value),
				),
			),
		};
	}
	for (const role of PROJECT_FONT_ROLES) {
		const config = input.roles?.[role];
		if (
			config &&
			config.role === role &&
			typeof config.fontId === "string" &&
			variants[config.activeVariantId]?.sourceFontId === config.fontId
		) empty.roles[role] = { ...config };
	}
	return { roles: empty.roles, variants };
}

export function getFontFeatureSettingsCss(
	settings: FontFeatureSettings,
): string | undefined {
	const entries = Object.entries(settings)
		.filter(([tag, enabled]) => isOpenTypeTag(tag) && typeof enabled === "boolean")
		.sort(([a], [b]) => a.localeCompare(b));
	return entries.length
		? entries.map(([tag, enabled]) => `"${tag}" ${enabled ? 1 : 0}`).join(", ")
		: undefined;
}

export function getFontVariationSettingsCss(
	settings: FontVariationSettings,
): string | undefined {
	const entries = Object.entries(settings)
		.filter(([tag, value]) => isOpenTypeTag(tag) && Number.isFinite(value))
		.sort(([a], [b]) => a.localeCompare(b));
	return entries.length
		? entries.map(([tag, value]) => `"${tag}" ${value}`).join(", ")
		: undefined;
}

export function resolveProjectFontRole(
	fontSystem: ProjectFontSystem,
	role: ProjectFontRole,
	fonts: ProjectFontEntity[],
): ResolvedProjectFont | null {
	const config = fontSystem.roles[role];
	if (!config) return null;
	return resolveVariant(config.fontId, config.activeVariantId, fonts, fontSystem, role);
}

function resolveVariant(
	fontId: string,
	variantId: string | undefined,
	fonts: ProjectFontEntity[],
	fontSystem: ProjectFontSystem,
	role?: ProjectFontRole,
): ResolvedProjectFont | null {
	const font = fonts.find((item) => item.dbId === fontId || item.id === fontId);
	const variant = variantId
		? fontSystem.variants[variantId]
		: createVariant(fontId);
	if (!font || !variant || variant.sourceFontId !== fontId) return null;
	return {
		font,
		role,
		variant,
		familyName: variant.globalAdjustments.familyName || font.cssFamily || font.family,
		featureSettings: variant.featureSettings,
		variationSettings: variant.variationSettings,
		globalAdjustments: variant.globalAdjustments,
		glyphAdjustments: variant.glyphAdjustments,
		kerningAdjustments: variant.kerningAdjustments,
	};
}

export function resolveTextNodeFont(
	node: TextNode,
	fontSystem: ProjectFontSystem,
	fonts: ProjectFontEntity[],
): ResolvedProjectFont | null {
	const source = node.fontSource;
	if (source?.type === "font")
		return resolveVariant(source.fontId, source.variantId, fonts, fontSystem);
	const legacyRole =
		node.fontType === "sec1"
			? "secondary-one"
			: node.fontType === "sec2"
				? "secondary-two"
				: "primary";
	return resolveProjectFontRole(
		fontSystem,
		source?.type === "role" ? source.role : legacyRole,
		fonts,
	);
}

export function isVariantModified(variant: ProjectFontVariant): boolean {
	return Boolean(
		Object.keys(variant.featureSettings).length ||
			Object.keys(variant.variationSettings).length ||
			Object.keys(variant.globalAdjustments).length ||
			Object.keys(variant.glyphAdjustments).length ||
			Object.keys(variant.kerningAdjustments).length,
	);
}
