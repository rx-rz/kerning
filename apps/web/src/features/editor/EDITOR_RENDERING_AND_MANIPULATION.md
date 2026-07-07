# Editor Nodes, Manipulation, Card Rendering, and Navigation

This chapter follows editor data into pixels and pointer interactions. It covers the shared node frame, rotation, animation-frame-coalesced dragging and resizing, smart-guide snapping, gesture history, type-specific rendering, card composition, zoom, and navigation.

Canonical sources:

- [`components/editor-node.tsx`](./components/editor-node.tsx): shared node frame and gestures.
- [`lib/smart-guide-engine.ts`](./lib/smart-guide-engine.ts): alignment and equal-spacing geometry.
- [`components/smart-guide-overlay.tsx`](./components/smart-guide-overlay.tsx): guide rendering.
- [`components/text-node.tsx`](./components/text-node.tsx): text rendering and inline editing.
- [`components/image-node.tsx`](./components/image-node.tsx): image composition and replacement.
- [`components/shape-node.tsx`](./components/shape-node.tsx): shape dispatch and stroke width.
- [`components/editor-card.tsx`](./components/editor-card.tsx): card stack, controls, layers, and guides.
- [`components/editor-canvas.tsx`](./components/editor-canvas.tsx): carousel navigation and zoom.
- [`components/card-tick-navigator.tsx`](./components/card-tick-navigator.tsx): direct card selection.

## 1. Rendering hierarchy

```text
EditorCard outer footprint (logical size × zoom)
└── logical card (width × height, transform: scale(zoom))
    ├── base fill CSS
    ├── procedural texture?
    ├── image fill?
    ├── full-card selection surface
    ├── EditorNode[] in array order
    │   ├── positioned and rotated shared frame
    │   ├── TextNode | ImageNode | ShapeNode
    │   └── selected controls
    │       ├── delete
    │       ├── eight resize handles
    │       └── text width handle
    └── SmartGuideOverlay
```

Everything inside a card is authored in logical units. Zoom scales the card once at its root. Pointer calculations divide screen movement by zoom before writing model coordinates.

## 2. Shared node frame

Every node variant passes through [`components/editor-node.tsx`](./components/editor-node.tsx):

```ts
type EditorNodeProps = {
  cardId: string;
  cardWidth: number;
  cardHeight: number;
  zoom: number;
  node: EditorNodeData;
  nodes: readonly EditorNodeData[];
  isSelected: boolean;
  layerIndex: number;
  onSelect: (nodeId: string) => void;
  onGuidesChange: (guides: SmartGuide[]) => void;
};
```

`nodes` lets each gesture build a guide engine from the other nodes. `onGuidesChange` lifts temporary guide state to the card, which is the shared coordinate space.

The frame owns position, size, rotation, and layer order:

```tsx
style={{
	left: node.x,
	top: node.y,
	width: node.width,
	height: node.height,
	transform: `rotate(${node.rotation ?? 0}deg)`,
	zIndex: (layerIndex + 1) * 5,
}}
```

`touch-none` prevents native touch gestures from competing with the editor's pointer interactions. Variant renderers fill the frame and own only their content-specific behavior.

## 3. Selection and propagation

An invisible full-card button sits below the nodes. Node clicks, pointer starts, handles, delete controls, and card controls stop propagation so a precise interaction is not immediately replaced by card-only selection.

```text
node interaction
→ stopPropagation()
→ selectNode(cardId, nodeId)
→ card selection surface does not run
```

Selected nodes show a ring, a delete button, and resize handles. Selecting a node can also reopen the inspector through a callback to `EditorWorkspace`.

## 4. Gesture scheduling

Pointer events can arrive faster than the browser paints. The node wrapper keeps only the latest pending operation and runs it in `requestAnimationFrame`:

```ts
function scheduleFrame(run: () => void) {
  pendingFrameRef.current = run;
  if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  frameRef.current = requestAnimationFrame(() => {
    frameRef.current = null;
    const pending = pendingFrameRef.current;
    pendingFrameRef.current = null;
    pending?.();
  });
}
```

This coalesces pointer bursts into at most one geometry calculation and store write for the latest coordinates in a paint cycle. Component unmount cancels the scheduled frame.

`finishInteraction` runs any last pending calculation, clears the frame bookkeeping, and removes guides. Both `pointerup` and `pointercancel` use the same cleanup path.

## 5. Dragging

Pointer-down selects the node, begins a history transaction, captures a fixed origin, constructs a guide engine, and captures the pointer:

```ts
const origin = {
  pointerX: event.clientX,
  pointerY: event.clientY,
  x: node.x,
  y: node.y,
};

const guideEngine = new SmartGuideEngine(
  nodes.filter(({ id }) => id !== node.id),
);
```

Every scheduled move starts from the unsnapped origin:

```ts
const result = guideEngine.compute({
  ...node,
  x: origin.x + (clientX - origin.pointerX) / zoom,
  y: origin.y + (clientY - origin.pointerY) / zoom,
});
```

Using total displacement prevents frame-by-frame rounding drift. Images retain their existing `Math.ceil` coordinate behavior; text and shapes can retain fractional values. After guide snapping, `updateNode` performs the final card-bound clamp and updates the active aspect ratio's saved position.

Pointer capture keeps the drag alive when the pointer leaves the element. Gesture completion ends the history transaction, so the entire drag is one undo step.

## 6. Eight-direction resizing

Resize directions are explicit:

```ts
type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
```

The gesture measures the rendered width when possible and divides it by zoom to recover logical width. Right and bottom handles preserve `x` and `y`. Left and top handles preserve the opposite edge:

```text
new x = old right - new width
new y = old bottom - new height
```

The interaction layer enforces a 24-unit gesture minimum and prevents a moving edge from crossing the opposite edge or card boundary. The store still applies its general `1…card size` normalization afterward.

The guide engine receives the moving edges:

```ts
guideEngine.compute(bounds, {
  left: movesLeft || undefined,
  right: movesRight || undefined,
  top: movesTop || undefined,
  bottom: movesBottom || undefined,
});
```

Only the moving edge is eligible to snap. Applying a resize snap changes that edge and the corresponding dimension while preserving the opposite edge.

Like dragging, all intermediate updates are wrapped in one history transaction.

## 7. Text width resizing

Text receives an additional right-center width handle. It changes only width, keeps the left edge fixed, respects a 24-unit minimum and the remaining card width, and uses `{ right: true }` for smart-guide snapping.

Text still receives the shared eight handles. The extra handle is a focused width-only affordance, not the sole way to resize text.

## 8. Rotation

General node rotation is now part of the model and renderer. The shared layout inspector writes an angle from `0` to `360`, and `constrainNode` clamps it into that range. All three node variants rotate through the shared frame.

Rotation currently has important limits:

- There is no on-canvas rotation handle.
- Resize directions remain screen-axis-aligned rather than rotating with the node.
- Smart guides use stored `x`, `y`, `width`, and `height`, not transformed corner bounds.
- Card constraints keep the unrotated rectangle inside the card; rotated corners can be clipped.

Line shapes also have an internal orientation (`horizontal`, `vertical`, `diagonal-up`, or `diagonal-down`). That orientation is rendered inside the shape frame and is independent of the node's outer rotation.

## 9. Smart-guide architecture

Smart guides are split into three layers:

```text
SmartGuideEngine              pure geometry and snapping
EditorNode                    gesture scheduling and store updates
EditorCard + SmartGuideOverlay transient state and SVG rendering
```

At pointer-down, the engine copies every other node's axis-aligned bounds. Those bounds remain fixed for the gesture, so pointer moves require no DOM measurement and do not re-read the store.

The default options are:

```ts
{
	snapTolerance: 6,
	snappingEnabled: true,
}
```

The overlay defaults to a one-pixel `#EC4899` stroke, ignores pointer events, and fades between visible and hidden states.

## 10. Alignment snapping

Each rectangle exposes three anchors per axis:

```text
X: left, horizontal center, right
Y: top, vertical center, bottom
```

The engine compares the active anchors with all anchors on all cached nodes. Candidates within six logical card units are eligible; the smallest absolute delta wins independently for X and Y.

Dragging allows all anchors. Resizing allows only the moving edge on each affected axis. When snapping is enabled, the winning delta is applied exactly. Because every frame begins from the raw pointer-derived proposal, moving beyond tolerance releases the snap immediately instead of accumulating a sticky offset.

An alignment guide spans the union of the active and matched rectangles.

## 11. Equal-spacing guides

The engine also detects when the active node's gap from a cross-axis-overlapping neighbor matches a gap between two static nodes within tolerance.

It emits a spacing guide containing:

```ts
type SpacingGuide = {
  type: "spacing";
  axis: "x" | "y";
  start: number;
  end: number;
  crossStart: number;
  crossEnd: number;
  distance: number;
};
```

The overlay draws a dashed measurement line with perpendicular end caps. Spacing currently provides feedback only; unlike alignment, it does not adjust the active bounds.

Alignment work is linear in node count with fixed anchor comparisons. Spacing is quadratic in the worst case but exits after the first match per axis.

## 12. Text rendering and inline editing

Text uses a controlled `<textarea>`. A selected text node is still draggable until double-click switches it into inline-edit mode.

```text
single click          select
pointer drag          move
double click          enter text editing
Escape or blur        leave text editing
```

While editing, pointer-down no longer starts a drag. Font role is resolved through workspace CSS variables. Alignment, casing, weight, line height, letter spacing, and color map directly from the node.

On content change, the component estimates required height from character width, line count, font size, and line height. It can grow the frame but does not automatically shrink it.

## 13. Image rendering and replacement

Image nodes resolve their source as:

```ts
const storedImageUrl = useStoredImageUrl(node.imageId);
const imageUrl = node.src || storedImageUrl;
```

The `<img>` receives object fit, object position, internal zoom, filter effects, and opacity. Image blend mode is no longer applied; the optional `blendMode` field exists only for old serialized data.

Double-click opens a hidden file input. Replacement stores the file in IndexedDB, updates `imageId`, clears `src`, and derives fallback alt text from the filename. [`hooks/use-stored-image-url.ts`](./hooks/use-stored-image-url.ts) owns object-URL creation and revocation.

Deleting through the selected-node control removes the stored blob before calling the store deletion action. The store itself remains storage-agnostic.

## 14. Shape rendering

Shape dispatch is data-driven:

```text
icon        → Lucide component from ICON_COMPONENTS
emoji       → text glyph
rectangle   → filled rectangle
ellipse     → filled pill/circle
line        → horizontal bar with internal orientation
```

`strokeWidth` controls Lucide icon strokes and line thickness:

```tsx
<Icon color={node.color} strokeWidth={node.strokeWidth} />
```

The same value is included in the SVG mask used by procedural shape textures, so the texture silhouette matches the visible stroke. Rectangle and ellipse fills do not use stroke width.

## 15. Card composition and controls

The outer card reserves the zoomed footprint:

```tsx
style={{
	width: card.width * zoom,
	height: card.height * zoom,
}}
```

The inner card retains logical dimensions and scales from its top-left corner. This prevents layout from treating a transformed card as though it still occupied only unscaled space.

Selected cards expose a compact icon tray for adding text, images, and shapes; opening templates and card settings; and deleting the card when more than one exists. A separate control below the card toggles the layer list. Tooltips are supplied by the shared `card-control` styling.

The card owns one `smartGuides` array and passes its setter to every node. Only an active gesture populates it; completion clears it.

## 16. Carousel navigation and locking

The canvas uses Embla with one card per snap. Store selection and carousel selection synchronize both ways. Dragging the carousel is disabled when the user activates the lock, and Embla rejects pointer starts inside `[data-editor-node]` so node manipulation wins.

The selected-card toolbar contains the lock next to card naming and undo/redo. When card selection is cleared, that toolbar is replaced by project title and last-edited metadata.

## 17. Zoom and wheel input

Zoom ranges from `0.5` to `1.5` in `0.1` increments. Buttons and `Ctrl/Cmd + wheel` change it; clicking the percentage resets to 100%.

Ordinary wheel movement chooses its dominant axis and navigates cards. Small deltas are ignored and accepted navigation is throttled for 180 ms to avoid skipping several cards in one trackpad gesture.

All drag and resize calculations use:

```text
logical delta = viewport delta / zoom
```

Smart-guide tolerance is expressed in logical card units, so its apparent screen distance scales with zoom.

## 18. Tick and toolbar navigation

[`components/card-tick-navigator.tsx`](./components/card-tick-navigator.tsx) renders one vertical tick per card. Every fifth tick is longer, the selected tick is emphasized, and hover or focus reveals card names. Clicking a tick calls the same `selectCard` action used by carousel synchronization.

The bottom toolbar provides previous/next buttons, a numeric position, add, reset, and zoom. Deleting a card updates the cards array; the store selects a survivor and the carousel effect scrolls to it.

## 19. End-to-end manipulation flows

### Drag with alignment and undo

```text
pointerdown
→ select node
→ begin history transaction
→ cache other node bounds
→ pointermove stores latest pointer coordinates
→ requestAnimationFrame computes raw logical bounds
→ guide engine snaps nearest X/Y anchors
→ updateNode clamps and stores active-ratio coordinates
→ overlay draws current guides
→ pointerup runs final pending frame and clears guides
→ end history transaction stores one starting snapshot
→ Undo restores the complete original card
```

### Resize from the north-west corner

```text
pointerdown on nw handle
→ preserve original right and bottom edges
→ convert pointer deltas through zoom
→ calculate width, height, x, and y
→ compare only left and top edges with guide anchors
→ apply snap deltas to moving edges and dimensions
→ store constrains axis-aligned bounds
→ gesture becomes one history entry
```

### Rotate a node

```text
change inspector Rotation field
→ updateNode(cardId, nodeId, { rotation })
→ store records discrete history snapshot
→ constrainNode clamps angle to 0…360
→ EditorNode applies CSS rotate to the shared frame
→ Undo restores the previous angle
```

## 20. Current boundaries

- Rotation is inspector-driven; there is no rotate gesture.
- Constraints, resizing, and guides use axis-aligned bounds even for rotated nodes.
- Smart guides align nodes to other nodes, not card edges, grids, margins, rulers, or user guides.
- Equal-spacing guides visualize matching gaps but do not magnetically adjust spacing.
- Resize does not preserve image or shape aspect ratio.
- There is no multi-selection, grouping, locking per node, skew, or visibility field.
- Text auto-height grows conservatively and does not shrink automatically.
- Card zoom is local presentation state and is not persisted.
