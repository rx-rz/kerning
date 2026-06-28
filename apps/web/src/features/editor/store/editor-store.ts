import { createId } from "@paralleldrive/cuid2";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mutative } from "zustand-mutative";

import {
	clampCardHeight,
	clampCardWidth,
	getCardSizeFromAspectRatio,
} from "#/features/editor/lib/card-size";
import type {
	CardSettings,
	EditorCard,
	EditorNode,
	EditorNodePatch,
	ImageNode,
	TextNode,
} from "#/features/editor/types";

type EditorState = {
	cards: EditorCard[];
	selectedCardId: string | null;
	selectedNodeId: string | null;
	selectCard: (id: string | null) => void;
	selectNode: (cardId: string, nodeId: string) => void;
	addCard: () => void;
	deleteCard: (id: string) => void;
	updateCard: (id: string, patch: Partial<EditorCard>) => void;
	updateCardSettings: (id: string, patch: Partial<CardSettings>) => void;
	addTextNode: (cardId: string) => void;
	addImageNode: (cardId: string) => void;
	updateNode: (cardId: string, nodeId: string, patch: EditorNodePatch) => void;
	deleteNode: (cardId: string, nodeId: string) => void;
	resetEditor: () => void;
};

export const EDITOR_SESSION_STORAGE_KEY = "kerning-editor-session";
export const NODE_CARD_INSET = 3;

const fallbackStorage: Storage = {
	length: 0,
	clear: () => {},
	getItem: () => null,
	key: () => null,
	removeItem: () => {},
	setItem: () => {},
};

function createDefaultCard(name = "Untitled Card"): EditorCard {
	const { width, height } = getCardSizeFromAspectRatio("business-card");

	return {
		id: createId(),
		name,
		width,
		height,
		settings: { aspectRatio: "business-card" },
		background: "#fffdf8",
		borderRadius: 10,
		nodes: [],
	};
}

function createDefaultState() {
	const card = createDefaultCard();

	return {
		cards: [card],
		selectedCardId: card.id,
		selectedNodeId: null,
	};
}

function createDefaultTextNode(card: EditorCard): TextNode {
	const width = Math.min(220, Math.max(1, card.width - 48));

	return {
		id: createId(),
		type: "text",
		x: 24,
		y: 24,
		width,
		height: 58,
		text: "Double click to start editing...",
		fontType: "primary",
		fontSize: 20,
		fontWeight: 500,
		lineHeight: 1.1,
		color: "#111111",
		textAlign: "left",
	};
}

function createDefaultImageNode(card: EditorCard): ImageNode {
	const width = Math.min(220, Math.max(1, card.width - 48));

	return {
		id: createId(),
		type: "image",
		x: 24,
		y: 24,
		width,
		height: Math.min(160, Math.max(1, card.height - 48)),
		src: "",
		imageId: null,
		alt: "",
		objectFit: "cover",
		opacity: 1,
	};
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function constrainNode(
	node: EditorNode,
	card: Pick<EditorCard, "width" | "height">,
): EditorNode {
	const rightInset = node.type === "text" ? 8 : NODE_CARD_INSET;
	const availableWidth = Math.max(1, card.width - NODE_CARD_INSET - rightInset);
	const availableHeight = Math.max(1, card.height - NODE_CARD_INSET * 2);
	const width = clamp(node.width, 1, availableWidth);
	const height = clamp(node.height, 1, availableHeight);
	const x = clamp(node.x, NODE_CARD_INSET, card.width - rightInset - width);
	const y = clamp(
		node.y,
		NODE_CARD_INSET,
		card.height - NODE_CARD_INSET - height,
	);

	return { ...node, width, height, x, y };
}

function normalizeCard(card: EditorCard): EditorCard {
	const clampedCard = clampCardDimensions({ ...card, nodes: card.nodes ?? [] });

	return {
		...clampedCard,
		nodes: clampedCard.nodes.map((node) =>
			constrainNode(
				node.type === "image"
					? { ...node, imageId: node.imageId ?? null }
					: node,
				clampedCard,
			),
		),
	};
}

function getNextCardName(cards: EditorCard[]) {
	const existingNames = new Set(cards.map((card) => card.name));

	if (!existingNames.has("Untitled Card")) {
		return "Untitled Card";
	}

	let index = 2;

	while (existingNames.has(`Untitled Card ${index}`)) {
		index += 1;
	}

	return `Untitled Card ${index}`;
}

function clampCardDimensions(card: EditorCard): EditorCard {
	return {
		...card,
		width: clampCardWidth(card.width),
		height: clampCardHeight(card.height),
	};
}

function clampCardPatch(patch: Partial<EditorCard>): Partial<EditorCard> {
	return {
		...patch,
		...(patch.width === undefined
			? {}
			: { width: clampCardWidth(patch.width) }),
		...(patch.height === undefined
			? {}
			: { height: clampCardHeight(patch.height) }),
	};
}

export const useEditorStore = create<EditorState>()(
	persist(
		mutative((set) => ({
			...createDefaultState(),
			selectCard: (id) => set({ selectedCardId: id, selectedNodeId: null }),
			selectNode: (cardId, nodeId) =>
				set({ selectedCardId: cardId, selectedNodeId: nodeId }),
			addCard: () =>
				set((state) => {
					const card = createDefaultCard(getNextCardName(state.cards));

					state.cards.push(card);
					state.selectedCardId = card.id;
					state.selectedNodeId = null;
				}),
			deleteCard: (id) =>
				set((state) => {
					const deletedIndex = state.cards.findIndex((card) => card.id === id);

					if (deletedIndex === -1) {
						return;
					}

					const deletedSelectedCard = state.selectedCardId === id;
					state.cards.splice(deletedIndex, 1);

					if (deletedSelectedCard) {
						const nearestCard =
							state.cards[Math.min(deletedIndex, state.cards.length - 1)];
						state.selectedCardId = nearestCard?.id ?? null;
						state.selectedNodeId = null;
					}
				}),
			updateCard: (id, patch) =>
				set((state) => {
					const cardIndex = state.cards.findIndex((card) => card.id === id);

					if (cardIndex === -1) return;

					state.cards[cardIndex] = normalizeCard({
						...state.cards[cardIndex],
						...clampCardPatch(patch),
					});
				}),
			updateCardSettings: (id, patch) =>
				set((state) => {
					const cardIndex = state.cards.findIndex((card) => card.id === id);

					if (cardIndex === -1) return;

					const card = state.cards[cardIndex];
					const settings = { ...card.settings, ...patch };
					const size = patch.aspectRatio
						? getCardSizeFromAspectRatio(patch.aspectRatio)
						: {};

					state.cards[cardIndex] = normalizeCard({
						...card,
						...size,
						settings,
					});
				}),
			addTextNode: (cardId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);

					if (!card) return;

					const node = createDefaultTextNode(card);
					card.nodes.push(node);
					state.selectedCardId = cardId;
					state.selectedNodeId = node.id;
				}),
			addImageNode: (cardId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);

					if (!card) return;

					const node = createDefaultImageNode(card);
					card.nodes.push(node);
					state.selectedCardId = cardId;
					state.selectedNodeId = node.id;
				}),
			updateNode: (cardId, nodeId, patch) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					const nodeIndex =
						card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;

					if (!card || nodeIndex === -1) return;

					card.nodes[nodeIndex] = constrainNode(
						{ ...card.nodes[nodeIndex], ...patch } as EditorNode,
						card,
					);
				}),
			deleteNode: (cardId, nodeId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					const nodeIndex =
						card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;

					if (!card || nodeIndex === -1) return;

					card.nodes.splice(nodeIndex, 1);
					if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
				}),
			resetEditor: () => set(createDefaultState()),
		})),
		{
			name: EDITOR_SESSION_STORAGE_KEY,
			storage: createJSONStorage(() =>
				typeof window === "undefined" ? fallbackStorage : window.sessionStorage,
			),
			partialize: ({ cards, selectedCardId, selectedNodeId }) => ({
				cards,
				selectedCardId,
				selectedNodeId,
			}),
			merge: (persistedState, currentState) => {
				const persistedEditorState = persistedState as Partial<EditorState>;

				return {
					...currentState,
					...persistedEditorState,
					cards:
						persistedEditorState.cards?.map(normalizeCard) ??
						currentState.cards,
				};
			},
			skipHydration: true,
		},
	),
);
