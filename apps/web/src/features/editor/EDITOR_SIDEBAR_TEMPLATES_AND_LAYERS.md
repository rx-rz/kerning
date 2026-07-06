# Editor Sidebar, Templates, Layers, and Content Insertion

This chapter explains the editor surfaces that add and organize content: the template sidebar, the template catalog, shape insertion, and the layer list. It follows data from a catalog entry or pointer gesture through the store and back into rendered card order.

Canonical sources:

- [`components/template-sidebar.tsx`](./components/template-sidebar.tsx)
- [`lib/editor-templates.ts`](./lib/editor-templates.ts)
- [`components/layer-list.tsx`](./components/layer-list.tsx)
- [`components/shape-picker.tsx`](./components/shape-picker.tsx)
- [`lib/shape-library.ts`](./lib/shape-library.ts)
- [`components/editor-card.tsx`](./components/editor-card.tsx)
- [`store/editor-store.ts`](./store/editor-store.ts)

## 1. Two content-management surfaces

```text
TemplateSidebar
→ replaces one destination card with a complete prepared composition

EditorCard toolbar
├── addTextNode
├── addImageNode
└── ShapePicker → addShapeNode

LayerList
├── select a node
├── delete a node
└── reorder card.nodes
```

Templates operate at card scope. Toolbar actions operate at node scope. The layer list does not create content; it presents and mutates the ordering of content already owned by one card.

## 2. How the template sidebar is opened

`EditorWorkspace` keeps `templateCardId: string | null`. The selected card's template button passes its ID upward through `EditorCard` and `EditorCanvas`. A non-null ID mounts the sidebar:

```tsx
{templateCardId ? (
	<TemplateSidebar
		cardId={templateCardId}
		onClose={() => setTemplateCardId(null)}
		availableFonts={{
			primary: Boolean(primary),
			sec1: Boolean(secondaryOne),
			sec2: Boolean(secondaryTwo),
		}}
	/>
) : null}
```

The card ID is both open-state context and the eventual mutation target. The sidebar does not depend on whichever card happens to become selected afterward.

## 3. Sidebar state and filtering

The complete state and template derivation in [`components/template-sidebar.tsx`](./components/template-sidebar.tsx) is:

```ts
type TemplateFilter = "All" | EditorTemplate["category"];

const [filter, setFilter] = useState<TemplateFilter>("All");
const applyTemplate = useEditorStore((state) => state.applyTemplate);
const templates = EDITOR_TEMPLATES.filter(
	(template) => filter === "All" || template.category === filter,
);
```

The current categories are `Album covers` and `Movie posters`. Filtering is local UI state; it does not alter the catalog or editor session.

The category controls are ordinary pressed buttons:

```tsx
{(["All", "Album covers", "Movie posters"] as const).map((item) => (
	<button
		key={item}
		type="button"
		aria-pressed={filter === item}
		className="rounded-md border border-hairline px-2.5 py-1.5 text-[10px] font-semibold aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-background"
		onClick={() => setFilter(item)}
	>
		{item}
	</button>
))}
```

`aria-pressed` communicates the active filter and also drives styling.

## 4. Template catalog shape

At the top of [`lib/editor-templates.ts`](./lib/editor-templates.ts), every catalog item is a complete card plus browsing metadata:

```ts
export type EditorTemplate = {
	id: string;
	name: string;
	category: "Album covers" | "Movie posters";
	aspectRatio: CardAspectRatio;
	card: EditorCard;
};
```

This avoids a second template-only rendering model. A template card already contains dimensions, settings, fills, textures, and typed nodes. The same domain objects used by the editor are used by previews and `applyTemplate`.

The catalog is exported as:

```ts
export const EDITOR_TEMPLATES: EditorTemplate[] = [
	...ALBUMS.map((spec, index) => makeTemplate(spec, index, "Album covers")),
	...POSTERS.map((spec, index) => makeTemplate(spec, index, "Movie posters")),
];
```

Rather than hand-writing every repeated card field, the file uses specification data and constructors. Important builders include `settings`, `posterSettings`, `text`, `shape`, `image`, `albumNodes`, `posterNodes`, and `makeTemplate`. The long node-building functions encode visual variations while still returning ordinary `EditorNode[]` values.

## 5. Template node constructors

The template helpers in [`lib/editor-templates.ts`](./lib/editor-templates.ts) centralize complete defaults for generated nodes. Their conceptual signatures are:

```ts
function text(/* typography and geometry */): TextNode
function shape(/* primitive and geometry */): ShapeNode
function image(/* source, crop, effects, and geometry */): ImageNode
```

This matters because templates must satisfy the same model as live nodes. Image templates need effect defaults, crop positions, opacity, blend mode, and nullable texture. Text templates need font role, casing, alignment, spacing, and line height. A missing field would otherwise be repaired only during normalization.

The final template constructor is located near the bottom of [`lib/editor-templates.ts`](./lib/editor-templates.ts):

```ts
function makeTemplate(
	spec: TemplateSpec,
	index: number,
	category: EditorTemplate["category"],
): EditorTemplate {
	const isAlbum = category === "Album covers";
	const width = isAlbum ? 500 : 360;
	const height = isAlbum ? 500 : 640;
	const aspectRatio = isAlbum ? "1:1" : "9:16";
	const prefix = isAlbum ? "album" : "poster";

	return {
		id: `${prefix}-${index + 1}`,
		name: spec.title,
		category,
		aspectRatio,
		card: {
			id: `${prefix}-${index + 1}`,
			name: spec.title,
			width,
			height,
			settings:
				!isAlbum && index < POSTER_ART.length
					? posterSettings(spec.background)
					: settings(aspectRatio, spec, index),
			nodes: isAlbum ? albumNodes(spec, index) : posterNodes(spec, index),
		},
	};
}
```

The catalog's IDs are stable catalog identities. They are not retained as live node identities after application.

## 6. Font availability and template repair

Templates may refer to `primary`, `sec1`, or `sec2`, but a project may not provide every role. The catalog exposes availability-aware resolution:

```ts
export type TemplateFontAvailability = Record<FontType, boolean>;

export function resolveTemplateFontType(
	fontType: FontType,
	available: TemplateFontAvailability,
): FontType {
	const fallbackOrder: Record<FontType, FontType[]> = {
		primary: ["primary", "sec1", "sec2"],
		sec1: ["sec1", "primary", "sec2"],
		sec2: ["sec2", "sec1", "primary"],
	};

	return fallbackOrder[fontType].find((role) => available[role]) ?? "primary";
}

export function resolveTemplateFonts(
	card: EditorCard,
	availableFonts: TemplateFontAvailability,
): EditorCard {
	return {
		...card,
		nodes: card.nodes.map((node) =>
			node.type === "text"
				? {
						...node,
						fontType: resolveTemplateFontType(node.fontType, availableFonts),
					}
				: node,
		),
	};
}
```

Resolution returns a copied card and copied text nodes. It does not mutate the shared catalog. Each requested role has its own fallback preference: `primary → sec1 → sec2`, `sec1 → primary → sec2`, and `sec2 → sec1 → primary`.

## 7. Applying a template

Each template tile runs the complete application call:

```tsx
onClick={() =>
	applyTemplate(
		cardId,
		resolveTemplateFonts(template.card, availableFonts),
	)
}
```

The store then replaces the card:

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

Application has four guarantees:

1. The destination card ID survives.
2. Every copied node receives a fresh ID.
3. Normalization constrains and repairs the snapshot.
4. Node selection clears because old content no longer exists.

The sidebar remains open after application; users can compare templates rapidly on the same destination.

## 8. Template previews

`TemplatePreview` renders a reduced, non-interactive representation. Square templates use a `140px` square viewport and scale `0.28`; posters use `99 × 176px` and scale `0.275`.

```tsx
<span
	className="absolute top-0 left-0 block origin-top-left"
	style={{
		width: card.width,
		height: card.height,
		transform: `scale(${scale})`,
	}}
>
	{card.nodes.map((node) => (
		<TemplateNodePreview key={node.id} node={node} />
	))}
</span>
```

Preview nodes branch by discriminator. Text maps typography styles; shapes reuse `ShapeGraphic`; images map fit, position, opacity, blend mode, and filters. Reusing `ShapeGraphic` prevents picker, card, and template previews from inventing different interpretations of a shape ID.

The preview is intentionally lighter than the production card renderer. It does not reproduce editor selection, handles, stored-image resolution, or every texture layer.

## 9. Adding individual content

The selected card toolbar calls domain actions directly:

```tsx
onClick={(event) => {
	event.stopPropagation();
	addTextNode(card.id);
}}
```

Image insertion uses the same form with `addImageNode`. Both store actions create a complete default node, append it, select the card, and select the new node. Appending is also a layer decision: the new node becomes topmost.

Shape insertion passes two fields from the catalog:

```tsx
addShapeNode(cardId, {
	shapeType: item.type,
	shape: item.value,
})
```

The store supplies geometry, color, texture, ID, and the `type: "shape"` discriminator.

## 10. Shape picker discovery

[`components/shape-picker.tsx`](./components/shape-picker.tsx) owns category and query state:

```ts
const [category, setCategory] = useState(SHAPE_CATEGORIES[0] ?? "Lines");
const [query, setQuery] = useState("");
const filteredShapes = useMemo(() => {
	const normalizedQuery = query.trim().toLowerCase();
	return SHAPE_LIBRARY.filter(
		(item) =>
			item.category === category &&
			(!normalizedQuery ||
				item.label.toLowerCase().includes(normalizedQuery)),
	);
}, [category, query]);
```

Search is case-insensitive and applies only inside the active category. The catalog in [`lib/shape-library.ts`](./lib/shape-library.ts) combines hand-authored primitives, mapped Lucide icons, and emoji/symbol entries. `SHAPE_CATEGORIES` is derived from the finished library, so picker navigation follows catalog contents.

Each tile uses the same `ShapeGraphic` component as live shapes:

```tsx
<ShapeGraphic
	node={{
		shapeType: item.type,
		shape: item.value,
		color: "currentColor",
	}}
	className="size-6 max-h-6 max-w-6"
/>
```

## 11. Layers are a reversed view

The domain stores bottom-first:

```text
card.nodes[0]        bottom
card.nodes[last]    top
```

The layer panel presents top-first:

```ts
const visualNodes = [...card.nodes].reverse();
```

It reverses a copy, preserving the store array. For each visual row, the underlying index is:

```ts
const index = card.nodes.length - 1 - visualIndex;
```

The row displays `(index + 1) * 5`, matching `EditorNode`'s z-index formula.

## 12. Layer labels

The complete label helper is:

```ts
function getLayerLabel(node: EditorNode) {
	if (node.type === "text") return node.text.trim().slice(0, 14) || "Text";
	if (node.type === "image") return node.alt.trim().slice(0, 14) || "Image";
	return node.shape.replaceAll("-", " ").slice(0, 14) || "Shape";
}
```

Labels are derived rather than stored. Text uses content, images use alt text, and shapes humanize the shape identifier. All are truncated to 14 characters before CSS truncation.

## 13. Distinguishing clicks from drags

The layer panel uses pointer events and a threshold:

```ts
const DRAG_THRESHOLD = 4;

const distance = Math.hypot(
	event.clientX - drag.startX,
	event.clientY - drag.startY,
);

if (!drag.isDragging && distance < DRAG_THRESHOLD) return;
if (!drag.isDragging) {
	drag.isDragging = true;
	setDraggedNodeId(drag.nodeId);
}
```

Movement below four pixels remains a click. This prevents small hand jitter from turning selection into reordering. Only the primary mouse/pointer button starts a drag, and pointer-down on a delete control is excluded.

The complete drag record is:

```ts
type DragState = {
	nodeId: string;
	pointerId: number;
	startX: number;
	startY: number;
	isDragging: boolean;
	insertionIndex: number | null;
};
```

It lives in a ref because pointer callbacks need the latest mutable gesture state without rerendering on every event. React state separately drives visual feedback.

## 14. Calculating insertion position

The panel removes the dragged row from consideration and compares the pointer to every remaining row midpoint:

```ts
function updateInsertion(clientY: number, nodeId: string) {
	const remaining = visualNodes.filter((node) => node.id !== nodeId);
	let nextIndex = remaining.length;

	for (let index = 0; index < remaining.length; index += 1) {
		const row = rowRefs.current.get(remaining[index]?.id ?? "");
		if (!row) continue;
		const bounds = row.getBoundingClientRect();
		if (clientY < bounds.top + bounds.height / 2) {
			nextIndex = index;
			break;
		}
	}

	dragRef.current = dragRef.current
		? { ...dragRef.current, insertionIndex: nextIndex }
		: null;
	setInsertionIndex(nextIndex);
}
```

Above a midpoint means insert before that row. Below every midpoint means insert at the visual end. Row DOM nodes are stored in a `Map` through callback refs.

## 15. Converting visual order back to domain order

The complete finishing calculation is:

```ts
if (drag.isDragging && drag.insertionIndex !== null) {
	const finalVisualIds = visualNodes
		.filter((node) => node.id !== drag.nodeId)
		.map((node) => node.id);
	finalVisualIds.splice(drag.insertionIndex, 0, drag.nodeId);
	const finalUnderlyingIds = finalVisualIds.reverse();
	reorderNode(
		card.id,
		drag.nodeId,
		finalUnderlyingIds.indexOf(drag.nodeId),
	);
}
```

This is the heart of layer drag-and-drop:

```text
top-first visual IDs
→ remove dragged ID
→ insert at pointer-derived visual index
→ reverse to bottom-first IDs
→ find target domain index
→ reorderNode
```

The store performs the actual splice and clamps the target index.

## 16. Preventing the post-drag click

Browsers may emit a click after pointer-up. Without protection, finishing a drag would also select the row. The panel sets `suppressClickRef.current`, then clears it in a zero-delay timeout. The click handler consumes that one click if it arrives.

This is local gesture bookkeeping; it has no domain meaning.

## 17. Layer selection and deletion

Clicking a row calls `onSelectNode(node.id)`, which ultimately selects both the node and its owning card. Delete and Backspace work when the row's selection button has keyboard focus.

The complete cleanup helper is:

```ts
function removeNode(node: EditorNode) {
	if (node.type === "image" && node.imageId) {
		void deleteEditorImage(node.imageId);
	}
	deleteNode(card.id, node.id);
}
```

Image database cleanup is coordinated before domain deletion. This duplicates the shared node-frame deletion path because `deleteNode` itself does not own persistence side effects.

## 18. Interaction containment

The layer section stops pointer-down and wheel propagation:

```tsx
onPointerDown={(event) => event.stopPropagation()}
onWheel={(event) => event.stopPropagation()}
```

This prevents manipulating or scrolling the overlay from selecting/panning the canvas beneath it. Individual delete buttons also stop pointer-down so they cannot initialize row dragging.

## 19. End-to-end flows

### Apply a template

```text
open templates from card
→ page stores destination card ID
→ filter catalog locally
→ choose template
→ resolve unavailable font roles on a copy
→ applyTemplate
→ retain card ID
→ regenerate node IDs
→ normalize card
→ clear node selection
```

### Add a shape

```text
open ShapePicker
→ choose category and optional search
→ render catalog tiles with ShapeGraphic
→ click tile
→ addShapeNode(cardId, discriminator data)
→ store supplies defaults and ID
→ append to nodes
→ new top layer becomes selected
```

### Reorder a layer

```text
pointer-down on row
→ capture pointer and origin
→ exceed four-pixel threshold
→ compare pointer against remaining row midpoints
→ show insertion marker
→ rebuild top-first order
→ reverse to bottom-first order
→ store splices node
→ card rerenders with new z-index
```

## 20. Current boundaries

- Templates replace a card; there is no merge or “insert template as group.”
- Template previews are intentionally approximate.
- Layers have ordering, derived labels, selection, and deletion, but no lock, visibility, group, or custom name.
- Dragging is pointer-based; keyboard reordering is not implemented.
- Stored-image cleanup remains duplicated across UI deletion paths.
- Applying a template is not undoable because the store has no history subsystem.

The useful mental model is that templates manufacture a whole card, insertion actions append one complete node, and the layer panel is merely a top-first projection of the card's bottom-first node array.
