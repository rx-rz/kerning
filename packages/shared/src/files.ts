import * as v from "valibot";

export const FILE_ROUTES = {
  getUploadUrl: "/files/get-upload-url",
  create: "/files",
  downloadUrl: "/files/:fileId/download-url",
  publicUrl: "/files/:fileId/public-url",
  delete: "/files/delete",
} as const;

export const FileParentTypeSchema = v.picklist(["PROJECT"]);

export const FileIdSchema = v.pipe(
  v.string(),
  v.minLength(1, "File id is required"),
);

export const FileKeySchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "File key is required"),
  v.maxLength(500, "File key must be 500 characters or fewer"),
);

export const CreateFileInputSchema = v.object({
  key: FileKeySchema,
  mimeType: v.pipe(v.string(), v.minLength(1, "MIME type is required")),
  parentId: v.pipe(v.string(), v.minLength(1, "Parent id is required")),
  parentType: FileParentTypeSchema,
  isThumbnail: v.optional(v.boolean(), false),
  order: v.optional(v.number(), 0),
});

export const FileEntitySchema = v.object({
  id: FileIdSchema,
  key: FileKeySchema,
  url: v.string(),
  mimeType: v.string(),
  parentId: v.string(),
  parentType: FileParentTypeSchema,
  isThumbnail: v.boolean(),
  order: v.number(),
  createdAt: v.string(),
  updatedAt: v.string(),
});

export type CreateFileInput = v.InferOutput<typeof CreateFileInputSchema>;
export type FileEntity = v.InferOutput<typeof FileEntitySchema>;
