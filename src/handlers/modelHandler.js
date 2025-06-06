'use strict';

const logger = require('../utils/logger');

// Dummy data for class mappings
const imageClassMapping = {
  "0": "A", "1": "B", "2": "C", "3": "D", "4": "E", "5": "F", "6": "G", "7": "H",
  "8": "I", "9": "J", "10": "K", "11": "L", "12": "M", "13": "N", "14": "O", "15": "P",
  "16": "Q", "17": "R", "18": "S", "19": "T", "20": "U", "21": "V", "22": "W", "23": "X",
  "24": "Y", "25": "Z"
};

const videoClassMapping = {
  "0": "Apa", "1": "Apa Kabar", "2": "Bagaimana", "3": "Baik", "4": "Belajar", "5": "Berapa",
  "6": "Berdiri", "7": "Bingung", "8": "Dia", "9": "Dimana", "10": "Duduk", "11": "Halo"
};

/**
 * Load all models and class mappings
 * @returns {Promise<Object>} Status of loaded models
 */
async function loadModels() {
  logger.info('Using pure dummy models (no TensorFlow)');
  
  return {
    landmarkModel: true,
    videoLstmModel: true,
    videoTransformerModel: true,
    imageClassMapping: true,
    videoClassMapping: true
  };
}

/**
 * Predict static sign (letter) from landmarks - Pure dummy implementation
 * @param {Array} landmarks - Flattened array of hand landmarks
 * @returns {Promise<Object>} Prediction result
 */
async function predictStaticSign(landmarks) {
  try {
    logger.info(`Received landmarks array with ${landmarks?.length || 0} elements`);
    
    // Always return A with high confidence
    return {
      class: "A",
      confidence: 0.95,
      index: 0
    };
  } catch (error) {
    logger.error('Error in predictStaticSign:', error);
    return {
      class: "A",
      confidence: 0.8,
      index: 0,
      error: error.message
    };
  }
}

/**
 * Predict dynamic sign (word) from landmark sequence - Pure dummy implementation
 * @param {Array} landmarkSequence - Array of landmark arrays
 * @param {string} modelChoice - 'lstm' or 'transformer'
 * @returns {Promise<Object>} Prediction result
 */
async function predictDynamicSign(landmarkSequence, modelChoice = 'transformer') {
  try {
    logger.info(`Received landmark sequence with ${landmarkSequence?.length || 0} frames`);
    
    // Always return Halo with high confidence
    return {
      class: "Halo",
      confidence: 0.92,
      index: 11,
      modelUsed: modelChoice
    };
  } catch (error) {
    logger.error('Error in predictDynamicSign:', error);
    return {
      class: "Halo",
      confidence: 0.8,
      index: 11,
      modelUsed: modelChoice,
      error: error.message
    };
  }
}

/**
 * Convert text to sign language
 * @param {string} text - Input text
 * @returns {Object} Sign language representation
 */
function textToSign(text) {
  if (!text) {
    throw new Error('No text provided');
  }
  
  const words = text.trim().toLowerCase().split(/\s+/);
  const result = [];
  
  for (const word of words) {
    if (word === 'halo') {
      result.push({
        type: 'word',
        original: word,
        mapped: 'Halo',
        knownInDataset: true
      });
    } else {
      const letters = [];
      
      for (const letter of word) {
        letters.push({
          letter: letter,
          mapped: letter.toUpperCase(),
          exists: true
        });
      }
      
      result.push({
        type: 'fingerspell',
        original: word,
        letters: letters
      });
    }
  }
  
  return {
    text: text,
    signs: result
  };
}

/**
 * Get available words from the vocabulary
 * @returns {Array} List of available words
 */
function getAvailableWords() {
  return Object.entries(videoClassMapping).map(([key, value]) => ({
    id: key,
    word: value
  }));
}

/**
 * Get available letters from the vocabulary
 * @returns {Array} List of available letters
 */
function getAvailableLetters() {
  return Object.entries(imageClassMapping).map(([key, value]) => ({
    id: key,
    letter: value
  }));
}

/**
 * Get model status
 * @returns {Object} Status of loaded models
 */
function getModelStatus() {
  return {
    landmarkModel: true,
    videoLstmModel: true,
    videoTransformerModel: true,
    imageClassMapping: true,
    videoClassMapping: true
  };
}

module.exports = {
  loadModels,
  predictStaticSign,
  predictDynamicSign,
  textToSign,
  getAvailableWords,
  getAvailableLetters,
  getModelStatus
};