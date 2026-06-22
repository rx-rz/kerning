import dotenv from 'dotenv'
import * as v from 'valibot'

if (!process.env.NODE_ENV) {
  throw new Error(
    'NODE_ENV must be explicitly set (development, production, or test)'
  )
}

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env' })
  dotenv.config({ path: '.env.development' })
}

console.log('Current NODE_ENV:', process.env.NODE_ENV)

const splitOrigins = (value: string) =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

const url = (message: string) => v.pipe(v.string(), v.url(message))

const envSchema = v.pipe(
  v.object({
    NODE_ENV: v.picklist(['development', 'test', 'production']),
    PORT: v.optional(
      v.pipe(
        v.string(),
        v.toNumber(),
        v.finite('PORT must be a finite number'),
        v.integer('PORT must be an integer'),
        v.minValue(1, 'PORT must be positive')
      ),
      '4004'
    ),
    DATABASE_URL: v.pipe(v.string(), v.minLength(1, 'DATABASE_URL is required')),
    BETTER_AUTH_SECRET: v.pipe(
      v.string(),
      v.minLength(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    ),
    BETTER_AUTH_URL: v.optional(
      url('BETTER_AUTH_URL must be a valid URL'),
      'http://localhost:4004'
    ),
    SITE_URL: v.optional(
      url('SITE_URL must be a valid URL'),
      'http://localhost:3000'
    ),
    TRUSTED_ORIGINS: v.optional(v.string(), ''),
    GOOGLE_CLIENT_ID: v.pipe(
      v.string(),
      v.minLength(1, 'GOOGLE_CLIENT_ID is required')
    ),
    GOOGLE_CLIENT_SECRET: v.pipe(
      v.string(),
      v.minLength(1, 'GOOGLE_CLIENT_SECRET is required')
    ),
    RESEND_API_KEY: v.pipe(
      v.string(),
      v.minLength(1, 'RESEND_API_KEY is required')
    ),
    AUTH_EMAIL_FROM: v.optional(
      v.pipe(v.string(), v.minLength(1)),
      'Kerning <auth@kerning.click>'
    ),
  }),
  v.forward(
    v.partialCheck(
      [['NODE_ENV'], ['BETTER_AUTH_URL'], ['SITE_URL']],
      ({ NODE_ENV, BETTER_AUTH_URL, SITE_URL }) => {
        if (NODE_ENV !== 'production') {
          return true
        }

        const authUrl = new URL(BETTER_AUTH_URL)
        const siteUrl = new URL(SITE_URL)

        return authUrl.protocol === 'https:' && siteUrl.protocol === 'https:'
      },
      'BETTER_AUTH_URL and SITE_URL must use https in production'
    ),
    ['BETTER_AUTH_URL']
  )
)

const parsedEnv = v.safeParse(envSchema, process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', v.flatten(parsedEnv.issues))
  process.exit(1)
}

const baseTrustedOrigins = [
  parsedEnv.output.SITE_URL,
  'https://kerning.click',
  'https://www.kerning.click',
  'http://localhost:3000',
  'http://localhost:4004',
]

export const env = {
  ...parsedEnv.output,
  TRUSTED_ORIGINS: [
    ...new Set([
      ...baseTrustedOrigins,
      ...splitOrigins(parsedEnv.output.TRUSTED_ORIGINS),
    ]),
  ],
}

export const ENV_VARIABLES = env
