import type { FileEntity } from "@kerning/shared";

import type { FileRow } from "../db/models/index.js";

export const mapFileFromDB = (row: FileRow): FileEntity => ({
  id: row.id,
  key: row.key,
  url: row.url,
  mimeType: row.mimeType,
  parentId: row.parentId,
  parentType: "PROJECT",
  isThumbnail: row.isThumbnail,
  order: row.order,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
