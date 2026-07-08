import type { FontAxis, ProjectFont } from "@kerning/shared"
import { openDB } from "idb"

const DB_NAME = "kerning"
const FONT_FAMILY_STORE = "font-families"

export type FontFaceKind = "static" | "variable"
export type FontStyle = "normal" | "italic"
export type FontFormat = "ttf" | "otf" | "woff" | "woff2"

export type StoredFontAxis = FontAxis

export type StoredFontFace = {
  id: string
  family: string

  kind: FontFaceKind

  weight: number

  weightRange?: {
    min: number
    max: number
  }

  /**
   * Variable font axes.
   *
   * Examples:
   * wght -> weight
   * wdth -> width
   * opsz -> optical size
   */
  axes?: StoredFontAxis[]

  style: FontStyle

  fileName: string
  size: number
  sizeLabel: string
  format: FontFormat

  blob: Blob

  createdAt: string
}

export type StoredFontFamily = {
  id: string
  source?: "upload" | "google"
  name: string
  cssFamily: string
  category?: string
  variants?: string[]
  subsets?: string[]
  axes?: StoredFontAxis[]
  version?: string
  lastModified?: string
  files?: Record<string, string>
  faces: StoredFontFace[]
  createdAt: string
  updatedAt: string
}

export type FontFamilyMeta = Omit<StoredFontFamily, "faces"> & {
  faces: Omit<StoredFontFace, "blob">[]
}

export async function getFontDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FONT_FAMILY_STORE)) {
        db.createObjectStore(FONT_FAMILY_STORE, {
          keyPath: "id",
        })
      }
    },
  })
}

export async function saveFontFamily(fontFamily: StoredFontFamily) {
  const db = await getFontDB()
  await db.put(FONT_FAMILY_STORE, fontFamily)
}

export async function saveGoogleFont(projectFont: ProjectFont) {
  const now = new Date().toISOString()

  await saveFontFamily({
    id: projectFont.id,
    source: "google",
    name: projectFont.family,
    cssFamily: projectFont.family,
    category: projectFont.category,
    variants: projectFont.variants,
    subsets: projectFont.subsets,
    axes: projectFont.axes,
    version: projectFont.version,
    lastModified: projectFont.lastModified,
    files: projectFont.files,
    faces: [],
    createdAt: projectFont.createdAt,
    updatedAt: now,
  })
}

export async function getFontFamily(id: string) {
  const db = await getFontDB()

  return db.get(FONT_FAMILY_STORE, id) as Promise<
    StoredFontFamily | undefined
  >
}

export async function getAllFontFamilies() {
  const db = await getFontDB()

  return db.getAll(FONT_FAMILY_STORE) as Promise<StoredFontFamily[]>
}

export async function deleteFontFamily(id: string) {
  const db = await getFontDB()
  await db.delete(FONT_FAMILY_STORE, id)
}

export function toFontFamilyMeta(fontFamily: StoredFontFamily): FontFamilyMeta {
  return {
    ...fontFamily,
    faces: fontFamily.faces.map(({ blob, ...face }) => face),
  }
}
