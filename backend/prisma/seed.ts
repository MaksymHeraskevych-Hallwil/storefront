import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../src/lib/prisma'

const ADMIN_EMAIL = 'admin@storefront.dev'
const ADMIN_PASSWORD = 'admin12345' // тільки для локальної розробки

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      name: 'Admin',
    },
  })

  console.log(`Готово: ${admin.email} / ${ADMIN_PASSWORD} (role: ${admin.role})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
