import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { auth } from './lib/auth.js'
import { env } from './lib/env.js'

const app = new Hono()
const API_PREFIX = '/api/v1'

app.use(
  `${API_PREFIX}/auth/*`,
  cors({
    origin: env.TRUSTED_ORIGINS,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

app.on(['POST', 'GET'], `${API_PREFIX}/auth/*`, (c) => auth.handler(c.req.raw))

app.get(API_PREFIX, (c) => {
  return c.json({ status: 'ok', service: 'kerning-api', version: 'v1' })
})

serve({
  fetch: app.fetch,
  port: env.PORT,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
