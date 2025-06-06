'use strict';

module.exports = [
  {
    method: 'POST',
    path: '/api/test-predict',
    handler: (request, h) => {
      return {
        success: true,
        result: {
          class: "A",
          confidence: 0.95,
          index: 0
        }
      };
    }
  },
  {
    method: 'POST', 
    path: '/api/test-dynamic',
    handler: (request, h) => {
      return {
        success: true,
        result: {
          class: "Halo",
          confidence: 0.92,
          index: 11,
          modelUsed: "transformer"
        }
      };
    }
  }
];