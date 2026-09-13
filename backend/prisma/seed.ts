import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../src/lib/prisma'

const ADMIN_EMAIL = 'admin@storefront.dev'
const ADMIN_PASSWORD = 'admin12345' // тільки для локальної розробки

async function seedAdmin() {
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

// Ідемпотентно лише в сенсі "не плодити дублі при повторному запуску" —
// якщо хоч одне замовлення вже є, вважаємо, що дані вже насіяні.
// Потребує хоча б одного варіанта товару; на зовсім свіжій базі (ще
// немає жодного Product) просто пропускається — це нормально.
async function seedOrders() {
  const existingOrders = await prisma.order.count()
  if (existingOrders > 0) return

  const variant = await prisma.productVariant.findFirst()
  if (!variant) {
    console.log('Пропускаю сід замовлень — ще немає жодного варіанта товару.')
    return
  }

  const [olena, ivan] = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'olena@example.com' },
      update: {},
      create: { email: 'olena@example.com', name: 'Олена Коваль', phone: '+380501234567' },
    }),
    prisma.customer.upsert({
      where: { email: 'ivan@example.com' },
      update: {},
      create: { email: 'ivan@example.com', name: 'Іван Петренко', phone: '+380671112233' },
    }),
  ])

  await prisma.order.create({
    data: {
      customerId: olena.id,
      status: 'PENDING',
      items: { create: [{ variantId: variant.id, quantity: 2, price: variant.price }] },
    },
  })

  await prisma.order.create({
    data: {
      customerId: ivan.id,
      status: 'PAID',
      items: { create: [{ variantId: variant.id, quantity: 1, price: variant.price }] },
    },
  })

  await prisma.order.create({
    data: {
      customerId: olena.id,
      status: 'FULFILLED',
      items: { create: [{ variantId: variant.id, quantity: 3, price: variant.price }] },
    },
  })

  console.log('Готово: 2 покупці, 3 тестові замовлення (PENDING / PAID / FULFILLED)')
}

async function main() {
  await seedAdmin()
  await seedOrders()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
