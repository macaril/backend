'use strict';

const modelHandler = require('../handlers/modelHandler');

module.exports = [
  {
    method: 'GET',
    path: '/api/health',
    handler: (request, h) => {
      const modelStatus = modelHandler.getModelStatus();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        models: modelStatus,
        uptime: process.uptime()
      };
    }
  }
];