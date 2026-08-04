import type { ProjectFontEntity } from "@kerning/shared";

export const PROJECT_FONT_ROLES = [
	"primary",
	"secondary-one",
	"secondary-two",
] as const;

export type ProjectFontRole = (typeof PROJECT_FONT_ROLES)[number];
export type FontFeatureSettings = Record<string, boolean>;
export type FontVariationSettings = Record<string, number>;

export type GlobalFontAdjustments = {
	familyName?: string;
	styleName?: string;
	ascender?: number;
	descender?: number;
	lineGap?: number;
};

export type GlyphAdjustment = {
	advanceWidth?: number;
	xOffset?: number;
	yOffset?: number;
	scaleX?: number;
	scaleY?: number;
};

export type KerningPairAdjustment = { value: number };

export type ProjectFontVariant = {
	id: string;
	name: string;
	sourceFontId: string;
	featureSettings: FontFeatureSettings;
	variationSettings: FontVariationSettings;
	globalAdjustments: GlobalFontAdjustments;
	glyphAdjustments: Record<string, GlyphAdjustment>;
	kerningAdjustments: Record<string, KerningPairAdjustment>;
};

export type ProjectFontRoleConfiguration = {
	role: ProjectFontRole;
	fontId: string;
	activeVariantId: string;
};

export type ProjectFontSystem = {
	roles: Record<ProjectFontRole, ProjectFontRoleConfiguration | null>;
	variants: Record<string, ProjectFontVariant>;
};

export type TextFontSource =
	| { type: "role"; role: ProjectFontRole }
	| { type: "font"; fontId: string; variantId?: string };

export type ResolvedProjectFont = {
	font: ProjectFontEntity;
	role?: ProjectFontRole;
	variant: ProjectFontVariant;
	familyName: string;
	featureSettings: FontFeatureSettings;
	variationSettings: FontVariationSettings;
	globalAdjustments: GlobalFontAdjustments;
	glyphAdjustments: Record<string, GlyphAdjustment>;
	kerningAdjustments: Record<string, KerningPairAdjustment>;
};

export type FontAdjustmentApplication =
	| "browser-css"
	| "technical-preview-only"
	| "requires-font-generation";

export const FONT_ADJUSTMENT_APPLICATION = {
	features: "browser-css",
	variations: "browser-css",
	globalMetrics: "requires-font-generation",
	glyphs: "requires-font-generation",
	kerning: "requires-font-generation",
} as const satisfies Record<string, FontAdjustmentApplication>;
