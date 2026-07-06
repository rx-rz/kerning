# Editor Inspector and Editing Controls

This chapter explains how selection determines the right-hand inspector, how card and node controls translate user input into store patches, how fill and texture editors manipulate discriminated unions, and how the shape picker inserts new domain objects.

Canonical sources:

- [`components/editor-inspector.tsx`](./components/editor-inspector.tsx)
- [`components/card-inspector.tsx`](./components/card-inspector.tsx)
- [`components/node-inspector.tsx`](./components/node-inspector.tsx)
- [`components/card-fill-inspector.tsx`](./components/card-fill-inspector.tsx)
- [`components/inspector-section.tsx`](./components/inspector-section.tsx)
- [`components/shape-picker.tsx`](./components/shape-picker.tsx)
- [`store/editor-store.ts`](./store/editor-store.ts)
- [`types.ts`](./types.ts)

## 1. Inspector architecture

```text
EditorInspector
├── no selected card → NoSelectionPanel
├── selected card only → CardInspector
└── selected card + valid selected node → NodeInspector
    ├── TextSettings | ImageSettings | ShapeSettings
    └── shared Layout controls
```

There is no stored “inspector mode.” The content is derived from selection, which prevents UI mode from disagreeing with the selected domain object.

## 2. Complete inspector routing

[`components/editor-inspector.tsx`](./components/editor-inspector.tsx) is compact enough to show in full:

```tsx
import { X } from "lucide-react";

import { Button } from "#/components/ui/button";
import { CardInspector } from "#/features/editor/components/card-inspector";
import { NoSelectionPanel } from "#/features/editor/components/no-selection-panel";
import { NodeInspector } from "#/features/editor/components/node-inspector";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorInspectorProps = {
	onClose: () => void;
};

export function EditorInspector({ onClose }: EditorInspectorProps) {
	const selectedCard = useEditorStore((state) =>
		state.cards.find((card) => card.id === state.selectedCardId),
	);
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const selectedNode = selectedCard?.nodes.find(
		(node) => node.id === selectedNodeId,
	);

	return (
		<aside className="fixed top-2 right-2 bottom-2 z-40 flex min-h-0 max-h-dvh w-[min(23rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-white/60 bg-surface-glass pt-2 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-3xl">
			<Button
				type="button"
				aria-label="Close inspector"
				variant="ghost"
				size="icon-sm"
				className="absolute top-3 right-3 z-10"
				onClick={onClose}
			>
				<X />
			</Button>
			<div className="mt-8 flex min-h-0 flex-1 flex-col overflow-y-auto">
				{selectedCard && selectedNode ? (
					<NodeInspector card={selectedCard} node={selectedNode} />
				) : selectedCard ? (
					<CardInspector card={selectedCard} />
				) : (
					<NoSelectionPanel />
				)}
			</div>
		</aside>
	);
}
```

The selected node is searched only inside the selected card. Closing the inspector changes workspace visibility, not selection.

## 3. Inspector sections

[`components/inspector-section.tsx`](./components/inspector-section.tsx) provides consistent visual grouping through native `<details>` and `<summary>`. Every section currently starts open. Despite accepting `defaultOpen`, the component does not read it, so callers cannot currently choose the initial state.

```tsx
export function InspectorSection({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	className?: string;
}) {
	return (
		<details
			className={cn(
				"group rounded-xl border border-hairline bg-surface-wash",
				className,
			)}
			open
		>
			<summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-xs font-semibold">
				{title}
			</summary>
			<div className="space-y-3 border-t border-hairline p-3">{children}</div>
		</details>
	);
}
```

## 4. Card inspector mutation boundary

`CardInspector` selects two actions:

```ts
const updateCard = useEditorStore((state) => state.updateCard);
const updateCardSettings = useEditorStore(
	(state) => state.updateCardSettings,
);
```

Structural fields—name, width, height—use `updateCard`. Appearance and aspect ratio use `updateCardSettings`. That distinction ensures aspect-ratio changes resolve preset dimensions and all appearance changes pass through card normalization.

## 5. Card identity and dimensions

The name field sends every edit directly:

```tsx
<Input
	id="card-name"
	className="pl-28"
	value={card.name}
	onChange={(event) =>
		updateCard(card.id, { name: event.target.value })
	}
/>
```

Numeric dimensions parse and clamp before reaching the store:

```ts
function updateNumericValue(key: NumericCardKey, value: string) {
	const parsedValue = Number(value);
	if (!Number.isFinite(parsedValue)) return;

	const nextValue =
		key === "width"
			? Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_DIMENSION, parsedValue))
			: Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_DIMENSION, parsedValue));

	updateCard(card.id, { [key]: nextValue });
}
```

The store clamps again and normalizes child nodes. UI clamping gives immediate predictable inputs; store clamping protects programmatic callers.

## 6. Aspect ratio controls

The preset list is explicit:

```ts
const ASPECT_RATIOS: Array<{
	value: CardAspectRatio;
	label: string;
}> = [
	{ value: "1:1", label: "Square · 1:1" },
	{ value: "4:5", label: "Portrait · 4:5" },
	{ value: "16:9", label: "Landscape · 16:9" },
	{ value: "9:16", label: "Story · 9:16" },
	{ value: "3:2", label: "Classic · 3:2" },
	{ value: "business-card", label: "Business Card" },
];
```

Radio changes call:

```ts
updateCardSettings(card.id, { aspectRatio: aspectRatio.value });
```

The store resolves width/height using [`lib/card-size.ts`](./lib/card-size.ts), then normalizes the card. Aspect-ratio selection can therefore resize or move nodes to keep them in bounds.

## 7. Card surface and border controls

Surface sliders edit whole-card opacity and blur:

```tsx
<Slider
	label="Opacity"
	value={[card.settings.opacity]}
	min={0}
	max={1}
	step={0.01}
	showTicks={false}
	snapToDeciles={false}
	onValueChange={([opacity]) => {
		if (opacity !== undefined) updateCardSettings(card.id, { opacity });
	}}
/>
```

Blur follows the same pattern over `0..10`. These settings apply to the rendered card container, so they affect foreground nodes as well as the background.

Border width is clamped to `0..40`. Border style is one of `solid`, `dashed`, `dotted`, or `double`; a popover displays visual swatches using `borderTopStyle`. `ColorField` writes `borderColor`.

## 8. Fill and texture are separate controls

The card inspector deliberately keeps these sections separate:

```tsx
<InspectorSection title="Color & fill">
	<CardFillInspector
		fill={card.settings.fill}
		onChange={(fill) => updateCardSettings(card.id, { fill })}
	/>
</InspectorSection>
<InspectorSection title="Texture">
	<CardTextureInspector
		texture={card.settings.texture}
		onChange={(texture) => updateCardSettings(card.id, { texture })}
	/>
</InspectorSection>
```

`fill` is the base solid, gradient, or image. `texture` is an optional procedural overlay. Editing one does not erase the other.

## 9. Base fill selection

[`components/card-fill-inspector.tsx`](./components/card-fill-inspector.tsx) presents four base types:

```text
solid
linear-gradient
radial-gradient
image
```

Changing type calls `createDefaultFill(type)` rather than trying to convert unrelated fields. This produces a valid complete union member immediately. The inspector then narrows on `fill.type`:

```tsx
{fill.type === "solid" ? (
	<ColorField ... />
) : fill.type === "linear-gradient" || fill.type === "radial-gradient" ? (
	<GradientInspector fill={fill} onChange={onChange} />
) : (
	<ImageFillSettings fill={fill} onChange={onChange} />
)}
```

The discriminator determines both visible controls and the legal patch shape.

## 10. Gradient editing

`GradientInspector` supports stop color, stop position, and variant-specific geometry. Stop updates preserve the array and replace only one matching stop:

```ts
function updateStop(id: string, patch: Partial<GradientStop>) {
	onChange({
		...fill,
		stops: fill.stops.map((stop) =>
			stop.id === id ? { ...stop, ...patch } : stop,
		),
	});
}
```

Linear gradients expose angle. Radial gradients expose center X and Y. Positions are percentage-like model values; normalization in [`lib/card-fill.ts`](./lib/card-fill.ts) protects their ranges.

## 11. Image fill storage and composition

`ImageFillSettings` supports browser-stored uploads and remote sources. Upload uses `replaceEditorImage`, then emits a copied fill with `imageId` and without a competing source. URL editing removes a prior stored image when switching authority.

The settings also expose:

- background size: `cover`, `contain`, or `auto`;
- horizontal origin;
- vertical origin;
- fill opacity.

Those values feed [`components/card-image-fill.tsx`](./components/card-image-fill.tsx), which resolves stored images and paints the dedicated image layer.

## 12. Texture selection

`CardTextureInspector` accepts `TextureCardFill | null`. `null` means no overlay. Supported current texture identities are:

- paper;
- fluted glass;
- halftone;
- CMYK halftone.

Selecting a texture constructs complete defaults for that variant. `TextureSettings` then branches on `texture.texture` and exposes domain-specific sliders, options, colors, and toggles. The settings are procedural parameters, not arbitrary CSS.

Shared helpers at the bottom of [`components/card-fill-inspector.tsx`](./components/card-fill-inspector.tsx)—`ColorPair`, `RangeField`, `OptionField`, and `ToggleField`—standardize the controls without flattening the variant-specific data.

## 13. Node inspector dispatch

`NodeInspector` receives already-resolved card and node objects. It dispatches by discriminator:

```tsx
{node.type === "text" ? (
	<TextSettings cardId={card.id} node={node} />
) : node.type === "image" ? (
	<ImageSettings cardId={card.id} node={node} />
) : (
	<ShapeSettings cardId={card.id} node={node} />
)}
```

After variant controls, every node receives the shared Layout section.

## 14. Shared node layout controls

The complete numeric update rule is:

```ts
function updateNumericValue(
	key: "x" | "y" | "width" | "height",
	value: string,
) {
	const parsedValue =
		node.type === "image" ? Math.ceil(Number(value)) : Number(value);
	if (Number.isFinite(parsedValue))
		updateNode(card.id, node.id, { [key]: parsedValue });
}
```

Images are rounded upward, matching pointer manipulation. The fields expose UI min/max hints, but the store's `constrainNode` is authoritative. It clamps dimensions first and positions second so the final rectangle remains inside the card.

The layout fields are generated uniformly:

```tsx
{(["x", "y", "width", "height"] as const).map((key) => (
	<NumberField
		key={key}
		id={`node-${key}`}
		label={key}
		value={node[key]}
		min={key === "x" || key === "y" ? NODE_CARD_INSET : 1}
		max={key === "x" || key === "width" ? card.width : card.height}
		onChange={(value) => updateNumericValue(key, value)}
	/>
))}
```

## 15. Text controls

Text settings are split into Content and Appearance.

Content edits:

- `text` through a controlled input;
- semantic font role: primary, secondary one, or secondary two.

Appearance edits:

- font size;
- line height;
- letter spacing;
- alignment: left, center, right, justify;
- casing: original, uppercase, lowercase, capitalize;
- color.

Finite numeric updates use:

```ts
function updateFinite(
	updateNode: (cardId: string, nodeId: string, patch: EditorNodePatch) => void,
	cardId: string,
	nodeId: string,
	key: "fontSize" | "lineHeight" | "letterSpacing",
	value: string,
) {
	const parsedValue = Number(value);
	if (Number.isFinite(parsedValue))
		updateNode(cardId, nodeId, { [key]: parsedValue });
}
```

`VisualChoiceGroup` implements accessible radio groups for alignment and casing. A generated `useId()` value prevents separate groups from sharing a radio name.

Font roles remain semantic. The renderer resolves them through CSS variables supplied by `EditorWorkspace`, so the inspector never writes a project font-family string into a node.

## 16. Image source controls

Image settings support two mutually authoritative sources:

```text
uploaded file → IndexedDB imageId, src cleared
remote URL    → src, imageId cleared and stored record deleted
```

The complete upload operation is:

```ts
async function uploadImage(file: File) {
	setIsSaving(true);
	setUploadError("");
	try {
		const imageId = await replaceEditorImage(file, node.imageId);
		updateNode(cardId, node.id, {
			imageId,
			src: "",
			alt: node.alt || file.name.replace(/\.[^.]+$/, ""),
		});
	} catch {
		setUploadError("The image could not be saved. Try another file.");
	} finally {
		setIsSaving(false);
	}
}
```

Unlike the node's double-click replacement path, the inspector exposes an error message with `role="alert"`.

Remote URLs use:

```ts
function handleRemoteUrl(src: string) {
	if (node.imageId) void deleteEditorImage(node.imageId);
	updateNode(cardId, node.id, { src, imageId: null });
}
```

## 17. Image fit, blend, and composition

Image fit is an accessible visual radio choice between `cover` and `contain`. Blend mode is selected from:

```text
normal, multiply, screen, overlay, difference, lighten, darken
```

Composition controls expose zoom from `1..4` and horizontal/vertical focal positions. The renderer maps these values to scale, transform origin, and object position.

The reset operation restores composition and effects but deliberately leaves source, fit, opacity, blend mode, texture, frame geometry, and alt text untouched:

```ts
function resetAdjustments() {
	updateNode(cardId, node.id, {
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
}
```

## 18. Image effects

Effects are generated from one typed table:

```ts
[
	["brightness", "Brightness", 0, 200, "%"],
	["contrast", "Contrast", 0, 200, "%"],
	["saturation", "Saturation", 0, 200, "%"],
	["blur", "Blur", 0, 20, "px"],
	["grayscale", "Grayscale", 0, 100, "%"],
	["sepia", "Sepia", 0, 100, "%"],
] as const
```

Updating one effect must preserve the others:

```ts
function updateEffect(key: keyof ImageEffects, value: number) {
	updateNode(cardId, node.id, {
		effects: { ...node.effects, [key]: value },
	});
}
```

Image nodes also reuse `CardTextureInspector`, demonstrating that procedural textures are shared domain data even though card and image renderers apply them in different places.

## 19. Shape controls

Shape settings currently expose color, a single square size, and optional texture:

```tsx
<NumberField
	id="shape-size"
	label="Size"
	value={Math.max(node.width, node.height)}
	min={8}
	onChange={(value) => {
		const size = Number(value);
		if (Number.isFinite(size)) {
			updateNode(cardId, node.id, { width: size, height: size });
		}
	}}
/>
```

This size control intentionally makes the frame square. It differs from shared width/height controls, which remain available below and can create non-square geometry. For line shapes, using Size also makes the line frame square even though the insertion default is wide and short.

The inspector edits an existing shape but does not change its primitive identity. New shape identities are chosen through `ShapePicker`.

## 20. Shape picker

[`components/shape-picker.tsx`](./components/shape-picker.tsx) is opened from the selected card toolbar. It provides category tabs, case-insensitive search inside the active category, and a scrollable five-column catalog.

The complete insertion call is:

```tsx
onClick={() =>
	addShapeNode(cardId, {
		shapeType: item.type,
		shape: item.value,
	})
}
```

Only identity fields cross the component/store boundary. The store supplies ID, geometry, color, and texture defaults, appends the node, and selects it.

Preview tiles use `ShapeGraphic` with `currentColor`, ensuring the catalog preview and live renderer share icon fallback, emoji, primitive, and line-orientation behavior.

## 21. Controlled inputs and immediate mutations

Most inspector controls are controlled directly by store-derived props:

```text
store value → component prop → input value
input event → store action → normalized state → rerendered prop
```

There is no draft/apply phase. Sliders can generate many store updates during one gesture. This keeps the canvas live but is relevant to future undo/redo: a slider drag should probably become one history transaction rather than dozens.

Local state is reserved for UI-only concerns such as upload progress, upload errors, popover state managed by primitives, category/query search, and generated radio-group names.

## 22. Validation layers

The inspector uses several levels of protection:

1. HTML attributes such as `min`, `max`, and `step` communicate expected input.
2. Event handlers reject non-finite values and sometimes clamp ranges.
3. Store actions normalize cards and constrain node geometry.
4. Persistence hydration normalizes restored data again.

HTML constraints alone are not trusted. Users can type values, programmatic callers bypass controls, and persisted JSON may be old.

## 23. Notable current gaps

- The node inspector contains a commented-out delete header; deletion is currently available on the canvas frame and layer list, not as a visible inspector action.
- Node patch typing permits cross-variant mistakes at the generic store boundary.
- `InspectorSection.defaultOpen` is accepted but unused.
- Shape identity cannot be changed after insertion.
- Shape Size forces a square and may be surprising for lines.
- Image opacity exists in the model and renderer but is not exposed alongside the current image-effect controls.
- No controls exist for rotation, locking, visibility, grouping, or layer names.
- Immediate updates are not grouped into undoable transactions.

## 24. End-to-end examples

### Change card aspect ratio

```text
choose radio in CardInspector
→ updateCardSettings({ aspectRatio })
→ store resolves preset dimensions
→ normalizeCard
→ constrain every child node
→ canvas and inspector rerender
```

### Change an image effect

```text
move effect slider
→ updateEffect copies effects object
→ updateNode merges node patch
→ store constrains geometry without changing it
→ ImageNode rebuilds CSS filter string
→ image repaints immediately
```

### Switch a card to image fill

```text
choose image fill type
→ createDefaultFill("image")
→ CardFillInspector narrows to ImageFillSettings
→ upload or enter URL
→ updateCardSettings({ fill })
→ normalize fill percentages
→ CardImageFill resolves and renders source
```

### Insert and edit a shape

```text
open ShapePicker
→ filter catalog
→ addShapeNode with identity fields
→ store creates and selects complete node
→ inspector routes to ShapeSettings
→ color/size/texture patches update live renderer
```

The inspector's core design is projection plus patches: selection determines which typed object is projected into controls, and every interaction emits the smallest useful patch back through the store's normalization boundary.
