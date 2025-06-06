'use strict';

// Entry point untuk aplikasi
const server = require('./server');
const logger = require('./utils/logger');

// Mulai server
const startServer = async () => {
  try {
    const app = await server.init();
    logger.info(`Server berjalan di ${app.info.uri}`);
  } catch (err) {
    logger.error('Gagal menjalankan server:', err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection:', err);
  process.exit(1);
});

// Mulai server
startServer();