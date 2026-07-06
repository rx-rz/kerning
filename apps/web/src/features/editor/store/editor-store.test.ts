import { beforeEach, describe, expect, it } from "vitest";
import {
	createDefaultFill,
	createDefaultTextureFill,
	getCardFillStyle,
} from "#/features/editor/lib/card-fill";
import { getCardSizeFromAspectRatio } from "#/features/editor/lib/card-size";
import { useEditorStore } from "#/features/editor/store/editor-store";
import { EDITOR_TEMPLATES } from "#/features/editor/lib/editor-templates";
import { SHAPE_LIBRARY } from "#/features/editor/lib/shape-library";
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
			backgroundImage: "linear-gradient(135deg, #FFFDF8 1%, #111111 100%)",
		});
		expect(getCardFillStyle(radial)).toEqual({
			backgroundImage:
				"radial-gradient(circle at 50% 50%, #FFFDF8 1%, #111111 100%)",
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
			imageId: null,
			opacity: 0.35,
			settings: { backgroundSize: "cover", originX: 50, originY: 50 },
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
				fill: { type: "solid", color: "#FFFFFF" },
				texture: null,
				opacity: 1,
				blur: 0,
				borderWidth: 0,
				borderStyle: "solid",
				borderColor: "#000000",
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
			lineHeight: 1.1,
			letterSpacing: 0,
			textAlign: "left",
			textCasing: "none",
			x: 24,
			width: 220,
		});
		expect(cards[0]?.nodes[1]).toMatchObject({
			type: "image",
			width: 220,
			imageId: null,
			blendMode: "normal",
			zoom: 1,
			positionX: 50,
			positionY: 50,
			effects: {
				brightness: 100,
				contrast: 100,
				saturation: 100,
				blur: 0,
				grayscale: 0,
				sepia: 0,
			},
		});
		expect(selectedNodeId).toBe(cards[0]?.nodes[1]?.id);
	});

	it("offers exactly 200 categorized shapes and adds them as editable nodes", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		const shape = SHAPE_LIBRARY.find(({ type }) => type === "ellipse");
		if (!shape) throw new Error("Expected an ellipse shape");

		expect(SHAPE_LIBRARY).toHaveLength(200);
		expect(
			new Set(SHAPE_LIBRARY.map(({ category }) => category)).size,
		).toBeGreaterThan(4);
		useEditorStore.getState().addShapeNode(card.id, {
			shapeType: shape.type,
			shape: shape.value,
		});

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			type: "shape",
			shapeType: "ellipse",
			color: "#111111",
		});
	});

	it("applies templates as editable nodes with their intended aspect ratio", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		const album = EDITOR_TEMPLATES.find(({ id }) => id === "album-1");
		if (!album) throw new Error("Expected the first album template");

		useEditorStore.getState().applyTemplate(card.id, album.card);
		const templatedCard = getCardAt(useEditorStore.getState().cards, 0);

		expect(EDITOR_TEMPLATES).toHaveLength(40);
		expect(
			EDITOR_TEMPLATES.filter(({ category }) => category === "Album covers"),
		).toHaveLength(20);
		expect(
			EDITOR_TEMPLATES.filter(({ category }) => category === "Movie posters"),
		).toHaveLength(20);
		expect(
			EDITOR_TEMPLATES.every(
				({ card }) =>
					card.settings.fill.type === "image" &&
					card.nodes.some(({ type }) => type === "image"),
			),
		).toBe(true);
		expect(templatedCard).toMatchObject({
			id: card.id,
			name: "brat",
			width: 500,
			height: 500,
			settings: {
				aspectRatio: "1:1",
				fill: { type: "image", src: expect.stringContaining("cdn.cosmos.so") },
			},
		});
		expect(templatedCard.nodes.length).toBeGreaterThanOrEqual(5);
		expect(
			templatedCard.nodes.find(({ type }) => type === "text"),
		).toMatchObject({
			type: "text",
			text: "brat",
		});
		expect(templatedCard.nodes[0]?.id).not.toBe(album.card.nodes[0]?.id);
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
			x: 0,
			y: 0,
			width: 560,
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
			opacity: 0.75,
			blur: 4,
			borderWidth: 2,
			borderStyle: "dashed",
			borderColor: "#FF0000",
		});

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			name: "Poster",
			settings: {
				fill: { type: "solid", color: "#111111" },
				opacity: 0.75,
				blur: 4,
				borderWidth: 2,
				borderStyle: "dashed",
				borderColor: "#FF0000",
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

	it("keeps the final card so every project always has a card", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		useEditorStore.getState().deleteCard(card.id);
		expect(useEditorStore.getState().cards).toHaveLength(1);
		expect(useEditorStore.getState().selectedCardId).toBe(card.id);

		useEditorStore.getState().resetEditor();
		expect(useEditorStore.getState().cards).toHaveLength(1);
		expect(useEditorStore.getState().selectedCardId).not.toBeNull();
	});
});
