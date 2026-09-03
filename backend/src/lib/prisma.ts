import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7 більше не приймає connection string напряму в PrismaClient —
// рантайм-з'єднання йде через driver adapter (тут: node-postgres).
// Один інстанс на застосунок, як і в my-express-app.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

const prisma = new PrismaClient({ adapter })

export default prisma
