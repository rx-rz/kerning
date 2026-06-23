import { randomUUID } from 'node:crypto'

import type { ProjectFontInput } from '@kerning/shared'
import { and, desc, eq, inArray } from 'drizzle-orm'

import { db as defaultDb } from '../../db/index.js'
import {
  project as projectTable,
  projectFont as projectFontTable,
  projectFontFace as projectFontFaceTable,
  type ProjectRowInsert,
  type ProjectRowUpdate,
} from '../../db/models/index.js'
import { mapProjectFontFromDB, mapProjectFromDB } from '../../entity/index.js'

type DB = typeof defaultDb

export const createProjectInDB = async ({
  dto,
  db = defaultDb,
}: {
  dto: Omit<ProjectRowInsert, 'id'>
  db?: DB
}) => {
  const [row] = await db
    .insert(projectTable)
    .values({ ...dto, id: randomUUID() })
    .returning()

  return row ? mapProjectFromDB(row) : null
}

export const listProjectsInDB = async ({
  ownerId,
  db = defaultDb,
}: {
  ownerId: string
  db?: DB
}) => {
  const rows = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.ownerId, ownerId))
    .orderBy(desc(projectTable.updatedAt), desc(projectTable.id))

  if (!rows.length) return []

  const fontRows = await db
    .select()
    .from(projectFontTable)
    .where(
      inArray(
        projectFontTable.projectId,
        rows.map((row) => row.id)
      )
    )
    .orderBy(projectFontTable.order, projectFontTable.createdAt)
  const fontsByProjectId = new Map<string, typeof fontRows>()

  for (const font of fontRows) {
    const fonts = fontsByProjectId.get(font.projectId) ?? []
    fonts.push(font)
    fontsByProjectId.set(font.projectId, fonts)
  }

  return rows.map((row) => ({
    ...mapProjectFromDB(row),
    fonts: (fontsByProjectId.get(row.id) ?? []).map((font) =>
      mapProjectFontFromDB({ row: font })
    ),
  }))
}

export const getProjectDetailsInDB = async ({
  projectId,
  ownerId,
  db = defaultDb,
}: {
  projectId: string
  ownerId: string
  db?: DB
}) => {
  const [row] = await db
    .select()
    .from(projectTable)
    .where(and(eq(projectTable.id, projectId), eq(projectTable.ownerId, ownerId)))
    .limit(1)

  if (!row) return null

  const fontRows = await db
    .select()
    .from(projectFontTable)
    .where(eq(projectFontTable.projectId, row.id))
    .orderBy(projectFontTable.order, projectFontTable.createdAt)

  const faceRows = fontRows.length
    ? await db
        .select()
        .from(projectFontFaceTable)
        .where(
          inArray(
            projectFontFaceTable.projectFontId,
            fontRows.map((font) => font.id)
          )
        )
    : []

  const facesByFontId = new Map<string, typeof faceRows>()

  for (const face of faceRows) {
    const faces = facesByFontId.get(face.projectFontId) ?? []
    faces.push(face)
    facesByFontId.set(face.projectFontId, faces)
  }

  return {
    ...mapProjectFromDB(row),
    fonts: fontRows.map((font) =>
      mapProjectFontFromDB({
        row: font,
        faces: facesByFontId.get(font.id) ?? [],
      })
    ),
  }
}

export const updateProjectInDB = async ({
  projectId,
  ownerId,
  dto,
  db = defaultDb,
}: {
  projectId: string
  ownerId: string
  dto: ProjectRowUpdate
  db?: DB
}) => {
  const [row] = await db
    .update(projectTable)
    .set({ ...dto, updatedAt: new Date() })
    .where(and(eq(projectTable.id, projectId), eq(projectTable.ownerId, ownerId)))
    .returning()

  return row ? mapProjectFromDB(row) : null
}

export const replaceProjectFontsInDB = async ({
  projectId,
  fonts,
  db = defaultDb,
}: {
  projectId: string
  fonts: ProjectFontInput[]
  db?: DB
}) => {
  await db
    .delete(projectFontTable)
    .where(eq(projectFontTable.projectId, projectId))

  if (!fonts.length) return []

  const fontRows = await db
    .insert(projectFontTable)
    .values(
      fonts.map((font, index) => ({
        id: randomUUID(),
        projectId,
        clientId: font.id,
        source: font.source,
        family: font.family,
        cssFamily: font.cssFamily,
        role: font.role,
        order: font.order ?? index,
        category: font.category,
        variants: font.variants,
        subsets: font.subsets,
        axes: font.axes,
        version: font.version,
        lastModified: font.lastModified,
      }))
    )
    .returning()

  const fontIdByClientId = new Map(
    fontRows.map((row) => [row.clientId, row.id] as const)
  )
  const faceValues = fonts.flatMap((font) => {
    const projectFontId = fontIdByClientId.get(font.id)

    if (!projectFontId) return []

    return (font.faces ?? []).map((face) => ({
      id: randomUUID(),
      projectFontId,
      fileId: face.fileId,
      clientId: face.id,
      fileKey: face.fileKey,
      fileUrl: face.fileUrl,
      fileName: face.fileName,
      size: face.size,
      sizeLabel: face.sizeLabel,
      format: face.format,
      kind: face.kind,
      weight: face.weight,
      weightRange: face.weightRange,
      axes: face.axes,
      style: face.style,
    }))
  })

  if (faceValues.length) {
    await db.insert(projectFontFaceTable).values(faceValues)
  }

  return fontRows.map((font) => mapProjectFontFromDB({ row: font }))
}

export const deleteProjectInDB = async ({
  projectId,
  ownerId,
  db = defaultDb,
}: {
  projectId: string
  ownerId: string
  db?: DB
}) => {
  const [row] = await db
    .delete(projectTable)
    .where(and(eq(projectTable.id, projectId), eq(projectTable.ownerId, ownerId)))
    .returning()

  return row ? mapProjectFromDB(row) : null
}
