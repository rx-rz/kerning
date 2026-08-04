import type {
	FontFeatureSettings,
	FontVariationSettings,
	ProjectFontRole,
} from "#/features/editor/font-system/font-system.types";

export type FontLabSurface =
	| "glyph"
	| "word"
	| "pair"
	| "compare"
	| "font-details";

export type FontLabSource =
	| { type: "project-role"; role: ProjectFontRole }
	| { type: "card"; cardId: string }
	| { type: "text-node"; cardId: string; nodeId: string }
	| { type: "comparison-group"; groupId: string }
	| { type: "standalone" };

export type FontInspectionSelection =
	| { type: "node"; text: string }
	| { type: "text-range"; text: string; start: number; end: number }
	| { type: "code-point"; codePoint: number }
	| { type: "pair"; leftCodePoint: number; rightCodePoint: number };

export type FontLabLaunchContext = {
	surface: FontLabSurface;
	source: FontLabSource;
	fontId?: string;
	variantId?: string;
	role?: ProjectFontRole;
	sampleText?: string;
	selection?: FontInspectionSelection;
	selectedCodePoint?: number;
	selectedWord?: string;
	pair?: { leftCodePoint: number; rightCodePoint: number };
	returnTarget?: { cardId?: string; nodeId?: string };
	expandedSection?: "features" | "axes";
	sourceLabel?: string;
	textStyle?: {
		fontSize: number;
		fontWeight?: number;
		fontStyle?: "normal" | "italic";
		lineHeight: number;
		letterSpacing: number;
		textAlign: "left" | "center" | "right" | "justify";
		textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
		containerWidth?: number;
	};
	featureSettings?: FontFeatureSettings;
	variationSettings?: FontVariationSettings;
};

export type FontLabApplyTarget =
	| { type: "selected-node"; cardId: string; nodeId: string }
	| { type: "card-role"; cardId: string; role: ProjectFontRole }
	| { type: "project-role"; role: ProjectFontRole }
	| { type: "comparison-variant"; cardId: string; role: ProjectFontRole };

export type FontLabBrowserSettings = {
	featureSettings: FontFeatureSettings;
	variationSettings: FontVariationSettings;
	fontSize?: number;
	lineHeight?: number;
	letterSpacing?: number;
};
