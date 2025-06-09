'use strict';

const Boom = require('@hapi/boom');
const config = require('../config');
const realtimeHandler = require('../handlers/realtimeHandler');
const logger = require('../utils/logger');

module.exports = [
  {
    method: 'POST',
    path: '/api/realtime/session/create',
    options: {
      handler: async (request, h) => {
        try {
          const userId = request.payload?.userId || null;
          const result = realtimeHandler.createSession(userId);
          
          return result;
        } catch (error) {
          logger.error('Error creating realtime session:', error);
          return Boom.badImplementation('Error creating session: ' + error.message);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/realtime/session/end',
    options: {
      handler: async (request, h) => {
        try {
          const { sessionId } = request.payload;
          
          if (!sessionId) {
            return Boom.badRequest('Session ID is required');
          }
          
          const result = realtimeHandler.endSession(sessionId);
          return result;
        } catch (error) {
          logger.error('Error ending realtime session:', error);
          return Boom.badImplementation('Error ending session: ' + error.message);
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/realtime/session/{sessionId}/status',
    options: {
      handler: async (request, h) => {
        try {
          const { sessionId } = request.params;
          
          if (!sessionId) {
            return Boom.badRequest('Session ID is required');
          }
          
          const result = realtimeHandler.getSessionStatus(sessionId);
          return result;
        } catch (error) {
          logger.error('Error getting session status:', error);
          return Boom.badImplementation('Error getting session status: ' + error.message);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/realtime/landmarks',
    options: {
      payload: {
        output: 'data',
        parse: true,
        allow: 'application/json',
        maxBytes: 1024 * 1024 * 2 // 2MB limit for landmark data
      },
      handler: async (request, h) => {
        try {
          const { sessionId, landmarks } = request.payload;
          
          if (!sessionId || !landmarks) {
            return Boom.badRequest('Session ID and landmarks are required');
          }
          
          if (!Array.isArray(landmarks)) {
            return Boom.badRequest('Landmarks must be an array');
          }
          
          const result = await realtimeHandler.processLandmarks(sessionId, landmarks);
          return result;
        } catch (error) {
          logger.error('Error processing realtime landmarks:', error);
          return Boom.badImplementation('Error processing landmarks: ' + error.message);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/realtime/landmark-sequence',
    options: {
      payload: {
        output: 'data',
        parse: true,
        allow: 'application/json',
        maxBytes: 1024 * 1024 * 10 // 10MB limit for sequence data
      },
      handler: async (request, h) => {
        try {
          const { sessionId, landmarkSequence, modelChoice } = request.payload;
          
          if (!sessionId || !landmarkSequence) {
            return Boom.badRequest('Session ID and landmark sequence are required');
          }
          
          if (!Array.isArray(landmarkSequence)) {
            return Boom.badRequest('Landmark sequence must be an array');
          }
          
          // Process landmark sequence for dynamic sign detection
          const result = await realtimeHandler.processLandmarkSequence(sessionId, landmarkSequence, modelChoice);
          return result;
        } catch (error) {
          logger.error('Error processing realtime landmark sequence:', error);
          return Boom.badImplementation('Error processing landmark sequence: ' + error.message);
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/realtime/correction',
    options: {
      handler: async (request, h) => {
        try {
          const { sessionId, correctionType, correction } = request.payload;
          
          if (!sessionId || !correctionType || !correction) {
            return Boom.badRequest('Session ID, correction type, and correction are required');
          }
          
          const result = realtimeHandler.correctPrediction(sessionId, correctionType, correction);
          return result;
        } catch (error) {
          logger.error('Error processing correction:', error);
          return Boom.badImplementation('Error processing correction: ' + error.message);
        }
      }
    }
  }
];