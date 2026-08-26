import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";

import { redisClient } from "../lib/redis.js";

type RateLimiterOptions = {
  points: number;
  duration: number;
  prefix: string;
  blockDuration?: number;
};

function createRateLimiter({
  points,
  duration,
  prefix,
  blockDuration = 0,
}: RateLimiterOptions) {
  const insuranceLimiter = new RateLimiterMemory({
    points,
    duration,
    blockDuration,
  });

  return new RateLimiterRedis({
    storeClient: redisClient,
    points,
    duration,
    blockDuration,
    keyPrefix: `kerning:rate-limit:${prefix}`,
    insuranceLimiter,
  });
}

export const globalRateLimiter = createRateLimiter({
  points: 2000,
  duration: 60,
  prefix: "global",
  blockDuration: 60,
});

export const authLimiter = createRateLimiter({
  points: 5,
  duration: 60,
  prefix: "auth",
  blockDuration: 300,
});

export const personalReadLimiter = createRateLimiter({
  points: 600,
  duration: 60,
  prefix: "personal-read",
});

export const writeLimiter = createRateLimiter({
  points: 30,
  duration: 60,
  prefix: "write",
  blockDuration: 120,
});

// A three-family project can legitimately contain dozens of static faces.
export const fileWriteLimiter = createRateLimiter({
  points: 120,
  duration: 60,
  prefix: "file-write",
  blockDuration: 120,
});

export const uploadUrlLimiter = createRateLimiter({
  points: 60,
  duration: 60,
  prefix: "upload-url",
});
