import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins/email-otp'

import { db } from '../db/index.js'
import { schema } from '../db/schema.js'
import { sendAuthOtpEmail } from '../email/auth-email.js'
import { env } from './env.js'

export const auth = betterAuth({
  appName: 'Kerning',
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/v1/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.TRUSTED_ORIGINS,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      expiresIn: 10 * 60,
      otpLength: 6,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      storeOTP: 'hashed',
      async sendVerificationOTP({ email, otp, type }) {
        await sendAuthOtpEmail({ email, otp, type })
      },
    }),
  ],
})

export type AuthSession = typeof auth.$Infer.Session
