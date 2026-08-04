import type { ProjectFontEntity } from "@kerning/shared";
import { createId } from "@paralleldrive/cuid2";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mutative } from "zustand-mutative";
import {
	createEmptyFontSystem,
	createVariant,
	isGlyphKey,
	isKerningPairKey,
	isOpenTypeTag,
	sanitizeFontSystem,
} from "#/features/editor/font-system/font-system";
import type {
	FontFeatureSettings,
	FontVariationSettings,
	GlobalFontAdjustments,
	GlyphAdjustment,
	KerningPairAdjustment,
	ProjectFontRole,
	ProjectFontSystem,
	TextFontSource,
} from "#/features/editor/font-system/font-system.types";
import {
	createDefaultFill,
	normalizeCardFillPercentages,
} from "#/features/editor/lib/card-fill";
import {
	clampCardHeight,
	clampCardWidth,
	getCardSizeFromAspectRatio,
} from "#/features/editor/lib/card-size";
import type { ContentStressMode } from "#/features/editor/lib/content-stress";
import {
	synchronizeLinkedCardSettings,
	synchronizeLinkedNodeChange,
} from "#/features/editor/lib/linked-cards";
import {
	createCardFromScenario,
	getTypographyScenario,
} from "#/features/editor/lib/typography-scenarios";
import type {
	CardAspectRatio,
	CardFill,
	CardFontSystemOverrides,
	CardSettings,
	EditorCard,
	EditorNode,
	EditorNodePatch,
	ImageCardFill,
	ImageNode,
	LinkedCardGroup,
	LinkedCardGroupMode,
	ShapeNode,
	TextNode,
	TextureCardFill,
} from "#/features/editor/types";

export type AddScenarioOptions = {
	selectAfterCreate?: boolean;
	insertAfterCardId?: string;
	groupId?: string;
};
export type PlaceTypeStudyInput = {
	text: string;
	role?: ProjectFontRole;
};
export type LinkedCardVariantInput = {
	name: string;
	roleAssignments?: Partial<Record<ProjectFontRole, string>>;
	roleMap?: Partial<Record<ProjectFontRole, ProjectFontRole>>;
	featureOverrides?: Partial<Record<ProjectFontRole, FontFeatureSettings>>;
	variationOverrides?: Partial<Record<ProjectFontRole, Record<string, number>>>;
	textStyle?: {
		role: ProjectFontRole;
		fontSize?: number;
		lineHeight?: number;
		letterSpacing?: number;
	};
	sampleText?: { nodeId?: string; linkedNodeKey?: string; text: string };
};

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
	fontSystem: ProjectFontSystem;
	projectFonts: ProjectFontEntity[];
	fontSystemPast: ProjectFontSystem[];
	fontSystemFuture: ProjectFontSystem[];
	linkedCardGroups: LinkedCardGroup[];
	selectedCardId: string | null;
	selectedNodeId: string | null;
	contentStressPreview: {
		cardId: string;
		nodeId: string;
		mode: Exclude<ContentStressMode, "original">;
	} | null;
	cardHistories: Record<string, CardHistory>;
	selectCard: (id: string | null) => void;
	selectNode: (cardId: string, nodeId: string) => void;
	setContentStressPreview: (
		preview: EditorState["contentStressPreview"],
	) => void;
	addCard: () => void;
	addCardFromScenario: (
		scenarioId: string,
		options?: AddScenarioOptions,
	) => string;
	createLinkedScenarioGroup: (input: {
		scenarioId: string;
		name: string;
		mode?: LinkedCardGroupMode;
		variants: LinkedCardVariantInput[];
	}) => string;
	createLinkedGroupFromCard: (input: {
		cardId: string;
		name?: string;
		mode: LinkedCardGroupMode;
		variants: LinkedCardVariantInput[];
	}) => string;
	unlinkCard: (cardId: string) => void;
	dissolveLinkedGroup: (groupId: string) => void;
	detachCardFromScenario: (cardId: string) => void;
	setCardFontOverrides: (
		cardId: string,
		overrides?: CardFontSystemOverrides,
	) => void;
	setCardRoleOverride: (
		cardId: string,
		role: ProjectFontRole,
		override?: NonNullable<CardFontSystemOverrides["roles"]>[ProjectFontRole],
	) => void;
	applyBrowserFontSettings: (
		target:
			| { type: "selected-node"; cardId: string; nodeId: string }
			| {
					type: "card-role" | "comparison-variant";
					cardId: string;
					role: ProjectFontRole;
			  }
			| { type: "project-role"; role: ProjectFontRole },
		settings: {
			fontId?: string;
			featureSettings: FontFeatureSettings;
			variationSettings: FontVariationSettings;
			fontSize?: number;
			lineHeight?: number;
			letterSpacing?: number;
		},
	) => void;
	swapCardRoles: (
		cardId: string,
		first: ProjectFontRole,
		second: ProjectFontRole,
	) => void;
	deleteCard: (id: string) => void;
	updateCard: (id: string, patch: Partial<EditorCard>) => void;
	updateCardSettings: (id: string, patch: Partial<CardSettings>) => void;
	addTextNode: (cardId: string) => void;
	placeTypeStudy: (cardId: string, input: PlaceTypeStudyInput) => string;
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
	setProjectFonts: (fonts: ProjectFontEntity[]) => void;
	assignFontToRole: (role: ProjectFontRole, fontId: string) => void;
	setRoleActiveVariant: (role: ProjectFontRole, variantId: string) => void;
	updateFontFeatures: (
		variantId: string,
		settings: FontFeatureSettings,
	) => void;
	updateFontVariationAxis: (
		variantId: string,
		axisTag: string,
		value: number,
	) => void;
	updateGlobalFontAdjustments: (
		variantId: string,
		patch: Partial<GlobalFontAdjustments>,
	) => void;
	updateGlyphAdjustment: (
		variantId: string,
		glyphKey: string,
		patch: Partial<GlyphAdjustment>,
	) => void;
	updateKerningAdjustment: (
		variantId: string,
		pairKey: string,
		adjustment: KerningPairAdjustment,
	) => void;
	resetFontVariant: (variantId: string) => void;
	setTextNodeFontSource: (
		cardId: string,
		nodeId: string,
		source: TextFontSource,
	) => void;
	undoFontSystem: () => void;
	redoFontSystem: () => void;
	resetEditor: () => void;
};

export const EDITOR_SESSION_STORAGE_KEY = "kerning-editor-session";
export const NODE_CARD_INSET = 0;
export const DEFAULT_NODE_COLOR = "#046A63";
export const DEFAULT_TEXT_NODE_COLOR = "#000000";
const HISTORY_LIMIT = 100;

function cloneCard(card: EditorCard): EditorCard {
	// Store documents are JSON-safe; JSON cloning also unwraps mutative's draft proxies.
	return JSON.parse(JSON.stringify(card)) as EditorCard;
}

function cloneFontSystem(fontSystem: ProjectFontSystem): ProjectFontSystem {
	return JSON.parse(JSON.stringify(fontSystem)) as ProjectFontSystem;
}

function recordFontSystemHistory(state: EditorState) {
	state.fontSystemPast.push(cloneFontSystem(state.fontSystem));
	if (state.fontSystemPast.length > HISTORY_LIMIT) state.fontSystemPast.shift();
	state.fontSystemFuture = [];
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
		fontSystem: createEmptyFontSystem(),
		selectedCardId: card.id,
		selectedNodeId: null,
		contentStressPreview: null,
		linkedCardGroups: [],
	};
}

const DEFAULT_LINK_SYNC = {
	content: true,
	layout: true,
	images: true,
	cardStyle: true,
	typographyStructure: true,
};
function variantOverrides(
	input: LinkedCardVariantInput,
	fontSystem?: ProjectFontSystem,
): CardFontSystemOverrides | undefined {
	const roles: CardFontSystemOverrides["roles"] = {};
	for (const role of ["primary", "secondary-one", "secondary-two"] as const) {
		const fontId = input.roleAssignments?.[role];
		const mapped = input.roleMap?.[role];
		const mappedConfig = mapped ? fontSystem?.roles[mapped] : undefined;
		if (
			fontId ||
			mappedConfig ||
			input.featureOverrides?.[role] ||
			input.variationOverrides?.[role]
		)
			roles[role] = {
				fontId: fontId ?? mappedConfig?.fontId,
				variantId: mappedConfig?.activeVariantId,
				featureSettings: input.featureOverrides?.[role],
				variationSettings: input.variationOverrides?.[role],
			};
	}
	return Object.keys(roles).length ? { roles } : undefined;
}

function variantTextStyle(
	node: EditorNode,
	input: LinkedCardVariantInput,
): Partial<TextNode> {
	const style = input.textStyle;
	if (
		!style ||
		node.type !== "text" ||
		node.fontSource?.type !== "role" ||
		node.fontSource.role !== style.role
	)
		return {};
	return Object.fromEntries(
		Object.entries({
			fontSize: style.fontSize,
			lineHeight: style.lineHeight,
			letterSpacing: style.letterSpacing,
		}).filter(([, value]) => value !== undefined),
	);
}

function applyVariantNode(
	node: EditorNode,
	input: LinkedCardVariantInput,
): EditorNode {
	if (node.type !== "text") return node;
	const sample = input.sampleText;
	const usesSample = Boolean(
		sample &&
			(!sample.nodeId || node.id === sample.nodeId) &&
			(!sample.linkedNodeKey || node.linkedNodeKey === sample.linkedNodeKey),
	);
	return {
		...node,
		...variantTextStyle(node, input),
		...(usesSample && sample ? { text: sample.text } : {}),
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
		fontSource: { type: "role", role: "primary" },
		fontSize: 20,
		fontWeight: 500,
		lineHeight: 1.1,
		letterSpacing: 0,
		color: DEFAULT_TEXT_NODE_COLOR,
		textAlign: "left",
		textCasing: "none",
	};
}

function createTypeStudyNode(
	card: EditorCard,
	input: PlaceTypeStudyInput,
): TextNode {
	const characters = Array.from(input.text);
	const isSingleGlyph = characters.length === 1;
	const fontSize = 20;
	const width = Math.min(
		card.width - 48,
		Math.max(fontSize * Math.max(characters.length * 0.68, 1.2), 72),
	);
	const height = Math.min(card.height - 48, Math.ceil(fontSize * 1.18));
	const x = Math.max(NODE_CARD_INSET, Math.round((card.width - width) / 2));
	const y = Math.max(NODE_CARD_INSET, Math.round((card.height - height) / 2));
	const role = input.role ?? "primary";

	return {
		id: createId(),
		type: "text",
		x,
		y,
		width,
		height,
		positions: { [card.settings.aspectRatio]: { x, y } },
		rotation: 0,
		text: input.text,
		fontType:
			role === "secondary-one"
				? "sec1"
				: role === "secondary-two"
					? "sec2"
					: "primary",
		fontSource: { type: "role", role },
		fontSize,
		fontWeight: 500,
		lineHeight: 1,
		letterSpacing: isSingleGlyph ? 0 : -fontSize * 0.025,
		color: DEFAULT_TEXT_NODE_COLOR,
		textAlign: "center",
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
			projectFonts: [],
			fontSystemPast: [],
			fontSystemFuture: [],
			selectCard: (id) => set({ selectedCardId: id, selectedNodeId: null }),
			selectNode: (cardId, nodeId) =>
				set({ selectedCardId: cardId, selectedNodeId: nodeId }),
			setContentStressPreview: (contentStressPreview) =>
				set({ contentStressPreview }),
			addCard: () =>
				set((state) => {
					const card = createDefaultCard(getNextCardName(state.cards));

					state.cards.push(card);
					state.selectedCardId = card.id;
					state.selectedNodeId = null;
				}),
			addCardFromScenario: (scenarioId, options = {}) => {
				const scenario = getTypographyScenario(scenarioId);
				if (!scenario) return "";
				const card = createCardFromScenario(scenario);
				set((state) => {
					const after = options.insertAfterCardId
						? state.cards.findIndex(
								({ id }) => id === options.insertAfterCardId,
							)
						: -1;
					state.cards.splice(
						after >= 0 ? after + 1 : state.cards.length,
						0,
						card,
					);
					if (options.groupId)
						state.linkedCardGroups
							.find(({ id }) => id === options.groupId)
							?.cardIds.push(card.id);
					if (options.selectAfterCreate !== false) {
						state.selectedCardId = card.id;
						state.selectedNodeId = null;
					}
				});
				return card.id;
			},
			createLinkedScenarioGroup: ({
				scenarioId,
				name,
				mode = "font-assignment",
				variants,
			}) => {
				const scenario = getTypographyScenario(scenarioId);
				if (!scenario || variants.length < 1) return "";
				const groupId = createId();
				set((state) => {
					const cards = variants.slice(0, 6).map((variant) => {
						const card = createCardFromScenario(scenario);
						return {
							...card,
							nodes: card.nodes.map((node) => applyVariantNode(node, variant)),
							comparisonLabel: variant.name,
							fontSystemOverrides: variantOverrides(variant, state.fontSystem),
						};
					});
					state.cards.push(...cards);
					state.linkedCardGroups.push({
						id: groupId,
						name,
						scenarioId,
						cardIds: cards.map(({ id }) => id),
						sourceCardId: cards[0]!.id,
						mode,
						sync: { ...DEFAULT_LINK_SYNC },
					});
					state.selectedCardId = cards[0]!.id;
					state.selectedNodeId = null;
				});
				return groupId;
			},
			createLinkedGroupFromCard: ({ cardId, name, mode, variants }) => {
				const groupId = createId();
				set((state) => {
					const source = state.cards.find(({ id }) => id === cardId);
					if (!source) return;
					const copies = variants.slice(0, 6).map((variant) => ({
						...cloneCard(source),
						id: createId(),
						name: source.name,
						nodes: source.nodes.map((node) => ({
							...applyVariantNode(node, variant),
							id: createId(),
						})),
						comparisonLabel: variant.name,
						fontSystemOverrides: variantOverrides(variant, state.fontSystem),
					}));
					state.cards.push(...copies);
					const ids = [source.id, ...copies.map(({ id }) => id)];
					state.linkedCardGroups.push({
						id: groupId,
						name: name ?? `${source.name} comparison`,
						scenarioId: source.scenario?.scenarioId,
						cardIds: ids,
						sourceCardId: source.id,
						mode,
						sync: { ...DEFAULT_LINK_SYNC },
					});
					if (copies[0]) {
						state.selectedCardId = copies[0].id;
						state.selectedNodeId = null;
					}
				});
				return groupId;
			},
			unlinkCard: (cardId) =>
				set((state) => {
					for (const group of state.linkedCardGroups)
						group.cardIds = group.cardIds.filter((id) => id !== cardId);
					state.linkedCardGroups = state.linkedCardGroups.filter(
						(group) => group.cardIds.length > 1,
					);
				}),
			dissolveLinkedGroup: (groupId) =>
				set((state) => {
					state.linkedCardGroups = state.linkedCardGroups.filter(
						({ id }) => id !== groupId,
					);
				}),
			detachCardFromScenario: (cardId) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					if (card) delete card.scenario;
				}),
			setCardFontOverrides: (cardId, overrides) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					if (card) {
						recordCardHistory(state, cardId);
						card.fontSystemOverrides = overrides;
					}
				}),
			setCardRoleOverride: (cardId, role, override) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					if (!card) return;
					recordCardHistory(state, cardId);
					const roles = { ...(card.fontSystemOverrides?.roles ?? {}) };
					if (override) roles[role] = override;
					else delete roles[role];
					card.fontSystemOverrides = Object.keys(roles).length
						? { roles }
						: undefined;
				}),
			applyBrowserFontSettings: (target, settings) =>
				set((state) => {
					if (target.type === "selected-node") {
						const card = state.cards.find(({ id }) => id === target.cardId);
						const node = card?.nodes.find(({ id }) => id === target.nodeId);
						if (!card || node?.type !== "text") return;
						recordCardHistory(state, target.cardId);
						if (settings.fontId) {
							const role =
								node.fontSource?.type === "role"
									? node.fontSource.role
									: node.fontSource
										? undefined
										: node.fontType === "sec1"
											? "secondary-one"
											: node.fontType === "sec2"
												? "secondary-two"
												: "primary";
							const inheritedFontId = role
								? (card.fontSystemOverrides?.roles?.[role]?.fontId ??
									state.fontSystem.roles[role]?.fontId)
								: node.fontSource?.type === "font"
									? node.fontSource.fontId
									: undefined;
							if (settings.fontId !== inheritedFontId)
								node.fontSource = { type: "font", fontId: settings.fontId };
						}
						node.featureSettings = { ...settings.featureSettings };
						node.variationSettings = { ...settings.variationSettings };
						if (settings.fontSize !== undefined)
							node.fontSize = settings.fontSize;
						if (settings.lineHeight !== undefined)
							node.lineHeight = settings.lineHeight;
						if (settings.letterSpacing !== undefined)
							node.letterSpacing = settings.letterSpacing;
						return;
					}
					if (target.type === "project-role") {
						if (
							settings.fontId &&
							state.fontSystem.roles[target.role]?.fontId !== settings.fontId
						) {
							const font = state.projectFonts.find(
								({ dbId, id }) =>
									dbId === settings.fontId || id === settings.fontId,
							);
							if (!font) return;
							recordFontSystemHistory(state);
							const variant =
								Object.values(state.fontSystem.variants).find(
									(item) => item.sourceFontId === font.dbId,
								) ?? createVariant(font.dbId);
							state.fontSystem.variants[variant.id] = variant;
							state.fontSystem.roles[target.role] = {
								role: target.role,
								fontId: font.dbId,
								activeVariantId: variant.id,
							};
						}
						const config = state.fontSystem.roles[target.role];
						if (!config) return;
						const variant = state.fontSystem.variants[config.activeVariantId];
						if (!variant) return;
						if (!settings.fontId) recordFontSystemHistory(state);
						variant.featureSettings = { ...settings.featureSettings };
						variant.variationSettings = { ...settings.variationSettings };
						return;
					}
					const card = state.cards.find(({ id }) => id === target.cardId);
					if (!card) return;
					recordCardHistory(state, target.cardId);
					const roles = { ...(card.fontSystemOverrides?.roles ?? {}) };
					const current = roles[target.role] ?? {};
					roles[target.role] = {
						...current,
						fontId: settings.fontId ?? current.fontId,
						featureSettings: { ...settings.featureSettings },
						variationSettings: { ...settings.variationSettings },
					};
					card.fontSystemOverrides = { roles };
					if (target.type === "comparison-variant") {
						const fontId =
							roles[target.role]?.fontId ??
							state.fontSystem.roles[target.role]?.fontId;
						const font = state.projectFonts.find(({ dbId }) => dbId === fontId);
						const axes = Object.entries(settings.variationSettings)
							.slice(0, 2)
							.map(([tag, value]) => `${tag} ${value}`);
						const features = Object.entries(settings.featureSettings)
							.filter(([, on]) => on)
							.slice(0, 2)
							.map(([tag]) => tag);
						card.comparisonLabel = [
							target.role === "primary"
								? "Primary"
								: target.role === "secondary-one"
									? "Secondary One"
									: "Secondary Two",
							font?.family,
							...axes,
							...features,
						]
							.filter(Boolean)
							.join(" · ");
					}
				}),
			swapCardRoles: (cardId, first, second) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					if (!card) return;
					recordCardHistory(state, cardId);
					const resolve = (role: ProjectFontRole) =>
						card.fontSystemOverrides?.roles?.[role] ??
						(state.fontSystem.roles[role]
							? {
									fontId: state.fontSystem.roles[role]!.fontId,
									variantId: state.fontSystem.roles[role]!.activeVariantId,
								}
							: undefined);
					const firstValue = resolve(first);
					const secondValue = resolve(second);
					card.fontSystemOverrides = {
						roles: {
							...(card.fontSystemOverrides?.roles ?? {}),
							[first]: secondValue,
							[second]: firstValue,
						},
					};
				}),
			deleteCard: (id) =>
				set((state) => {
					const deletedIndex = state.cards.findIndex((card) => card.id === id);

					if (deletedIndex === -1 || state.cards.length === 1) {
						return;
					}

					const deletedSelectedCard = state.selectedCardId === id;
					state.cards.splice(deletedIndex, 1);
					for (const group of state.linkedCardGroups)
						group.cardIds = group.cardIds.filter((cardId) => cardId !== id);
					state.linkedCardGroups = state.linkedCardGroups.filter(
						(group) => group.cardIds.length > 1,
					);

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
					const group = state.linkedCardGroups.find(({ cardIds }) =>
						cardIds.includes(id),
					);
					if (group)
						state.cards = synchronizeLinkedCardSettings(
							group,
							state.cards[cardIndex]!,
							state.cards,
						);
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
			placeTypeStudy: (cardId, input) => {
				const text = input.text.trim();
				if (!text) return "";
				let nodeId = "";
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					if (!card) return;
					recordCardHistory(state, cardId);
					const node = createTypeStudyNode(card, { ...input, text });
					nodeId = node.id;
					card.nodes.push(node);
					state.selectedCardId = cardId;
					state.selectedNodeId = node.id;
				});
				return nodeId;
			},
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
					const group = state.linkedCardGroups.find(({ cardIds }) =>
						cardIds.includes(cardId),
					);
					if (group)
						state.cards = synchronizeLinkedNodeChange(
							group,
							cardId,
							card.nodes[nodeIndex]!,
							state.cards,
						);
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
			setProjectFonts: (fonts) =>
				set((state) => {
					state.projectFonts = fonts;
					for (const font of fonts) {
						if (
							font.role !== "primary" &&
							font.role !== "secondary-one" &&
							font.role !== "secondary-two"
						)
							continue;
						if (state.fontSystem.roles[font.role]) continue;
						const variant =
							Object.values(state.fontSystem.variants).find(
								(item) => item.sourceFontId === font.dbId,
							) ?? createVariant(font.dbId);
						state.fontSystem.variants[variant.id] = variant;
						state.fontSystem.roles[font.role] = {
							role: font.role,
							fontId: font.dbId,
							activeVariantId: variant.id,
						};
					}
				}),
			assignFontToRole: (role, fontId) =>
				set((state) => {
					const font = state.projectFonts.find(
						(candidate) => candidate.dbId === fontId || candidate.id === fontId,
					);
					if (!font) return;
					const stableId = font.dbId;
					const existing = Object.values(state.fontSystem.variants).find(
						(variant) => variant.sourceFontId === stableId,
					);
					const variant = existing ?? createVariant(stableId);
					if (
						state.fontSystem.roles[role]?.fontId === stableId &&
						state.fontSystem.roles[role]?.activeVariantId === variant.id
					)
						return;
					recordFontSystemHistory(state);
					state.fontSystem.variants[variant.id] = variant;
					state.fontSystem.roles[role] = {
						role,
						fontId: stableId,
						activeVariantId: variant.id,
					};
				}),
			setRoleActiveVariant: (role, variantId) =>
				set((state) => {
					const config = state.fontSystem.roles[role];
					const variant = state.fontSystem.variants[variantId];
					if (!config || !variant || variant.sourceFontId !== config.fontId)
						return;
					recordFontSystemHistory(state);
					config.activeVariantId = variantId;
				}),
			updateFontFeatures: (variantId, settings) =>
				set((state) => {
					const variant = state.fontSystem.variants[variantId];
					if (!variant) return;
					const valid = Object.fromEntries(
						Object.entries(settings).filter(
							([tag, enabled]) =>
								isOpenTypeTag(tag) && typeof enabled === "boolean",
						),
					);
					recordFontSystemHistory(state);
					variant.featureSettings = valid;
				}),
			updateFontVariationAxis: (variantId, axisTag, value) =>
				set((state) => {
					const variant = state.fontSystem.variants[variantId];
					if (!variant || !isOpenTypeTag(axisTag) || !Number.isFinite(value))
						return;
					const font = state.projectFonts.find(
						({ dbId }) => dbId === variant.sourceFontId,
					);
					const axis =
						font?.axes?.find(({ tag }) => tag === axisTag) ??
						font?.faces
							.flatMap((face) => face.axes ?? [])
							.find(({ tag }) => tag === axisTag);
					if (!axis) return;
					recordFontSystemHistory(state);
					variant.variationSettings[axisTag] = Math.min(
						axis.max,
						Math.max(axis.min, value),
					);
				}),
			updateGlobalFontAdjustments: (variantId, patch) =>
				set((state) => {
					const variant = state.fontSystem.variants[variantId];
					if (!variant) return;
					const valid = Object.fromEntries(
						Object.entries(patch).filter(
							([, value]) =>
								typeof value === "string" || Number.isFinite(value),
						),
					);
					recordFontSystemHistory(state);
					variant.globalAdjustments = {
						...variant.globalAdjustments,
						...valid,
					};
				}),
			updateGlyphAdjustment: (variantId, glyphKey, patch) =>
				set((state) => {
					const variant = state.fontSystem.variants[variantId];
					if (!variant || !isGlyphKey(glyphKey)) return;
					const valid = Object.fromEntries(
						Object.entries(patch).filter(([, value]) => Number.isFinite(value)),
					);
					recordFontSystemHistory(state);
					variant.glyphAdjustments[glyphKey] = {
						...variant.glyphAdjustments[glyphKey],
						...valid,
					};
				}),
			updateKerningAdjustment: (variantId, pairKey, adjustment) =>
				set((state) => {
					const variant = state.fontSystem.variants[variantId];
					if (
						!variant ||
						!isKerningPairKey(pairKey) ||
						!Number.isFinite(adjustment.value)
					)
						return;
					recordFontSystemHistory(state);
					variant.kerningAdjustments[pairKey] = adjustment;
				}),
			resetFontVariant: (variantId) =>
				set((state) => {
					const variant = state.fontSystem.variants[variantId];
					if (!variant) return;
					recordFontSystemHistory(state);
					state.fontSystem.variants[variantId] = {
						...createVariant(variant.sourceFontId),
						id: variant.id,
						name: variant.name,
					};
				}),
			setTextNodeFontSource: (cardId, nodeId, source) =>
				set((state) => {
					const card = state.cards.find(({ id }) => id === cardId);
					const node = card?.nodes.find(({ id }) => id === nodeId);
					if (!card || node?.type !== "text") return;
					recordCardHistory(state, cardId);
					node.fontSource = source;
				}),
			undoFontSystem: () =>
				set((state) => {
					const previous = state.fontSystemPast.pop();
					if (!previous) return;
					state.fontSystemFuture.push(cloneFontSystem(state.fontSystem));
					state.fontSystem = previous;
				}),
			redoFontSystem: () =>
				set((state) => {
					const next = state.fontSystemFuture.pop();
					if (!next) return;
					state.fontSystemPast.push(cloneFontSystem(state.fontSystem));
					state.fontSystem = next;
				}),
			resetEditor: () =>
				set({
					...createDefaultState(),
					cardHistories: {},
					fontSystemPast: [],
					fontSystemFuture: [],
				}),
		})),
		{
			name: EDITOR_SESSION_STORAGE_KEY,
			version: 9,
			storage: createJSONStorage(() =>
				typeof window === "undefined" ? fallbackStorage : window.sessionStorage,
			),
			partialize: ({
				cards,
				linkedCardGroups,
				selectedCardId,
				selectedNodeId,
				fontSystem,
			}) => ({
				cards,
				linkedCardGroups,
				fontSystem,
				selectedCardId,
				selectedNodeId,
			}),
			migrate: (persistedState) => {
				const state = persistedState as Partial<EditorState>;

				return {
					...state,
					fontSystem: sanitizeFontSystem(state.fontSystem),
					cards: state.cards?.map((card) =>
						migrateCardAppearance(card as LegacyEditorCard),
					),
					linkedCardGroups: state.linkedCardGroups ?? [],
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
					linkedCardGroups: persistedEditorState.linkedCardGroups ?? [],
					fontSystem: sanitizeFontSystem(persistedEditorState.fontSystem),
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
