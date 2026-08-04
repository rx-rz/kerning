import type { ProjectFontRole } from "#/features/editor/font-system/font-system.types";

export type TypographyWarningSeverity = "info" | "warning" | "error";
export type TypographyWarningCode =
	| "missing-character"
	| "unsupported-feature"
	| "unsupported-axis"
	| "axis-out-of-range"
	| "unassigned-role"
	| "technical-adjustment-not-generated"
	| "font-load-failed"
	| "font-variant-missing"
	| "detached-role"
	| "comparison-override-active";

export type TypographyWarningAction =
	| { type: "open-compare" }
	| { type: "open-glyph"; codePoint?: number }
	| { type: "open-features" }
	| { type: "open-axes" }
	| { type: "disable-feature"; tag: string }
	| { type: "clamp-axis"; tag: string; value: number }
	| { type: "reset-axis"; tag: string }
	| { type: "reset-card-override"; role: ProjectFontRole }
	| { type: "relink-role"; role: ProjectFontRole };

export type TypographyWarning = {
	id: string;
	code: TypographyWarningCode;
	severity: TypographyWarningSeverity;
	cardId: string;
	nodeId?: string;
	role?: ProjectFontRole;
	title: string;
	description: string;
	characters?: string[];
	featureTag?: string;
	axisTag?: string;
	action?: TypographyWarningAction;
};
