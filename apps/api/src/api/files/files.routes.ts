import {
  CreateFileInputSchema,
  FILE_ROUTES,
  FileIdSchema,
  FileKeySchema,
} from "@kerning/shared";
import { Hono } from "hono";
import { BadRequestError } from "http-errors-enhanced";

import { parseJson, parseValue } from "../../lib/http.js";
import { getUserFromContext, requireAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import {
  personalReadLimiter,
  uploadUrlLimiter,
  writeLimiter,
} from "../../rate-limiter/index.js";
import {
  createFileService,
  deleteFileService,
  getDownloadUrlService,
  getPublicUrlService,
  getUploadUrlService,
} from "./files.services.js";

export const fileRoutes = new Hono();

fileRoutes.use("*", requireAuth);

fileRoutes.get(
  FILE_ROUTES.getUploadUrl,
  rateLimit({
    limiter: uploadUrlLimiter,
    getKey: ({ c }) => getUserFromContext(c).id,
  }),
  async (c) => {
    const key = parseValue(FileKeySchema, c.req.query("key"));
    const user = getUserFromContext(c);
    const url = await getUploadUrlService({ key, userId: user.id });

    return c.json({ status: "success", data: { url } });
  },
);

fileRoutes.post(
  FILE_ROUTES.create,
  rateLimit({
    limiter: writeLimiter,
    getKey: ({ c }) => getUserFromContext(c).id,
  }),
  async (c) => {
    const dto = await parseJson(c.req.raw, CreateFileInputSchema);
    const user = getUserFromContext(c);
    const file = await createFileService({ dto, userId: user.id });

    return c.json({ status: "success", data: { file } }, 201);
  },
);

fileRoutes.get(
  FILE_ROUTES.downloadUrl,
  rateLimit({
    limiter: personalReadLimiter,
    getKey: ({ c }) => getUserFromContext(c).id,
  }),
  async (c) => {
    const fileId = parseValue(FileIdSchema, c.req.param("fileId"));
    const user = getUserFromContext(c);
    const url = await getDownloadUrlService({ fileId, userId: user.id });

    return c.json({ status: "success", data: { url } });
  },
);

fileRoutes.get(
  FILE_ROUTES.publicUrl,
  rateLimit({
    limiter: personalReadLimiter,
    getKey: ({ c }) => getUserFromContext(c).id,
  }),
  async (c) => {
    const fileId = parseValue(FileIdSchema, c.req.param("fileId"));
    const user = getUserFromContext(c);
    const url = await getPublicUrlService({ fileId, userId: user.id });

    return c.json({ status: "success", data: { url } });
  },
);

fileRoutes.delete(
  FILE_ROUTES.delete,
  rateLimit({
    limiter: writeLimiter,
    getKey: ({ c }) => getUserFromContext(c).id,
  }),
  async (c) => {
    const fileId = c.req.query("fileId");
    const key = c.req.query("key");

    if (!fileId && !key) {
      throw new BadRequestError("fileId or key is required");
    }

    const user = getUserFromContext(c);
    const file = await deleteFileService({ fileId, key, userId: user.id });

    return c.json({ status: "success", data: { file } });
  },
);
