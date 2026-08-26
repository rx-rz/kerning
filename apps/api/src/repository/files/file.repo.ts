import { randomUUID } from "node:crypto";

import { and, eq, or } from "drizzle-orm";

import { db as defaultDb } from "../../db/index.js";
import {
  file as fileTable,
  type FileRowInsert,
} from "../../db/models/index.js";
import { mapFileFromDB } from "../../entity/index.js";

type DB = typeof defaultDb;

export const createFileInDB = async ({
  dto,
  db = defaultDb,
}: {
  dto: Omit<FileRowInsert, "id">;
  db?: DB;
}) => {
  const [row] = await db
    .insert(fileTable)
    .values({ ...dto, id: randomUUID() })
    .returning();

  return row ? mapFileFromDB(row) : null;
};

export const getFileByIdInDB = async ({
  fileId,
  ownerId,
  db = defaultDb,
}: {
  fileId: string;
  ownerId: string;
  db?: DB;
}) => {
  const [row] = await db
    .select()
    .from(fileTable)
    .where(and(eq(fileTable.id, fileId), eq(fileTable.ownerId, ownerId)))
    .limit(1);

  return row ? mapFileFromDB(row) : null;
};

export const getFileByIdOrKeyInDB = async ({
  fileId,
  key,
  ownerId,
  db = defaultDb,
}: {
  fileId?: string;
  key?: string;
  ownerId: string;
  db?: DB;
}) => {
  if (!fileId && !key) return null;

  const conditions = [
    fileId ? eq(fileTable.id, fileId) : null,
    key ? eq(fileTable.key, key) : null,
  ].filter((condition): condition is NonNullable<typeof condition> =>
    Boolean(condition),
  );

  const [row] = await db
    .select()
    .from(fileTable)
    .where(
      and(
        eq(fileTable.ownerId, ownerId),
        conditions.length === 1 ? conditions[0] : or(...conditions),
      ),
    )
    .limit(1);

  return row ? mapFileFromDB(row) : null;
};

export const deleteFileByIdInDB = async ({
  fileId,
  ownerId,
  db = defaultDb,
}: {
  fileId: string;
  ownerId: string;
  db?: DB;
}) => {
  const [row] = await db
    .delete(fileTable)
    .where(and(eq(fileTable.id, fileId), eq(fileTable.ownerId, ownerId)))
    .returning();

  return row ? mapFileFromDB(row) : null;
};

export const listFilesByParentInDB = async ({
  parentId,
  ownerId,
  db = defaultDb,
}: {
  parentId: string;
  ownerId: string;
  db?: DB;
}) => {
  const rows = await db
    .select()
    .from(fileTable)
    .where(
      and(
        eq(fileTable.parentType, "PROJECT"),
        eq(fileTable.parentId, parentId),
        eq(fileTable.ownerId, ownerId),
      ),
    );

  return rows.map(mapFileFromDB);
};

export const deleteFilesByParentInDB = async ({
  parentId,
  ownerId,
  db = defaultDb,
}: {
  parentId: string;
  ownerId: string;
  db?: DB;
}) =>
  db
    .delete(fileTable)
    .where(
      and(
        eq(fileTable.parentType, "PROJECT"),
        eq(fileTable.parentId, parentId),
        eq(fileTable.ownerId, ownerId),
      ),
    );
