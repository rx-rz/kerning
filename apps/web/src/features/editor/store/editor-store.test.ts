import { beforeEach, describe, expect, it } from "vitest";
import {
	createDefaultFill,
	createDefaultTextureFill,
	getCardFillStyle,
} from "#/features/editor/lib/card-fill";
import { getCardSizeFromAspectRatio } from "#/features/editor/lib/card-size";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { CardAspectRatio, EditorCard } from "#/features/editor/types";

function getCardAt(cards: EditorCard[], index: number) {
	const card = cards[index];

	if (!card) {
		throw new Error(`Expected a card at index ${index}`);
	}

	return card;
}

describe("getCardSizeFromAspectRatio", () => {
	it.each<[CardAspectRatio, number, number]>([
		["1:1", 500, 500],
		["4:5", 480, 600],
		["16:9", 640, 360],
		["9:16", 360, 640],
		["3:2", 600, 400],
		["business-card", 560, 320],
	])("returns the default size for %s", (aspectRatio, width, height) => {
		expect(getCardSizeFromAspectRatio(aspectRatio)).toEqual({ width, height });
	});
});

describe("card fills", () => {
	it("creates editable linear and radial gradient styles", () => {
		const linear = createDefaultFill("linear-gradient");
		const radial = createDefaultFill("radial-gradient");

		expect(getCardFillStyle(linear)).toEqual({
			backgroundImage: "linear-gradient(135deg, #FFFDF8 0%, #111111 100%)",
		});
		expect(getCardFillStyle(radial)).toEqual({
			backgroundImage:
				"radial-gradient(circle at 50% 50%, #FFFDF8 0%, #111111 100%)",
		});
	});

	it.each([
		"paper",
		"fluted-glass",
		"halftone",
		"halftone-cmyk",
	] as const)("creates serializable %s texture settings", (texture) => {
		const fill = createDefaultTextureFill(texture);

		expect(fill).toMatchObject({ type: "texture", texture });
		expect(() => JSON.stringify(fill)).not.toThrow();
	});

	it("creates image as a fill rather than a texture", () => {
		const fill = createDefaultFill("image");

		expect(fill).toMatchObject({
			type: "image",
			opacity: 0.35,
			settings: { image: "/splash.webp" },
		});
		expect(getCardFillStyle(fill)).toEqual({});
	});
});

describe("editor store", () => {
	beforeEach(() => {
		useEditorStore.getState().resetEditor();
	});

	it("starts with one selected business card", () => {
		const { cards, selectedCardId } = useEditorStore.getState();

		expect(cards).toHaveLength(1);
		expect(cards[0]).toMatchObject({
			name: "Untitled Card",
			width: 560,
			height: 320,
			settings: {
				aspectRatio: "business-card",
				fill: { type: "solid", color: "#FFFDF8" },
				texture: null,
				borderRadius: 10,
			},
		});
		expect(selectedCardId).toBe(cards[0]?.id);
	});

	it("adds text and image nodes with constrained defaults", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		useEditorStore.getState().addTextNode(card.id);
		useEditorStore.getState().addImageNode(card.id);

		const { cards, selectedNodeId } = useEditorStore.getState();
		expect(cards[0]?.nodes).toHaveLength(2);
		expect(cards[0]?.nodes[0]).toMatchObject({
			type: "text",
			fontType: "primary",
			fontSize: 20,
			x: 24,
			width: 220,
		});
		expect(cards[0]?.nodes[1]).toMatchObject({
			type: "image",
			width: 220,
			imageId: null,
		});
		expect(selectedNodeId).toBe(cards[0]?.nodes[1]?.id);
	});

	it("constrains node geometry to the card", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);
		const node = useEditorStore.getState().cards[0]?.nodes[0];
		if (!node) throw new Error("Expected a text node");

		useEditorStore.getState().updateNode(card.id, node.id, {
			x: 999,
			y: -20,
			width: 999,
		});

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			x: 3,
			y: 3,
			width: 549,
		});
	});

	it("reconstrains nodes when the card becomes smaller", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);

		useEditorStore.getState().updateCard(card.id, { width: 320 });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			x: 24,
			width: 220,
		});
	});

	it("adds and selects a new card", () => {
		useEditorStore.getState().addCard();
		const { cards, selectedCardId } = useEditorStore.getState();

		expect(cards).toHaveLength(2);
		expect(cards[1]).toMatchObject({
			name: "Untitled Card 2",
			width: 560,
			height: 320,
		});
		expect(selectedCardId).toBe(cards[1]?.id);
	});

	it("updates structural card fields and appearance settings", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		useEditorStore.getState().updateCard(card.id, { name: "Poster" });
		useEditorStore.getState().updateCardSettings(card.id, {
			fill: { type: "solid", color: "#111111" },
			borderRadius: 24,
		});

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			name: "Poster",
			settings: {
				fill: { type: "solid", color: "#111111" },
				borderRadius: 24,
			},
		});
	});

	it("clamps manually entered dimensions to the supported card bounds", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		useEditorStore.getState().updateCard(card.id, {
			width: 1200,
			height: 900,
		});

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			width: 640,
			height: 640,
		});
	});

	it("updates dimensions when the aspect ratio changes", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		useEditorStore
			.getState()
			.updateCardSettings(card.id, { aspectRatio: "4:5" });

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			width: 480,
			height: 600,
			settings: { aspectRatio: "4:5" },
		});
	});

	it("selects the nearest card after deleting the selection", () => {
		useEditorStore.getState().addCard();
		useEditorStore.getState().addCard();
		const cards = useEditorStore.getState().cards;
		const middleCard = getCardAt(cards, 1);

		useEditorStore.getState().selectCard(middleCard.id);
		useEditorStore.getState().deleteCard(middleCard.id);

		expect(useEditorStore.getState().selectedCardId).toBe(cards[2]?.id);
	});

	it("allows deleting the final card and reset restores a default card", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		useEditorStore.getState().deleteCard(card.id);
		expect(useEditorStore.getState()).toMatchObject({
			cards: [],
			selectedCardId: null,
		});

		useEditorStore.getState().resetEditor();
		expect(useEditorStore.getState().cards).toHaveLength(1);
		expect(useEditorStore.getState().selectedCardId).not.toBeNull();
	});
});
