# The Editor Domain Model

This chapter explains the data model behind the Kerning editor: what the editor considers a document, how cards and nodes are represented, which invariants the store protects, how layers emerge from array order, and how React components turn the model into an interactive UI.

It focuses on the editor feature under [`apps/web/src/features/editor`](./). The canonical type declarations are in [`types.ts`](./types.ts), while the state transitions and persistence rules live in [`store/editor-store.ts`](./store/editor-store.ts).

The shortest useful mental model is:

```text
Editor session
├── cards[]
│   ├── card identity and dimensions
│   ├── card.settings
│   │   ├── base fill
│   │   ├── optional texture overlay
│   │   └── whole-card visual effects and border
│   └── nodes[]                 ← array order is layer order
│       ├── text node
│       ├── image node
│       └── shape node
├── selectedCardId
└── selectedNodeId
```

There is no separate `Document`, `Layer`, `Transform`, or `Selection` class. Those concepts exist, but they are represented by plain objects, arrays, and IDs. That simplicity is central to understanding the feature.

## 1. The aggregate: one editor session containing cards

The editor's root state is declared in [`store/editor-store.ts`](./store/editor-store.ts). The complete state contract is:

```ts
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
	addShapeNode: (
		cardId: string,
		shape: Pick<ShapeNode, "shapeType" | "shape">,
	) => void;
	applyTemplate: (cardId: string, template: EditorCard) => void;
	updateNode: (cardId: string, nodeId: string, patch: EditorNodePatch) => void;
	deleteNode: (cardId: string, nodeId: string) => void;
	reorderNode: (cardId: string, nodeId: string, targetIndex: number) => void;
	resetEditor: () => void;
};
```

The state is both the document and the editor's current UI focus. `cards` is durable session content. `selectedCardId` and `selectedNodeId` are ephemeral-feeling UI state, but they are persisted alongside the cards so a reload can return the user to the same editing context.

The action API is deliberately domain-oriented. Components ask the store to `addTextNode`, `applyTemplate`, or `reorderNode`; they do not replace `cards` directly. This gives the store one place to enforce dimensions, selection transitions, identity, and backward compatibility.

### Ownership rules

The ownership tree is strict:

- The editor owns cards.
- A card owns its settings and nodes.
- A node belongs to exactly one card because it is nested in that card's `nodes` array.
- Selection points into this tree using IDs rather than holding duplicate card or node objects.

Every node mutation therefore needs both `cardId` and `nodeId`. A node ID by itself is not treated as a globally sufficient lookup key by the store API.

## 2. Cards: the editor's document pages

The complete card type from [`types.ts`](./types.ts) is:

```ts
export type EditorCard = {
	id: string;
	name: string;
	width: number;
	height: number;
	settings: CardSettings;
	nodes: EditorNode[];
};
```

A card combines four concerns:

1. **Identity:** `id` remains stable while the card is edited.
2. **Human labeling:** `name` appears in the canvas UI and is generated uniquely for new untitled cards.
3. **Geometry:** `width` and `height` define the coordinate space in which every child node lives.
4. **Content and appearance:** `settings` styles the card itself; `nodes` contains the editable foreground objects.

Card coordinates are not browser pixels in the viewport. They are logical editor units. The card is rendered at its logical width and height and then visually scaled using the current canvas zoom. That is why drag calculations divide pointer movement by `zoom` before updating `node.x` or `node.y`.

### Default card creation

New cards are created only inside [`store/editor-store.ts`](./store/editor-store.ts):

```ts
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
```

The initial editor state contains one selected card and no selected node:

```ts
function createDefaultState() {
	const card = createDefaultCard();

	return {
		cards: [card],
		selectedCardId: card.id,
		selectedNodeId: null,
	};
}
```

This establishes two product invariants:

- A fresh editor is immediately usable; it never starts with an empty void.
- The last card cannot be deleted. `deleteCard` returns early when `state.cards.length === 1`.

## 3. Card geometry and aspect ratios

The accepted presets are declared in [`types.ts`](./types.ts):

```ts
export type CardAspectRatio =
	| "1:1"
	| "4:5"
	| "16:9"
	| "9:16"
	| "3:2"
	| "business-card";
```

The preset name is stored in `settings.aspectRatio`, while the resolved dimensions are stored separately as `card.width` and `card.height`. This slight denormalization is intentional in the current design: renderers and constraint code can consume exact dimensions without repeatedly resolving a preset.

Changing an aspect ratio is more than changing a label. `updateCardSettings` resolves the preset and normalizes the entire card:

```ts
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
```

The important consequence is that changing card size can also move or shrink nodes. `normalizeCard` constrains every node to the card's new bounds. The model chooses “keep all content inside the card” over “preserve an out-of-bounds transform.”

Dimension bounds themselves are implemented in [`lib/card-size.ts`](./lib/card-size.ts). Store callers use `clampCardWidth` and `clampCardHeight`, so both direct dimension edits and aspect-ratio changes pass through the same protection.

## 4. Card appearance: base fill, texture overlay, and card-wide effects

The complete settings type is:

```ts
export type CardSettings = {
	aspectRatio: CardAspectRatio;
	fill: CardFill;
	texture: TextureCardFill | null;
	opacity: number;
	blur: number;
	borderWidth: number;
	borderStyle: "solid" | "dashed" | "dotted" | "double";
	borderColor: string;
};
```

There are three distinct visual layers here:

1. `fill` is the card's base background: solid, gradient, or image.
2. `texture` is an optional generated overlay placed above the base fill.
3. Opacity, blur, and border properties apply to the rendered card container as a whole.

Do not mentally collapse `fill` and `texture`. A card may have a gradient base **and** a paper texture overlay. The types enforce that distinction because `CardFill` does not include a texture variant:

```ts
export type CardFill =
	| SolidCardFill
	| LinearGradientCardFill
	| RadialGradientCardFill
	| ImageCardFill;
```

### Discriminated fill variants

The complete base-fill declarations are:

```ts
export type SolidCardFill = {
	type: "solid";
	color: string;
};

export type GradientStop = {
	id: string;
	color: string;
	position: number;
};

export type LinearGradientCardFill = {
	type: "linear-gradient";
	angle: number;
	stops: GradientStop[];
};

export type RadialGradientCardFill = {
	type: "radial-gradient";
	centerX: number;
	centerY: number;
	stops: GradientStop[];
};

export type ImageCardFill = {
	type: "image";
	imageId: string | null;
	src?: string;
	opacity: number;
	settings: ImageFillSettings;
};

export type ImageFillSettings = {
	backgroundSize: "cover" | "contain" | "auto";
	originX: number;
	originY: number;
};
```

These are discriminated unions: the literal `type` field determines which other fields exist. Code can check `fill.type === "image"` and TypeScript then knows that `imageId`, `opacity`, and image settings are available.

Gradient stop `position`, radial centers, and image origins are percentage-like values. [`lib/card-fill.ts`](./lib/card-fill.ts) creates defaults, normalizes percentages, and converts model objects into React CSS styles. Keeping those calculations outside components prevents the inspector and renderer from inventing different interpretations of the same model.

`imageId` and `src` serve different jobs. `src` is a renderable URL or source string; `imageId` links to an image stored by the editor's IndexedDB image layer. The nullable/optional shape also supports external or legacy sources that do not have a stored database identity.

### Texture variants

Textures use a generic discriminated shape internally:

```ts
type TextureFill<TTexture extends string, TSettings> = {
	type: "texture";
	texture: TTexture;
	opacity: number;
	settings: TSettings;
};

export type TextureCardFill =
	| TextureFill<"paper", PaperTextureSettings>
	| TextureFill<"fluted-glass", FlutedGlassSettings>
	| TextureFill<"halftone", HalftoneTextureSettings>
	| TextureFill<"halftone-cmyk", HalftoneCmykTextureSettings>;
```

The first discriminator, `type: "texture"`, distinguishes textures from base fills in legacy/migration logic. The second, `texture`, selects the exact procedural texture and therefore the shape of `settings`.

The full per-texture settings live in [`types.ts`](./types.ts). They are intentionally domain data rather than arbitrary CSS: paper exposes fibers, folds, and a seed; halftone exposes grid and dot behavior; fluted glass exposes distortion and highlights. Rendering lives in [`components/card-texture-fill.tsx`](./components/card-texture-fill.tsx), and editing lives in [`components/card-fill-inspector.tsx`](./components/card-fill-inspector.tsx).

### How the card renderer composes appearance

[`components/editor-card.tsx`](./components/editor-card.tsx) applies the base style to the card container, renders an optional texture, then renders the special image-fill layer:

```tsx
<div
	className={cn(
		"relative cursor-default overflow-hidden border border-hairline bg-white p-0 text-left shadow-[0_10px_30px_rgba(15,23,42,0.10)] outline-none transition-[outline-color,box-shadow] duration-150",
		isSelected ? "z-10 ring-1 ring-primary/30" : "",
	)}
	style={{
		width: card.width,
		height: card.height,
		...getCardFillStyle(card.settings.fill),
		opacity: card.settings.opacity,
		filter: `blur(${card.settings.blur}px)`,
		borderWidth: card.settings.borderWidth,
		borderStyle: card.settings.borderStyle,
		borderColor: card.settings.borderColor,
		transform: `scale(${zoom})`,
		transformOrigin: "top left",
	}}
>
	{card.settings.texture ? (
		<Suspense fallback={null}>
			<CardTextureFill fill={card.settings.texture} />
		</Suspense>
	) : null}
	{card.settings.fill.type === "image" ? (
		<CardImageFill fill={card.settings.fill} />
	) : null}
	{/* selection surface and nodes follow */}
</div>
```

This code is where the abstract settings become a stacking model. It also reveals that card blur and opacity affect the container, not merely its background.

## 5. Nodes: one shared spatial contract, three content variants

Every foreground object is an `EditorNode`. The common geometry is defined once:

```ts
type BaseNode = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
};
```

All nodes are axis-aligned rectangles positioned relative to their owning card's top-left corner:

- `x`: distance from the card's left edge.
- `y`: distance from the card's top edge.
- `width`: node bounding-box width.
- `height`: node bounding-box height.

The current model does **not** include rotation, skew, anchors, grouped transforms, visibility, or locking. If those features are added, they will require explicit domain fields and corresponding store/rendering behavior; they are not hidden elsewhere in the current model.

The union is:

```ts
export type EditorNode = TextNode | ImageNode | ShapeNode;
```

Like fills, nodes use `type` as a discriminator. This allows renderers and inspectors to branch safely without maintaining parallel “node kind” state.

## 6. Text nodes

The complete text-node model is:

```ts
export type FontType = "primary" | "sec1" | "sec2";
export type TextAlignment = "left" | "center" | "right" | "justify";
export type TextCasing = "none" | "uppercase" | "lowercase" | "capitalize";

export type TextNode = BaseNode & {
	type: "text";
	text: string;
	fontType: FontType;
	fontSize: number;
	fontWeight: number;
	lineHeight: number;
	letterSpacing: number;
	color: string;
	textAlign: TextAlignment;
	textCasing: TextCasing;
};
```

Text content and typography are stored directly on the node. `fontType` is a semantic font slot rather than an arbitrary family name: `primary`, `sec1`, and `sec2` map into the editor's font system. This lets templates and saved sessions refer to a stable role while font-loading code determines the actual family.

The default factory demonstrates the expected units and starting behavior:

```ts
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
		letterSpacing: 0,
		color: "#111111",
		textAlign: "left",
		textCasing: "none",
	};
}
```

Text has a special width-only resize handle in [`components/editor-node.tsx`](./components/editor-node.tsx), in addition to the eight general handles. Inline text editing is implemented by [`components/text-node.tsx`](./components/text-node.tsx), while the full form-based typography controls live in [`components/node-inspector.tsx`](./components/node-inspector.tsx).

## 7. Image nodes

The complete image model is:

```ts
export type ImageEffects = {
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	grayscale: number;
	sepia: number;
};

export type ImageNode = BaseNode & {
	type: "image";
	src: string;
	imageId: string | null;
	alt: string;
	objectFit: "cover" | "contain";
	zoom: number;
	positionX: number;
	positionY: number;
	effects: ImageEffects;
	opacity: number;
	blendMode?:
		| "normal"
		| "multiply"
		| "screen"
		| "overlay"
		| "difference"
		| "lighten"
		| "darken";
	texture?: TextureCardFill | null;
};
```

An image node has two layers of geometry:

- Base-node geometry positions and sizes the node's outer frame.
- `zoom`, `positionX`, `positionY`, and `objectFit` control how the image is composed inside that frame.

This distinction is vital. Resizing the node changes the frame; increasing `zoom` changes the crop/composition within the frame.

Effects are stored in UI-friendly units. Neutral brightness, contrast, and saturation are `100`; neutral grayscale and sepia are `0`; neutral opacity is `1`. [`components/image-node.tsx`](./components/image-node.tsx) converts these values into browser styles.

`texture` allows a procedural overlay on an individual image node. This is separate from `card.settings.texture`, even though both reuse `TextureCardFill`.

The default factory creates an empty image placeholder rather than requiring a source immediately:

```ts
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
		blendMode: "normal",
		texture: null,
	};
}
```

Stored image cleanup is currently initiated by UI deletion paths in [`components/editor-node.tsx`](./components/editor-node.tsx) and [`components/layer-list.tsx`](./components/layer-list.tsx). The store removes the node from domain state, while those components call `deleteEditorImage(imageId)` when appropriate. That means storage cleanup is not itself an invariant of the `deleteNode` store action; callers that delete stored-image nodes must remember the side effect.

## 8. Shape nodes

The complete shape model is compact:

```ts
export type ShapeNode = BaseNode & {
	type: "shape";
	shapeType: "icon" | "emoji" | "line" | "rectangle" | "ellipse";
	shape: string;
	color: string;
	texture?: TextureCardFill | null;
};
```

`shapeType` selects the rendering strategy. `shape` identifies the specific icon/emoji/primitive. This permits both a generic category and a concrete asset name without creating a TypeScript type for every shape in the library.

Shape definitions and choices live in [`lib/shape-library.ts`](./lib/shape-library.ts); insertion UI lives in [`components/shape-picker.tsx`](./components/shape-picker.tsx); rendering lives in [`components/shape-node.tsx`](./components/shape-node.tsx).

Lines receive a wide, short default frame; other shapes start square:

```ts
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
		shapeType: shape.shapeType,
		shape: shape.shape,
		color: "#111111",
		texture: null,
	};
}
```

## 9. Layers are node-array order

There is no `Layer` domain type. A layer is simply a node's position in `card.nodes`.

[`components/editor-card.tsx`](./components/editor-card.tsx) renders nodes in array order and passes the index down:

```tsx
{card.nodes.map((node, index) => (
	<EditorNode
		key={node.id}
		cardId={card.id}
		cardWidth={card.width}
		cardHeight={card.height}
		zoom={zoom}
		node={node}
		isSelected={node.id === selectedNodeId}
		layerIndex={index}
		onSelect={handleSelectNode}
	/>
))}
```

[`components/editor-node.tsx`](./components/editor-node.tsx) converts that index into a z-index:

```tsx
style={{
	left: node.x,
	top: node.y,
	width: node.width,
	height: node.height,
	zIndex: (layerIndex + 1) * 5,
}}
```

Therefore:

- `card.nodes[0]` is the bottommost node.
- The final node in the array is the topmost node.
- Newly added nodes use `push`, so they appear on top.
- Reordering layers means moving an element within `nodes`.

The store operation is the complete layer mutation primitive:

```ts
reorderNode: (cardId, nodeId, targetIndex) =>
	set((state) => {
		const card = state.cards.find(({ id }) => id === cardId);
		const sourceIndex =
			card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;
		if (!card || sourceIndex < 0) return;
		const [node] = card.nodes.splice(sourceIndex, 1);
		if (!node) return;
		card.nodes.splice(
			Math.max(0, Math.min(targetIndex, card.nodes.length)),
			0,
			node,
		);
	}),
```

The layer panel presents topmost first, which is conventional for design tools, so [`components/layer-list.tsx`](./components/layer-list.tsx) reverses a copy:

```ts
const visualNodes = [...card.nodes].reverse();
```

During drag-and-drop it computes the desired order in visual/top-first space, reverses back to underlying/bottom-first order, then calls `reorderNode`. Understanding that conversion removes most of the apparent complexity in the layer drag code.

The current layer model has ordering, selection, labeling, and deletion. It does not yet model visibility, locked state, groups, masks, or custom layer names.

## 10. Selection is a pair of references into the aggregate

Selection is represented by:

```ts
selectedCardId: string | null;
selectedNodeId: string | null;
```

The store maintains the relationship between them:

```ts
selectCard: (id) => set({ selectedCardId: id, selectedNodeId: null }),
selectNode: (cardId, nodeId) =>
	set({ selectedCardId: cardId, selectedNodeId: nodeId }),
```

Selecting a card clears node selection. Selecting a node also selects its owning card. This prevents the nonsensical state “node B on card B is selected while card A is selected” during normal actions.

Selection is resolved rather than duplicated. [`components/editor-inspector.tsx`](./components/editor-inspector.tsx) shows the complete lookup and dispatch logic:

```tsx
const selectedCard = useEditorStore((state) =>
	state.cards.find((card) => card.id === state.selectedCardId),
);
const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
const selectedNode = selectedCard?.nodes.find(
	(node) => node.id === selectedNodeId,
);

return (
	<aside>{
		selectedCard && selectedNode ? (
			<NodeInspector card={selectedCard} node={selectedNode} />
		) : selectedCard ? (
			<CardInspector card={selectedCard} />
		) : (
			<NoSelectionPanel />
		)
	}</aside>
);
```

This gives the inspector a clean three-state machine:

```text
no selected card       → no-selection panel
selected card only     → card inspector
selected card + node   → node inspector
```

Deleting a selected node clears `selectedNodeId`. Deleting a selected card chooses the nearest surviving card and clears node selection. Deleting a non-selected card leaves the current selection untouched.

## 11. Mutation patches and type narrowing

Components edit existing records through partial patches:

```ts
export type EditorNodePatch =
	| Partial<TextNode>
	| Partial<ImageNode>
	| Partial<ShapeNode>;
```

The store merges a patch onto the current node:

```ts
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
```

This API is convenient for inspectors and pointer interactions:

```ts
updateNode(cardId, node.id, { color });
updateNode(cardId, node.id, { x, y });
updateNode(cardId, node.id, { width, height });
```

However, the patch type is permissive. Because it is a union of partial object types and the implementation casts the merged result, the store does not strongly prevent a caller from attempting a cross-variant or discriminator-changing patch. The UI avoids that by narrowing `node.type` before rendering variant-specific controls. In other words, node-kind integrity is currently maintained by disciplined callers, not by a generic-aware `updateNode` signature or runtime schema validation.

Card updates are split deliberately:

- `updateCard(id, patch)` changes structural card fields such as name, width, or height.
- `updateCardSettings(id, patch)` changes appearance/aspect settings and resolves aspect-ratio dimensions.

That separation communicates intent and ensures aspect-ratio edits trigger size recalculation.

## 12. Spatial invariants: nodes remain inside cards

The central geometry guard is `constrainNode` in [`store/editor-store.ts`](./store/editor-store.ts):

```ts
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

	return { ...node, width, height, x, y };
}
```

`NODE_CARD_INSET` is currently `0`, so nodes may touch every card edge. The helper still expresses an inset-aware formula, making a future safe margin possible in one place.

The order of calculation matters:

1. Clamp width and height to the available card area.
2. Clamp `x` and `y` using the already-clamped dimensions.

If position were clamped first, shrinking an oversized node afterward could produce inconsistent placement.

`constrainNode` runs after every `updateNode`, while pointer handlers also apply interaction-specific minimum sizes. The store's absolute minimum is one unit; the resize UI generally enforces 24 units. This means the domain accepts values that the current pointer UI would not normally produce—useful for templates or programmatic updates, but worth knowing.

### Zoom and pointer movement

Zoom belongs to canvas presentation, not saved node geometry. Dragging in [`components/editor-node.tsx`](./components/editor-node.tsx) converts screen-space deltas back into card-space deltas:

```ts
function moveNode(moveEvent: globalThis.PointerEvent) {
	const round = node.type === "image" ? Math.ceil : (value: number) => value;
	useEditorStore.getState().updateNode(cardId, node.id, {
		x: round(origin.x + (moveEvent.clientX - origin.pointerX) / zoom),
		y: round(origin.y + (moveEvent.clientY - origin.pointerY) / zoom),
	});
}
```

At `zoom = 0.5`, moving the pointer 20 screen pixels moves the node 40 logical units. Without division by zoom, dragging would feel slower as the canvas zoomed out and faster as it zoomed in.

Image geometry is rounded upward during drag and resize, while text and shapes may retain fractional values. That is an explicit behavior in the interaction layer, not a general invariant enforced by the store.

## 13. Rendering dispatch mirrors the domain union

[`components/editor-node.tsx`](./components/editor-node.tsx) owns the shared frame, selection ring, delete button, resize handles, dragging, and absolute positioning. It delegates only the variant-specific body:

```tsx
{node.type === "text" ? (
	<TextNode
		cardId={cardId}
		node={node}
		isSelected={isSelected}
		onSelect={selectNode}
		onStartDragging={startDragging}
	/>
) : node.type === "image" ? (
	<ImageNode
		cardId={cardId}
		node={node}
		isSelected={isSelected}
		onSelect={selectNode}
		onStartDragging={startDragging}
	/>
) : (
	<ShapeNode
		node={node}
		isSelected={isSelected}
		onSelect={selectNode}
		onStartDragging={startDragging}
	/>
)}
```

This is a direct architectural reflection of the domain:

```text
BaseNode fields  → EditorNode wrapper behavior
TextNode fields  → TextNode renderer and text inspector
ImageNode fields → ImageNode renderer and image inspector
ShapeNode fields → ShapeNode renderer and shape inspector
```

When adding a fourth node kind, the work is correspondingly broad: extend the union, create defaults and insertion action, normalize old/missing fields, add rendering dispatch, add inspector controls, label it in the layer list, and cover persistence/tests.

## 14. Templates are complete card snapshots

Templates in [`lib/editor-templates.ts`](./lib/editor-templates.ts) ultimately contain an `EditorCard`, not an unrelated template-only representation. This makes previewing and applying templates straightforward because templates speak the same domain language as live cards.

Applying one replaces the target card's modeled content and appearance while preserving the target card identity:

```ts
applyTemplate: (cardId, template) =>
	set((state) => {
		const cardIndex = state.cards.findIndex(({ id }) => id === cardId);
		if (cardIndex === -1) return;

		state.cards[cardIndex] = normalizeCard({
			...template,
			id: cardId,
			nodes: template.nodes.map((node) => ({ ...node, id: createId() })),
		});
		state.selectedCardId = cardId;
		state.selectedNodeId = null;
	}),
```

Three identity rules are encoded here:

- The destination card keeps its ID, so carousel selection and external references remain stable.
- Every template node gets a new ID, so applying the same template repeatedly cannot duplicate node identities.
- Node selection is cleared because the previously selected node may no longer exist.

The template is normalized after copying, so templates pass through the same geometry and compatibility rules as persisted cards and ordinary updates.

## 15. Persistence: session-scoped documents with migrations

The store uses Zustand persistence with `sessionStorage`:

```ts
export const EDITOR_SESSION_STORAGE_KEY = "kerning-editor-session";
```

The persistence configuration in [`store/editor-store.ts`](./store/editor-store.ts) is:

```ts
{
	name: EDITOR_SESSION_STORAGE_KEY,
	version: 6,
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
}
```

Several domain decisions are packed into this block:

- **Session scope:** closing the browser session may discard the document; this is not durable account/cloud persistence.
- **Actions are not serialized:** `partialize` keeps only data and selection, while current action implementations come from `currentState` during merge.
- **SSR safety:** `fallbackStorage` avoids touching `window` on the server.
- **Explicit hydration:** `skipHydration: true` means [`components/editor-page.tsx`](./components/editor-page.tsx) triggers rehydration on the client.
- **Schema versioning:** version `6` identifies the current persisted representation.
- **Repair on load:** every restored card is normalized before use.
- **Selection repair:** if the persisted selected card no longer exists, the first available card is selected and stale node selection is cleared.

### Migration versus normalization

These are related but different:

- **Migration** translates known old schema shapes into the current shape. For example, it moves legacy backgrounds/textures into current fill and texture fields and drops removed texture kinds.
- **Normalization** fills missing defaults, clamps values, normalizes percentages, and constrains nodes even when the data is nominally current.

This two-stage boundary is healthy for persisted client data. TypeScript only checks code at compile time; JSON restored from storage can be old, partial, or manually corrupted.

The normalization function is also a compact record of backward-compatible defaults. For example, old text nodes gain `letterSpacing`, `textAlign`, and `textCasing`; old image nodes gain crop/effect defaults; old shape nodes gain texture and shape defaults.

## 16. End-to-end feature flows

### Adding a text node

```text
EditorCard toolbar
  → addTextNode(card.id)
  → store finds owning card
  → createDefaultTextNode(card)
  → card.nodes.push(node)
  → node becomes top layer
  → selectedCardId and selectedNodeId update
  → EditorCard rerenders nodes
  → EditorNode dispatches to TextNode
  → inspector resolves and displays NodeInspector
```

The corresponding store action is:

```ts
addTextNode: (cardId) =>
	set((state) => {
		const card = state.cards.find(({ id }) => id === cardId);

		if (!card) return;

		const node = createDefaultTextNode(card);
		card.nodes.push(node);
		state.selectedCardId = cardId;
		state.selectedNodeId = node.id;
	}),
```

### Dragging a node

```text
pointer down on variant renderer
  → shared EditorNode selects node and captures pointer
  → pointer movement measured in screen pixels
  → delta divided by canvas zoom
  → updateNode(cardId, nodeId, {x, y})
  → store constrains node to card
  → React rerenders absolute left/top
```

Pointer capture matters because movement continues even if the pointer leaves the node while dragging. `event.stopPropagation()` prevents the card's selection surface from stealing the interaction.

### Reordering a layer

```text
drag row in LayerList (top-first visual order)
  → calculate insertion index among remaining visual rows
  → produce final visual ID order
  → reverse into bottom-first nodes[] order
  → reorderNode(..., underlyingIndex)
  → splice node to new index
  → EditorNode receives new layerIndex/z-index
```

### Changing card aspect ratio

```text
CardInspector
  → updateCardSettings(card.id, {aspectRatio})
  → resolve preset width and height
  → normalize card
  → clamp card dimensions
  → constrain every node to new bounds
  → canvas and inspectors rerender
```

## 17. Source map: where each part lives

| Domain concern | Canonical model/logic | Main consumers |
| --- | --- | --- |
| Card and node types | [`types.ts`](./types.ts) | Entire editor feature |
| State and actions | [`store/editor-store.ts`](./store/editor-store.ts) | Canvas, card, layers, inspectors, pickers |
| Card dimensions | [`lib/card-size.ts`](./lib/card-size.ts) | Store and card inspector |
| Fill defaults/normalization/CSS | [`lib/card-fill.ts`](./lib/card-fill.ts) | Store, card renderer, fill inspector |
| Card rendering | [`components/editor-card.tsx`](./components/editor-card.tsx) | Canvas |
| Shared node frame/interactions | [`components/editor-node.tsx`](./components/editor-node.tsx) | Card renderer |
| Text rendering/editing | [`components/text-node.tsx`](./components/text-node.tsx) | Shared node frame |
| Image rendering/editing | [`components/image-node.tsx`](./components/image-node.tsx) | Shared node frame |
| Shape rendering | [`components/shape-node.tsx`](./components/shape-node.tsx) | Shared node frame |
| Layer ordering UI | [`components/layer-list.tsx`](./components/layer-list.tsx) | Selected card |
| Card controls | [`components/card-inspector.tsx`](./components/card-inspector.tsx) | Editor inspector |
| Node controls | [`components/node-inspector.tsx`](./components/node-inspector.tsx) | Editor inspector |
| Contextual inspector routing | [`components/editor-inspector.tsx`](./components/editor-inspector.tsx) | Editor page |
| Template data | [`lib/editor-templates.ts`](./lib/editor-templates.ts) | Template sidebar/store |
| Shape catalog | [`lib/shape-library.ts`](./lib/shape-library.ts) | Shape picker/renderer |
| Stored image URL resolution | [`hooks/use-stored-image-url.ts`](./hooks/use-stored-image-url.ts) | Image renderers |
| Store behavior tests | [`store/editor-store.test.ts`](./store/editor-store.test.ts) | Domain regression coverage |
| Component interaction tests | [`components/editor-components.test.tsx`](./components/editor-components.test.tsx) | UI/domain integration coverage |

## 18. The invariants worth memorizing

If you remember only the following, the rest of the editor becomes much easier to read:

1. A card is the coordinate system and owner of its nodes.
2. Node coordinates are logical card units, not zoomed screen pixels.
3. Every node shares `id`, `x`, `y`, `width`, and `height`.
4. `node.type` selects text, image, or shape data and behavior.
5. The index in `card.nodes` is the layer order; later means higher.
6. The layer list reverses `nodes` only for top-first presentation.
7. Selecting a card clears node selection; selecting a node also selects its card.
8. Store updates constrain node bounds and normalize card data.
9. A texture is an overlay, not a base `CardFill` variant.
10. Templates are complete card snapshots with regenerated node IDs.
11. Persisted data is migrated and normalized before the UI trusts it.
12. The current model has no rotation, grouping, visibility, or locking.

## 19. Where the model is strong—and where it may evolve

The current model is effective because it is serializable, inspectable, and closely aligned with rendering. A card can be logged as ordinary JSON; a template can reuse the live card shape; a renderer can exhaustively branch on node type; layer ordering requires no secondary index structure.

As the product grows, the pressure points will likely be:

- **Safer patches:** make `updateNode` generic or variant-aware so cross-kind patches cannot compile.
- **Storage lifecycle:** move image cleanup behind a domain/service action so every deletion path behaves consistently.
- **History:** undo/redo will need transaction boundaries, especially for high-frequency pointer updates.
- **Transforms:** rotation would require a stored angle and careful resize/bounds mathematics.
- **Layer metadata:** visibility, locking, naming, grouping, and masks would justify explicit fields or a richer layer abstraction.
- **Validation:** a runtime schema could validate persisted sessions more rigorously than normalization plus casts.
- **Durability:** account or project persistence would separate saved document state from local UI selection and session state.

Those are extensions, not hidden current behavior. The best way to understand this codebase is to treat the types and store as the truth, then follow each field outward into its inspector, renderer, and interaction code.
