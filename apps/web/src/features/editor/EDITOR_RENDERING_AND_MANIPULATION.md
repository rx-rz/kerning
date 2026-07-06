# Editor Nodes, Manipulation, Card Rendering, and Navigation

This chapter follows an editor object from its stored node data to the pixels and pointer interactions on screen. It covers shared node selection, dragging and resizing, the current rotation boundary, type-specific text/image/shape rendering, IndexedDB image URLs, card backgrounds, zoom, card states, and tick navigation.

The canonical sources are:

- [`components/editor-node.tsx`](./components/editor-node.tsx) — shared node frame and manipulation.
- [`components/text-node.tsx`](./components/text-node.tsx) — text rendering and inline editing.
- [`components/image-node.tsx`](./components/image-node.tsx) — image composition, effects, and replacement.
- [`components/shape-node.tsx`](./components/shape-node.tsx) — shape dispatch and line orientation.
- [`hooks/use-stored-image-url.ts`](./hooks/use-stored-image-url.ts) — IndexedDB blob URL lifecycle.
- [`components/editor-card.tsx`](./components/editor-card.tsx) — card stack, toolbar, layers, and nodes.
- [`components/card-tick-navigator.tsx`](./components/card-tick-navigator.tsx) — direct card selection.
- [`lib/card-size.ts`](./lib/card-size.ts) — aspect-ratio dimensions and clamps.
- [`lib/card-fill.ts`](./lib/card-fill.ts) — fill normalization and CSS conversion.

## 1. Rendering hierarchy

```text
EditorCard outer footprint (width × zoom, height × zoom)
└── scaled logical card (width × height, transform: scale(zoom))
    ├── base fill CSS
    ├── procedural texture overlay?
    ├── image fill layer?
    ├── card selection surface
    └── EditorNode[] in array order
        ├── shared positioned frame
        ├── TextNode | ImageNode | ShapeNode
        └── selected controls
            ├── delete
            ├── eight resize handles
            └── text width handle
```

The card and nodes are authored in logical units. The browser scales the whole logical card for zoom. Pointer calculations reverse that scale before writing geometry.

## 2. The shared node frame

[`components/editor-node.tsx`](./components/editor-node.tsx) receives everything shared behavior needs:

```ts
type EditorNodeProps = {
	cardId: string;
	cardWidth: number;
	cardHeight: number;
	zoom: number;
	node: EditorNodeData;
	isSelected: boolean;
	layerIndex: number;
	onSelect: (nodeId: string) => void;
};
```

The owner ID scopes mutations. Card dimensions bound resizing. Zoom converts pointer space to card space. `layerIndex` translates array order into stacking. The node variant is passed as one discriminated union.

The complete shared frame style is:

```tsx
<div
	ref={nodeRef}
	data-editor-node
	className={cn(
		"absolute m-0 touch-none bg-transparent p-0 text-left transition-[box-shadow]",
		isSelected
			? "ring-1 ring-foreground/55 shadow-[0_0_0_1px_rgba(255,255,255,.55)]"
			: "hover:ring-1 hover:ring-foreground/25",
	)}
	style={{
		left: node.x,
		top: node.y,
		width: node.width,
		height: node.height,
		zIndex: (layerIndex + 1) * 5,
	}}
>
	{/* variant renderer and selected controls */}
</div>
```

`touch-none` prevents browser touch gestures from competing with pointer manipulation. The frame owns geometry; variant renderers fill `size-full` and focus on content.

## 3. Selection and event propagation

The wrapper creates one local selector:

```ts
const selectNode = () => onSelect(node.id);
```

`EditorCard` turns that into the store transition `selectNode(card.id, nodeId)` and optionally tells the page to open the inspector. Variant renderers call this callback on click.

All specific interactions stop propagation. Without that, a click or pointer-down could bubble to the full-card selection surface and immediately replace node selection with card-only selection. This is a recurring event rule:

```text
node content/handle/delete receives event
→ stop propagation
→ select or mutate node
→ card selection button never handles that event
```

## 4. Dragging

The complete drag implementation is:

```ts
function startDragging(event: PointerEvent<HTMLElement>) {
	event.stopPropagation();
	selectNode();

	const origin = {
		pointerX: event.clientX,
		pointerY: event.clientY,
		x: node.x,
		y: node.y,
	};
	const target = event.currentTarget;
	target.setPointerCapture(event.pointerId);

	function moveNode(moveEvent: globalThis.PointerEvent) {
		const round =
			node.type === "image" ? Math.ceil : (value: number) => value;
		useEditorStore.getState().updateNode(cardId, node.id, {
			x: round(origin.x + (moveEvent.clientX - origin.pointerX) / zoom),
			y: round(origin.y + (moveEvent.clientY - origin.pointerY) / zoom),
		});
	}

	function stopDragging() {
		target.removeEventListener("pointermove", moveNode);
		target.removeEventListener("pointerup", stopDragging);
		target.removeEventListener("pointercancel", stopDragging);
	}

	target.addEventListener("pointermove", moveNode);
	target.addEventListener("pointerup", stopDragging);
	target.addEventListener("pointercancel", stopDragging);
}
```

The starting pointer and model position form a stable origin. Each movement computes total displacement from that origin, avoiding accumulated rounding drift. Dividing by `zoom` converts screen pixels to logical card units:

```text
logical delta = screen delta / zoom
```

At 50% zoom, 20 screen pixels equal 40 card units. Image positions are rounded upward; text and shape positions may remain fractional. Pointer capture keeps events flowing to the initiating target even after the pointer leaves its bounds. Cleanup occurs on both normal completion and cancellation.

The store's `updateNode` finally constrains the requested position so the node stays inside its card.

## 5. Eight-direction resizing

Directions are explicit:

```ts
type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
```

The complete setup records pointer, geometry, and a measured width:

```ts
const measuredWidth = nodeRef.current?.getBoundingClientRect().width;
const origin = {
	pointerX: event.clientX,
	pointerY: event.clientY,
	width:
		measuredWidth && measuredWidth > 0 ? measuredWidth / zoom : node.width,
	height: node.height,
	x: node.x,
	y: node.y,
};
```

Using the DOM width when available makes resizing begin from what is actually painted; dividing by zoom converts it back to model units.

The core resize calculation is:

```ts
const deltaX = (moveEvent.clientX - origin.pointerX) / zoom;
const deltaY = (moveEvent.clientY - origin.pointerY) / zoom;
const round = node.type === "image" ? Math.ceil : (value: number) => value;

const movesLeft = direction.includes("w");
const movesRight = direction.includes("e");
const movesTop = direction.includes("n");
const movesBottom = direction.includes("s");
const width = movesLeft
	? Math.min(origin.x + origin.width, Math.max(24, origin.width - deltaX))
	: movesRight
		? Math.min(cardWidth - origin.x, Math.max(24, origin.width + deltaX))
		: origin.width;
const height = movesTop
	? Math.min(origin.y + origin.height, Math.max(24, origin.height - deltaY))
	: movesBottom
		? Math.min(cardHeight - origin.y, Math.max(24, origin.height + deltaY))
		: origin.height;

useEditorStore.getState().updateNode(cardId, node.id, {
	width: round(width),
	height: round(height),
	x: movesLeft ? round(origin.x + origin.width - width) : origin.x,
	y: movesTop ? round(origin.y + origin.height - height) : origin.y,
});
```

Right and bottom handles keep `x`/`y` fixed. Left and top handles preserve the opposite edge by moving position as size changes:

```text
new left = old right - new width
new top  = old bottom - new height
```

The interaction minimum is 24 units. The store's domain minimum is one unit, so programmatic/template data can be smaller than pointer-created geometry. Card-edge maxima are applied in the interaction and then defensively enforced again by the store.

## 6. Text width-only resizing

Selected text gets an additional right-edge handle. Its complete movement rule is:

```ts
const maximumWidth = cardWidth - node.x;
useEditorStore.getState().updateNode(cardId, node.id, {
	width: Math.min(
		maximumWidth,
		Math.max(
			24,
			origin.width + (moveEvent.clientX - origin.pointerX) / zoom,
		),
	),
});
```

This changes wrapping width without changing height directly. The text renderer may subsequently grow height when edited.

## 7. Handle rendering

The eight handles are data-driven rather than eight separate JSX branches:

```tsx
{(
	[
		["n", "top-0 left-1/2 h-1.5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"],
		["ne", "top-0 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"],
		["e", "top-1/2 right-0 h-5 w-1.5 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
		["se", "right-0 bottom-0 size-2.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"],
		["s", "bottom-0 left-1/2 h-1.5 w-5 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"],
		["sw", "bottom-0 left-0 size-2.5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"],
		["w", "top-1/2 left-0 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
		["nw", "top-0 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"],
	] as const
).map(([direction, position]) => (
	<button
		key={direction}
		type="button"
		data-editor-node-resize-handle={direction}
		aria-label={
			direction === "se"
				? `Resize ${node.type} node`
				: `Resize ${node.type} node from ${direction}`
		}
		className={cn(
			"absolute z-30 touch-none rounded-[2px] bg-foreground/75 p-0 shadow-sm outline-none",
			position,
		)}
		onClick={(event) => event.stopPropagation()}
		onPointerDown={(event) => startResizing(event, direction)}
	/>
))}
```

Data attributes make the handles straightforward to target in component tests.

## 8. Rotation: the important current boundary

The editor does **not** currently support general node rotation. `BaseNode` has no rotation angle, `EditorNode` has no rotation handle, resize math is axis-aligned, and the store has no rotate action.

There is one visually rotated behavior: line shapes use their `shape` value to choose a fixed orientation inside [`components/shape-node.tsx`](./components/shape-node.tsx):

```ts
const rotation =
	node.shape === "vertical"
		? 90
		: node.shape === "diagonal-up"
			? -30
			: node.shape === "diagonal-down"
				? 30
				: 0;
```

That is rendering of four line variants, not a persisted transform. A future general rotation feature needs at least an angle field, a rotate gesture, inspector control, transformed hit testing, and a clear policy for card-bound constraints.

## 9. Variant dispatch

The complete dispatch in [`components/editor-node.tsx`](./components/editor-node.tsx) mirrors the discriminated union:

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

The shared wrapper owns geometry and controls. Renderers own content-specific behavior.

## 10. Text rendering and inline editing

[`components/text-node.tsx`](./components/text-node.tsx) renders a controlled `<textarea>`. Local `isEditing` distinguishes selected-and-movable from selected-and-editable:

```ts
const [isEditing, setIsEditing] = useState(false);
const isTextEditing = isSelected && isEditing;
```

Double-click enters editing; blur or Escape exits. Losing selection also exits through an effect. A single click selects without entering text mode.

The full typography mapping is:

```tsx
style={{
	fontSize: node.fontSize,
	fontWeight: node.fontWeight,
	lineHeight: node.lineHeight,
	letterSpacing: node.letterSpacing,
	color: node.color,
	WebkitTextFillColor: node.color,
	textAlign: node.textAlign,
	textTransform: node.textCasing,
	fontFamily: `var(--font-project-${node.fontType})`,
}}
```

`fontType` selects a semantic CSS variable supplied by `EditorWorkspace`. The node does not contain a raw font-family string.

Text input estimates required height:

```ts
const nextText = event.target.value;
const characterWidth = Math.max(
	node.fontSize * 0.5 + Math.max(node.letterSpacing, 0),
	1,
);
const charactersPerLine = Math.max(
	1,
	Math.floor(node.width / characterWidth),
);
const lineCount = nextText
	.split("\n")
	.reduce(
		(lines, paragraph) =>
			lines + Math.max(1, Math.ceil(paragraph.length / charactersPerLine)),
		0,
	);
const requiredHeight = Math.ceil(
	lineCount * node.fontSize * node.lineHeight + node.fontSize * 0.18,
);

useEditorStore.getState().updateNode(cardId, node.id, {
	text: nextText,
	height: Math.max(node.height, requiredHeight),
});
```

This is an approximation, not DOM typography measurement. It only grows the node; deleting text does not shrink it. The store may cap growth at the card edge.

Pointer behavior changes by mode. While editing, pointer-down remains inside the textarea for caret/selection. Otherwise it starts shared dragging.

## 11. Image rendering and composition

[`components/image-node.tsx`](./components/image-node.tsx) resolves either an explicit source or stored blob:

```ts
const storedImageUrl = useStoredImageUrl(node.imageId);
const imageUrl = node.src || storedImageUrl;
const imagePosition = `${node.positionX}% ${node.positionY}%`;
const imageFilter = [
	`brightness(${node.effects.brightness}%)`,
	`contrast(${node.effects.contrast}%)`,
	`saturate(${node.effects.saturation}%)`,
	`blur(${node.effects.blur}px)`,
	`grayscale(${node.effects.grayscale}%)`,
	`sepia(${node.effects.sepia}%)`,
].join(" ");
```

`src` wins when both exist. Position fields feed `object-position` and `transform-origin`, so zoom expands around the chosen focal point.

The complete painted image body is:

```tsx
<span className="relative block size-full overflow-hidden">
	<img
		className="pointer-events-none size-full"
		src={imageUrl}
		alt={node.alt}
		style={{
			objectFit: node.objectFit,
			objectPosition: imagePosition,
			transform: `scale(${node.zoom})`,
			transformOrigin: imagePosition,
			filter: imageFilter,
			opacity: node.opacity,
			mixBlendMode: node.blendMode ?? "normal",
		}}
		draggable={false}
	/>
	{node.texture ? (
		<Suspense fallback={null}>
			<CardTextureFill fill={node.texture} />
		</Suspense>
	) : null}
</span>
```

The `<img>` is pointer-transparent and non-draggable so the surrounding button owns selection and movement. The node frame clips zoomed content. A procedural texture is lazy-loaded and painted above the image.

With no resolved URL, the renderer shows a dashed placeholder. Double-click opens a hidden file input.

## 12. Replacing a stored image

The complete replacement operation is:

```ts
async function replaceImage(file: File) {
	setIsReplacing(true);
	try {
		const imageId = await replaceEditorImage(file, node.imageId);
		useEditorStore.getState().updateNode(cardId, node.id, {
			imageId,
			src: "",
			alt: node.alt || file.name.replace(/\.[^.]+$/, ""),
		});
	} finally {
		setIsReplacing(false);
	}
}
```

The database helper replaces the prior record when possible and returns the current ID. Clearing `src` ensures the stored image becomes authoritative. Existing alt text is preserved; otherwise the filename without its final extension becomes alt text.

Deleting an image node from the shared wrapper performs both sides:

```ts
if (node.type === "image" && node.imageId) {
	void deleteEditorImage(node.imageId);
}
useEditorStore.getState().deleteNode(cardId, node.id);
```

The database deletion is fire-and-forget while the domain node disappears immediately. Other deletion routes must remember the same cleanup because the store itself does not own it.

## 13. Stored-image URL lifecycle

The complete [`hooks/use-stored-image-url.ts`](./hooks/use-stored-image-url.ts) hook is:

```ts
import { useEffect, useState } from "react";

import { getEditorImage } from "#/db/image-db";

export function useStoredImageUrl(imageId: string | null) {
	const [objectUrl, setObjectUrl] = useState("");

	useEffect(() => {
		if (!imageId) {
			setObjectUrl("");
			return;
		}

		let isActive = true;
		let nextObjectUrl = "";

		void getEditorImage(imageId).then((image) => {
			if (!image || !isActive) return;
			nextObjectUrl = URL.createObjectURL(image.blob);
			setObjectUrl(nextObjectUrl);
		});

		return () => {
			isActive = false;
			if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
		};
	}, [imageId]);

	return objectUrl;
}
```

IndexedDB stores a blob, not a browser-renderable permanent URL. The hook creates a temporary object URL, prevents a late async result from updating an inactive effect, and revokes the URL on ID change or unmount. Revocation is essential because object URLs retain blob memory.

## 14. Shape rendering

[`components/shape-node.tsx`](./components/shape-node.tsx) uses a button for selection/drag behavior and delegates pixels to `ShapeGraphic`. Its strategies are:

- `icon`: find a Lucide component in `ICON_COMPONENTS`, falling back to `Circle`.
- `emoji`: render text centered with container-query-relative sizing.
- `rectangle`: fill the frame with `backgroundColor`.
- `ellipse`: the rectangle strategy plus a fully rounded radius.
- `line`: render a horizontal bar with a fixed orientation selected by `shape`.

The complete primitive branches are:

```tsx
if (node.shapeType === "icon") {
	const Icon = ICON_COMPONENTS[node.shape] ?? Circle;
	return (
		<Icon
			className={className ?? "size-full"}
			color={node.color}
			strokeWidth={1.8}
		/>
	);
}

if (node.shapeType === "emoji") {
	return (
		<span
			className={
				className ?? "flex size-full items-center justify-center leading-none"
			}
			style={{ color: node.color, fontSize: "min(80cqw, 80cqh)" }}
		>
			{node.shape}
		</span>
	);
}

if (node.shapeType === "rectangle" || node.shapeType === "ellipse") {
	return (
		<span
			className={className ?? "block size-full"}
			style={{
				backgroundColor: node.color,
				borderRadius: node.shapeType === "ellipse" ? "999px" : undefined,
			}}
		/>
	);
}
```

Shapes may also receive a lazy procedural texture through `ShapeTextureFill`, painted over `ShapeGraphic`.

## 15. Card footprint and zoom

[`components/editor-card.tsx`](./components/editor-card.tsx) uses two nested boxes. The outer footprint reserves scaled layout space:

```tsx
<div
	data-card-id={card.id}
	data-card-zoom={zoom}
	className="relative shrink-0 border-px"
	style={{
		width: card.width * zoom,
		height: card.height * zoom,
	}}
>
```

The inner card keeps logical dimensions and is visually scaled:

```tsx
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
```

This prevents CSS transforms—which do not affect normal layout measurements—from causing cards to overlap. Nodes remain authored in the card's unscaled coordinate system.

## 16. Background composition

The full background order is:

```tsx
<div style={{ ...getCardFillStyle(card.settings.fill), /* card effects */ }}>
	{card.settings.texture ? (
		<Suspense fallback={null}>
			<CardTextureFill fill={card.settings.texture} />
		</Suspense>
	) : null}
	{card.settings.fill.type === "image" ? (
		<CardImageFill fill={card.settings.fill} />
	) : null}
	{/* selection surface and nodes */}
</div>
```

`getCardFillStyle` handles CSS-native solid and gradient information. Image fills require a component because they may resolve stored images. Texture is a separate overlay, so a gradient or image can coexist with paper, halftone, CMYK halftone, or fluted-glass rendering.

Opacity and blur are on the card container. Consequently they affect the entire card subtree, including nodes—not only the background. The border is also a card-container property.

## 17. Card selection surface and nodes

After backgrounds, a transparent full-card button provides the card selection hit area:

```tsx
<button
	type="button"
	aria-label={`Select ${card.name}`}
	aria-pressed={isSelected}
	className="absolute inset-0 size-full border-0 bg-transparent"
	onClick={(event) => {
		event.stopPropagation();
		onSelect(card.id);
	}}
/>
```

Nodes render after it and have explicit positive z-indices, so they remain interactive above the selection surface:

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

Later array elements receive larger z-indices and appear higher.

## 18. Card states and contextual controls

Every card always renders content, but only the selected card renders its external controls:

- name badge;
- add text;
- add image;
- shape picker;
- template sidebar trigger;
- settings/inspector trigger;
- delete, only when more than one card exists;
- layers toggle and optional `LayerList`.

Selected visual state adds a ring and z-index. `canDelete` derives from `cards.length > 1`, matching the store's last-card guard. The local `layersOpen` state belongs to each mounted card component; it is presentation state, not persisted document data.

Adding text or images calls store actions directly. Shape insertion is delegated to [`components/shape-picker.tsx`](./components/shape-picker.tsx). Template and inspector controls call page-level callbacks because they open workspace surfaces.

## 19. Card size presets and constraints

The complete [`lib/card-size.ts`](./lib/card-size.ts) implementation is:

```ts
import type { CardAspectRatio } from "#/features/editor/types";

export type CardSize = {
	width: number;
	height: number;
};

export const MIN_CARD_DIMENSION = 1;
export const MAX_CARD_WIDTH = 640;
export const MAX_CARD_HEIGHT = 640;

const CARD_SIZES: Record<CardAspectRatio, CardSize> = {
	"1:1": { width: 500, height: 500 },
	"4:5": { width: 480, height: 600 },
	"16:9": { width: 640, height: 360 },
	"9:16": { width: 360, height: 640 },
	"3:2": { width: 600, height: 400 },
	"business-card": { width: 560, height: 320 },
};

export function getCardSizeFromAspectRatio(
	aspectRatio: CardAspectRatio,
): CardSize {
	return CARD_SIZES[aspectRatio];
}

export function clampCardWidth(width: number) {
	return Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_DIMENSION, width));
}

export function clampCardHeight(height: number) {
	return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_DIMENSION, height));
}
```

Preset dimensions never exceed the 640-unit bounds. Direct card patches are clamped too. When dimensions shrink, store normalization constrains every node into the new card rectangle.

## 20. Tick navigation

[`components/card-tick-navigator.tsx`](./components/card-tick-navigator.tsx) is a store-connected direct navigation control. It reads cards and selection and calls `selectCard`:

```tsx
{cards.map((card, index) => {
	const isSelected = card.id === selectedCardId;

	return (
		<button
			type="button"
			key={card.id}
			aria-label={`Go to ${card.name}`}
			aria-current={isSelected ? "true" : undefined}
			className="flex h-5 min-w-5 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
			onClick={() => selectCard(card.id)}
		>
			<span
				className={cn(
					"h-px shrink-0 bg-foreground/35 transition-[width,background-color,height]",
					index % 5 === 0 ? "w-5" : "w-3",
					isSelected && "h-0.5 w-6 bg-foreground",
				)}
			/>
			<span
				className={cn(
					"pointer-events-none max-w-0 -translate-x-1 overflow-hidden whitespace-nowrap text-xs opacity-0 transition-[max-width,opacity,transform] duration-200 group-hover:max-w-44 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:max-w-44 group-focus-within:translate-x-0 group-focus-within:opacity-100",
					isSelected
						? "font-semibold text-foreground"
						: "text-muted-foreground",
				)}
			>
				{card.name}
			</span>
		</button>
	);
})}
```

Every fifth tick is longer, the selected tick is stronger, and labels expand on hover/focus. Selecting through this navigator also clears node selection because the store's `selectCard` action enforces that invariant.

The navigator stops click and keydown propagation at its `<nav>` boundary so canvas-level shortcuts or deselection do not steal navigation events. It returns `null` for an empty card array, though normal store invariants keep at least one card.

## 21. End-to-end manipulation flows

### Drag an image

```text
pointer down on ImageNode button
→ shared startDragging
→ event stops and node becomes selected
→ pointer captured
→ screen delta divided by zoom
→ image coordinates rounded upward
→ updateNode merges patch
→ store constrains frame to card
→ absolute left/top rerender
```

### Resize from the north-west corner

```text
pointer down on nw handle
→ capture original box
→ deltas converted to logical units
→ width decreases as pointer moves right
→ height decreases as pointer moves down
→ x/y move so original right/bottom edges stay fixed
→ 24-unit interaction minimum
→ card-edge and store constraints
```

### Replace an image

```text
double-click ImageNode
→ hidden file picker opens
→ replaceEditorImage writes/replaces IndexedDB record
→ node receives imageId and clears src
→ useStoredImageUrl fetches blob
→ object URL created
→ img rerenders
→ URL revoked when ID changes or node unmounts
```

### Navigate to another card

```text
tick button clicked
→ selectCard(card.id)
→ selectedCardId changes
→ selectedNodeId clears
→ card selection ring/toolbars move
→ inspector switches to card mode
```

## 22. Current limits and likely evolution

- No general rotation, skew, grouped transforms, or transformed bounds.
- Resize does not preserve aspect ratio for images or shapes.
- Text auto-height is estimated and growth-only.
- Image storage cleanup is duplicated at UI deletion call sites.
- Image replacement has no visible error branch beyond clearing the loading flag.
- Card-wide opacity and blur include foreground nodes; separating background effects would require another wrapper.
- Pointer updates are immediate and ungrouped; future history needs gesture transactions.

The shared-frame architecture is the central idea: `EditorNode` standardizes spatial behavior once, while the three renderers remain small and type-specific. `EditorCard` then supplies the logical coordinate system, visual background stack, and selected-card tools around those nodes.
