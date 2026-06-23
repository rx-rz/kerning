import { GoogleFontSearchInputSchema } from '@kerning/shared'
import { Hono } from 'hono'

import { HttpStatus } from '../../lib/http-status-codes.js'
import { parseValue } from '../../lib/http.js'
import { searchGoogleFontsService } from './google-fonts.services.js'

export const googleFontsRoutes = new Hono()

googleFontsRoutes.get('/google-fonts', async (c) => {
  const input = parseValue(GoogleFontSearchInputSchema, {
    q: c.req.query('q') ?? '',
    category: c.req.query('category') || undefined,
    limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined,
  })

  try {
    const data = await searchGoogleFontsService({ input })
    return c.json({ status: 'success', data })
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === 'GOOGLE_FONTS_API_KEY is not configured'
    ) {
      return c.json(
        {
          status: 'error',
          message: err.message,
        },
        HttpStatus.ServiceUnavailable
      )
    }

    throw err
  }
})
