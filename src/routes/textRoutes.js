'use strict';

const Boom = require('@hapi/boom');
const Joi = require('joi');
const modelHandler = require('../handlers/modelHandler');
const logger = require('../utils/logger');

module.exports = [
  {
    method: 'POST',
    path: '/api/text-to-sign',
    options: {
      validate: {
        payload: Joi.object({
          text: Joi.string().required()
        })
      },
      handler: async (request, h) => {
        try {
          const { text } = request.payload;
          
          if (!text) {
            return Boom.badRequest('No text provided');
          }
          
          // Process text to sign using the model handler
          const result = modelHandler.textToSign(text);
          
          logger.info('Text to sign conversion', {
            text: text,
            wordCount: result.signs.length
          });
          
          return {
            success: true,
            ...result
          };
        } catch (error) {
          logger.error('Error in text to sign conversion', error);
          return Boom.badImplementation('Error processing the request');
        }
      }
    }
  }
];