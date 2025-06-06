'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Path = require('path');
const Fs = require('fs');

// Import modules
const config = require('./config');
const routes = require('./routes');
const logger = require('./utils/logger');
const modelHandler = require('./handlers/modelHandler');

// Create directories if they don't exist
[
  config.directories.uploads,
  config.directories.temp,
  config.directories.public,
  config.models.directory
].forEach(dir => {
  if (!Fs.existsSync(dir)) {
    Fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize the server
const init = async () => {
  // Create Hapi server
  const server = Hapi.server({
    port: config.server.port,
    host: config.server.host,
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Accept', 'Content-Type'],
        additionalHeaders: ['X-Requested-With']
      },
      files: {
        relativeTo: config.directories.public
      }
    }
  });

  // Register plugins
  await server.register([
    Inert
  ]);

  // Register routes
  server.route(routes);

  // Error handling
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    
    if (!response.isBoom) {
      return h.continue;
    }
    
    // Log error
    logger.error(`API Error: ${response.output.statusCode}`, {
      error: response.output.payload,
      path: request.path,
      method: request.method
    });
    
    // Continue with the error response
    return h.continue;
  });

  // Start the server
  await server.start();
  
  // Load models after server start
  try {
    const modelStatus = await modelHandler.loadModels();
    logger.info('Models loaded', modelStatus);
  } catch (error) {
    logger.error('Error loading models:', error);
  }
  
  return server;
};

module.exports = {
  init
};