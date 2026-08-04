import { S3Client } from "@aws-sdk/client-s3";
import { InternalServerError } from "http-errors-enhanced";

import { env } from "../lib/env.js";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.CLOUDFLARE_ENDPOINT || "http://localhost",
  // PutObject supports checksums, so recent AWS SDK versions otherwise add the
  // CRC32 of an empty body while presigning. The browser supplies the body
  // later, which makes R2 reject the upload because that checksum cannot match.
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID || "missing",
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY || "missing",
  },
});

export function assertR2Configured() {
  const missing = [
    ["CLOUDFLARE_ACCESS_KEY_ID", env.CLOUDFLARE_ACCESS_KEY_ID],
    ["CLOUDFLARE_SECRET_ACCESS_KEY", env.CLOUDFLARE_SECRET_ACCESS_KEY],
    ["CLOUDFLARE_ENDPOINT", env.CLOUDFLARE_ENDPOINT],
    ["CLOUDFLARE_BUCKET_NAME", env.CLOUDFLARE_BUCKET_NAME],
    ["CLOUDFLARE_PUBLIC_ACCESS_URL", env.CLOUDFLARE_PUBLIC_ACCESS_URL],
  ].flatMap(([key, value]) => (value ? [] : [key]));

  if (missing.length) {
    throw new InternalServerError(
      `Cloudflare R2 is not configured: ${missing.join(", ")}`,
    );
  }
}

export function createPublicR2Url(key: string) {
  return `${env.CLOUDFLARE_PUBLIC_ACCESS_URL.replace(/\/+$/, "")}/${key.replace(
    /^\/+/,
    "",
  )}`;
}
