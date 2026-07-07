import { createId } from "@paralleldrive/cuid2";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mutative } from "zustand-mutative";
import {
	createDefaultFill,
	normalizeCardFillPercentages,
} from "#/features/editor/lib/card-fill";
import {
	clampCardHeight,
	clampCardWidth,
	getCardSizeFromAspectRatio,
} from "#/features/editor/lib/card-size";
import type {
	CardAspectRatio,
	CardFill,
	CardSettings,
	EditorCard,
	EditorNode,
	EditorNodePatch,
	ImageCardFill,
	ImageNode,
	ShapeNode,
	TextNode,
	TextureCardFill,
} from "#/features/editor/types";

type CardHistorySnapshot = {
	card: EditorCard;
	selectedNodeId: string | null;
};

type CardHistory = {
	past: CardHistorySnapshot[];
	future: CardHistorySnapshot[];
	transactionStart: CardHistorySnapshot | null;
};

type EditorState = {
	cards: EditorCard[];
	selectedCardId: string | null;
	selectedNodeId: string | null;
	cardHistories: Record<string, CardHistory>;
	selectCard: (id: string | null) => void;
	selectNode: (cardId: string, nodeId: string) => void;
	addCard: () => void;
	deleteCard: (id: string) => void;
	updateCard: (id: string, patch: Partial<EditorCard>) => void;
	updateCardSettings: (id: string, patch: Partial<CardSettings>) => void;
	addTextNode: (cardId: string) => void;
	addImageNode: (cardId: string) => void;
	addShapeNode: (
		cardId: string,
		shape: Pick<ShapeNode, "shapeType" | "shape">,
	) => void;
	applyTemplate: (cardId: string, template: EditorCard) => void;
	updateNode: (cardId: string, nodeId: string, patch: EditorNodePatch) => void;
	deleteNode: (cardId: string, nodeId: string) => void;
	reorderNode: (cardId: string, nodeId: string, targetIndex: number) => void;
	beginHistoryTransaction: (cardId: string) => void;
	endHistoryTransaction: (cardId: string) => void;
	undo: (cardId: string) => void;
	redo: (cardId: string) => void;
	resetEditor: () => void;
};

export const EDITOR_SESSION_STORAGE_KEY = "kerning-editor-session";
export const NODE_CARD_INSET = 0;
export const DEFAULT_NODE_COLOR = "#046A63";
const HISTORY_LIMIT = 100;

function cloneCard(card: EditorCard): EditorCard {
	// Store documents are JSON-safe; JSON cloning also unwraps mutative's draft proxies.
	return JSON.parse(JSON.stringify(card)) as EditorCard;
}

function snapshotCard(
	state: Pick<EditorState, "cards" | "selectedCardId" | "selectedNodeId">,
	cardId: string,
): CardHistorySnapshot | null {
	const card = state.cards.find(({ id }) => id === cardId);
	if (!card) return null;
	return {
		card: cloneCard(card),
		selectedNodeId:
			state.selectedCardId === cardId ? state.selectedNodeId : null,
	};
}

function getCardHistory(state: EditorState, cardId: string): CardHistory {
	const existing = state.cardHistories[cardId];
	if (existing) return existing;
	const history = {
		past: [],
		future: [],
		transactionStart: null,
	};
	state.cardHistories[cardId] = history;
	return history;
}

function recordCardHistory(state: EditorState, cardId: string) {
	const history = getCardHistory(state, cardId);
	if (history.transactionStart) return;
	const snapshot = snapshotCard(state, cardId);
	if (!snapshot) return;
	history.past.push(snapshot);
	if (history.past.length > HISTORY_LIMIT) history.past.shift();
	history.future = [];
}

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
		positions: { [card.settings.aspectRatio]: { x: 24, y: 24 } },
		rotation: 0,
		text: "Double click to start editing...",
		fontType: "primary",
		fontSize: 20,
		fontWeight: 500,
		lineHeight: 1.1,
		letterSpacing: 0,
		color: DEFAULT_NODE_COLOR,
		textAlign: "left",
		textCasing: "none",
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
		positions: { [card.settings.aspectRatio]: { x: 24, y: 24 } },
		rotation: 0,
		src: "",
		imageId: null,
		alt: "",
		objectFit: "cover",
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
		opacity: 1,
		texture: null,
	};
}

function createDefaultShapeNode(
	card: EditorCard,
	shape: Pick<ShapeNode, "shapeType" | "shape">,
): ShapeNode {
	const size = Math.min(
		120,
		Math.max(24, Math.min(card.width, card.height) / 3),
	);

	return {
		id: createId(),
		type: "shape",
		x: 24,
		y: 24,
		width: shape.shapeType === "line" ? Math.min(180, card.width - 48) : size,
		height: shape.shapeType === "line" ? 32 : size,
		positions: { [card.settings.aspectRatio]: { x: 24, y: 24 } },
		rotation: 0,
		shapeType: shape.shapeType,
		shape: shape.shape,
		color: DEFAULT_NODE_COLOR,
		strokeWidth: 1,
		texture: null,
	};
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function constrainNode(
	node: EditorNode,
	card: Pick<EditorCard, "width" | "height">,
): EditorNode {
	const availableWidth = Math.max(1, card.width - NODE_CARD_INSET * 2);
	const availableHeight = Math.max(1, card.height - NODE_CARD_INSET * 2);
	const width = clamp(node.width, 1, availableWidth);
	const height = clamp(node.height, 1, availableHeight);
	const x = clamp(
		node.x,
		NODE_CARD_INSET,
		card.width - NODE_CARD_INSET - width,
	);
	const y = clamp(
		node.y,
		NODE_CARD_INSET,
		card.height - NODE_CARD_INSET - height,
	);

	return {
		...node,
		width,
		height,
		x,
		y,
		rotation: clamp(node.rotation ?? 0, 0, 360),
	};
}

function normalizeCard(card: EditorCard): EditorCard {
	const clampedCard = clampCardDimensions({
		...card,
		settings: {
			...card.settings,
			fill: normalizeCardFillPercentages(card.settings.fill),
			opacity: card.settings.opacity ?? 1,
			blur: clamp(card.settings.blur ?? 0, 0, 10),
			borderWidth: card.settings.borderWidth ?? 0,
			borderStyle: card.settings.borderStyle ?? "solid",
			borderColor: card.settings.borderColor ?? "#000000",
		},
		nodes: card.nodes ?? [],
	});

	return {
		...clampedCard,
		nodes: clampedCard.nodes
			.map((node) =>
				constrainNode(
					node.type === "image"
						? {
								...node,
								imageId: node.imageId ?? null,
								zoom: node.zoom ?? 1,
								positionX: node.positionX ?? 50,
								positionY: node.positionY ?? 50,
								effects: {
									brightness: node.effects?.brightness ?? 100,
									contrast: node.effects?.contrast ?? 100,
									saturation: node.effects?.saturation ?? 100,
									blur: node.effects?.blur ?? 0,
									grayscale: node.effects?.grayscale ?? 0,
									sepia: node.effects?.sepia ?? 0,
								},
							}
						: node.type === "text"
							? {
									...node,
									letterSpacing: node.letterSpacing ?? 0,
									textAlign: node.textAlign ?? "left",
									textCasing: node.textCasing ?? "none",
								}
							: {
									...node,
									shapeType: node.shapeType ?? "icon",
									shape: node.shape ?? "circle",
									color: node.color ?? DEFAULT_NODE_COLOR,
									strokeWidth: node.strokeWidth ?? 1,
									texture: node.texture ?? null,
								},
					clampedCard,
				),
			)
			.map((node) => ({
				...node,
				rotation: node.rotation ?? 0,
				positions: {
					...(node.positions ?? {}),
					[clampedCard.settings.aspectRatio]: { x: node.x, y: node.y },
				},
			})),
	};
}

function switchNodeAspectRatio(
	node: EditorNode,
	from: CardAspectRatio,
	to: CardAspectRatio,
	card: Pick<EditorCard, "width" | "height">,
): EditorNode {
	const positions = {
		...(node.positions ?? {}),
		[from]: { x: node.x, y: node.y },
	};
	const target = positions[to] ?? { x: node.x, y: node.y };
	const constrained = constrainNode({ ...node, ...target, positions }, card);

	return {
		...constrained,
		positions: {
			...positions,
			[to]: { x: constrained.x, y: constrained.y },
		},
	};
}

type LegacyTextureFill = {
	type: "texture";
	texture: TextureCardFill["texture"] | "image-dithering" | "water" | "dither";
	opacity?: number;
	settings: unknown;
};

type LegacyEditorCard = Omit<EditorCard, "settings"> & {
	background?: string;
	borderRadius?: number;
	settings: Partial<Omit<CardSettings, "fill">> &
		Pick<CardSettings, "aspectRatio"> & {
			fill?: CardFill | LegacyTextureFill;
		};
};

function migrateTexture(
	texture: LegacyTextureFill | TextureCardFill | null | undefined,
): TextureCardFill | null {
	if (!texture || texture.texture === "water") return null;
	if (texture.texture === "dither" || texture.texture === "image-dithering")
		return null;

	return {
		...texture,
		opacity: texture.opacity ?? 0.35,
	} as TextureCardFill;
}

function migrateImageFill(fill: {
	imageId?: string | null;
	src?: string;
	opacity?: number;
}): ImageCardFill {
	const defaultFill = createDefaultFill("image") as ImageCardFill;
	const migratedFill: ImageCardFill = {
		...defaultFill,
		imageId: fill.imageId ?? null,
		opacity: fill.opacity ?? defaultFill.opacity,
	};

	if (fill.src === undefined) delete migratedFill.src;
	else migratedFill.src = fill.src;

	return migratedFill;
}

function migrateCardAppearance(card: LegacyEditorCard): EditorCard {
	const {
		background,
		borderRadius,
		settings: legacySettings,
		...structuralCard
	} = card;
	const legacyTexture =
		legacySettings.texture ??
		(legacySettings.fill?.type === "texture" ? legacySettings.fill : null);
	const imageTexture =
		legacyTexture?.texture === "image-dithering" ||
		legacyTexture?.texture === "dither"
			? legacyTexture
			: null;

	return {
		...structuralCard,
		settings: {
			aspectRatio: legacySettings.aspectRatio,
			fill: imageTexture
				? migrateImageFill(imageTexture)
				: legacySettings.fill?.type === "image"
					? migrateImageFill(legacySettings.fill)
					: legacySettings.fill?.type !== "texture"
						? (legacySettings.fill ?? {
								type: "solid",
								color: background ?? "#FFFDF8",
							})
						: { type: "solid", color: background ?? "#FFFDF8" },
			texture: migrateTexture(legacyTexture),
			opacity: legacySettings.opacity ?? 1,
			blur: legacySettings.blur ?? 0,
			borderWidth: legacySettings.borderWidth ?? 0,
			borderStyle: legacySettings.borderStyle ?? "solid",
			borderColor: legacySettings.borderColor ?? "#000000",
		},
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
			cardHistories: {},
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

					if (deletedIndex === -1 || state.cards.length === 1) {
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
					recordCardHistory(state, id);

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
					recordCardHistory(state, id);
					const settings = { ...card.settings, ...patch };
					const size = patch.aspectRatio
						? getCardSizeFromAspectRatio(patch.aspectRatio)
						: {};

					const nextCard = normalizeCard({
						...card,
						...size,
						settings,
					});
					state.cards[cardIndex] = patch.aspectRatio
						? {
								...nextCard,
								nodes: card.nodes.map((node) =>
									switchNodeAspectRatio(
										node,
										card.settings.aspectRatio,
										patch.aspectRatio as CardAspectRatio,
										nextCard,
									),
								),
							}
						: nextCard;
				}),
			addTextNode: (cardId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);

					if (!card) return;
					recordCardHistory(state, cardId);

					const node = createDefaultTextNode(card);
					card.nodes.push(node);
					state.selectedCardId = cardId;
					state.selectedNodeId = node.id;
				}),
			addImageNode: (cardId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);

					if (!card) return;
					recordCardHistory(state, cardId);

					const node = createDefaultImageNode(card);
					card.nodes.push(node);
					state.selectedCardId = cardId;
					state.selectedNodeId = node.id;
				}),
			addShapeNode: (cardId, shape) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);

					if (!card) return;
					recordCardHistory(state, cardId);

					const node = createDefaultShapeNode(card, shape);
					card.nodes.push(node);
					state.selectedCardId = cardId;
					state.selectedNodeId = node.id;
				}),
			applyTemplate: (cardId, template) =>
				set((state) => {
					const cardIndex = state.cards.findIndex(({ id }) => id === cardId);
					if (cardIndex === -1) return;
					recordCardHistory(state, cardId);

					state.cards[cardIndex] = normalizeCard({
						...template,
						id: cardId,
						nodes: template.nodes.map((node) => ({ ...node, id: createId() })),
					});
					state.selectedCardId = cardId;
					state.selectedNodeId = null;
				}),
			updateNode: (cardId, nodeId, patch) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					const nodeIndex =
						card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;

					if (!card || nodeIndex === -1) return;
					recordCardHistory(state, cardId);

					const updatedNode = constrainNode(
						{ ...card.nodes[nodeIndex], ...patch } as EditorNode,
						card,
					);
					card.nodes[nodeIndex] = {
						...updatedNode,
						positions: {
							...updatedNode.positions,
							[card.settings.aspectRatio]: {
								x: updatedNode.x,
								y: updatedNode.y,
							},
						},
					};
				}),
			deleteNode: (cardId, nodeId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					const nodeIndex =
						card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;

					if (!card || nodeIndex === -1) return;
					recordCardHistory(state, cardId);

					card.nodes.splice(nodeIndex, 1);
					if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
				}),
			reorderNode: (cardId, nodeId, targetIndex) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					const sourceIndex =
						card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;
					if (!card || sourceIndex < 0) return;
					recordCardHistory(state, cardId);
					const [node] = card.nodes.splice(sourceIndex, 1);
					if (!node) return;
					card.nodes.splice(
						Math.max(0, Math.min(targetIndex, card.nodes.length)),
						0,
						node,
					);
				}),
			beginHistoryTransaction: (cardId) =>
				set((state) => {
					const history = getCardHistory(state, cardId);
					if (!history.transactionStart) {
						history.transactionStart = snapshotCard(state, cardId);
					}
				}),
			endHistoryTransaction: (cardId) =>
				set((state) => {
					const history = getCardHistory(state, cardId);
					const start = history.transactionStart;
					history.transactionStart = null;
					const current = snapshotCard(state, cardId);
					if (!start || !current) return;
					if (JSON.stringify(start.card) === JSON.stringify(current.card))
						return;
					history.past.push(start);
					if (history.past.length > HISTORY_LIMIT) history.past.shift();
					history.future = [];
				}),
			undo: (cardId) =>
				set((state) => {
					const history = getCardHistory(state, cardId);
					const previous = history.past.pop();
					const current = snapshotCard(state, cardId);
					if (!previous || !current) return;
					history.future.push(current);
					const index = state.cards.findIndex(({ id }) => id === cardId);
					state.cards[index] = previous.card;
					state.selectedCardId = cardId;
					state.selectedNodeId = previous.selectedNodeId;
				}),
			redo: (cardId) =>
				set((state) => {
					const history = getCardHistory(state, cardId);
					const next = history.future.pop();
					const current = snapshotCard(state, cardId);
					if (!next || !current) return;
					history.past.push(current);
					const index = state.cards.findIndex(({ id }) => id === cardId);
					state.cards[index] = next.card;
					state.selectedCardId = cardId;
					state.selectedNodeId = next.selectedNodeId;
				}),
			resetEditor: () => set({ ...createDefaultState(), cardHistories: {} }),
		})),
		{
			name: EDITOR_SESSION_STORAGE_KEY,
			version: 7,
			storage: createJSONStorage(() =>
				typeof window === "undefined" ? fallbackStorage : window.sessionStorage,
			),
			partialize: ({ cards, selectedCardId, selectedNodeId }) => ({
				cards,
				selectedCardId,
				selectedNodeId,
			}),
			migrate: (persistedState) => {
				const state = persistedState as Partial<EditorState>;

				return {
					...state,
					cards: state.cards?.map((card) =>
						migrateCardAppearance(card as LegacyEditorCard),
					),
				};
			},
			merge: (persistedState, currentState) => {
				const persistedEditorState = persistedState as Partial<EditorState>;
				const persistedCards = persistedEditorState.cards?.map(normalizeCard);
				const cards = persistedCards?.length
					? persistedCards
					: currentState.cards;
				const selectedCardId = cards.some(
					(card) => card.id === persistedEditorState.selectedCardId,
				)
					? (persistedEditorState.selectedCardId ?? cards[0]?.id ?? null)
					: (cards[0]?.id ?? null);

				return {
					...currentState,
					...persistedEditorState,
					cards,
					selectedCardId,
					selectedNodeId:
						selectedCardId === persistedEditorState.selectedCardId
							? (persistedEditorState.selectedNodeId ?? null)
							: null,
				};
			},
			skipHydration: true,
		},
	),
);
