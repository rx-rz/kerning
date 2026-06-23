# Font Addition Flow

This project now supports two font sources:

- Upload fonts: local `TTF`, `OTF`, `WOFF`, and `WOFF2` files from the user.
- Google Fonts: metadata fetched on demand from the Google Web Fonts Developer API and cached in Redis.

The key rule is that both paths become project fonts, but they load differently:

- Uploaded fonts store browser-local font file blobs.
- Google fonts store metadata only and load through Google Fonts CSS when needed.

## Environment

The API needs these values:

```bash
GOOGLE_FONTS_API_KEY=
GOOGLE_FONTS_CACHE_TTL_SECONDS=86400
```

`GOOGLE_FONTS_API_KEY` is the only required final plug-in step for Google Fonts. `GOOGLE_FONTS_CACHE_TTL_SECONDS` defaults to `86400` if it is not set.

Redis is also required for Google Fonts caching. The cache keys are:

```text
google-fonts:catalog
google-fonts:search:{query}:{category}:{limit}
```

## Shared Types

Shared Google font and project-font types live in `packages/shared/src/google-fonts.ts`.

The Google catalog item keeps useful metadata:

```ts
type GoogleFontCatalogItem = {
  id: string
  source: "google"
  family: string
  category: string
  variants: string[]
  subsets?: string[]
  axes?: FontAxis[]
  version?: string
  lastModified?: string
}
```

The project font shape is shared too:

```ts
type ProjectFont = {
  id: string
  source: "upload" | "google"
  family: string
  category?: string
  variants: string[]
  subsets?: string[]
  axes?: FontAxis[]
  version?: string
  lastModified?: string
  createdAt: string
}
```

`axes` is kept for variable-font controls later. Google font `files` URLs are intentionally not stored because the app does not download or persist Google font files.

## Google Fonts Backend Flow

The frontend calls:

```http
GET /api/v1/google-fonts?q=&category=&limit=50
```

The route is implemented in `apps/api/src/api/google-fonts/google-fonts.routes.ts`.

The service flow in `apps/api/src/api/google-fonts/google-fonts.services.ts` is:

1. Parse `q`, `category`, and `limit`.
2. Build the exact search cache key: `google-fonts:search:{query}:{category}:{limit}`.
3. Check Redis for that exact filtered result.
4. If found, return the cached filtered result.
5. If not found, check Redis for `google-fonts:catalog`.
6. If the catalog exists, filter that local cached catalog.
7. If the catalog is missing, call:

```text
https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}
```

8. Normalize each Google item into `GoogleFontCatalogItem`.
9. Cache the full catalog in Redis.
10. Filter by query/category/limit.
11. Cache the filtered search result in Redis.
12. Return the filtered result.

The backend does not run a cron sync, does not read public metadata files, and does not download WOFF2 files.

## Google Fonts Frontend Flow

The new-project page has two normal tabs:

- Upload Fonts
- Google Fonts

Clicking the Google Fonts tab only switches tab content. It does not open the dialog.

The Google Fonts tab renders a large full-width empty-state action card. Clicking that card opens the Google Fonts dialog.

When the dialog opens, `apps/web/src/api/google-fonts/list.ts` runs the query:

```ts
useGoogleFontsApi({
  q: "",
  category: undefined,
  limit: 50,
})
```

Inside the dialog:

- Left side has search, category pills, and a scrollable family list.
- Rows show `Aa`, family name, category, and variant count.
- Right side shows a live preview.
- Preview modes are text, paragraph, numbers, and punctuation.
- Weight choices use the Google `wght` axis when available, otherwise variant weights.
- Footer has Cancel and Add to Project.

Clicking Add to Project stores metadata only through `importGoogleFont` in `apps/web/src/lib/fonts.ts`.

## Google Font Storage

Google fonts are saved into the browser font store as metadata-only records:

```ts
{
  id,
  source: "google",
  name: family,
  cssFamily: family,
  category,
  variants,
  subsets,
  axes,
  version,
  lastModified,
  faces: [],
  createdAt,
  updatedAt,
}
```

No Google font file blob is saved. No WOFF2 file is downloaded. No Google CSS is saved.

## Google Font Loading

Google fonts are loaded lazily by `loadGoogleFontStylesheet` in `apps/web/src/lib/fonts.ts`.

When a Google font is previewed or used, the app injects a stylesheet like:

```text
https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap
```

The loader creates a stable `<link>` id from the family and avoids duplicate stylesheet injection.

Uploaded fonts do not use this path. They load with the browser `FontFace` API from locally stored blobs.

## Upload Font Flow

Upload starts in `apps/web/src/features/new-project/components/font-upload-button.tsx`.

The user chooses local font files. `uploadFontFiles` in `apps/web/src/lib/fonts.ts` then:

1. Filters to supported file extensions.
2. Reads existing uploaded font families from IndexedDB.
3. Ignores Google metadata records for upload-limit calculations.
4. Parses each font with `opentype.js`.
5. Falls back to filename parsing if the font cannot be parsed.
6. Extracts family name, weight, style, and variable axes where available.
7. Groups matching faces into a family.
8. Saves the font family and its file blobs into IndexedDB.
9. Loads the font into the document with the `FontFace` API.
10. Returns metadata for the UI.

Uploaded families store real `faces`, and each face stores the local blob plus extracted metadata.

## Shared Project Selection

The new-project route keeps one combined font list:

- uploaded fonts
- imported Google fonts

The Upload tab only displays uploaded fonts.

The Google Fonts tab only displays imported Google fonts.

The Primary, Secondary 1, and Secondary 2 selects use the combined list, so imported Google fonts and uploaded fonts are selectable together.

The preview panel also uses the combined list. Uploaded fonts render from `FontFace`; Google fonts render after their stylesheet is injected.

## What To Do To Run It

1. Add your Google Fonts API key to `apps/api/.env.development`:

```bash
GOOGLE_FONTS_API_KEY=your_key_here
GOOGLE_FONTS_CACHE_TTL_SECONDS=86400
```

2. Make sure Redis is running.
3. Start the API and web app.
4. Open the new project page.
5. Go to Google Fonts.
6. Click Browse Fonts.
7. Select a family.
8. Click Add to Project.

At that point the imported Google font should appear in the Primary, Secondary 1, and Secondary 2 selects alongside uploaded fonts.
