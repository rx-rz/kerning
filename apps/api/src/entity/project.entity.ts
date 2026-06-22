import type { ProjectEntity } from '@kerning/shared'

import type { ProjectRow } from '../db/models/index.js'

export const mapProjectFromDB = (row: ProjectRow): ProjectEntity => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  version: 1,
})
