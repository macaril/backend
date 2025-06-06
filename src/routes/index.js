'use strict';

// Import all route modules
const healthRoutes = require('./healthRoutes');
const staticSignRoutes = require('./staticSignRoutes');
const dynamicSignRoutes = require('./dynamicSignRoutes');
const textRoutes = require('./textRoutes');
const uploadRoutes = require('./uploadRoutes');
const testRoutes = require('./testRoutes');
const simplifiedRoutes = require('./simplifiedRoutes'); // Pastikan ini ada

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

// Combine all routes
module.exports = [
  rootRoute,
  staticFilesRoute,
  ...healthRoutes,
  ...staticSignRoutes,
  ...dynamicSignRoutes,
  ...textRoutes,
  ...uploadRoutes,
  ...testRoutes,
  ...simplifiedRoutes // Pastikan ini ada
];