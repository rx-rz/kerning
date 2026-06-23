import * as v from 'valibot'

export const GoogleFontCategorySchema = v.optional(
  v.picklist(['serif', 'sans-serif', 'monospace', 'display', 'handwriting'])
)

export const GoogleFontSearchInputSchema = v.object({
  q: v.optional(v.string(), ''),
  category: GoogleFontCategorySchema,
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    50
  ),
})

export const FontAxisSchema = v.object({
  tag: v.string(),
  name: v.string(),
  min: v.number(),
  max: v.number(),
  defaultValue: v.number(),
})

export const GoogleFontCatalogItemSchema = v.object({
  id: v.string(),
  source: v.literal('google'),
  family: v.string(),
  category: v.string(),
  variants: v.array(v.string()),
  subsets: v.optional(v.array(v.string())),
  axes: v.optional(v.array(FontAxisSchema)),
  version: v.optional(v.string()),
  lastModified: v.optional(v.string()),
})

export const ProjectFontSchema = v.object({
  id: v.string(),
  source: v.picklist(['upload', 'google']),
  family: v.string(),
  category: v.optional(v.string()),
  variants: v.array(v.string()),
  subsets: v.optional(v.array(v.string())),
  axes: v.optional(v.array(FontAxisSchema)),
  version: v.optional(v.string()),
  lastModified: v.optional(v.string()),
  createdAt: v.string(),
})

export const GoogleFontsDataSchema = v.object({
  fonts: v.array(GoogleFontCatalogItemSchema),
  cache: v.object({
    hit: v.boolean(),
  }),
})

export type GoogleFontCategory = v.InferOutput<typeof GoogleFontCategorySchema>
export type GoogleFontSearchInput = v.InferOutput<
  typeof GoogleFontSearchInputSchema
>
export type FontAxis = v.InferOutput<typeof FontAxisSchema>
export type GoogleFontCatalogItem = v.InferOutput<
  typeof GoogleFontCatalogItemSchema
>
export type GoogleFontsData = v.InferOutput<typeof GoogleFontsDataSchema>
export type ProjectFont = v.InferOutput<typeof ProjectFontSchema>
