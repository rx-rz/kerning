# Smart Guides engine

Smart Guides provide alignment snapping and equal-spacing feedback while an editor node is dragged or resized. Geometry, interaction, and rendering are separate so each can evolve independently.

## Architecture

`SmartGuideEngine` in `apps/web/src/features/editor/lib/smart-guide-engine.ts` calculates geometry. At pointer-down, `EditorNode` constructs an engine from every other node on the card:

```ts
const guideEngine = new SmartGuideEngine(
  nodes.filter(({ id }) => id !== node.id),
);
```

The constructor copies those bounds as a drag-session cache. Other nodes are not reread on every move, and no layout measurement is required because the model already stores card-local `x`, `y`, `width`, and `height`. Only the active rectangle is recalculated.

`EditorNode` owns gesture scheduling. Pointer events retain the newest coordinates and schedule work through `requestAnimationFrame`; an already-pending frame is cancelled. Pointer-up and pointer-cancel remove listeners, cancel pending work, and clear guides immediately.

`EditorCard` owns transient guide state because it is the shared coordinate space. `SmartGuideOverlay` renders one absolutely positioned SVG above the node stack. It uses `pointer-events: none`, does not affect layout, and transitions opacity over 100ms.

## Alignment calculation

Every rectangle exposes left, horizontal-center, and right anchors on X, plus top, vertical-center, and bottom anchors on Y. The engine compares active anchors with all matching-axis anchors on each cached node. A candidate is accepted when its absolute delta is at most `snapTolerance` (6 card pixels by default). The smallest delta wins independently for X and Y.

Dragging makes all anchors eligible. Resizing supplies moving edges, so an east resize compares only the right edge and a corner resize compares one edge per axis. Applying a resize snap changes the moving edge and dimension while preserving the opposite edge.

The resulting vertical or horizontal line spans the union of the active and matched rectangles.

## Magnetic snapping

Snapping starts from the unsnapped pointer position every frame; snapped coordinates never become the next frame's input. Within tolerance, the winning delta is applied exactly. Continued motion beyond tolerance removes the match and immediately follows the pointer again, producing magnetism without a sticky latch.

Image values retain their existing integer rounding after guide calculation. Other nodes preserve fractional coordinates. The store remains the boundary guard that constrains nodes to the card.

## Equal spacing

For each axis, the engine finds a static neighbor whose cross-axis span overlaps the active node. It measures their empty interval, then compares it with gaps between that neighbor and other static nodes. A match within tolerance emits a `spacing` guide with axis, endpoints, cross-axis extent, and distance.

The overlay draws a dashed measurement line and perpendicular end caps. The distinct guide type allows labels, arrows, or repeated-gap highlights to be added without changing alignment logic.

## Configuration

Behavior is configured per session:

```ts
new SmartGuideEngine(staticBounds, {
  snapTolerance: 6,
  snappingEnabled: true,
});
```

Appearance is configured separately:

```tsx
<SmartGuideOverlay
  guides={guides}
  appearance={{ color: "#EC4899", thickness: 1 }}
/>
```

## Performance

Alignment is linear in node count with a fixed nine comparisons per axis. Static bounds are copied once per gesture. Direct loops and animation-frame coalescing avoid redundant allocations and store writes. Spacing is quadratic in the worst case, but exits after its first match per axis and performs no DOM reads.

For very large documents, a future card-level spatial index can pass only nearby bounds to the same API. Canvas edges, grids, rulers, margins, bleed, and user guides can likewise become synthetic candidates without coupling them to the overlay.

Tests in `smart-guide-engine.test.ts` cover edge/center snapping, resize behavior, equal-spacing detection, and cached-bound immutability.
