/**
 * Юніт-тести. Жодної реальної бази — Prisma тут не використовується
 * взагалі, тому тести швидкі й запускаються без docker compose.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  clearMocks: true,
}
