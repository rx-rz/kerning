import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { isHttpError } from 'http-errors-enhanced'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { DatabaseError } from 'pg'
import * as v from 'valibot'

import { env } from './env.js'
import { formatValidationError } from './http.js'
import { HttpStatus } from './http-status-codes.js'

type Jsend =
  | {
    status: 'fail'
    message?: string
    details?: unknown
    data?: Record<string, unknown>
  }
  | {
    status: 'error'
    message: string
    details?: unknown
  }

export const onError = (err: unknown, c: Context) => {
  const { status, jsend } = resolveErrorInfo(err, c)

  console.error({
    path: c.req.path,
    method: c.req.method,
    status,
    error: err instanceof Error ? err.message : String(err),
  })

  return c.json(redactForProd(jsend, status), status as ContentfulStatusCode)
}

const resolveErrorInfo = (err: unknown, c: Context) => {
  const isJsonReq = c.req.header('content-type')?.includes('application/json')
  const isBetterAuthError =
    err instanceof Error && err.name === 'BetterAuthError'

  switch (true) {
    case err instanceof v.ValiError:
      return {
        status: HttpStatus.BadRequest,
        jsend: formatValidationError(err.issues),
      }

    case isBetterAuthError:
      return {
        status: HttpStatus.Unauthorized,
        jsend: { status: 'error', message: err.message } satisfies Jsend,
      }

    case isHttpError(err):
      return {
        status: err.status,
        jsend: {
          status: err.status >= 500 ? 'error' : 'fail',
          message: err.message,
          details: err.details,
        } satisfies Jsend,
      }

    case err instanceof SyntaxError &&
      err.message.includes('JSON') &&
      isJsonReq:
      return {
        status: HttpStatus.BadRequest,
        jsend: {
          status: 'fail',
          message: 'Invalid JSON payload',
        } satisfies Jsend,
      }



    case err instanceof DrizzleQueryError:
      if (err.cause instanceof DatabaseError) {
        return parsePostgresError(err.cause)
      }

      return {
        status: HttpStatus.InternalServerError,
        jsend: {
          status: 'error',
          message:
            env.NODE_ENV === 'production'
              ? 'Database error'
              : (err.message ?? 'Database query failed.'),
        } satisfies Jsend,
      }

    case err instanceof Error &&
      err.message.includes('Malformed JSON') &&
      isJsonReq:
      return {
        status: HttpStatus.BadRequest,
        jsend: {
          status: 'fail',
          message: 'Malformed JSON in request body',
        } satisfies Jsend,
      }

    default:
      return {
        status: HttpStatus.InternalServerError,
        jsend: {
          status: 'error',
          message: 'Internal server error',
        } satisfies Jsend,
      }
  }
}

export const parsePostgresError = (err: DatabaseError) => {
  const { code, detail, column } = err
  const field = detail?.match(/\((.+?)\)=/)?.[1]

  switch (code) {
    case '23505':
      return {
        status: HttpStatus.Conflict,
        jsend: {
          status: 'fail',
          message: `${field ? `Field "${field}"` : 'A field'} must be unique.`,
        } satisfies Jsend,
      }
    case '23503':
      return {
        status: HttpStatus.BadRequest,
        jsend: {
          status: 'fail',
          message: `${field ? `The value for "${field}"` : 'A provided value'} does not match any existing record.`,
        } satisfies Jsend,
      }
    case '23502':
      return {
        status: HttpStatus.BadRequest,
        jsend: {
          status: 'fail',
          message: `${column ? `The field "${column}"` : 'A required field'} is required.`,
        } satisfies Jsend,
      }
    case '22P02':
      return {
        status: HttpStatus.BadRequest,
        jsend: {
          status: 'fail',
          message: 'Invalid input format. Please check your data types.',
        } satisfies Jsend,
      }
    default:
      return {
        status: HttpStatus.InternalServerError,
        jsend: {
          status: 'error',
          message: 'An unexpected database error occurred.',
        } satisfies Jsend,
      }
  }
}

const redactForProd = (original: Jsend, status: number): Jsend => {
  if (env.NODE_ENV !== 'production') {
    return original
  }

  if (status >= 500) {
    return { status: 'error', message: 'Internal server error' }
  }

  if (original.status === 'error') {
    return {
      status: 'error',
      message: original.message,
    }
  }

  return {
    status: 'fail',
    message: original.message,
    data: original.data
      ? Object.fromEntries(Object.keys(original.data).map((key) => [key, 'invalid']))
      : undefined,
  }
}
