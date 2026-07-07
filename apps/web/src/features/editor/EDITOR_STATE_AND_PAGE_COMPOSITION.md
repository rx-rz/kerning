# Editor State, Actions, and Page Composition

This chapter describes the editor as a running application: which state belongs to the document, which state belongs to the workspace shell, how actions and per-card undo/redo work, how session restoration repairs data, and how the page composes the canvas, inspector, templates, and glyph viewer.

Canonical sources:

- [`store/editor-store.ts`](./store/editor-store.ts): editor data, actions, history, persistence, migration, and normalization.
- [`components/editor-page.tsx`](./components/editor-page.tsx): workspace composition and project-font integration.
- [`components/editor-canvas.tsx`](./components/editor-canvas.tsx): canvas controls, carousel, zoom, and history shortcuts.
- [`components/editor-inspector.tsx`](./components/editor-inspector.tsx): contextual inspector routing.
- [`components/template-sidebar.tsx`](./components/template-sidebar.tsx): template browsing and application.
- [`components/glyph-viewer.tsx`](./components/glyph-viewer.tsx): glyph and text comparison.

## 1. Runtime architecture

```text
EditorPage or ProjectEditorPage
└── EditorWorkspace
    ├── EditorCanvas
    │   ├── project or selected-card toolbar
    │   ├── Embla card carousel
    │   │   └── EditorCard[]
    │   ├── CardTickNavigator
    │   └── bottom navigation and zoom toolbar
    ├── TemplateSidebar?       selected by templateCardId
    ├── GlyphViewer            controlled dialog
    └── EditorInspector?       contextual card/node controls
```

The boundaries are deliberate:

- The Zustand store owns cards, selection, and runtime per-card history.
- `EditorWorkspace` owns whether the inspector and glyph viewer are open and which card is receiving a template.
- `EditorCanvas` owns zoom, carousel lock, editable input drafts, and the locally displayed last-edited timestamp.
- `EditorCard` owns its layers-panel visibility and transient smart-guide overlay state.
- `TextNode` owns whether it is currently in inline-edit mode.

Closing a panel does not change the document. Selecting or editing a card does.

## 2. Store contract

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

There is no public `setCards`. Components express intent through named actions, which gives the store one boundary for identity, constraints, selection, history, and compatibility repair.

## 3. Defaults and creation

A fresh editor contains one selected business card and no selected node. `resetEditor` creates another fresh card with a new ID and clears all card histories.

New nodes share these defaults:

```ts
{
	x: 24,
	y: 24,
	positions: { [card.settings.aspectRatio]: { x: 24, y: 24 } },
	rotation: 0,
}
```

Text and shape nodes use `DEFAULT_NODE_COLOR` (`#046A63`). Shapes also start with `strokeWidth: 1`. New image nodes no longer receive a blend mode.

Insertion appends to `card.nodes`, selects the card, selects the new node, and records the previous card state for undo.

## 4. Mutation syntax

The store combines Zustand, persistence, and `zustand-mutative`:

```ts
create<EditorState>()(
  persist(
    mutative((set) => ({
      // actions
    })),
    // persistence options
  ),
);
```

Action bodies may use `push`, `splice`, and direct assignment. The middleware still produces immutable state transitions for subscribers. Components must not mutate objects returned by selectors.

## 5. Selection actions

```ts
selectCard: (id) => set({ selectedCardId: id, selectedNodeId: null }),
selectNode: (cardId, nodeId) =>
	set({ selectedCardId: cardId, selectedNodeId: nodeId }),
```

Selecting a card clears node focus. Selecting a node selects its owner at the same time. Pressing Escape in the canvas calls `selectCard(null)`, which clears both levels and reveals the project-level toolbar.

Deleting the selected card selects the nearest survivor. Deleting the selected node clears only the node reference. Store deletion does not remove IndexedDB blobs; image-aware UI paths coordinate that side effect.

## 6. Card mutations and aspect-ratio positions

`updateCard` handles structural patches such as name and raw dimensions. `updateCardSettings` handles appearance and resolves a changed aspect-ratio preset into concrete dimensions. Both record history and normalize the result.

Aspect-ratio changes have one extra phase:

```ts
state.cards[cardIndex] = patch.aspectRatio
  ? {
      ...nextCard,
      nodes: card.nodes.map((node) =>
        switchNodeAspectRatio(
          node,
          card.settings.aspectRatio,
          patch.aspectRatio,
          nextCard,
        ),
      ),
    }
  : nextCard;
```

The current `(x, y)` is saved under the old ratio. A prior destination position is restored if it exists; otherwise the current position is reused. The result is constrained to the resized card and written into the destination slot.

Every `updateNode` also refreshes the active ratio's position:

```ts
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
```

## 7. Layer order and templates

`reorderNode` moves one node inside the array. Because render order and `z-index` follow array order, this is the entire layer mutation.

Applying a template:

1. records the destination card for undo;
2. copies the template card;
3. preserves the destination card ID;
4. gives every template node a fresh ID;
5. normalizes fields and geometry;
6. clears node selection.

The template catalog now exposes five filters: album covers, movie posters, business cards, typography specimens, and pitch decks. Preview dimensions are calculated from each template card's actual aspect ratio, and solid template fills are reflected directly in the preview background.

## 8. Per-card undo and redo

History snapshots include a deep-cloned card and the selected node on that card:

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

History is keyed by card ID rather than kept as one global timeline. Undoing card A does not consume card B's past.

For discrete edits, `recordCardHistory` runs before mutation:

```ts
function recordCardHistory(state, cardId) {
  const history = getCardHistory(state, cardId);
  if (history.transactionStart) return;
  const snapshot = snapshotCard(state, cardId);
  if (!snapshot) return;
  history.past.push(snapshot);
  if (history.past.length > 100) history.past.shift();
  history.future = [];
}
```

The snapshot cap is 100 past states per card. A new edit clears only that card's future stack.

Undo moves the current card to `future` and restores the latest `past` card. Redo performs the reverse. Both select the affected card and restore the snapshot's `selectedNodeId`.

Card creation and deletion are not in card history. Selection-only changes and project title changes are not history entries either.

## 9. Gesture transactions

Drag and resize generate many `updateNode` calls. Recording every pointer move would make one gesture consume dozens of undo steps, so the interaction layer brackets the gesture:

```ts
useEditorStore.getState().beginHistoryTransaction(cardId);

// repeated updateNode calls while the pointer moves

useEditorStore.getState().endHistoryTransaction(cardId);
```

While `transactionStart` exists, `recordCardHistory` does nothing. At the end, the store compares the starting and current card snapshots. A changed gesture contributes one past entry; a no-op gesture contributes none. Pointer cancellation closes the transaction too.

## 10. History controls and shortcuts

The selected-card toolbar derives button state from the selected card's history:

```ts
const canUndo = useEditorStore((state) =>
  selectedCardId
    ? Boolean(state.cardHistories[selectedCardId]?.past.length)
    : false,
);
```

Undo and redo buttons act on that card. A window-level shortcut handles:

- `Cmd/Ctrl + Z`: undo;
- `Cmd/Ctrl + Shift + Z`: redo.

The handler ignores events originating in `input`, `textarea`, `select`, or contenteditable elements so native text editing remains intact. There is no separate `Ctrl + Y` binding.

## 11. Persistence and restoration

The store persists only document content and selection to `sessionStorage`:

```ts
partialize: ({ cards, selectedCardId, selectedNodeId }) => ({
	cards,
	selectedCardId,
	selectedNodeId,
}),
```

`cardHistories` is intentionally absent, so undo/redo starts empty after reload. Canvas zoom, carousel lock, open panels, smart guides, and inline editing state are also transient.

Persistence is version `7`. Hydration is manually triggered once from `EditorWorkspace`:

```ts
useEffect(() => {
  useEditorStore.persist.rehydrate();
}, []);
```

The migration phase repairs legacy appearance structures. The merge phase normalizes cards, supplies rotation and position defaults, restores only an existing selected-card ID, and falls back to the first card when necessary.

## 12. Page entry points and project metadata

`EditorPage` mounts a standalone workspace. `ProjectEditorPage` loads a project and passes title, update timestamp, rename behavior, and project fonts into the same shell:

```tsx
<EditorWorkspace
  projectTitle={data?.project.name}
  projectUpdatedAt={data?.project.updatedAt}
  onProjectTitleChange={(name) => updateProject.mutate({ name })}
  primary={primary}
  secondaryOne={secondaryOne}
  secondaryTwo={secondaryTwo}
/>
```

Google fonts are loaded through a stylesheet helper. Uploaded and variable font faces are installed with the browser `FontFace` API. The workspace then exposes role-based stacks through `--font-project-primary`, `--font-project-sec1`, and `--font-project-sec2`.

## 13. Contextual canvas toolbars

The canvas has two mutually exclusive top-center toolbars.

When no card is selected, the project toolbar shows:

- an editable project title;
- a localized “Last edited” timestamp sourced from `projectUpdatedAt`;
- an optimistic local timestamp update after committing a new project title.

When a card is selected, the card toolbar shows:

- `Card n` using its current array position;
- an editable card name committed through `updateCard`;
- per-card undo and redo;
- carousel drag lock.

Enter commits title fields by blurring them. Escape restores the prior value and cancels that blur commit. The project timestamp is display state, not part of the editor store or card history.

## 14. Canvas navigation and zoom

[`components/editor-canvas.tsx`](./components/editor-canvas.tsx) uses Embla to keep carousel position and store selection synchronized in both directions. Dragging is disabled when the lock is active, and pointer starts inside `[data-editor-node]` are never delegated to Embla.

Wheel input has two modes:

- `Ctrl/Cmd + wheel` changes zoom from 50% to 150% in 10% steps.
- Ordinary wheel movement selects the previous or next card, throttled to one navigation every 180 ms.

The bottom toolbar also provides previous/next, add card, reset, zoom controls, and a clickable reset-to-100% label. The left tick navigator selects cards directly and reveals card names on hover or keyboard focus.

## 15. Inspector routing

The inspector resolves live selection from store IDs:

```text
selected card + selected node found  → NodeInspector
selected card only                   → CardInspector
no selected card                     → NoSelectionPanel
```

Selecting a node asks `EditorWorkspace` to open the inspector. Closing the inspector leaves selection unchanged, so reopening it returns to the same context.

Inspector sections are now always-open semantic `<section>` blocks rather than collapsible `<details>` elements. Rotation is in the shared layout section, shape stroke width is in shape controls, and image blend-mode controls have been removed.

## 16. Glyph viewer integration

The glyph viewer receives the available project fonts and can compare up to three font slots. The first slot is primary; additional unused project fonts can be added and removed.

It has two modes:

- **Glyph:** overlays the selected glyph from each slot in distinct colors against cap-height, x-height, baseline, and descender guides.
- **Text:** renders editable specimen text at a configurable size, one comparison row per slot, using parsed font outlines when available.

Metric badges report cap height, x-height, and descender for every slot. Missing glyphs in text-outline mode render as dashed boxes. Loading and retry state remains local to the dialog rather than entering editor document state.

## 17. End-to-end examples

### Drag and undo a node

```text
pointerdown on node
→ selectNode(cardId, nodeId)
→ beginHistoryTransaction(cardId)
→ requestAnimationFrame-coalesced updateNode calls
→ pointerup or pointercancel
→ endHistoryTransaction(cardId)
→ one starting snapshot enters cardHistories[cardId].past
→ Cmd/Ctrl+Z or Undo restores the original card and selection
```

### Change and revisit an aspect ratio

```text
updateCardSettings(cardId, { aspectRatio: "9:16" })
→ record previous card
→ resolve 9:16 dimensions
→ save each node's current position under the old ratio
→ restore or initialize each node's 9:16 position
→ constrain nodes and store 9:16 coordinates
→ switch away and back
→ prior 9:16 coordinates are restored
```

### Apply a template

```text
selected card opens TemplateSidebar
→ filter one of five categories
→ click template
→ applyTemplate(cardId, template.card)
→ destination ID survives; node IDs are regenerated
→ normalization repairs optional fields and geometry
→ node selection clears
→ Undo can restore the replaced card
```

## 18. Current boundaries

- Undo/redo is per-card, runtime-only, and does not include card creation/deletion or project metadata.
- History compares whole JSON-safe card snapshots; large documents may eventually need a more compact command or patch representation.
- Aspect-ratio memory stores positions only, not per-ratio dimensions or rotation.
- Project-title mutation and editor-card persistence remain separate systems.
- Image blob cleanup is coordinated by UI paths rather than guaranteed by store actions.
