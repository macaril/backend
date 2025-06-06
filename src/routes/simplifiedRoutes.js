'use strict';

module.exports = [
  {
    method: 'POST',
    path: '/api/simple-static-sign',
    handler: (request, h) => {
      const payload = request.payload || {};
      const landmarks = payload.landmarks || [];
      
      return {
        success: true,
        payload_received: { landmarks: landmarks.length > 10 ? landmarks.slice(0, 10).concat(['...']) : landmarks },
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
    path: '/api/simple-dynamic-sign',
    handler: (request, h) => {
      const payload = request.payload || {};
      const sequence = payload.landmarkSequence || [];
      
      return {
        success: true,
        payload_received: { 
          landmarkSequence: sequence.length > 0 ? 
            [sequence[0].length > 10 ? sequence[0].slice(0, 10).concat(['...']) : sequence[0], '...'] : 
            [] 
        },
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