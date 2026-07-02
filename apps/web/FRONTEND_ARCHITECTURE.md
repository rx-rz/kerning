# Kerning Frontend Architecture Guide

This document explains the Kerning web frontend from the outside in, then drills down into the implementation details. It starts with the application-wide mental model, follows a font from selection or upload through project creation, and finishes inside the card editor and its Zustand store.

The goal is not merely to list files. The goal is to explain why each layer exists, what data it owns, how data crosses layer boundaries, and which assumptions must remain true as the product grows.

---

## 1. The frontend in one sentence

Kerning is a TanStack Start React application where users collect font families, assign them project roles, save that project through an API, and then enter an in-memory Zustand editor that represents visual work as cards.

That sentence contains four separate systems:

1. **Application shell and routing** — TanStack Router decides which screen is mounted.
2. **Font acquisition and project setup** — React state, IndexedDB, browser font APIs, Google Fonts, and React Query cooperate to prepare a project.
3. **Server-backed project data** — project names and font metadata are sent through the API and cached by React Query.
4. **Card editor state** — Zustand owns the current editor session and its cards.

The most important architectural fact is that these systems do not all have the same persistence model.

| Data | Current owner | Persistence |
| --- | --- | --- |
| Dashboard project list | React Query | Backend database |
| Project font metadata | React Query + API | Backend database |
| Uploaded font blobs before project creation | IndexedDB | Current browser |
| Google font selections before project creation | IndexedDB metadata | Current browser |
| New-project form choices | React component state | Until route unmount |
| Editor cards | Zustand + `sessionStorage` | Current browser-tab session |
| Inspector open/closed state | `EditorPage` local React state | Current editor mount only |

If you remember only one thing, remember this separation. React Query is for server state, IndexedDB is for browser-owned font files, Zustand is for editor-domain state, and ordinary React state is for temporary UI orchestration.

---

## 2. End-to-end system map

```text
Dashboard (/)
  |
  | user clicks New Project
  v
Project setup (/new)
  |
  +-- Upload Fonts --------------------------------------+
  |    hidden file input                                |
  |      -> parse OpenType metadata                     |
  |      -> normalize/group families                   |
  |      -> save blobs to IndexedDB                     |
  |      -> register FontFace objects in document       |
  |                                                     |
  +-- Browse Google Fonts ------------------------------+
       React Query catalog request                      |
         -> dynamically add Google stylesheet           |
         -> save selected family metadata to IndexedDB  |
                                                        |
  <---------------- unified FontFamilyMeta[] ------------+
                         |
                         v
              Assign primary/secondary roles
                         |
                         v
                 Confirmation preview
                         |
                         v
              POST project, upload local faces,
              PATCH project font metadata
                         |
                         v
              Card editor (/project/$projectId)
                         |
                         v
                 Zustand EditorCard[]
```

This is a pipeline. Each stage converts data into a form needed by the next stage:

- Raw browser `File` objects become parsed `StoredFontFace` records.
- Stored font records become lightweight `FontFamilyMeta` objects for React rendering.
- Selected font metadata becomes `ProjectFontInput` API payloads.
- A created project ID becomes the editor route parameter.
- Editor UI controls become small Zustand state transitions.

---

## 3. Application boot and route ownership

### 3.1 The root document

`src/routes/__root.tsx` creates the document shell shared by every route.

Its responsibilities are deliberately broad but shallow:

- Declare HTML metadata and the viewport.
- Load the global stylesheet.
- Load Inter from `https://rsms.me/inter/inter.css`.
- Provide one `QueryClient` to the React tree.
- Mount the PostHog integration.
- Render TanStack Router head content and scripts.

The `QueryClient` is created with a lazy `useState` initializer. That matters because constructing it directly in the component body would produce a new cache on every render. The current configuration gives queries a one-minute default stale time, one retry, and no automatic refetch when the window regains focus.

### 3.2 Route generation

Routes are file-based. A route file exports a `Route` created with `createFileRoute`. TanStack's generator turns those declarations into `src/routeTree.gen.ts`, which gives navigation and route parameters their TypeScript types.

The relevant user journey is:

```text
/                       Dashboard
/new                    Project and font setup
/new?confirm=true       Project confirmation mode
/project/$projectId     Card editor
```

The `confirm` query value does not create a separate route component. It changes which branch of the `/new` route renders. This keeps all temporary project-creation state alive when moving between selection and confirmation.

### 3.3 Dashboard handoff

The dashboard uses `useProjectsApi()` to read the project list from React Query. It renders loading, error, empty, and populated states. Each populated project card is a typed link to `/project/$projectId`.

The dashboard is the only screen with the traditional left application sidebar. The editor intentionally bypasses that layout and owns its entire viewport.

---

## 4. The application typography system

There are two different meanings of “font” in this frontend:

1. **UI typography** — the font used by buttons, labels, forms, panels, and routes.
2. **Project typography** — the fonts a user uploads or selects for specimen work.

These must remain conceptually separate.

### 4.1 Inter as the UI font

The root route preconnects to `rsms.me` and loads the Inter stylesheet. `styles.css` then sets:

```css
:root {
  font-family: Inter, sans-serif;
  font-feature-settings: "liga" 1, "calt" 1;
}

@supports (font-variation-settings: normal) {
  :root {
    font-family: InterVariable, sans-serif;
  }
}
```

The feature settings enable standard ligatures and contextual alternates. Browsers that support variable-font settings use `InterVariable`; older browsers fall back to static `Inter` and then the system sans-serif.

Tailwind's theme maps both `font-sans` and the legacy `font-mono` utility to Inter. The `font-mono` name remains in component classes because it currently communicates a visual role—small technical labels, counters, and uppercase controls—even though it no longer selects a monospaced typeface.

That means the whole application UI is Inter without rewriting every existing class.

### 4.2 Why project specimens still show other fonts

Font previews use inline style overrides such as:

```tsx
style={{ fontFamily: font.cssFamily }}
```

Inline `fontFamily` wins over the inherited UI font. Therefore replacing the application font with Inter does not break specimen rendering. Inter controls the surrounding interface; the selected family controls the actual sample text.

### 4.3 Token flow

The effective path for ordinary UI text is:

```text
Inter stylesheet
  -> Inter / InterVariable @font-face definitions
  -> --font-sans and --font-mono theme tokens
  -> Tailwind font-sans / font-mono utilities
  -> body inheritance or explicit utility classes
```

The body uses `var(--font-sans)`, so components without an explicit typography class inherit Inter automatically.

---

## 5. State taxonomy: choosing the right state tool

Kerning currently uses three state mechanisms, each for a different lifetime.

### 5.1 Local React state

Use local state when a value only coordinates one mounted screen:

- Active upload/Google tab.
- Whether the Google Fonts dialog is open.
- Project name before submission.
- Selected primary and secondary font IDs.
- Whether project submission is pending.
- Whether the editor inspector is open.

This state should disappear when the screen disappears.

### 5.2 React Query

Use React Query when the server is authoritative:

- Project lists.
- Project details.
- Google Fonts catalog search results returned by the API.
- Project creation mutations.

React Query solves caching, stale data, loading states, mutation lifecycles, and invalidation. It is not used for the card editor because those cards are not yet a server resource.

### 5.3 Zustand

Use Zustand for shared editor-domain state that many sibling components read and mutate:

- Card collection.
- Selected card ID.
- Card creation, deletion, updates, and reset.

The canvas, inspector, and bottom strip are siblings. Lifting all card state into `EditorPage` and threading callbacks through every component would become noisy as the editor grows. Zustand gives those components direct, narrowly selected access to the same domain model.

### 5.4 IndexedDB

IndexedDB is not React state. It is browser persistence for data that is too large or too binary for normal state or `localStorage`:

- Uploaded font blobs.
- Parsed face metadata.
- Google font selection metadata used across project-creation visits.

The `idb` package provides a promise-based wrapper around the browser API.

---

## 6. The `/new` route as an orchestration layer

`src/routes/new.tsx` is the coordinator for the project-creation workflow. It does not parse fonts itself and it does not implement reusable controls itself. It owns the cross-feature state and connects the specialized modules.

Its important state is:

```ts
activeTab
isGoogleFontsOpen
projectName
fonts
isSubmittingProject
primaryFontId
secondaryFontOneId
secondaryFontTwoId
```

The `fonts` array is the unified client-side catalog for the current setup session. Uploaded fonts and Google fonts both become `FontFamilyMeta`, so later UI does not need two completely different rendering paths.

### 6.1 Initial hydration from IndexedDB

On mount, the route calls `getAllFontFamilies()`. For every stored family it calls `loadFontFamilyIntoDocument()` and then converts the records to metadata-only objects with `toFontFamilyMeta()`.

The distinction between full and metadata records matters:

- `StoredFontFamily` contains `Blob` values.
- `FontFamilyMeta` removes those blobs but preserves face metadata.
- React state therefore does not carry large binary payloads.
- Binary data remains available from IndexedDB when project creation needs to upload it.

After loading, `mergeFontFamilies()` normalizes and deduplicates the families.

### 6.2 Keeping font-role selections valid

A second effect watches the unified font list and the three role IDs.

Its job is to maintain referential validity:

- If there are no fonts, all role IDs become `undefined`.
- If the primary selection is missing or was deleted, it falls back to the first font.
- Secondary one falls back to the second font.
- Secondary two falls back to the third font.

The effect uses a `Set` of current IDs for fast membership checks. This prevents stale selections from pointing at families that no longer exist.

This is a good example of derived-state maintenance: the IDs are user-editable state, but the set of valid values comes from `fonts`.

---

## 7. Uploaded-font pipeline in detail

The uploaded-font path starts in `FontUploadButton` and ends with a registered browser font plus an IndexedDB record.

### 7.1 File acquisition

`FontUploadButton` renders a hidden multiple file input accepting:

- `.ttf`
- `.otf`
- `.woff`
- `.woff2`

The visible button programmatically clicks that input. The same action is available through Command/Ctrl + U. The keyboard listener is added on mount and removed on unmount.

`isUploading` prevents duplicate interactions while asynchronous parsing and storage are running. An optional `maxFonts` prop can enforce a family count, although the current route does not pass a limit into the upload tab.

### 7.2 Filtering and format detection

`uploadFontFiles()` filters the `FileList` with `isFontFile()`. Unsupported extensions are ignored. `getFontFormat()` later converts a filename extension into the internal union:

```ts
"ttf" | "otf" | "woff" | "woff2"
```

### 7.3 Parsing OpenType metadata

For each valid file, `parseFontFile()` dynamically imports `opentype.js`. Dynamic import keeps the heavy parser out of the initial route bundle until the user actually uploads a file.

The parser attempts to read:

- Preferred family name.
- Font family fallback name.
- Preferred subfamily.
- Normal or italic style.
- OS/2 weight class.
- Variable font axes from the `fvar` table.

When the font is variable, axes such as `wght`, `wdth`, `opsz`, `slnt`, and `ital` are converted into `StoredFontAxis` records.

### 7.4 Graceful filename fallback

Font parsing can fail because of format limitations, malformed files, or browser/build differences. The code therefore computes a filename-based fallback before calling OpenType.

The fallback parser:

- Removes the extension.
- Detects variable-font hints like `VF`, `variable`, `[wght]`, `opsz`, or `wdth`.
- Detects italic or oblique naming.
- Maps common weight words to numeric CSS weights.
- Removes weight/style noise from the family name.
- Normalizes separators and casing.

This fallback is deliberately less exact but keeps the upload flow usable.

### 7.5 Family normalization and grouping

Multiple files often represent one family: regular, italic, bold, and variable faces should not become four unrelated families.

`normalizeFontFamilyName()` removes:

- File extensions.
- Variable-axis brackets.
- Variable/style words.
- Known weight words.
- Generated hash suffixes.
- Repeated separators and whitespace.

Families are keyed by normalized lowercase names. Existing uploaded families from IndexedDB are loaded into the same map before new files are processed.

### 7.6 Face deduplication

The upload logic rejects semantic duplicates:

- A variable face duplicates another variable face with the same style.
- A static face duplicates another static face with the same weight and style.

This is more useful than comparing filenames because renamed files may still represent the same typographic face.

### 7.7 Stored records

A newly discovered family receives:

- A browser-generated UUID.
- `source: "upload"`.
- A normalized display name.
- A synthetic CSS family such as `kerning-font-family-<id>`.
- Creation and update timestamps.

Each face stores its original `Blob`, parsed characteristics, filename, byte size, formatted size label, and format.

### 7.8 IndexedDB persistence

The `kerning` database currently has one `font-families` object store keyed by family ID. `saveFontFamily()` writes complete family records, including blobs.

IndexedDB is appropriate here because:

- Font files are binary and potentially large.
- Storage survives route changes and browser refreshes.
- The data can be read later when the user creates a project.
- React components only need lightweight metadata most of the time.

### 7.9 Browser font registration

After saving, `loadFontFamilyIntoDocument()` creates a temporary object URL for each face blob, creates a `FontFace`, waits for it to load, and adds it to `document.fonts`.

Variable faces use a weight range such as `100 900`; static faces use one weight. The object URL is revoked after loading because the browser's loaded font face no longer needs the temporary URL.

A module-level `loadedFaces` set prevents registering the same face repeatedly in one page session.

At this point `style={{ fontFamily: family.cssFamily }}` can render the uploaded family anywhere in the document.

---

## 8. Google Fonts pipeline in detail

The Google path produces the same `FontFamilyMeta` shape without storing binary blobs.

### 8.1 Opening the catalog

The Google Fonts tab opens `GoogleFontsDialog`. Command/Ctrl + S also switches to the Google tab and opens the dialog.

The dialog owns search-specific UI state:

- Search query.
- Category filter.
- Per-family specimen mode: letters, numbers, or symbols.

### 8.2 Catalog queries

`useGoogleFontsApi()` wraps a React Query request to the frontend API abstraction. Its query key includes the search input, category, and limit, so different searches are independently cached.

The query is enabled only while the dialog is open and has a one-hour stale time. This avoids catalog requests for a closed dialog and reduces repeated network work during browsing.

The dialog limits visible results to twelve families even if more are returned.

### 8.3 Preview stylesheet loading

When results change, the dialog calls `loadGoogleFontStylesheet()` for each visible family.

That function:

1. Builds a Google Fonts CSS2 URL.
2. Includes variable weight ranges when axes are available.
3. Includes italic/weight pairs for static variant catalogs.
4. Sets `display=swap`.
5. Hashes the URL into a stable link ID.
6. Avoids adding a duplicate stylesheet.
7. Appends a `<link rel="stylesheet">` to the document head.

Each catalog card can therefore render its own family and default weight.

### 8.4 Importing a selected Google family

Selecting a family calls `importGoogleFont()`.

The function:

- Creates a stable ID such as `google:inter`.
- Converts catalog metadata to a `ProjectFont`-shaped record.
- Saves metadata to IndexedDB with no local faces.
- Ensures its stylesheet is loaded.
- Returns `FontFamilyMeta` for React state.

Because Google Fonts remain remotely hosted, their IndexedDB record contains catalog metadata rather than binary face blobs.

### 8.5 Imported-state detection

The dialog receives the current imported font IDs and names. It builds a `Map` keyed by family name, allowing each catalog card to determine whether it represents an already imported family.

This supports checked/imported styling and removal behavior without repeated linear searches for every card render.

---

## 9. Unifying font sources

The route derives two filtered views:

```ts
uploadedFonts = fonts.filter(font => font.source !== "google")
googleFonts = fonts.filter(font => font.source === "google")
```

Those views exist for source-specific controls, but the canonical setup state remains one `fonts` array.

`mergeFontFamilies()` uses a source-aware key:

```text
<source>:<normalized lowercase family name>
```

That detail prevents an uploaded family and a Google family with the same human-readable name from accidentally collapsing into one record. Faces inside a family are deduplicated by face ID, and families are sorted by creation time.

The benefit is a stable downstream interface. Selected-font rows, role selectors, and project submission can work over `FontFamilyMeta[]` without branching at every call site.

---

## 10. Selected-font list and role selector

### 10.1 Selected-font summary

`SelectedFonts` renders every chosen family with:

- An “Aa” preview in that family.
- Family name.
- Source badge.
- Category or uploaded font type.
- Variant count.
- Delete action.

For uploaded fonts, the type is “Variable” if any face is variable. Variant counts are derived from unique weight/style or weight-range/style combinations.

Deleting a family removes it from IndexedDB and filters it from route state. The role-validation effect then repairs any role ID that pointed to the deleted family.

### 10.2 Font role slots

`FontSelectSection` defines three slots:

1. Primary Font.
2. Secondary Font 1.
3. Secondary Font 2.

The section only renders when at least one family exists. Every `SelectItem` renders its label in the represented font through `font.cssFamily`, making the control itself a small live specimen.

The selector is controlled: values live in the route, and callbacks update route state. The component knows nothing about IndexedDB or project submission.

That is a useful component boundary. Its job is “choose IDs from these options,” not “manage the font system.”

---

## 11. Confirmation preview

Clicking Proceed updates the `/new` search state to `confirm=true`. Because the same route stays mounted, the selected fonts and role IDs do not need to be serialized into the URL.

The confirmation screen collects the project name and renders `FontPreviewCard`.

`getPreviewFonts()` converts the three role IDs into labeled specimen rows. Missing optional roles are omitted with `flatMap`, so the preview only shows valid assignments.

Each specimen row uses the chosen family for:

- A large “Aa”.
- The role label area.
- Alphabetic sample text.
- Numbers.
- Symbols.

If no role can be previewed, the screen shows supported upload formats instead.

---

## 12. Project creation transaction

Project creation is a multi-step client-orchestrated transaction.

### 12.1 Step one: create the project shell

`useCreateProjectApi()` posts the project name to `projects`. The backend returns a project with an ID. The mutation invalidates the project-list query.

The name is trimmed and falls back to `Untitled Project`.

### 12.2 Step two: assign roles

`buildProjectFontInputs()` creates a `Map` from selected family IDs to API role values:

- `primary`
- `secondary-one`
- `secondary-two`

Every other family becomes `supporting`.

The original `fonts` array index becomes the persisted order.

### 12.3 Step three: serialize Google fonts

Google families already live remotely, so their payload contains catalog metadata and an empty `faces` array. No file upload is needed.

### 12.4 Step four: upload local font faces

For an uploaded family, the route reloads the complete `StoredFontFamily` from IndexedDB. This is where the architecture benefits from keeping blobs out of React state.

For every face it:

1. Builds a sanitized project-scoped storage key.
2. Requests a signed upload URL.
3. PUTs the blob directly to that URL with the correct font MIME type.
4. Creates file metadata through the application API.
5. Converts the stored face into an API face payload containing the new file identifiers and URLs.

All family conversions run through `Promise.all`, and all faces inside one family also use `Promise.all`.

### 12.5 Step five: patch project fonts

After building the complete `ProjectFontInput[]`, the route PATCHes the project detail endpoint with the fonts.

It then:

- Writes the updated project directly into the detail query cache.
- Invalidates the project list.
- Navigates to `/project/$projectId`.

### 12.6 Important failure characteristic

Project shell creation happens before face upload and project patching. If a later upload fails, the backend may retain a project with incomplete font data.

The `finally` block correctly clears the pending UI state, but there is not yet a rollback transaction or recovery screen. This is an important future reliability boundary.

---

## 13. API and React Query layer

### 13.1 API route constants

`src/api/api-routes.ts` centralizes relative API paths. Feature modules do not scatter literal endpoints throughout component code.

### 13.2 The API client

`src/lib/api.ts` wraps `ky`.

Global behavior includes:

- API URL prefix from public environment configuration.
- Cookie credentials.
- An idempotency key for write requests.
- Normalized `APIError` creation.
- JSend envelope validation.

`api.jsend<T>()` unwraps successful `data` and throws when the envelope is not successful. Components and query hooks therefore work with domain data instead of transport envelopes.

### 13.3 Query key factory

`src/api/queries.ts` centralizes keys for auth, projects, and Google Fonts. Stable keys are essential because invalidation only works when readers and writers agree on the key structure.

### 13.4 Why server data is not copied into Zustand

Project lists and details already have an authoritative cache in React Query. Copying them into Zustand would create two caches that can disagree.

Zustand begins where the current backend model ends: the unsaved editor card session.

---

## 14. Entering the card editor

The route `src/routes/project.$projectId.tsx` reads the typed route parameter and mounts `EditorPage` with a key based on project ID.

The key guarantees a new editor component instance when moving between project IDs. On mount, `EditorPage` rehydrates the Zustand store from `sessionStorage`.

Current limitation: the editor does not call `useProjectApi(projectId)` and does not hydrate cards from the backend. The project ID establishes navigation identity, but the browser-session document is not yet scoped by project ID.

Refreshing the page in the same tab restores the cards and selection. Closing the tab clears the session document.

---

## 15. Editor domain model

The editor starts with a deliberately small model.

```ts
type EditorCard = {
  id: string
  name: string
  width: number
  height: number
  settings: CardSettings
  background: string
  opacity: number
  blur: number
  borderWidth: number
  borderStyle: "solid" | "dashed" | "dotted" | "double"
  borderColor: string
}
```

`settings` is the extension point. Today it contains only `aspectRatio`; future typography, images, textures, effects, and export settings can grow there without replacing the card collection architecture.

Coordinates are intentionally absent. Cards participate in a horizontal flex layout rather than living on a freeform stage.

### 15.1 Aspect ratios

`CardAspectRatio` accepts:

- `1:1`
- `4:5`
- `16:9`
- `9:16`
- `3:2`
- `business-card`

`getCardSizeFromAspectRatio()` is the single mapping from semantic ratio to default pixel dimensions. Keeping this logic out of the inspector prevents controls from duplicating domain rules.

### 15.2 Default card

The store creates one selected business card:

- Name: `Untitled Card`.
- Size: 560 × 320.
- Background: `#fffdf8`.
- Border radius: 16.

IDs come from `createId()`.

---

## 16. Zustand store mechanics

`useEditorStore` combines state and small actions.

### 16.1 `selectCard(id)`

Sets the selected ID or clears it with `null`. Clicking the empty preview calls this with `null`.

### 16.2 `addCard()`

Creates a business card, chooses the first available Untitled Card name, appends it immutably, and selects it.

Name generation checks existing names rather than relying only on array length, so deletion does not automatically force duplicate names.

### 16.3 `deleteCard(id)`

Finds the deleted index and removes the card.

If the deleted card was selected, selection moves to:

- The card that shifted into the same index.
- Otherwise the previous final card.
- Otherwise `null` when no cards remain.

Deleting an unselected card preserves the current selection.

### 16.4 `updateCard(id, patch)`

Immutably shallow-merges ordinary card properties. The inspector uses it for name, dimensions, background, and border radius.

### 16.5 `updateCardSettings(id, patch)`

Merges the settings object. When the patch contains `aspectRatio`, it also replaces width and height using the ratio helper.

This is a critical invariant: aspect-ratio changes must use the settings action rather than `updateCard()` so size stays synchronized.

### 16.6 `resetEditor()`

Creates a fresh default card and selects it. Reset generates a new card ID rather than restoring a hard-coded object.

---

## 17. Editor component tree

```text
EditorPage
  +-- EditorCanvas
  |     +-- EditorCard[]
  |     +-- empty state
  |     +-- previous/next toolbar
  +-- BottomCardStrip
  +-- EditorInspector (fixed overlay, conditional)
        +-- CardInspector
        +-- NoSelectionPanel
```

Each component subscribes to the smallest useful store slice. Actions used only in event handlers are selected directly rather than pulling the entire store object into every render.

---

## 18. `EditorPage`: editor shell state

`EditorPage` owns layout and the inspector's visibility.

The page is a two-row grid:

- Flexible preview row.
- Content-sized bottom strip.

The inspector is not a grid column. It is a fixed, transparent, strongly blurred tool palette positioned 10px from the top and right. Closing it removes the panel and reveals a compact fixed reopen button.

Inspector visibility stays in local React state because it is presentation state, not document state. It should not be serialized into a project or mixed into undoable editor actions.

---

## 19. `EditorCanvas`: horizontal card workspace

Despite the historical component name, this is not an HTML `<canvas>` and not a coordinate plane. It is a frosted horizontal workspace.

### 19.1 Card layout

Cards render in a flex row with:

- Center alignment when the row fits.
- Horizontal overflow when it does not.
- Fixed gaps.
- Generous vertical and horizontal padding.

Cards own their width and height, but flexbox owns their position.

### 19.2 Scroll snapping

The scroll area uses:

- Horizontal snap axis.
- Mandatory snapping.
- Smooth scrolling.
- Center snap points on cards.
- Scroll padding.
- Horizontal overscroll containment.
- Reduced-motion fallback.

This gives mouse, trackpad, and touch scrolling a carousel-like stopping behavior without a third-party carousel package.

### 19.3 Selection-driven scrolling

The canvas keeps a ref to the scroll area. When `selectedCardId` changes, an effect finds the matching `data-card-id` element and calls `scrollIntoView()` with center alignment.

This keeps selection from the bottom strip or previous/next controls visually synchronized with the viewport.

### 19.4 Previous and next controls

The centered toolbar derives `selectedIndex` from the cards array. Previous and next are disabled at collection boundaries.

The toolbar stops click propagation so using it does not trigger the preview's empty-space deselection handler.

### 19.5 Empty state

When `cards.length` is zero:

- The scrolling row disappears.
- Previous/next navigation disappears.
- A centered message explains that the project has no cards.
- “Add Card” calls the same store action as the bottom strip.

The button stops propagation because adding a card selects it; allowing the click to bubble would immediately deselect the newly created card.

---

## 20. `EditorCard`: visual card boundary

Each card has an outer layout wrapper and an inner selection button.

The wrapper owns:

- Width and height.
- Snap-point behavior.
- Positioning context for floating controls.
- The `data-card-id` used by selection-driven scrolling.

The inner button owns:

- Background.
- Border radius.
- Border and selected outline.
- Click-to-select behavior.

Separating the wrapper from the selection button allows the floating delete control to be a sibling button. A button nested inside another button would be invalid HTML and would create unreliable keyboard and pointer behavior.

When selected, the card shows:

- Blue outline and light shadow.
- Blue name badge.
- Tiny red delete button.

Card clicks stop propagation so selecting a card does not also invoke empty-space deselection.

---

## 21. Floating inspector

`EditorInspector` reads the selected card by deriving it from `cards` and `selectedCardId`.

It is intentionally transparent. Its visual separation comes from:

- Strong backdrop blur.
- Rounded border.
- Floating shadow.
- Fixed position.

The inspector is open by default but receives an `onClose` callback from `EditorPage`.

If there is no selected card, it renders `NoSelectionPanel`. If a selected card exists, it renders `CardInspector`.

### 21.1 Inspector sections

`CardInspector` groups controls into:

- Card: name.
- Settings: aspect ratio.
- Size: width and height.
- Appearance: background and border radius.

Every field is controlled directly from Zustand state.

### 21.2 Numeric constraints

The inspector enforces UI-level minimums:

- Width and height: at least 1.
- Border radius: at least 0.

It ignores non-finite numeric input.

### 21.3 Aspect-ratio behavior

Aspect ratio uses `updateCardSettings()`. Width and height inputs use `updateCard()`.

Manual size edits do not rewrite the semantic aspect-ratio value. Selecting a new ratio later re-applies that ratio's default size.

---

## 22. Bottom card strip

The bottom strip is a second representation of the card collection optimized for navigation and collection commands.

It provides:

- One selectable chip per card.
- Selected-chip styling.
- Add Card.
- Delete Selected.
- Reset.

The strip may horizontally scroll when many card chips exist. It does not duplicate editor state; every command calls the same Zustand actions used elsewhere.

This is an important editor principle: multiple UI affordances can operate on one domain action. The empty-state button, bottom-strip button, and future keyboard shortcut should all call `addCard()`, not implement separate creation logic.

---

## 23. Event propagation and interaction correctness

The editor deliberately uses propagation boundaries:

- Preview background click: deselect.
- Card click: stop propagation, then select.
- Delete badge click: stop propagation, then delete.
- Empty-state Add click: stop propagation, then add/select.
- Navigation toolbar click: stop propagation.

Without those boundaries, one gesture could trigger contradictory actions. For example, clicking a card could select it and then bubble to the preview, immediately clearing selection.

Keyboard behavior also matters:

- Card surfaces and controls are actual buttons.
- Escape on the preview clears selection.
- Disabled previous/next controls use native button semantics.
- Inspector open/close controls have accessible labels.

---

## 24. Styling architecture

The frontend uses Tailwind CSS utilities backed by CSS custom properties.

### 24.1 Semantic color layers

`styles.css` defines raw design concepts first:

- Base backgrounds and paper surfaces.
- Text opacity levels.
- Hairline borders.
- Component fills.
- Glass surfaces.
- Semantic success, warning, and danger colors.

Those feed shadcn-style variables such as `--background`, `--foreground`, `--muted`, `--border`, and `--ring`.

Tailwind's `@theme inline` exposes them as utilities like:

- `bg-background`
- `text-foreground`
- `bg-surface-glass`
- `border-border`

This indirection lets components describe semantic intent instead of hard-coding every color.

### 24.2 Shared primitives

Buttons, inputs, selects, dialogs, tabs, cards, and fields live under `src/components/ui`.

Feature components compose these primitives rather than rebuilding focus rings, disabled styles, spacing, and Radix behavior every time.

### 24.3 Glass and transparency

The editor inspector is a good example of separating material from color. It has no opaque panel fill; backdrop blur, border, and shadow create the tool-palette effect while the workspace remains visible beneath it.

---

## 25. Testing strategy

Vitest uses a dedicated `vitest.config.ts`, separate from the Cloudflare Vite configuration. This avoids loading Worker-specific plugins into ordinary component tests.

### 25.1 Store tests

Store tests call `useEditorStore.getState()` directly and verify:

- Aspect-ratio size mappings.
- Default state.
- Add/select behavior.
- Generic card updates.
- Aspect-ratio dimension updates.
- Nearest-card selection after deletion.
- Final-card deletion.
- Reset behavior.

### 25.2 Component tests

Component tests use Testing Library with jsdom and verify behavior through accessible controls:

- Canvas selection and deselection.
- Inspector field updates.
- Bottom-strip actions.
- Previous/next selection.
- Inspector close/reopen behavior.
- Empty-state behavior.
- Per-card delete action.

The tests reset Zustand before each case because the store is a module singleton.

### 25.3 What tests do not prove

jsdom does not provide real layout, font rendering, backdrop blur, or scroll snapping. Tests can prove state transitions and accessible structure, but visual QA in a real browser remains necessary for:

- Actual Inter loading.
- Variable font behavior.
- Card sizing.
- Horizontal snapping.
- Backdrop blur.
- Inspector overlap.

---

## 26. Current architectural boundaries and gaps

Understanding what the frontend does not yet do is as important as understanding what it does.

### 26.1 Cards are not server-persisted

Editor cards are persisted to browser `sessionStorage` through Zustand. The backend project schema currently persists project metadata and fonts, not cards, so the editor document does not survive the browser-tab session or move across devices.

### 26.2 Editor does not hydrate project detail

The route has a project ID, and a `useProjectApi()` hook exists, but `EditorPage` does not currently load that project. The editor therefore cannot yet display the saved project name or project fonts.

### 26.3 No undo/redo

Actions mutate current Zustand state without history. Future undo should wrap domain actions rather than being implemented independently in each control.

### 26.4 No save status

Because cards are only browser-session data, there is no backend dirty state, autosave, conflict handling, or save feedback.

### 26.5 Project creation is not atomic

Creating a project, uploading faces, and patching metadata are separate network stages. A partial failure can leave a project shell behind.

### 26.6 UI font depends on a CDN

Inter currently loads from `rsms.me`. If offline reliability or strict performance control becomes important, self-hosting Inter files would remove that runtime dependency.

---

## 27. How to extend the font selector safely

### Add another role

To add a fourth role:

1. Extend the shared API role type.
2. Add route state for its selected ID.
3. Add validation/fallback logic in the font-list effect.
4. Add a slot in `FontSelectSection`.
5. Add it to `rolesByFontId`.
6. Add it to `getPreviewFonts()`.
7. Update tests and backend validation.

The role must be represented consistently from control to preview to API payload.

### Add another local font format

You would need to update:

1. File input `accept`.
2. `isFontFile()`.
3. `FontFormat`.
4. `getFontFormat()`.
5. MIME mapping.
6. Parser support assumptions.
7. UI format documentation.

Adding only the extension to the file input would create an incomplete pipeline.

### Improve font loading performance

The initial IndexedDB hydration loads stored families sequentially. If independent font registrations are safe in parallel, this could become `Promise.all`, but browser memory pressure and large files should be measured before changing it.

---

## 28. How to extend the card editor safely

### Add a new card setting

For a setting such as texture:

1. Extend `CardSettings`.
2. Give default cards a default texture value.
3. Add a store action or use `updateCardSettings()`.
4. Add the inspector control.
5. Read the setting during card rendering.
6. Test default, update, and reset behavior.

Settings should remain serializable if backend persistence is planned.

### Add card types

A future discriminated union could introduce:

```ts
type EditorCard =
  | TextCard
  | ImageCard
  | GlyphCard
  | SpecimenCard
```

Shared geometry and appearance can live in a base type, while `type` and `settings` discriminate specialized configuration. The collection actions can remain generic because they already operate by ID and patches.

### Add persistence

A robust persistence path would need:

1. Backend card schema and API types.
2. Project-detail hydration into the editor store.
3. A clear server/client source-of-truth policy.
4. Save or autosave mutation handling.
5. Dirty and pending states.
6. Error recovery.
7. Versioning or conflict strategy.

Do not simply persist the Zustand store wholesale. Define a stable document payload and map between transport data and editor runtime state.

### Add undo/redo

Undo history should capture domain transitions, not DOM events. Aspect-ratio changes should be one history entry containing both the setting and derived dimensions.

---

## 29. Debugging playbooks

### An uploaded font does not render

Check in this order:

1. Was the file extension accepted?
2. Did `parseFontFile()` return the expected family/style/weight?
3. Does IndexedDB contain the family and blob?
4. Did `FontFace.load()` succeed?
5. Does `document.fonts` contain the synthetic CSS family?
6. Is the preview using `font.cssFamily`, not the display name?

### A Google font card uses the fallback font

Check:

1. Did the catalog provide variants or axes?
2. Was the generated CSS URL valid?
3. Was a `<link>` inserted into `<head>`?
4. Is the card using the exact catalog family string?
5. Did the network or content security policy block Google Fonts?

### A font role points to the wrong family

Inspect:

1. The unified `fonts` array.
2. The selected role ID.
3. Whether deletion triggered the repair effect.
4. Whether duplicate family merging changed an ID unexpectedly.

### A card selects and immediately deselects

Look for a missing `stopPropagation()` on an interactive child inside the preview.

### Previous/next changes state but the card is not visible

Check:

1. The selected ID exists in `cards`.
2. The wrapper has the correct `data-card-id`.
3. `scrollAreaRef.current` points at the horizontal scroller.
4. The runtime provides `scrollIntoView()`.

### Inspector changes do not affect a card

Check whether the control uses the correct action:

- Ordinary property: `updateCard()`.
- Aspect ratio or future setting: `updateCardSettings()`.

---

## 30. Recommended reading order for learning the codebase

Read these areas in this order:

1. `src/routes/__root.tsx` — understand providers and document setup.
2. `src/styles.css` — understand tokens, Inter, and semantic utilities.
3. `src/routes/index.tsx` — see the simplest server-state screen.
4. `src/routes/new.tsx` — understand workflow orchestration.
5. `src/features/new-project/components/font-selection.tsx` — see controlled component boundaries.
6. `src/features/new-project/containers/font-upload-tab.tsx` — see source merging.
7. `src/lib/fonts.ts` — study the full font processing domain.
8. `src/db/font-db.ts` — understand browser persistence.
9. `src/lib/api.ts` and `src/api/queries.ts` — understand transport and caching.
10. `src/features/editor/types.ts` — start from the editor domain model.
11. `src/features/editor/store/editor-store.ts` — understand editor transitions.
12. `src/features/editor/components/editor-page.tsx` — understand shell state.
13. `editor-canvas.tsx`, `editor-card.tsx`, and `editor-inspector.tsx` — follow rendering and interactions.
14. Editor tests — confirm which behaviors are considered invariants.

---

## 31. Final mental model

The frontend is easiest to reason about as a sequence of ownership transfers:

```text
Browser file/catalog result
  -> normalized browser font record
  -> lightweight React metadata
  -> role-assigned project payload
  -> backend project
  -> project editor route
  -> Zustand card document
  -> canvas, inspector, and strip projections
```

At every arrow, ask four questions:

1. Who owns this data now?
2. Is it temporary, browser-persistent, or server-persistent?
3. What is the stable type crossing the boundary?
4. Which action is allowed to change it?

That discipline is what keeps a frontend understandable as it grows. Components remain projections of state, domain logic stays in helpers and stores, server data keeps one authoritative cache, and large binary font files do not leak into ordinary render state.
