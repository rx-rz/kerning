import type { ProjectEntity, ProjectFontEntity } from "@kerning/shared";

import type {
  ProjectFontFaceRow,
  ProjectFontRow,
  ProjectRow,
} from "../db/models/index.js";

export const mapProjectFromDB = (row: ProjectRow): ProjectEntity => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  version: 1,
});

export const mapProjectFontFromDB = ({
  row,
  faces = [],
}: {
  row: ProjectFontRow;
  faces?: ProjectFontFaceRow[];
}): ProjectFontEntity => ({
  dbId: row.id,
  id: row.clientId,
  source: row.source === "google" ? "google" : "upload",
  family: row.family,
  cssFamily: row.cssFamily ?? undefined,
  role:
    row.role === "primary" ||
    row.role === "secondary-one" ||
    row.role === "secondary-two" ||
    row.role === "supporting"
      ? row.role
      : undefined,
  order: row.order,
  category: row.category ?? undefined,
  variants: row.variants ?? undefined,
  subsets: row.subsets ?? undefined,
  axes: row.axes ?? undefined,
  version: row.version ?? undefined,
  lastModified: row.lastModified ?? undefined,
  faces: faces.map((face) => ({
    id: face.clientId,
    fileId: face.fileId ?? undefined,
    fileKey: face.fileKey ?? undefined,
    fileUrl: face.fileUrl ?? undefined,
    fileName: face.fileName,
    size: face.size,
    sizeLabel: face.sizeLabel,
    format:
      face.format === "ttf" ||
      face.format === "otf" ||
      face.format === "woff" ||
      face.format === "woff2"
        ? face.format
        : "ttf",
    kind: face.kind === "variable" ? "variable" : "static",
    weight: face.weight,
    weightRange: face.weightRange ?? undefined,
    axes: face.axes ?? undefined,
    style: face.style === "italic" ? "italic" : "normal",
    createdAt: face.createdAt.toISOString(),
  })),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
