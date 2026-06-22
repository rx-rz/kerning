import { randomUUID } from 'node:crypto'

import { and, desc, eq } from 'drizzle-orm'

import { db as defaultDb } from '../../db/index.js'
import {
  project as projectTable,
  type ProjectRowInsert,
  type ProjectRowUpdate,
} from '../../db/models/index.js'
import { mapProjectFromDB } from '../../entity/index.js'

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

  return rows.map(mapProjectFromDB)
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
  return row ? mapProjectFromDB(row) : null
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
