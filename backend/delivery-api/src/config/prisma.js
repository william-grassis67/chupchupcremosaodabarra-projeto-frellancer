const { PrismaClient } = require('@prisma/client');

// Single shared Prisma Client instance across the whole app.
// Avoids exhausting DB connections by creating a new client per request.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
