import { Resend } from 'resend'

import { env } from '../lib/env.js'

const resend = new Resend(env.RESEND_API_KEY)

type AuthEmailType =
  | 'sign-in'
  | 'email-verification'
  | 'forget-password'
  | 'change-email'

const subjects: Record<AuthEmailType, string> = {
  'sign-in': 'Your Kerning sign-in code',
  'email-verification': 'Verify your Kerning email',
  'forget-password': 'Reset your Kerning password',
  'change-email': 'Confirm your Kerning email change',
}

const descriptions: Record<AuthEmailType, string> = {
  'sign-in': 'Use this code to finish signing in to Kerning.',
  'email-verification': 'Use this code to verify your email for Kerning.',
  'forget-password': 'Use this code to reset your Kerning password.',
  'change-email': 'Use this code to confirm your new Kerning email address.',
}

const otpHtml = (otp: string, type: AuthEmailType) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subjects[type]}</title>
  </head>
  <body style="margin:0;background:#f6f3ee;font-family:Arial,sans-serif;color:#171717;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e6e0d8;border-radius:8px;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 20px;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#6f675d;">Kerning</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#171717;">${subjects[type]}</h1>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.55;color:#4a443d;">${descriptions[type]}</p>
                <p style="margin:0 0 28px;font-size:36px;line-height:1;letter-spacing:0.16em;font-weight:700;color:#171717;">${otp}</p>
                <p style="margin:0;font-size:14px;line-height:1.5;color:#6f675d;">This code expires shortly. If you did not request it, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

export const sendAuthOtpEmail = async ({
  email,
  otp,
  type,
}: {
  email: string
  otp: string
  type: AuthEmailType
}) => {
  await resend.emails.send({
    from: env.AUTH_EMAIL_FROM,
    to: email,
    subject: subjects[type],
    html: otpHtml(otp, type),
    text: `${descriptions[type]}\n\n${otp}\n\nThis code expires shortly.`,
  })
}
