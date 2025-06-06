'use strict';

const Boom = require('@hapi/boom');
const Path = require('path');
const Fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const uploadHandler = require('../handlers/uploadHandler');
const logger = require('../utils/logger');

module.exports = [
  {
    method: 'POST',
    path: '/api/upload',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: config.uploads.maxFileSize
      },
      handler: async (request, h) => {
        try {
          const data = request.payload;
          
          if (!data.file) {
            return Boom.badRequest('No file uploaded');
          }
          
          const file = data.file;
          const fileType = data.fileType || 'unknown';
          
          // Handle file upload
          const uploadResult = await uploadHandler.handleFileUpload(file, fileType);
          
          logger.info('File uploaded', {
            filename: uploadResult.filename,
            originalName: uploadResult.originalName,
            type: uploadResult.type
          });
          
          return {
            success: true,
            ...uploadResult
          };
        } catch (error) {
          logger.error('Error uploading file', error);
          return Boom.badImplementation('Error processing the request');
        }
      }
    }
  }
];