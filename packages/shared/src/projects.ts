import * as v from "valibot";

import { FontAxisSchema } from "./google-fonts.js";

export const PROJECT_ROUTES = {
  list: "/projects",
  create: "/projects",
  detail: "/projects/:projectId",
  fonts: "/projects/:projectId/fonts",
} as const;

export const ProjectIdSchema = v.pipe(
  v.string(),
  v.minLength(1, "Project id is required"),
);

export const ProjectNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Project name is required"),
  v.maxLength(120, "Project name must be 120 characters or fewer"),
);

export const ProjectFontSourceSchema = v.picklist(["upload", "google"]);
export const ProjectFontRoleSchema = v.picklist([
  "primary",
  "secondary-one",
  "secondary-two",
  "supporting",
]);
export const ProjectFontFaceKindSchema = v.picklist(["static", "variable"]);
export const ProjectFontStyleSchema = v.picklist(["normal", "italic"]);
export const ProjectFontFormatSchema = v.picklist([
  "ttf",
  "otf",
  "woff",
  "woff2",
]);

export const ProjectFontFaceSchema = v.object({
  id: v.string(),
  fileId: v.optional(v.string()),
  fileKey: v.optional(v.string()),
  fileUrl: v.optional(v.string()),
  fileName: v.string(),
  size: v.number(),
  sizeLabel: v.string(),
  format: ProjectFontFormatSchema,
  kind: ProjectFontFaceKindSchema,
  weight: v.number(),
  weightRange: v.optional(
    v.object({
      min: v.number(),
      max: v.number(),
    }),
  ),
  axes: v.optional(v.array(FontAxisSchema)),
  style: ProjectFontStyleSchema,
  createdAt: v.optional(v.string()),
});

const ProjectFontInputEntries = {
  id: v.string(),
  source: ProjectFontSourceSchema,
  family: v.string(),
  cssFamily: v.optional(v.string()),
  role: v.optional(ProjectFontRoleSchema),
  order: v.optional(v.number()),
  category: v.optional(v.string()),
  variants: v.optional(v.array(v.string())),
  subsets: v.optional(v.array(v.string())),
  axes: v.optional(v.array(FontAxisSchema)),
  version: v.optional(v.string()),
  lastModified: v.optional(v.string()),
  faces: v.optional(v.array(ProjectFontFaceSchema)),
  createdAt: v.optional(v.string()),
};

export const ProjectFontInputSchema = v.object(ProjectFontInputEntries);

export const ProjectFontEntitySchema = v.object({
  ...ProjectFontInputEntries,
  dbId: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  faces: v.array(ProjectFontFaceSchema),
});

export const ProjectEntitySchema = v.object({
  id: ProjectIdSchema,
  name: v.string(),
  fonts: v.optional(v.array(ProjectFontEntitySchema)),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
  version: v.literal(1),
});

export const CreateProjectInputSchema = v.object({
  name: ProjectNameSchema,
  fonts: v.optional(v.array(ProjectFontInputSchema)),
});

export const UpdateProjectInputSchema = v.pipe(
  v.object({
    name: v.optional(ProjectNameSchema),
    fonts: v.optional(v.array(ProjectFontInputSchema)),
  }),
  v.partialCheck(
    [["name"], ["fonts"]],
    ({ name, fonts }) => name !== undefined || fonts !== undefined,
    "At least one project field must be provided",
  ),
);

export type ProjectEntity = v.InferOutput<typeof ProjectEntitySchema>;
export type CreateProjectInput = v.InferOutput<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = v.InferOutput<typeof UpdateProjectInputSchema>;
export type ProjectFontInput = v.InferOutput<typeof ProjectFontInputSchema>;
export type ProjectFontEntity = v.InferOutput<typeof ProjectFontEntitySchema>;
export type ProjectFontFace = v.InferOutput<typeof ProjectFontFaceSchema>;
