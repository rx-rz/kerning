import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { fileRoutes } from "./api/files/files.routes.js";
import { googleFontsRoutes } from "./api/google-fonts/google-fonts.routes.js";
import { projectRoutes } from "./api/projects/projects.routes.js";
import { auth } from "./lib/auth.js";
import { env } from "./lib/env.js";
import { onError } from "./lib/errors.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { authLimiter, globalRateLimiter } from "./rate-limiter/index.js";

const app = new Hono();
const API_PREFIX = "/api/v1";

app.use(
  `${API_PREFIX}/*`,
  cors({
    origin: env.TRUSTED_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.use(`${API_PREFIX}/*`, rateLimit({ limiter: globalRateLimiter }));
app.use(`${API_PREFIX}/auth/*`, rateLimit({ limiter: authLimiter }));
app.on(["POST", "GET"], `${API_PREFIX}/auth/*`, (c) => auth.handler(c.req.raw));

app.route(API_PREFIX, googleFontsRoutes);
app.route(API_PREFIX, fileRoutes);
app.route(API_PREFIX, projectRoutes);
app.onError(onError);

app.get(API_PREFIX, (c) => {
  return c.json({ status: "ok", service: "kerning-api", version: "v1" });
});

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
