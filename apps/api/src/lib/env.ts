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
    GOOGLE_FONTS_API_KEY: v.optional(v.string(), ''),
    GOOGLE_FONTS_CACHE_TTL_SECONDS: v.optional(
      v.pipe(
        v.string(),
        v.toNumber(),
        v.finite('GOOGLE_FONTS_CACHE_TTL_SECONDS must be a finite number'),
        v.integer('GOOGLE_FONTS_CACHE_TTL_SECONDS must be an integer'),
        v.minValue(1, 'GOOGLE_FONTS_CACHE_TTL_SECONDS must be positive')
      ),
      '86400'
    ),
    REDIS_HOST: v.optional(v.string(), 'localhost'),
    REDIS_PORT: v.optional(
      v.pipe(
        v.string(),
        v.toNumber(),
        v.finite('REDIS_PORT must be a finite number'),
        v.integer('REDIS_PORT must be an integer'),
        v.minValue(1, 'REDIS_PORT must be positive')
      ),
      '6379'
    ),
    REDIS_PASSWORD: v.optional(v.string()),
    REDIS_URL: v.optional(v.pipe(v.string(), v.url('REDIS_URL must be a valid URL'))),
    RESEND_API_KEY: v.pipe(
      v.string(),
      v.minLength(1, 'RESEND_API_KEY is required')
    ),
    CLOUDFLARE_ACCESS_KEY_ID: v.optional(v.string(), ''),
    CLOUDFLARE_SECRET_ACCESS_KEY: v.optional(v.string(), ''),
    CLOUDFLARE_ENDPOINT: v.optional(v.string(), ''),
    CLOUDFLARE_BUCKET_NAME: v.optional(v.string(), ''),
    CLOUDFLARE_PUBLIC_ACCESS_URL: v.optional(v.string(), ''),
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
  ),
  v.forward(
    v.partialCheck(
      [
        ['NODE_ENV'],
        ['CLOUDFLARE_ACCESS_KEY_ID'],
        ['CLOUDFLARE_SECRET_ACCESS_KEY'],
        ['CLOUDFLARE_ENDPOINT'],
        ['CLOUDFLARE_BUCKET_NAME'],
        ['CLOUDFLARE_PUBLIC_ACCESS_URL'],
      ],
      ({
        NODE_ENV,
        CLOUDFLARE_ACCESS_KEY_ID,
        CLOUDFLARE_SECRET_ACCESS_KEY,
        CLOUDFLARE_ENDPOINT,
        CLOUDFLARE_BUCKET_NAME,
        CLOUDFLARE_PUBLIC_ACCESS_URL,
      }) => {
        if (NODE_ENV !== 'production') {
          return true
        }

        return Boolean(
          CLOUDFLARE_ACCESS_KEY_ID &&
            CLOUDFLARE_SECRET_ACCESS_KEY &&
            CLOUDFLARE_ENDPOINT &&
            CLOUDFLARE_BUCKET_NAME &&
            CLOUDFLARE_PUBLIC_ACCESS_URL
        )
      },
      'Cloudflare R2 environment variables are required in production'
    ),
    ['CLOUDFLARE_ENDPOINT']
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
