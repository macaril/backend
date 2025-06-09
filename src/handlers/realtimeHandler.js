'use strict';

const modelHandler = require('./modelHandler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Global server reference
let server = null;

// User sessions storage
const userSessions = new Map();

/**
 * Session object structure
 * @typedef {Object} UserSession
 * @property {Array} staticBuffer - Buffer untuk static signs (huruf)
 * @property {Array} dynamicBuffer - Buffer untuk dynamic signs (kata)
 * @property {string} lastLetter - Huruf terakhir yang diprediksi
 * @property {string} lastWord - Kata terakhir yang diprediksi
 * @property {string} currentWord - Kata yang sedang dibangun dari huruf
 * @property {string} fullText - Teks lengkap dari semua prediksi
 * @property {number} stableFrames - Jumlah frame stabil berturut-turut
 * @property {boolean} isInMotion - Apakah tangan sedang bergerak
 * @property {number} lastActivity - Timestamp aktivitas terakhir
 */

/**
 * Initialize realtime handler with server instance
 * @param {Object} serverInstance - Hapi server instance
 */
function init(serverInstance) {
  server = serverInstance;
  
  // Start cleanup job for inactive sessions
  setInterval(cleanupInactiveSessions, 30 * 60 * 1000); // Run every 30 minutes
  
  logger.info('Realtime handler initialized');
}

/**
 * Create a new user session
 * @param {string} userId - User ID
 * @returns {UserSession} New user session object
 */
function createUserSession(userId) {
  const session = {
    userId,
    staticBuffer: [],
    dynamicBuffer: [],
    lastLetter: null,
    lastWord: null,
    currentWord: '',
    fullText: '',
    stableFrames: 0,
    isInMotion: false,
    lastActivity: Date.now()
  };
  
  userSessions.set(userId, session);
  logger.info(`New user session created: ${userId}`);
  
  return session;
}

/**
 * Get or create user session
 * @param {string} userId - User ID
 * @returns {UserSession} User session object
 */
function getSession(userId) {
  if (!userSessions.has(userId)) {
    return createUserSession(userId);
  }
  
  const session = userSessions.get(userId);
  session.lastActivity = Date.now();
  return session;
}

/**
 * Clean up inactive sessions
 */
function cleanupInactiveSessions() {
  const now = Date.now();
  const inactiveThreshold = config.realtime.sessionTimeout || 60 * 60 * 1000; // 1 hour default
  
  for (const [userId, session] of userSessions.entries()) {
    if (now - session.lastActivity > inactiveThreshold) {
      userSessions.delete(userId);
      logger.info(`Cleaned up inactive session: ${userId}`);
    }
  }
}

/**
 * Reset session buffers
 * @param {UserSession} session - User session
 */
function resetBuffers(session) {
  session.staticBuffer = [];
  session.dynamicBuffer = [];
  session.stableFrames = 0;
}

/**
 * Detect if landmarks are stable enough for static sign prediction
 * @param {UserSession} session - User session
 * @param {Array} landmarks - Current landmarks
 * @returns {boolean} True if stable
 */
function isStablePose(session, landmarks) {
  // If buffer is empty, cannot compare
  if (session.staticBuffer.length === 0) {
    session.staticBuffer.push(landmarks);
    return false;
  }
  
  // Compare with last frame
  const lastLandmarks = session.staticBuffer[session.staticBuffer.length - 1];
  let diffSum = 0;
  
  // Calculate average movement
  for (let i = 0; i < landmarks.length && i < lastLandmarks.length; i++) {
    diffSum += Math.abs(landmarks[i] - lastLandmarks[i]);
  }
  
  const avgDiff = diffSum / landmarks.length;
  
  // Update buffer
  session.staticBuffer.push(landmarks);
  if (session.staticBuffer.length > 10) { // Keep only last 10 frames
    session.staticBuffer.shift();
  }
  
  // Check if stable
  const isStable = avgDiff < (config.realtime.movementThreshold || 0.015); // Threshold for stability
  
  if (isStable) {
    session.stableFrames++;
  } else {
    session.stableFrames = 0;
  }
  
  // Return true if stable for at least 5 frames
  return session.stableFrames >= (config.realtime.stableFrameThreshold || 5);
}

/**
 * Detect if user is making a dynamic sign
 * @param {UserSession} session - User session
 * @param {Array} landmarks - Current landmarks
 * @returns {Object} Status object {isStarting, isEnding}
 */
function detectDynamicSign(session, landmarks) {
  // If buffer is empty, cannot compare
  if (session.dynamicBuffer.length === 0) {
    session.dynamicBuffer.push(landmarks);
    return { isStarting: false, isEnding: false };
  }
  
  // Compare with last frame
  const lastLandmarks = session.dynamicBuffer[session.dynamicBuffer.length - 1];
  let diffSum = 0;
  
  // Calculate average movement
  for (let i = 0; i < landmarks.length && i < lastLandmarks.length; i++) {
    diffSum += Math.abs(landmarks[i] - lastLandmarks[i]);
  }
  
  const avgDiff = diffSum / landmarks.length;
  
  // Update buffer
  session.dynamicBuffer.push(landmarks);
  if (session.dynamicBuffer.length > 30) { // Keep at most 30 frames (1 second at 30fps)
    session.dynamicBuffer.shift();
  }
  
  // Detect motion start and end
  const movementThreshold = config.realtime.movementThreshold || 0.03; // Threshold for significant movement
  const isMoving = avgDiff > movementThreshold;
  
  const wasInMotion = session.isInMotion;
  session.isInMotion = isMoving;
  
  return {
    isStarting: isMoving && !wasInMotion,
    isEnding: !isMoving && wasInMotion && session.dynamicBuffer.length > (config.realtime.minSequenceFrames || 15) // At least 15 frames of motion
  };
}

/**
 * Add letter to current word
 * @param {UserSession} session - User session
 * @param {string} letter - Letter to add
 */
function addLetterToWord(session, letter) {
  // Don't add the same letter consecutively
  if (letter === session.lastLetter) {
    return;
  }
  
  session.lastLetter = letter;
  session.currentWord += letter;
  
  // Publish update
  publishUpdate(session.userId, {
    type: 'letter',
    letter: letter,
    currentWord: session.currentWord,
    fullText: session.fullText
  });
}

/**
 * Complete word and add to text
 * @param {UserSession} session - User session
 * @param {string} word - Word to add (optional, uses currentWord if not provided)
 */
function completeWord(session, word = null) {
  const wordToAdd = word || session.currentWord;
  
  if (!wordToAdd) {
    return;
  }
  
  if (session.fullText.length > 0) {
    session.fullText += ' ';
  }
  
  session.fullText += wordToAdd;
  session.lastWord = wordToAdd;
  session.currentWord = '';
  
  // Publish update
  publishUpdate(session.userId, {
    type: 'word',
    word: wordToAdd,
    fullText: session.fullText
  });
}

/**
 * Publish update to client via WebSocket
 * @param {string} userId - User ID
 * @param {Object} update - Update data
 */
function publishUpdate(userId, update) {
  if (!server) {
    logger.error('Server not initialized for realtime updates');
    return;
  }
  
  server.publish(`/realtime/sign/${userId}`, {
    timestamp: Date.now(),
    ...update
  });
}

/**
 * Process landmarks for realtime prediction
 * @param {string} userId - User ID
 * @param {Array} landmarks - Hand landmarks
 */
async function processLandmarks(userId, landmarks) {
  try {
    const session = getSession(userId);
    
    // Check if this is a stable pose for static sign (letter)
    if (isStablePose(session, landmarks)) {
      const result = await modelHandler.predictStaticSign(landmarks);
      
      if (result && result.confidence > (config.realtime.confidenceThreshold || 0.7)) {
        addLetterToWord(session, result.class);
      }
    }
    
    // Check for dynamic sign (word)
    const dynamicStatus = detectDynamicSign(session, landmarks);
    
    if (dynamicStatus.isEnding) {
      // End of motion, predict dynamic sign
      const result = await modelHandler.predictDynamicSign(session.dynamicBuffer);
      
      if (result && result.confidence > (config.realtime.confidenceThreshold || 0.7)) {
        completeWord(session, result.class);
      }
      
      // Reset dynamic buffer after prediction
      session.dynamicBuffer = [];
    }
    
    return {
      success: true,
      sessionId: userId
    };
  } catch (error) {
    logger.error('Error processing landmarks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process a complete landmark sequence for word detection
 * @param {string} userId - User ID
 * @param {Array} landmarkSequence - Sequence of landmarks
 * @param {string} modelChoice - Model choice (lstm or transformer)
 */
async function processLandmarkSequence(userId, landmarkSequence, modelChoice = 'transformer') {
  try {
    const session = getSession(userId);
    
    // Predict word directly
    const result = await modelHandler.predictDynamicSign(landmarkSequence, modelChoice);
    
    if (result && result.confidence > (config.realtime.confidenceThreshold || 0.7)) {
      completeWord(session, result.class);
    }
    
    return {
      success: true,
      sessionId: userId,
      result: result
    };
  } catch (error) {
    logger.error('Error processing landmark sequence:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a new session or reset existing one
 * @param {string} userId - User ID (optional)
 * @returns {Object} Session info
 */
function createSession(userId = null) {
  const sessionId = userId || uuidv4();
  const session = createUserSession(sessionId);
  
  return {
    success: true,
    sessionId: sessionId
  };
}

/**
 * End session and return final results
 * @param {string} userId - User ID
 * @returns {Object} Final results
 */
function endSession(userId) {
  if (!userSessions.has(userId)) {
    return {
      success: false,
      error: 'Session not found'
    };
  }
  
  const session = userSessions.get(userId);
  
  // Complete current word if any
  if (session.currentWord) {
    completeWord(session);
  }
  
  const result = {
    success: true,
    fullText: session.fullText,
    sessionId: userId
  };
  
  // Clean up session
  userSessions.delete(userId);
  
  return result;
}

/**
 * Get current session status
 * @param {string} userId - User ID
 * @returns {Object} Session status
 */
function getSessionStatus(userId) {
  if (!userSessions.has(userId)) {
    return {
      success: false,
      error: 'Session not found'
    };
  }
  
  const session = userSessions.get(userId);
  
  return {
    success: true,
    sessionId: userId,
    currentWord: session.currentWord,
    fullText: session.fullText,
    lastLetter: session.lastLetter,
    lastWord: session.lastWord
  };
}

/**
 * Correct prediction
 * @param {string} userId - User ID
 * @param {string} correctionType - Type of correction (letter, word, clearWord, clearText)
 * @param {string} correction - Correction value
 * @returns {Object} Updated session status
 */
function correctPrediction(userId, correctionType, correction) {
  if (!userSessions.has(userId)) {
    return {
      success: false,
      error: 'Session not found'
    };
  }
  
  const session = userSessions.get(userId);
  
  if (correctionType === 'letter') {
    // Replace last letter
    if (session.currentWord.length > 0) {
      session.currentWord = session.currentWord.slice(0, -1) + correction;
    }
  } else if (correctionType === 'word') {
    // Replace last word
    if (session.fullText.includes(' ')) {
      const words = session.fullText.split(' ');
      words.pop();
      words.push(correction);
      session.fullText = words.join(' ');
    } else {
      session.fullText = correction;
    }
  } else if (correctionType === 'clearWord') {
    session.currentWord = '';
  } else if (correctionType === 'clearText') {
    session.fullText = '';
    session.currentWord = '';
  }
  
  // Publish update
  publishUpdate(userId, {
    type: 'correction',
    currentWord: session.currentWord,
    fullText: session.fullText
  });
  
  return {
    success: true,
    currentWord: session.currentWord,
    fullText: session.fullText
  };
}

module.exports = {
  init,
  processLandmarks,
  processLandmarkSequence,
  createSession,
  endSession,
  getSessionStatus,
  correctPrediction
};