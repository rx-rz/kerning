import { UnauthorizedError } from 'http-errors-enhanced'
import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'

import { auth } from '../lib/auth.js'

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session?.user) {
    throw new UnauthorizedError('Session invalid')
  }

  c.set('user', session.user)
  await next()
})

export const optionalAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (session?.user) {
    c.set('user', session.user)
  }
  await next()
})

export const getUserFromContext = (c: Context) => {
  const user = c.get('user') as { id: string } | undefined

  if (!user) {
    throw new UnauthorizedError('Session invalid')
  }

  return user
}

export const getOptionalUserFromContext = (c: Context) =>
  (c.get('user') as { id: string } | undefined) ?? null
