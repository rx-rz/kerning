import { beforeEach, describe, expect, it } from "vitest";
import {
	createDefaultFill,
	createDefaultTextureFill,
	getCardFillStyle,
} from "#/features/editor/lib/card-fill";
import { getCardSizeFromAspectRatio } from "#/features/editor/lib/card-size";
import { EDITOR_TEMPLATES } from "#/features/editor/lib/editor-templates";
import { SHAPE_LIBRARY } from "#/features/editor/lib/shape-library";
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
			backgroundImage: "linear-gradient(135deg, #FFFDF8 1%, #046A63 100%)",
		});
		expect(getCardFillStyle(radial)).toEqual({
			backgroundImage:
				"radial-gradient(circle at 50% 50%, #FFFDF8 1%, #046A63 100%)",
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
			color: "#000000",
			fontType: "primary",
			fontSource: { type: "role", role: "primary" },
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

	it("places a linked glyph study in the centre of its source card", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);

		const nodeId = useEditorStore
			.getState()
			.placeTypeStudy(card.id, { text: "&", role: "secondary-one" });

		const { cards, selectedCardId, selectedNodeId } = useEditorStore.getState();
		const study = cards[0]?.nodes.find(({ id }) => id === nodeId);
		expect(study).toMatchObject({
			id: nodeId,
			type: "text",
			text: "&",
			fontType: "sec1",
			fontSource: { type: "role", role: "secondary-one" },
			textAlign: "center",
			lineHeight: 1,
			fontSize: 20,
			color: "#000000",
		});
		expect(selectedCardId).toBe(card.id);
		expect(selectedNodeId).toBe(nodeId);
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
			color: "#046A63",
			strokeWidth: 1,
		});
	});

	it("applies templates as editable nodes with their intended aspect ratio", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		const album = EDITOR_TEMPLATES.find(({ id }) => id === "album-1");
		if (!album) throw new Error("Expected the first album template");

		useEditorStore.getState().applyTemplate(card.id, album.card);
		const templatedCard = getCardAt(useEditorStore.getState().cards, 0);

		expect(EDITOR_TEMPLATES).toHaveLength(120);
		expect(
			EDITOR_TEMPLATES.filter(({ category }) => category === "Album covers"),
		).toHaveLength(20);
		expect(
			EDITOR_TEMPLATES.filter(({ category }) => category === "Movie posters"),
		).toHaveLength(30);
		expect(
			EDITOR_TEMPLATES.filter(({ category }) => category === "Business cards"),
		).toHaveLength(20);
		expect(
			EDITOR_TEMPLATES.filter(({ category }) => category === "Pitch decks"),
		).toHaveLength(30);
		expect(
			EDITOR_TEMPLATES.filter(
				({ category }) => category === "Typography specimens",
			),
		).toHaveLength(20);
		const refreshedTemplates = EDITOR_TEMPLATES.filter(
			({ category }) =>
				category !== "Pitch decks" && category !== "Movie posters",
		);
		expect(
			refreshedTemplates.every(
				({ card }) => card.settings.fill.type === "solid",
			),
		).toBe(true);
		expect(
			refreshedTemplates.every(({ card }) =>
				card.nodes.every(
					(node) =>
						Number.isInteger(node.x) &&
						Number.isInteger(node.y) &&
						Number.isInteger(node.width) &&
						Number.isInteger(node.height),
				),
			),
		).toBe(true);
		expect(
			refreshedTemplates.every(({ card }) =>
				card.nodes.every(
					(node) =>
						node.type !== "shape" ||
						node.width < card.width ||
						node.height < card.height,
				),
			),
		).toBe(true);
		expect(
			EDITOR_TEMPLATES.filter(
				({ category }) => category === "Business cards",
			).every(
				({ aspectRatio, card }) =>
					aspectRatio === "business-card" &&
					card.width === 560 &&
					card.height === 320,
			),
		).toBe(true);
		expect(
			EDITOR_TEMPLATES.filter(
				({ category }) => category === "Business cards",
			).filter(({ card }) => card.nodes.some(({ type }) => type === "image")),
		).toHaveLength(7);
		expect(
			EDITOR_TEMPLATES.filter(
				({ category }) => category === "Pitch decks",
			).every(
				({ aspectRatio, card }) =>
					aspectRatio === "16:9" && card.width === 640 && card.height === 360,
			),
		).toBe(true);
		const typographyCards = EDITOR_TEMPLATES.filter(
			({ category }) => category === "Typography specimens",
		);
		expect(typographyCards).toHaveLength(20);
		expect(
			typographyCards.every(
				({ card }) =>
					card.settings.fill.type === "solid" &&
					card.settings.aspectRatio === "4:5",
			),
		).toBe(true);
		expect(
			EDITOR_TEMPLATES.every(({ card }) =>
				card.nodes.every(
					(node) => node.type !== "text" || node.fontSource?.type === "role",
				),
			),
		).toBe(true);
		expect(
			EDITOR_TEMPLATES.filter(
				({ category }) => category === "Pitch decks",
			).every(({ card }) => card.nodes.some(({ type }) => type === "image")),
		).toBe(true);
		expect(templatedCard).toMatchObject({
			id: card.id,
			name: "Swiss Modernism",
			width: 500,
			height: 500,
			settings: {
				aspectRatio: "1:1",
				fill: { type: "solid", color: "#F2F1EC" },
			},
		});
		expect(templatedCard.nodes.length).toBeGreaterThanOrEqual(3);
		expect(
			templatedCard.nodes.find(({ type }) => type === "text"),
		).toMatchObject({
			type: "text",
			text: "CONCRETE / AIR",
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

	it("keeps independent node coordinates for each aspect ratio", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);
		const nodeId = useEditorStore.getState().cards[0]?.nodes[0]?.id;
		if (!nodeId) throw new Error("Expected a text node");

		useEditorStore.getState().updateNode(card.id, nodeId, { x: 300, y: 200 });
		useEditorStore
			.getState()
			.updateCardSettings(card.id, { aspectRatio: "9:16" });
		useEditorStore.getState().updateNode(card.id, nodeId, { x: 80, y: 400 });
		useEditorStore
			.getState()
			.updateCardSettings(card.id, { aspectRatio: "business-card" });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			x: 300,
			y: 200,
			positions: {
				"business-card": { x: 300, y: 200 },
				"9:16": { x: 80, y: 400 },
			},
		});
	});

	it("stores node rotation and undoes and redoes changes per card", () => {
		const firstCard = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(firstCard.id);
		const nodeId = useEditorStore.getState().cards[0]?.nodes[0]?.id;
		if (!nodeId) throw new Error("Expected a text node");
		useEditorStore
			.getState()
			.updateNode(firstCard.id, nodeId, { rotation: 90 });

		useEditorStore.getState().addCard();
		const secondCard = getCardAt(useEditorStore.getState().cards, 1);
		useEditorStore.getState().updateCard(secondCard.id, { name: "Second" });
		useEditorStore.getState().undo(firstCard.id);

		expect(useEditorStore.getState().cards[0]?.nodes[0]?.rotation).toBe(0);
		expect(useEditorStore.getState().cards[1]?.name).toBe("Second");

		useEditorStore.getState().redo(firstCard.id);
		expect(useEditorStore.getState().cards[0]?.nodes[0]?.rotation).toBe(90);
	});

	it("clamps freeform node rotation between zero and 360 degrees", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);
		const nodeId = useEditorStore.getState().cards[0]?.nodes[0]?.id;
		if (!nodeId) throw new Error("Expected a text node");

		useEditorStore.getState().updateNode(card.id, nodeId, { rotation: 420 });
		expect(useEditorStore.getState().cards[0]?.nodes[0]?.rotation).toBe(360);

		useEditorStore.getState().updateNode(card.id, nodeId, { rotation: -15 });
		expect(useEditorStore.getState().cards[0]?.nodes[0]?.rotation).toBe(0);
	});

	it("coalesces a node interaction into one undo step", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);
		const nodeId = useEditorStore.getState().cards[0]?.nodes[0]?.id;
		if (!nodeId) throw new Error("Expected a text node");
		useEditorStore.getState().beginHistoryTransaction(card.id);
		useEditorStore.getState().updateNode(card.id, nodeId, { x: 50 });
		useEditorStore.getState().updateNode(card.id, nodeId, { x: 100 });
		useEditorStore.getState().endHistoryTransaction(card.id);

		expect(useEditorStore.getState().cardHistories[card.id]?.past).toHaveLength(
			2,
		);
		useEditorStore.getState().undo(card.id);
		expect(useEditorStore.getState().cards[0]?.nodes[0]?.x).toBe(24);
	});

	it("applies Font Lab browser settings to one node as one undo step", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);
		const node = useEditorStore.getState().cards[0]?.nodes[0];
		if (!node || node.type !== "text") throw new Error("Expected a text node");
		useEditorStore.getState().applyBrowserFontSettings(
			{ type: "selected-node", cardId: card.id, nodeId: node.id },
			{
				featureSettings: { ss01: true, liga: false },
				variationSettings: { wght: 650 },
				fontSize: 32,
				lineHeight: 1.3,
				letterSpacing: -0.5,
			},
		);
		const applied = useEditorStore.getState().cards[0]?.nodes[0];
		expect(applied).toMatchObject({
			featureSettings: { ss01: true, liga: false },
			variationSettings: { wght: 650 },
			fontSize: 32,
			lineHeight: 1.3,
			letterSpacing: -0.5,
		});
		useEditorStore.getState().undo(card.id);
		expect(useEditorStore.getState().cards[0]?.nodes[0]).not.toHaveProperty(
			"featureSettings",
		);
	});

	it("applies an explicit comparison font choice only to the source block", () => {
		const card = getCardAt(useEditorStore.getState().cards, 0);
		useEditorStore.getState().addTextNode(card.id);
		const node = useEditorStore.getState().cards[0]?.nodes[0];
		if (!node || node.type !== "text") throw new Error("Expected a text node");

		useEditorStore.getState().setTextNodeFontSource(card.id, node.id, {
			type: "font",
			fontId: "comparison-font",
		});

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			fontSource: { type: "font", fontId: "comparison-font" },
			fontSize: node.fontSize,
			lineHeight: node.lineHeight,
			letterSpacing: node.letterSpacing,
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
