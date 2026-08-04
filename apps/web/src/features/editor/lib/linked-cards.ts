import type { ProjectFontEntity } from "@kerning/shared";
import { createVariant, resolveProjectFontRole } from "#/features/editor/font-system/font-system";
import type { ProjectFontRole, ProjectFontSystem, ResolvedProjectFont } from "#/features/editor/font-system/font-system.types";
import type { EditorCard, EditorNode, LinkedCardGroup } from "#/features/editor/types";

export function synchronizeLinkedNodeChange(group: LinkedCardGroup, sourceCardId: string, sourceNode: EditorNode, cards: EditorCard[]): EditorCard[] {
	if (!sourceNode.linkedNodeKey) return cards;
	return cards.map((card) => {
		if (card.id === sourceCardId || !group.cardIds.includes(card.id)) return card;
		const index = card.nodes.findIndex((node) => node.linkedNodeKey === sourceNode.linkedNodeKey && node.type === sourceNode.type);
		if (index < 0) return card;
		const target = card.nodes[index];
		let patch: Partial<EditorNode> = {};
		if (sourceNode.type === "text" && target?.type === "text") {
			if (group.sync.content) patch = { ...patch, text: sourceNode.text };
			if (group.sync.typographyStructure) patch = { ...patch, textAlign: sourceNode.textAlign, textCasing: sourceNode.textCasing };
		}
		if (sourceNode.type === "image" && target?.type === "image" && group.sync.images) patch = { ...patch, src:sourceNode.src,imageId:sourceNode.imageId,alt:sourceNode.alt,objectFit:sourceNode.objectFit,zoom:sourceNode.zoom,positionX:sourceNode.positionX,positionY:sourceNode.positionY,effects:sourceNode.effects,opacity:sourceNode.opacity,texture:sourceNode.texture };
		if (group.sync.layout) patch = { ...patch,x:sourceNode.x,y:sourceNode.y,width:sourceNode.width,height:sourceNode.height,rotation:sourceNode.rotation,positions:sourceNode.positions };
		const nodes = [...card.nodes]; nodes[index] = { ...target, ...patch } as EditorNode;
		return { ...card, nodes };
	});
}

export function synchronizeLinkedCardSettings(group: LinkedCardGroup, sourceCard: EditorCard, cards: EditorCard[]): EditorCard[] {
	if (!group.sync.cardStyle) return cards;
	return cards.map((card) => group.cardIds.includes(card.id) && card.id !== sourceCard.id ? { ...card,width:sourceCard.width,height:sourceCard.height,settings:structuredClone(sourceCard.settings) } : card);
}

export function resolveCardFontRole(card: EditorCard, role: ProjectFontRole, projectFontSystem: ProjectFontSystem, fonts: ProjectFontEntity[]): ResolvedProjectFont | null {
	const override = card.fontSystemOverrides?.roles?.[role];
	if (!override?.fontId) {
		const resolved = resolveProjectFontRole(projectFontSystem, role, fonts);
		if (!resolved || (!override?.featureSettings && !override?.variationSettings)) return resolved;
		return { ...resolved, featureSettings:{...resolved.featureSettings,...override.featureSettings}, variationSettings:{...resolved.variationSettings,...override.variationSettings} };
	}
	const font = fonts.find((item) => item.dbId === override.fontId || item.id === override.fontId);
	if (!font) return null;
	const variant = (override.variantId && projectFontSystem.variants[override.variantId]) || createVariant(font.dbId);
	return { font,role,variant,familyName:variant.globalAdjustments.familyName || font.cssFamily || font.family,featureSettings:{...variant.featureSettings,...override.featureSettings},variationSettings:{...variant.variationSettings,...override.variationSettings},globalAdjustments:variant.globalAdjustments,glyphAdjustments:variant.glyphAdjustments,kerningAdjustments:variant.kerningAdjustments };
}
