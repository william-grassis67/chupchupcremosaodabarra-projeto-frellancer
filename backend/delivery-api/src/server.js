require('dotenv').config();

const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await prisma.$connect();
    console.log('Connected to the database.');

    const server = app.listen(PORT, () => {
      console.log(`Delivery API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server closed and database disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start the server:', err);
    process.exit(1);
  }
}

start();
