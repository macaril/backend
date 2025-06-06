'use strict';

const Boom = require('@hapi/boom');
const config = require('../config');
const modelHandler = require('../handlers/modelHandler');
const logger = require('../utils/logger');

module.exports = [
  {
    method: 'POST',
    path: '/api/predict-static-sign',
    options: {
      payload: {
        output: 'data',
        parse: true,
        allow: 'application/json',
      },
      handler: async (request, h) => {
        try {
          const payload = request.payload;
          
          if (!payload || !payload.landmarks) {
            return Boom.badRequest('No landmarks data provided');
          }
          
          // Log untuk debugging
          logger.info(`Received landmarks with ${payload.landmarks.length} elements`);
          
          // Panggil fungsi prediksi (yang sekarang adalah implementasi dummy)
          const result = await modelHandler.predictStaticSign(payload.landmarks);
          
          return {
            success: true,
            result: result
          };
        } catch (error) {
          logger.error('Error in static sign prediction:', error);
          // Selalu kembalikan respons sukses dengan data dummy untuk testing
          return {
            success: true,
            error: error.message,
            result: {
              class: "A",
              confidence: 0.9,
              index: 0
            }
          };
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/predict-static-sign-form',
    options: {
      payload: {
        output: 'data',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
      },
      handler: async (request, h) => {
        try {
          const payload = request.payload;
          
          if (!payload || !payload.landmarks) {
            return Boom.badRequest('No landmarks data provided');
          }
          
          // Parse landmarks from form data
          let landmarks;
          try {
            landmarks = JSON.parse(payload.landmarks);
          } catch (error) {
            return Boom.badRequest('Invalid landmarks data format: ' + error.message);
          }
          
          // Make prediction
          const result = await modelHandler.predictStaticSign(landmarks);
          
          return {
            success: true,
            result: result
          };
        } catch (error) {
          logger.error('Error in static sign prediction:', error);
          return Boom.badImplementation('Error processing the request: ' + error.message);
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/available-letters',
    handler: (request, h) => {
      try {
        const availableLetters = modelHandler.getAvailableLetters();
        
        return {
          success: true,
          count: availableLetters.length,
          letters: availableLetters
        };
      } catch (error) {
        logger.error('Error fetching available letters:', error);
        return Boom.badImplementation('Error processing the request');
      }
    }
  }
];