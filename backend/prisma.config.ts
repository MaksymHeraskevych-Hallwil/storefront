import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7: конекшн-стрінг для `prisma migrate` / `prisma db` живе тут,
// окремо від рантайм-клієнта (див. src/lib/prisma.ts, там свій adapter).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
