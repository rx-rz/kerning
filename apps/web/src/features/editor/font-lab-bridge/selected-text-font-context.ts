import type { ProjectFontEntity } from "@kerning/shared";
import { resolveTextNodeFont } from "#/features/editor/font-system/font-system";
import type {
	FontFeatureSettings,
	FontVariationSettings,
	ProjectFontRole,
	ProjectFontSystem,
	ResolvedProjectFont,
} from "#/features/editor/font-system/font-system.types";
import { resolveCardFontRole } from "#/features/editor/lib/linked-cards";
import type { EditorCard, TextNode } from "#/features/editor/types";

export type SelectedTextFontContext = {
	cardId: string;
	nodeId: string;
	node: TextNode;
	sourceType: "role" | "direct-font";
	role?: ProjectFontRole;
	fontId: string;
	variantId?: string;
	resolvedFont: ResolvedProjectFont;
	effectiveFeatureSettings: FontFeatureSettings;
	effectiveVariationSettings: FontVariationSettings;
	sampleText: string;
};

export function getTextNodeRole(node: TextNode): ProjectFontRole | undefined {
	if (node.fontSource?.type === "font") return undefined;
	if (node.fontSource?.type === "role") return node.fontSource.role;
	return node.fontType === "sec1"
		? "secondary-one"
		: node.fontType === "sec2"
			? "secondary-two"
			: "primary";
}

export function resolveSelectedTextFontContext({
	card,
	node,
	fontSystem,
	fonts,
}: {
	card: EditorCard;
	node: TextNode;
	fontSystem: ProjectFontSystem;
	fonts: ProjectFontEntity[];
}): SelectedTextFontContext | null {
	const role = getTextNodeRole(node);
	const resolvedFont = role
		? resolveCardFontRole(card, role, fontSystem, fonts)
		: resolveTextNodeFont(node, fontSystem, fonts);
	if (!resolvedFont) return null;
	return {
		cardId: card.id,
		nodeId: node.id,
		node,
		sourceType: role ? "role" : "direct-font",
		role,
		fontId: resolvedFont.font.dbId,
		variantId: resolvedFont.variant.id,
		resolvedFont,
		effectiveFeatureSettings: {
			...resolvedFont.featureSettings,
			...node.featureSettings,
		},
		effectiveVariationSettings: {
			...resolvedFont.variationSettings,
			...node.variationSettings,
		},
		sampleText: node.text,
	};
}
