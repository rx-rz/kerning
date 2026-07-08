import {
  type GoogleFontCategory,
  type GoogleFontCatalogItem,
  type GoogleFontSearchInput,
  type FontAxis,
} from '@kerning/shared'

import { GoogleFontsCache } from '../../cache/google-fonts.cache.js'
import { env } from '../../lib/env.js'

type GoogleFontsApiResponse = {
  items?: GoogleFontsApiFamily[]
}

type GoogleFontsApiFamily = {
  family: string
  variants?: string[]
  subsets?: string[]
  version?: string
  lastModified?: string
  category?: string
  files?: Record<string, string>
  axes?: Array<{
    tag?: string
    start?: number
    end?: number
  }>
}

type GoogleFontSearchResult = {
  fonts: GoogleFontCatalogItem[]
  cache: {
    hit: boolean
  }
}

export async function searchGoogleFontsService({
  input,
}: {
  input: GoogleFontSearchInput
}): Promise<GoogleFontSearchResult> {
  if (!env.GOOGLE_FONTS_API_KEY) {
    throw new Error('GOOGLE_FONTS_API_KEY is not configured')
  }

  const normalizedInput = normalizeInput(input)
  const cachedSearch = await GoogleFontsCache.getSearch(normalizedInput)

  if (cachedSearch) {
    return {
      fonts: cachedSearch,
      cache: {
        hit: true,
      },
    }
  }

  const cachedCatalog = await GoogleFontsCache.getCatalog()
  const catalog = cachedCatalog ?? (await fetchGoogleFontsCatalog())

  if (!cachedCatalog) {
    await GoogleFontsCache.setCatalog(catalog)
  }

  const fonts = filterGoogleFonts(catalog, normalizedInput)
  await GoogleFontsCache.setSearch(normalizedInput, fonts)

  return {
    fonts,
    cache: {
      hit: false,
    },
  }
}

async function fetchGoogleFontsCatalog() {
  const url = new URL('https://www.googleapis.com/webfonts/v1/webfonts')

  url.searchParams.set('key', env.GOOGLE_FONTS_API_KEY)
  url.searchParams.set('capability', 'VF')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Google Fonts API request failed with ${response.status}`)
  }

  const data = (await response.json()) as GoogleFontsApiResponse

  return (data.items ?? []).map(mapGoogleFontFamily)
}

function filterGoogleFonts(
  fonts: GoogleFontCatalogItem[],
  input: ReturnType<typeof normalizeInput>,
) {
  const query = input.q.trim().toLowerCase()

  return fonts
    .filter((font) => {
      if (input.category && font.category !== input.category) return false
      if (!query) return true

      return font.family.toLowerCase().includes(query)
    })
    .slice(0, input.limit)
}

function mapGoogleFontFamily(
  font: GoogleFontsApiFamily,
): GoogleFontCatalogItem {
  return {
    id: `google:${slugify(font.family)}`,
    source: 'google',
    family: font.family,
    category: font.category ?? 'sans-serif',
    variants: font.variants ?? [],
    subsets: font.subsets ?? [],
    axes: mapGoogleFontAxes(font.axes),
    version: font.version,
    lastModified: font.lastModified,
    files: font.files,
  }
}

function mapGoogleFontAxes(
  axes: GoogleFontsApiFamily['axes'],
): FontAxis[] | undefined {
  const mappedAxes = axes?.flatMap((axis) => {
    if (!axis.tag || axis.start === undefined || axis.end === undefined) {
      return []
    }

    return [
      {
        tag: axis.tag,
        name: getAxisFallbackName(axis.tag),
        min: axis.start,
        max: axis.end,
        defaultValue: getAxisDefaultValue(axis.tag, axis.start, axis.end),
      },
    ]
  })

  return mappedAxes?.length ? mappedAxes : undefined
}

function getAxisDefaultValue(tag: string, min: number, max: number) {
  const defaults: Record<string, number> = {
    wght: 400,
    wdth: 100,
    opsz: 14,
    slnt: 0,
    ital: 0,
  }

  const defaultValue = defaults[tag] ?? min

  return Math.min(Math.max(defaultValue, min), max)
}

function getAxisFallbackName(tag: string) {
  const axisNames: Record<string, string> = {
    wght: 'Weight',
    wdth: 'Width',
    opsz: 'Optical Size',
    slnt: 'Slant',
    ital: 'Italic',
  }

  return axisNames[tag] ?? tag
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeInput(input: GoogleFontSearchInput): {
  q: string
  category?: GoogleFontCategory
  limit: number
} {
  return {
    q: input.q.trim(),
    category: input.category,
    limit: input.limit,
  }
}
