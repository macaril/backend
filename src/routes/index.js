'use strict';

// Import all route modules
const healthRoutes = require('./healthRoutes');
const staticSignRoutes = require('./staticSignRoutes');
const dynamicSignRoutes = require('./dynamicSignRoutes');
const textRoutes = require('./textRoutes');
const uploadRoutes = require('./uploadRoutes');
const testRoutes = require('./testRoutes');
const simplifiedRoutes = require('./simplifiedRoutes');
const realtimeRoutes = require('./realtimeRoutes');

// Root route
const rootRoute = {
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return { message: 'Artisign BISINDO Translator API' };
  }
};

// Static files route
const staticFilesRoute = {
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true
    }
  }
};

// Model files route for client-side model loading
const modelFilesRoute = {
  method: 'GET',
  path: '/models/{param*}',
  handler: {
    directory: {
      path: '../models',
      redirectToSlash: true
    }
  }
};

// Combine all routes
module.exports = [
  rootRoute,
  staticFilesRoute,
  modelFilesRoute,
  ...healthRoutes,
  ...staticSignRoutes,
  ...dynamicSignRoutes,
  ...textRoutes,
  ...uploadRoutes,
  ...testRoutes,
  ...simplifiedRoutes,
  ...realtimeRoutes
];