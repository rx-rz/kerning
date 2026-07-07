# The Editor Domain Model

This chapter describes the data model behind the Kerning editor: cards, nodes, appearance, geometry, selection, per-card history, templates, and persistence. The canonical declarations are in [`types.ts`](./types.ts); the invariants and transitions are implemented in [`store/editor-store.ts`](./store/editor-store.ts).

The shortest useful mental model is:

```text
Editor session
├── cards[]
│   ├── identity and dimensions
│   ├── settings
│   │   ├── base fill
│   │   ├── optional texture
│   │   └── card-wide opacity, blur, and border
│   └── nodes[]                    array order is layer order
│       ├── shared geometry
│       └── text | image | shape content
├── selectedCardId
├── selectedNodeId
└── cardHistories[cardId]          runtime-only undo/redo state
```

There is no separate `Document`, `Layer`, `Transform`, or `Selection` class. The editor is plain JSON-safe data plus store actions. Concepts such as layers and transforms emerge from fields on those objects.

## 1. The editor aggregate

The Zustand store owns the document, its selection, and runtime history:

```ts
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
```

The ownership rules are strict:

- The editor owns the card list.
- Each card owns its settings and nodes.
- A node belongs to exactly one card because it is nested in that card's `nodes` array.
- Selection and history refer to content by ID or snapshot; components do not own duplicate mutable copies.

Every node action therefore takes both `cardId` and `nodeId`. The store does not treat a bare node ID as a complete address.

## 2. Cards

An editor card is a bounded page-like coordinate space:

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

`id` is stable while a card is edited. `name` is user-facing and can be edited from either the selected-card toolbar or inspector. `width` and `height` are logical editor units, not viewport pixels. The card is authored at those dimensions and visually scaled by canvas zoom.

Fresh sessions start with one selected business card. New untitled cards receive the first available name in the sequence `Untitled Card`, `Untitled Card 2`, and so on. The store refuses to delete the final card.

## 3. Card geometry and aspect ratios

The supported presets are:

```ts
export type CardAspectRatio =
  | "1:1"
  | "4:5"
  | "16:9"
  | "9:16"
  | "3:2"
  | "business-card";
```

The preset label lives in `settings.aspectRatio`; resolved logical dimensions live in `width` and `height`. Changing the preset resolves new dimensions, normalizes the card, and switches every node to the coordinates saved for that ratio.

```ts
function switchNodeAspectRatio(node, from, to, card) {
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
```

This gives each node an aspect-ratio-specific position memory. If the destination ratio has been used before, its saved coordinates are restored. On first use, the current coordinates are reused and clamped into the new card bounds. Node size is shared across ratios; only `x` and `y` are remembered separately.

## 4. Card appearance

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

The base fill and procedural texture are separate layers. `CardFill` can be solid, linear gradient, radial gradient, or image. `TextureCardFill` can be paper, fluted glass, halftone, or halftone CMYK.

The renderer composes them in this order:

```text
card fill CSS
→ optional procedural texture
→ image-fill element when fill.type === "image"
→ selection surface
→ nodes
→ smart-guide overlay
```

Card opacity, blur, and border are applied to the logical card container. Default fill and texture colors now use the editor's teal-led palette; the shared default node color is `#046A63`.

## 5. Shared node geometry

All node variants inherit the same spatial contract:

```ts
type BaseNode = {
  id: string;
  x: number;
  y: number;
  positions?: Partial<Record<CardAspectRatio, NodePosition>>;
  width: number;
  height: number;
  rotation?: NodeRotation;
};

export type NodePosition = { x: number; y: number };
export type NodeRotation = number;
```

`positions` and `rotation` are optional at the type boundary so older persisted data and older template objects can still deserialize. Normalization fills them in:

```ts
{
	...node,
	rotation: node.rotation ?? 0,
	positions: {
		...(node.positions ?? {}),
		[card.settings.aspectRatio]: { x: node.x, y: node.y },
	},
}
```

The current ratio's entry is updated whenever `updateNode` changes the node. Rotation is clamped to `0…360` and rendered as `transform: rotate(...)`.

The spatial constraints remain axis-aligned: width and height are clamped to the card, then `x` and `y` are clamped so the unrotated rectangle remains inside. A rotated corner may therefore extend beyond the card and be clipped. The model does not yet compute a transformed bounding box.

## 6. Text nodes

```ts
export type TextNode = BaseNode & {
  type: "text";
  text: string;
  fontType: "primary" | "sec1" | "sec2";
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  textAlign: "left" | "center" | "right" | "justify";
  textCasing: "none" | "uppercase" | "lowercase" | "capitalize";
};
```

Text nodes store semantic font roles rather than concrete font-family names. [`components/editor-page.tsx`](./components/editor-page.tsx) maps project fonts onto CSS custom properties for those roles. Inline editing updates both content and a conservative minimum height estimate so newly wrapped lines are not immediately clipped.

New text nodes begin at `(24, 24)`, use the active ratio's position slot, have zero rotation, and use `#046A63`.

## 7. Image nodes

```ts
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
	blendMode?: /* legacy values */;
	texture?: TextureCardFill | null;
};
```

An image can be remote (`src`) or stored in IndexedDB (`imageId`). The hook [`hooks/use-stored-image-url.ts`](./hooks/use-stored-image-url.ts) turns stored blobs into temporary object URLs and revokes them when no longer needed.

`blendMode` remains optional only to deserialize older saved projects. The current image renderer, template preview, and inspector do not apply or expose blend modes. New image nodes do not write the field.

Image effects cover brightness, contrast, saturation, blur, grayscale, and sepia. `zoom`, `positionX`, and `positionY` control crop composition independently of the node's outer frame.

## 8. Shape nodes

```ts
export type ShapeNode = BaseNode & {
  type: "shape";
  shapeType: "icon" | "emoji" | "line" | "rectangle" | "ellipse";
  shape: string;
  color: string;
  strokeWidth: number;
  texture?: TextureCardFill | null;
};
```

`shapeType` selects the renderer and `shape` selects the specific icon, emoji, or line orientation. `strokeWidth` is shared by icon strokes, line thickness, and procedural texture masks. It defaults to `1` during creation and normalization and is editable from `1` to `24` in the inspector.

Rectangles and ellipses are filled shapes, so their visible fill does not use `strokeWidth`. Emoji color depends on platform emoji rendering even though the domain retains `color` consistently.

## 9. Layers

There is no layer object. The node array is the layer stack:

```text
nodes[0]                 back
nodes[1]
...
nodes[n - 1]             front
```

[`components/editor-node.tsx`](./components/editor-node.tsx) derives `z-index` from `(layerIndex + 1) * 5`. New nodes are appended and therefore start on top. `reorderNode` removes an item and inserts it at a clamped target index. The layers panel reverses this order for display so the frontmost node appears first.

## 10. Selection

Selection is a coordinated pair of references:

```ts
selectCard: (id) => set({ selectedCardId: id, selectedNodeId: null }),
selectNode: (cardId, nodeId) =>
	set({ selectedCardId: cardId, selectedNodeId: nodeId }),
```

Selecting a card clears node selection. Selecting a node also selects its owner. Deleting the selected node clears only `selectedNodeId`; deleting the selected card chooses the nearest surviving card and clears node selection.

History snapshots additionally remember the selected node for the card. Undo and redo restore both the card snapshot and that selection reference.

## 11. Per-card history

History is runtime state keyed by card ID:

```ts
type CardHistorySnapshot = {
  card: EditorCard;
  selectedNodeId: string | null;
};

type CardHistory = {
  past: CardHistorySnapshot[];
  future: CardHistorySnapshot[];
  transactionStart: CardHistorySnapshot | null;
};
```

Ordinary mutations record the card immediately before the change. Drag and resize gestures open a transaction, suppress intermediate snapshots, and commit one starting snapshot when the gesture ends. Each card keeps at most 100 past snapshots. A new edit clears that card's redo stack.

History deliberately does not cover adding or deleting whole cards, changing selection by itself, or project-level metadata. It is also excluded from persisted session data, so reloading starts with empty undo/redo stacks.

## 12. Templates

Templates are complete card snapshots with catalog metadata:

```ts
export type EditorTemplate = {
  id: string;
  name: string;
  category:
    | "Album covers"
    | "Movie posters"
    | "Business cards"
    | "Typography specimens"
    | "Pitch decks";
  aspectRatio: CardAspectRatio;
  card: EditorCard;
};
```

Applying a template preserves the destination card ID, replaces its other content, generates fresh node IDs, normalizes the result, clears node selection, and records the replaced card for undo.

## 13. Persistence and normalization

The store persists to `sessionStorage` under `kerning-editor-session`, currently at version `7`:

```ts
partialize: ({ cards, selectedCardId, selectedNodeId }) => ({
	cards,
	selectedCardId,
	selectedNodeId,
}),
```

Only cards and selection survive reload. History, canvas zoom, carousel lock, open panels, guide overlays, and title input drafts do not.

Hydration has two different jobs:

- **Migration** converts legacy appearance formats and removed textures into current structures.
- **Normalization** supplies missing defaults, clamps dimensions and nodes, creates current-ratio position entries, and fills zero rotation or default shape stroke width.

This distinction matters because a persisted object may already be on schema version 7 and still contain incomplete optional fields from templates or transitional code.

## 14. Invariants worth remembering

1. A live editor normally has at least one card, and the final card cannot be deleted.
2. Node mutations are scoped by both card ID and node ID.
3. Card and node coordinates are logical units; zoom is presentation state.
4. Nodes are constrained to an axis-aligned card-local rectangle.
5. Rotation is stored and rendered, but transformed bounds are not calculated.
6. Each aspect ratio remembers node position, not node size.
7. Node-array order is layer order.
8. New nodes append to the front of the layer stack.
9. `blendMode` is legacy data and has no current rendering effect.
10. Shape `strokeWidth` is part of the durable model.
11. Card history is per-card, limited to 100 past snapshots, and not persisted.
12. All durable edits should pass through named store actions.

## 15. Source map

- [`types.ts`](./types.ts): durable card and node shapes.
- [`store/editor-store.ts`](./store/editor-store.ts): creation, constraints, history, migration, normalization, and persistence.
- [`lib/card-size.ts`](./lib/card-size.ts): preset dimensions and card clamps.
- [`lib/card-fill.ts`](./lib/card-fill.ts): fill defaults, percentage normalization, and CSS conversion.
- [`lib/editor-templates.ts`](./lib/editor-templates.ts): template catalog and card snapshots.
- [`components/editor-node.tsx`](./components/editor-node.tsx): geometry rendering and manipulation.
- [`components/editor-card.tsx`](./components/editor-card.tsx): card composition and layer stack.
- [`components/node-inspector.tsx`](./components/node-inspector.tsx): editable node fields.
