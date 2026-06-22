import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import { env } from '../lib/env.js'
import { schema } from './schema.js'

const { Pool } = pg

export const pool = new Pool({ connectionString: env.DATABASE_URL })

export const db = drizzle(pool, { schema })
