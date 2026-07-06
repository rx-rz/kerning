# Editor State, Actions, and Page Composition

This chapter explains how the Kerning editor behaves as a running application: where its state lives, how actions mutate that state, how selection and layer order are protected, how templates replace a card, what “history” currently means, and how the page composes the canvas, template sidebar, inspector, and glyph viewer.

The canonical sources are:

- [`store/editor-store.ts`](./store/editor-store.ts) for editor data, mutations, persistence, migration, and normalization.
- [`components/editor-page.tsx`](./components/editor-page.tsx) for the workspace shell and project-font integration.
- [`components/editor-canvas.tsx`](./components/editor-canvas.tsx) for canvas controls and card layout.
- [`components/editor-inspector.tsx`](./components/editor-inspector.tsx) for contextual inspector routing.
- [`components/template-sidebar.tsx`](./components/template-sidebar.tsx) for template browsing and application.
- [`components/glyph-viewer.tsx`](./components/glyph-viewer.tsx) for the modal font/glyph browser.

## 1. The runtime architecture

```text
EditorPage or ProjectEditorPage
└── EditorWorkspace
    ├── EditorCanvas
    │   ├── canvas toolbar and zoom controls
    │   ├── EditorCard[]
    │   └── CardTickNavigator
    ├── TemplateSidebar?       selected by templateCardId
    ├── GlyphViewer            controlled dialog
    └── EditorInspector?       contextual card/node controls
```

`EditorWorkspace` owns transient shell state: whether panels are open and which card is receiving a template. The Zustand store owns document state and document selection. This distinction matters: closing the inspector does not modify the document, while selecting a card does.

## 2. The complete store contract

The action contract is declared at the top of [`store/editor-store.ts`](./store/editor-store.ts):

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

There are no public setters for `cards`. UI code expresses intent through actions, which gives the store a single boundary for ID generation, selection transitions, geometry constraints, and persistence repair.

## 3. Defaults and creation

The complete default-card constructor is:

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

function createDefaultState() {
	const card = createDefaultCard();

	return {
		cards: [card],
		selectedCardId: card.id,
		selectedNodeId: null,
	};
}
```

The editor therefore always boots with a selected, editable business card. `resetEditor` calls this constructor again, producing fresh identities instead of restoring fixed fixture IDs.

New node constructors live in the same store file. They choose a safe initial size relative to the card, place the node at `(24, 24)`, and populate every current variant field. Insertion actions then push the node and select it:

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

`addImageNode` and `addShapeNode` follow the same complete transition. Because `push` appends, new nodes become the top layer.

## 4. Mutative syntax without uncontrolled mutation

The store is created with Zustand, `persist`, and `zustand-mutative`:

```ts
export const useEditorStore = create<EditorState>()(
	persist(
		mutative((set) => ({
			...createDefaultState(),
			// actions
		})),
		// persistence options
	),
);
```

Action bodies can use readable operations such as `push`, `splice`, and direct assignment. `mutative` still produces the immutable state transitions Zustand subscribers expect. Components should not mutate objects obtained from selectors.

## 5. Selection is a coordinated pair

The complete selection actions are deliberately tiny:

```ts
selectCard: (id) => set({ selectedCardId: id, selectedNodeId: null }),
selectNode: (cardId, nodeId) =>
	set({ selectedCardId: cardId, selectedNodeId: nodeId }),
```

They encode two invariants:

1. Selecting a card clears node focus.
2. Selecting a node selects its owner at the same time.

The IDs are references, not duplicated objects. Consumers resolve the selected card from `cards`, then resolve the selected node inside that card. A stale selected card is repaired during hydration; action callers are responsible for passing real IDs during normal use.

Deletion preserves the same relationship. The full card deletion mutation is:

```ts
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
```

The last card cannot be deleted. If the selected card is removed, the card now occupying the same index is preferred; deleting the last item selects the new last card. Deleting a non-selected card does not disturb focus.

Node deletion is local to one card and clears focus only when necessary:

```ts
deleteNode: (cardId, nodeId) =>
	set((state) => {
		const card = state.cards.find(({ id }) => id === cardId);
		const nodeIndex =
			card?.nodes.findIndex(({ id }) => id === nodeId) ?? -1;

		if (!card || nodeIndex === -1) return;

		card.nodes.splice(nodeIndex, 1);
		if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
	}),
```

Stored image cleanup is not performed here; UI deletion paths currently coordinate that IndexedDB side effect.

## 6. Card mutations and normalization

Structural and appearance mutations use separate actions:

```ts
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
```

Changing the aspect-ratio preset also resolves concrete width and height. Both paths normalize the resulting card, so invalid dimensions and newly out-of-bounds nodes are repaired immediately.

Every node patch also crosses the geometry boundary:

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

The cast exposes a current weakness: `EditorNodePatch` is permissive enough that caller discipline protects the node discriminator. Geometry, however, is protected at runtime.

## 7. Node ordering is layer ordering

`card.nodes` is stored bottom-first. The complete reorder primitive is:

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

The target index is clamped after removal, when `card.nodes.length` reflects the remaining list. [`components/editor-card.tsx`](./components/editor-card.tsx) renders in this order and converts the index to z-index. [`components/layer-list.tsx`](./components/layer-list.tsx) reverses a copy for a conventional top-first panel, then converts drag results back to bottom-first order.

## 8. Templates replace content but preserve destination identity

The full store mutation is:

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

This is replacement, not merging. The destination keeps its ID; all copied nodes receive fresh IDs; normalization protects against template data that exceeds current bounds; and stale node selection is removed. Template definitions live in [`lib/editor-templates.ts`](./lib/editor-templates.ts), while browsing/filtering/application UI lives in [`components/template-sidebar.tsx`](./components/template-sidebar.tsx).

## 9. History: what exists and what does not

There is currently **no undo/redo history** in the editor store. There are no past/future stacks, transaction boundaries, keyboard shortcuts, or `undo`/`redo` actions. Pointer movement calls `updateNode` repeatedly and each intermediate position is simply current state.

The word “history” can otherwise be confused with two existing mechanisms:

- Session persistence restores the latest snapshot after reload.
- Schema migration upgrades older persisted snapshots.

Neither is user-facing edit history. Adding real undo/redo would require deciding when a burst of drag or resize updates becomes one transaction. Recording every pointer event would produce noisy history and excessive memory use.

## 10. Persistence and repair

The complete persistence boundary is at the bottom of [`store/editor-store.ts`](./store/editor-store.ts):

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

Only serializable document and selection fields persist. Current action functions survive because `merge` begins with `currentState`. `sessionStorage` makes this tab/session-oriented, not project-cloud durability. `fallbackStorage` avoids server-side `window` access. Hydration is explicit so server and client render paths remain controlled.

## 11. Page entry points and project fonts

[`components/editor-page.tsx`](./components/editor-page.tsx) exposes two entry points:

```tsx
export function EditorPage() {
	return <EditorWorkspace />;
}

export function ProjectEditorPage({ projectId }: { projectId: string }) {
	const { data } = useProjectApi(projectId);
	const updateProject = useUpdateProjectApi(projectId);
	const projectFonts = data?.project.fonts;

	useEffect(() => {
		for (const font of projectFonts ?? []) {
			if (font.source === "google") {
				loadGoogleFontStylesheet({
					family: font.family,
					variants: font.variants,
					axes: font.axes,
				});
				continue;
			}
			for (const face of font.faces) {
				if (!face.fileUrl) continue;
				const weight =
					face.kind === "variable" && face.weightRange
						? `${face.weightRange.min} ${face.weightRange.max}`
						: String(face.weight);
				const loadedFace = new FontFace(
					font.cssFamily ?? font.family,
					`url(${face.fileUrl})`,
					{ weight, style: face.style },
				);
				void loadedFace
					.load()
					.then((readyFace) => document.fonts.add(readyFace));
			}
		}
	}, [projectFonts]);

	const fontByRole = (role: "primary" | "secondary-one" | "secondary-two") =>
		projectFonts?.find((font) => font.role === role);
	const primary = fontByRole("primary");
	const secondaryOne = fontByRole("secondary-one");
	const secondaryTwo = fontByRole("secondary-two");

	return (
		<EditorWorkspace
			projectTitle={data?.project.name}
			onProjectTitleChange={(name) => updateProject.mutate({ name })}
			primary={primary}
			secondaryOne={secondaryOne}
			secondaryTwo={secondaryTwo}
		/>
	);
}
```

The plain entry point is locally usable. The project entry point fetches project metadata, persists title edits through the project API, loads Google or uploaded font faces, and passes semantic font roles into the same workspace.

Google fonts are loaded through `loadGoogleFontStylesheet`. Uploaded faces use the browser `FontFace` API; variable faces receive a weight range, while static faces receive one numeric weight. The workspace then exposes three CSS custom properties:

```tsx
style={{
	"--font-project-primary": fontStack(primary, secondaryOne, secondaryTwo),
	"--font-project-sec1": fontStack(secondaryOne, primary, secondaryTwo),
	"--font-project-sec2": fontStack(secondaryTwo, secondaryOne, primary),
} as React.CSSProperties}
```

Each role has ordered fallbacks, ending in `system-ui, sans-serif`. Text nodes consume these variables rather than knowing project entities.

## 12. Workspace-owned UI state

The complete local state declaration is:

```tsx
const [isInspectorOpen, setIsInspectorOpen] = useState(true);
const [templateCardId, setTemplateCardId] = useState<string | null>(null);
const [isGlyphViewerOpen, setIsGlyphViewerOpen] = useState(false);
```

These values are intentionally absent from session persistence. They describe the shell arrangement, not the card document. `templateCardId` does double duty: `null` means closed; a card ID means open and identifies the template destination.

The workspace explicitly hydrates the store after mounting:

```tsx
useEffect(() => {
	useEditorStore.persist.rehydrate();
}, []);
```

This pairs with `skipHydration: true` in the store.

## 13. Complete page composition

The central render from [`components/editor-page.tsx`](./components/editor-page.tsx) is:

```tsx
return (
	<main
		className="h-dvh min-w-240 overflow-hidden bg-surface-wash text-foreground"
		style={
			{
				"--font-project-primary": fontStack(
					primary,
					secondaryOne,
					secondaryTwo,
				),
				"--font-project-sec1": fontStack(secondaryOne, primary, secondaryTwo),
				"--font-project-sec2": fontStack(secondaryTwo, secondaryOne, primary),
			} as React.CSSProperties
		}
	>
		<EditorCanvas
			projectTitle={projectTitle}
			onProjectTitleChange={onProjectTitleChange}
			onToggleInspector={() => setIsInspectorOpen((isOpen) => !isOpen)}
			onSelectNode={() => setIsInspectorOpen(true)}
			onOpenTemplates={setTemplateCardId}
			onOpenGlyphViewer={() => setIsGlyphViewerOpen(true)}
		/>
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
		<GlyphViewer
			fonts={glyphFonts}
			open={isGlyphViewerOpen}
			onOpenChange={setIsGlyphViewerOpen}
		/>
		{isInspectorOpen ? (
			<EditorInspector onClose={() => setIsInspectorOpen(false)} />
		) : (
			<Button
				type="button"
				aria-label="Open inspector"
				variant="ghost"
				size="icon"
				className="fixed top-2.5 right-2.5 z-40 border border-white/60 bg-surface-glass shadow-hairline backdrop-blur-3xl"
				onClick={() => setIsInspectorOpen(true)}
			>
				<PanelRightOpen />
			</Button>
		)}
	</main>
);
```

The canvas is always mounted. The template sidebar mounts only for a target card. The glyph viewer stays mounted and receives controlled dialog state. The inspector is replaced by a compact reopen button when closed.

## 14. Event flow between page and canvas

```text
node selected in EditorCard
→ EditorCanvas calls onSelectNode
→ EditorWorkspace opens inspector

template button on selected card
→ EditorCanvas forwards card ID
→ templateCardId becomes that ID
→ TemplateSidebar mounts for that destination

glyph toolbar action
→ onOpenGlyphViewer
→ controlled GlyphViewer opens

inspector toggle
→ isInspectorOpen flips
→ inspector or reopen button is rendered
```

The page does not select cards or mutate nodes itself. It coordinates feature surfaces; the canvas and descendants call the store.

## 15. Canvas responsibilities

[`components/editor-canvas.tsx`](./components/editor-canvas.tsx) is the spatial host. It subscribes to cards and selection, owns presentation state such as zoom, renders toolbar controls, places every `EditorCard`, and mounts [`components/card-tick-navigator.tsx`](./components/card-tick-navigator.tsx). Clicking empty canvas space can clear/select at the appropriate level, while card and node handlers stop propagation to preserve their more specific interactions.

The canvas passes callbacks downward instead of making cards aware of page panels:

```tsx
<EditorCard
	card={card}
	zoom={zoom}
	isSelected={card.id === selectedCardId}
	onSelect={selectCard}
	onToggleSettings={onToggleInspector}
	onSelectNode={onSelectNode}
	onOpenTemplates={onOpenTemplates}
	onDelete={deleteCard}
/>
```

That boundary keeps `EditorCard` reusable and makes `EditorWorkspace` the only component that knows whether an inspector, glyph dialog, or template sidebar is open.

## 16. Inspector routing

[`components/editor-inspector.tsx`](./components/editor-inspector.tsx) derives its content from store references:

```text
no valid selected card            → NoSelectionPanel
selected card, no selected node   → CardInspector
selected card and selected node   → NodeInspector
```

There is no separate inspector mode variable. This prevents a panel mode from drifting away from selection. The page controls only whether the inspector shell is visible.

## 17. Glyph viewer integration

`glyphFonts` is memoized from available project roles. Each option contains the project font entity, the editor role (`primary`, `sec1`, or `sec2`), and a human label. [`components/glyph-viewer.tsx`](./components/glyph-viewer.tsx) receives that list and controlled `open` state.

The viewer is a font exploration surface, not editor document state. Opening it does not select or insert a node by itself. Its glyph/font derivation helpers are in [`lib/glyph-font.ts`](./lib/glyph-font.ts).

## 18. End-to-end examples

### Add and edit a node

```text
selected EditorCard toolbar
→ addTextNode(card.id)
→ constructor creates complete node
→ push makes it topmost
→ store selects card and node
→ EditorCard rerenders
→ EditorNode dispatches to TextNode
→ page callback opens inspector
→ EditorInspector resolves NodeInspector
```

### Apply a template

```text
card template button
→ page records templateCardId
→ sidebar opens for that card
→ user chooses template
→ applyTemplate(cardId, template.card)
→ destination identity retained
→ node identities regenerated
→ card normalized
→ node selection cleared
```

### Restore a session

```text
EditorWorkspace mounts
→ explicit rehydrate()
→ version migration translates legacy appearance
→ normalizeCard repairs every restored card
→ merge verifies selected card
→ stale card selection falls back to first card
→ node selection clears if its card reference changed
```

## 19. Practical extension points

- Undo/redo belongs around store actions, with drag/resize transaction coalescing.
- Durable project saving should separate document state from local selection and panel state.
- Image deletion should move behind a domain/service action so every deletion route cleans storage.
- A variant-aware node update API would remove the unsafe merge cast.
- Inspector visibility could become URL or workspace preference state if persistence becomes a product requirement; it should still remain separate from card data.

The key architectural idea is simple: the store owns the editable aggregate, while `EditorWorkspace` owns the arrangement of tools around it. The canvas is where those two worlds meet.
