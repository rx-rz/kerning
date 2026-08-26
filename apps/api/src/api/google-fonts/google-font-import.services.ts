import { createHash } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { ProjectFontInput } from "@kerning/shared";
import { BadRequestError } from "http-errors-enhanced";

import { env } from "../../lib/env.js";
import {
  createFileInDB,
  deleteFileByIdInDB,
} from "../../repository/files/index.js";
import {
  assertR2Configured,
  createPublicR2Url,
  r2Client,
} from "../../storage/index.js";

export const MAX_FONT_FILE_SIZE = 10 * 1024 * 1024;
export const HARD_MAX_FONT_FILE_SIZE = 25 * 1024 * 1024;

export async function selfHostGoogleFonts({
  fonts,
  projectId,
  userId,
}: {
  fonts: ProjectFontInput[];
  projectId: string;
  userId: string;
}): Promise<ProjectFontInput[]> {
  const hasRemoteFaces = fonts.some(
    (font) =>
      font.source === "google" &&
      font.faces?.some((face) => face.fileUrl && !face.fileId),
  );
  if (!hasRemoteFaces) return fonts;

  assertR2Configured();
  const uploadedKeys = new Set<string>();
  const createdFileIds = new Set<string>();

  try {
    return await settleAll(
      fonts.map(async (font, fontIndex) => {
        if (font.source !== "google" || !font.faces?.length) return font;

        const faces = await settleAll(
          font.faces.map(async (face, faceIndex) => {
            if (!face.fileUrl || face.fileId) return face;
            const sourceUrl = new URL(face.fileUrl);
            if (sourceUrl.hostname !== "fonts.gstatic.com") {
              throw new BadRequestError(
                "Google font assets must come from fonts.gstatic.com",
              );
            }
            sourceUrl.protocol = "https:";

            const response = await fetch(sourceUrl, {
              signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) {
              throw new BadRequestError(
                `Google font download failed with ${response.status}`,
              );
            }

            const declaredSize = Number(
              response.headers.get("content-length") ?? 0,
            );
            if (
              declaredSize > HARD_MAX_FONT_FILE_SIZE ||
              declaredSize > MAX_FONT_FILE_SIZE
            ) {
              throw new BadRequestError(
                "Font file exceeds the 10 MB import limit",
              );
            }

            const bytes = new Uint8Array(await response.arrayBuffer());
            if (bytes.byteLength > MAX_FONT_FILE_SIZE) {
              throw new BadRequestError(
                "Font file exceeds the 10 MB import limit",
              );
            }

            const checksum = createHash("sha256").update(bytes).digest("hex");
            const safeName = face.fileName.replace(/[^a-z0-9._-]+/gi, "-");
            const key = `projects/${projectId}/fonts/google/${checksum.slice(0, 16)}-${safeName}`;
            const mimeType = face.format === "otf" ? "font/otf" : "font/ttf";

            uploadedKeys.add(key);
            await r2Client.send(
              new PutObjectCommand({
                Bucket: env.CLOUDFLARE_BUCKET_NAME,
                Key: key,
                Body: bytes,
                ContentType: mimeType,
                Metadata: { checksum, source: "google" },
              }),
            );

            const file = await createFileInDB({
              dto: {
                ownerId: userId,
                key,
                url: createPublicR2Url(key),
                mimeType,
                parentId: projectId,
                parentType: "PROJECT",
                isThumbnail: false,
                order: fontIndex + faceIndex,
              },
            });
            if (!file) {
              throw new BadRequestError(
                "Unable to save imported font metadata",
              );
            }
            createdFileIds.add(file.id);

            return {
              ...face,
              fileId: file.id,
              fileKey: file.key,
              fileUrl: file.url,
              size: bytes.byteLength,
              sizeLabel: formatBytes(bytes.byteLength),
            };
          }),
        );

        return { ...font, faces };
      }),
    );
  } catch (error) {
    // Wait for all imports before rollback so late writes cannot recreate data.
    const storageCleanup = await Promise.allSettled(
      Array.from(uploadedKeys, (key) =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: env.CLOUDFLARE_BUCKET_NAME,
            Key: key,
          }),
        ),
      ),
    );
    if (storageCleanup.every((result) => result.status === "fulfilled")) {
      await Promise.allSettled(
        Array.from(createdFileIds, (fileId) =>
          deleteFileByIdInDB({ fileId, ownerId: userId }),
        ),
      );
    }
    throw error;
  }
}

async function settleAll<T>(promises: Promise<T>[]) {
  const results = await Promise.allSettled(promises);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) throw failure.reason;
  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
