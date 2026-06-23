import type { Context, MiddlewareHandler } from "hono";
import type { RateLimiterRedis } from "rate-limiter-flexible";

import { globalRateLimiter } from "../rate-limiter/index.js";

type GetKey = ({ c }: { c: Context }) => string;

function getRealIP(c: Context) {
  const headers = [
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
    "x-client-ip",
    "forwarded",
  ];

  for (const header of headers) {
    const value = c.req.header(header);
    const ip = value?.split(",")[0]?.trim();

    if (ip) return ip;
  }

  return "unknown";
}

export const rateLimit = ({
  limiter,
  getKey,
  includeGlobal = false,
}: {
  limiter: RateLimiterRedis;
  getKey?: GetKey;
  includeGlobal?: boolean;
}): MiddlewareHandler => {
  return async (c, next) => {
    const ip = getRealIP(c);
    const key = getKey ? getKey({ c }) : ip;

    try {
      if (includeGlobal) {
        await globalRateLimiter.consume(ip);
      }

      const result = await limiter.consume(key);

      c.header("X-RateLimit-Limit", limiter.points.toString());
      c.header("X-RateLimit-Remaining", result.remainingPoints.toString());
      c.header(
        "X-RateLimit-Reset",
        new Date(Date.now() + result.msBeforeNext).toISOString(),
      );

      await next();
    } catch (err) {
      if (isRateLimiterRejection(err)) {
        const retryAfter = Math.ceil((err.msBeforeNext ?? 1000) / 1000);

        c.header("X-RateLimit-Limit", limiter.points.toString());
        c.header("X-RateLimit-Remaining", "0");
        c.header("Retry-After", retryAfter.toString());

        return c.json(
          {
            status: "fail",
            data: null,
            message: "Too many requests. Please try again later.",
            retryAfter,
          },
          429,
        );
      }

      console.error("[RateLimit Error]", err);
      await next();
    }
  };
};

function isRateLimiterRejection(
  err: unknown,
): err is { msBeforeNext?: number } {
  return Boolean(
    err &&
    typeof err === "object" &&
    "remainingPoints" in err &&
    "msBeforeNext" in err,
  );
}
