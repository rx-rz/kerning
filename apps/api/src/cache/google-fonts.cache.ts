import type { GoogleFontCatalogItem } from '@kerning/shared'

import { ensureRedisConnected, redisClient } from '../lib/redis.js'
import { env } from '../lib/env.js'

export const GoogleFontsCacheKeys = {
  catalog: 'google-fonts:catalog',
  search: ({
    q,
    category,
    limit,
  }: {
    q: string
    category?: string
    limit: number
  }) => `google-fonts:search:${q}:${category ?? ''}:${limit}`,
}

const safeCall = async <T>(op: string, action: () => Promise<T>) => {
  try {
    await ensureRedisConnected()
    return await action()
  } catch (err) {
    console.error(
      `[Redis Error] ${op}:`,
      err instanceof Error ? err.message : String(err)
    )
    return null
  }
}

const parseJson = <T>(value: string | null) => {
  if (!value) return null
  return JSON.parse(value) as T
}

export const GoogleFontsCache = {
  async getCatalog() {
    const raw = await safeCall<string | null>(
      'google-fonts:getCatalog',
      () => redisClient.get(GoogleFontsCacheKeys.catalog)
    )

    return parseJson<GoogleFontCatalogItem[]>(raw)
  },

  async setCatalog(fonts: GoogleFontCatalogItem[]) {
    await safeCall(
      'google-fonts:setCatalog',
      () => redisClient.setex(
        GoogleFontsCacheKeys.catalog,
        env.GOOGLE_FONTS_CACHE_TTL_SECONDS,
        JSON.stringify(fonts)
      )
    )
  },

  async getSearch(input: { q: string; category?: string; limit: number }) {
    const raw = await safeCall<string | null>(
      'google-fonts:getSearch',
      () => redisClient.get(GoogleFontsCacheKeys.search(input))
    )

    return parseJson<GoogleFontCatalogItem[]>(raw)
  },

  async setSearch(
    input: { q: string; category?: string; limit: number },
    fonts: GoogleFontCatalogItem[]
  ) {
    await safeCall(
      'google-fonts:setSearch',
      () => redisClient.setex(
        GoogleFontsCacheKeys.search(input),
        env.GOOGLE_FONTS_CACHE_TTL_SECONDS,
        JSON.stringify(fonts)
      )
    )
  },
}
