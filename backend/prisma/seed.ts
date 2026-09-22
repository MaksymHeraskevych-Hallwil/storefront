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

// Так само ідемпотентно: якщо тікети вже є — виходимо. Прив'язуємось
// до тих самих покупців, що й seedOrders(), щоб не плодити зайвих Customer.
async function seedTickets() {
  const existingTickets = await prisma.ticket.count()
  if (existingTickets > 0) return

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

  await prisma.ticket.create({
    data: {
      customerId: olena.id,
      subject: 'Коли приїде замовлення?',
      status: 'OPEN',
      messages: {
        create: [
          { authorType: 'CUSTOMER', body: 'Доброго дня! Підкажіть, будь ласка, статус мого замовлення.' },
        ],
      },
    },
  })

  await prisma.ticket.create({
    data: {
      customerId: ivan.id,
      subject: 'Не працює промокод',
      status: 'PENDING_CUSTOMER',
      messages: {
        create: [
          { authorType: 'CUSTOMER', body: 'Промокод SALE10 видає помилку при оформленні.' },
          { authorType: 'STAFF', body: 'Перевірили — промокод уже застосований до вашого акаунта. Спробуйте ще раз, будь ласка.' },
        ],
      },
    },
  })

  await prisma.ticket.create({
    data: {
      customerId: olena.id,
      subject: 'Дякую за швидку доставку',
      status: 'CLOSED',
      messages: {
        create: [
          { authorType: 'CUSTOMER', body: 'Все прийшло вчасно, дякую!' },
          { authorType: 'STAFF', body: 'Раді були допомогти! Гарного дня.' },
        ],
      },
    },
  })

  console.log('Готово: 3 тестові тікети (OPEN / PENDING_CUSTOMER / CLOSED)')
}

async function main() {
  await seedAdmin()
  await seedOrders()
  await seedTickets()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
