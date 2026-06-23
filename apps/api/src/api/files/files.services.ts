import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { CreateFileInput } from "@kerning/shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "http-errors-enhanced";

import { getProjectDetailsInDB } from "../../repository/projects/index.js";
import {
  createFileInDB,
  deleteFileByIdInDB,
  getFileByIdInDB,
  getFileByIdOrKeyInDB,
} from "../../repository/files/index.js";
import {
  assertR2Configured,
  createPublicR2Url,
  r2Client,
} from "../../storage/index.js";
import { env } from "../../lib/env.js";

const PRESIGNED_URL_EXPIRES_IN_SECONDS = 60 * 30;

export function assertSafeProjectFileKey(key: string) {
  if (key.startsWith("/") || key.includes("..") || key.includes("\\")) {
    throw new BadRequestError("Invalid file key");
  }

  if (!/^projects\/[^/]+\/fonts\/[^/]+/.test(key)) {
    throw new BadRequestError(
      "Project font uploads must use projects/{projectId}/fonts/{fileName}",
    );
  }
}

export function getProjectIdFromFileKey(key: string) {
  const match = /^projects\/([^/]+)\/fonts\//.exec(key);
  return match?.[1] ?? null;
}

export async function getUploadUrlService({
  key,
  userId,
}: {
  key: string;
  userId: string;
}) {
  assertR2Configured();
  assertSafeProjectFileKey(key);

  const projectId = getProjectIdFromFileKey(key);

  if (!projectId) {
    throw new BadRequestError("Invalid project upload key");
  }

  const project = await getProjectDetailsInDB({ projectId, ownerId: userId });

  if (!project) {
    throw new ForbiddenError("Project not found for upload key");
  }

  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
  });
}

export async function createFileService({
  dto,
  userId,
}: {
  dto: CreateFileInput;
  userId: string;
}) {
  assertSafeProjectFileKey(dto.key);

  if (dto.parentType !== "PROJECT") {
    throw new BadRequestError("Unsupported file parent type");
  }

  const projectId = getProjectIdFromFileKey(dto.key);

  if (!projectId || projectId !== dto.parentId) {
    throw new BadRequestError("File key must match the project parent");
  }

  const project = await getProjectDetailsInDB({
    projectId: dto.parentId,
    ownerId: userId,
  });

  if (!project) {
    throw new ForbiddenError("Project not found for file");
  }

  const file = await createFileInDB({
    dto: {
      ...dto,
      ownerId: userId,
      url: createPublicR2Url(dto.key),
    },
  });

  if (!file) {
    throw new BadRequestError("Unable to save file metadata");
  }

  return file;
}

export async function getDownloadUrlService({
  fileId,
  userId,
}: {
  fileId: string;
  userId: string;
}) {
  assertR2Configured();

  const file = await getFileByIdInDB({ fileId, ownerId: userId });

  if (!file) {
    throw new NotFoundError("File not found");
  }

  const command = new GetObjectCommand({
    Bucket: env.CLOUDFLARE_BUCKET_NAME,
    Key: file.key,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
  });
}

export async function getPublicUrlService({
  fileId,
  userId,
}: {
  fileId: string;
  userId: string;
}) {
  const file = await getFileByIdInDB({ fileId, ownerId: userId });

  if (!file) {
    throw new NotFoundError("File not found");
  }

  return file.url;
}

export async function deleteFileService({
  fileId,
  key,
  userId,
}: {
  fileId?: string;
  key?: string;
  userId: string;
}) {
  assertR2Configured();

  const file = await getFileByIdOrKeyInDB({ fileId, key, ownerId: userId });

  if (!file && !key) {
    throw new NotFoundError("File not found");
  }

  const keyToDelete = file?.key ?? key;

  if (!keyToDelete) {
    throw new BadRequestError("fileId or key is required");
  }

  if (!file) {
    assertSafeProjectFileKey(keyToDelete);

    const projectId = getProjectIdFromFileKey(keyToDelete);
    const project = projectId
      ? await getProjectDetailsInDB({ projectId, ownerId: userId })
      : null;

    if (!project) {
      throw new ForbiddenError("Project not found for file key");
    }
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: keyToDelete,
    }),
  );

  if (!file) {
    return null;
  }

  return deleteFileByIdInDB({ fileId: file.id, ownerId: userId });
}
