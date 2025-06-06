#!/bin/bash

# Script untuk memperbaiki masalah loading model di container Docker

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== ArtiSign BISINDO Model Fix Script ===${NC}"
echo "Script ini akan memperbaiki masalah loading model pada aplikasi ArtiSign BISINDO."

# Dapatkan ID container yang berjalan
CONTAINER_ID=$(docker ps -qf "ancestor=artisign-backend" || docker ps -qf "name=artisign")

if [ -z "$CONTAINER_ID" ]; then
  echo -e "${RED}Error: Tidak dapat menemukan container backend yang berjalan.${NC}"
  echo "Pastikan container Docker sudah berjalan."
  echo "Daftar container yang sedang berjalan:"
  docker ps
  exit 1
fi

echo -e "${GREEN}Menemukan container dengan ID: ${CONTAINER_ID}${NC}"

# 1. Backup modelHandler.js asli
echo -e "\n${YELLOW}Membuat backup file modelHandler.js asli...${NC}"
mkdir -p ./backup
docker cp $CONTAINER_ID:/usr/src/app/src/handlers/modelHandler.js ./backup/modelHandler.js.bak
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Backup berhasil dibuat: ./backup/modelHandler.js.bak${NC}"
else
  echo -e "${RED}Gagal membuat backup file modelHandler.js${NC}"
  exit 1
fi

# 2. Buat file modelHandler.js baru dengan perbaikan
echo -e "\n${YELLOW}Membuat file modelHandler.js baru dengan perbaikan...${NC}"
cat > ./modelHandler.js.new << 'EOF'
'use strict';

const Path = require('path');
const Fs = require('fs');
const tf = require('@tensorflow/tfjs-node');
const config = require('../config');
const logger = require('../utils/logger');

// Global variables for loaded models
let landmarkModel = null;
let videoLstmModel = null;
let videoTransformerModel = null;
let imageClassMapping = {};
let videoClassMapping = {};

/**
 * Load all models and class mappings
 * @returns {Promise<Object>} Status of loaded models
 */
async function loadModels() {
  try {
    logger.info('Loading models and class mappings...');
    
    // Ensure model directory exists
    if (!Fs.existsSync(config.models.directory)) {
      logger.warn(`Model directory does not exist, creating: ${config.models.directory}`);
      Fs.mkdirSync(config.models.directory, { recursive: true });
    }
    
    // Load class mappings
    const imageClassMappingPath = Path.join(
      config.models.directory, 
      config.models.files.imageClassMapping
    );
    
    const videoClassMappingPath = Path.join(
      config.models.directory, 
      config.models.files.videoClassMapping
    );
    
    if (Fs.existsSync(imageClassMappingPath)) {
      try {
        imageClassMapping = JSON.parse(Fs.readFileSync(imageClassMappingPath, 'utf8'));
        logger.info(`Image class mapping loaded with ${Object.keys(imageClassMapping).length} classes`);
      } catch (error) {
        logger.error('Error parsing image class mapping:', error);
      }
    } else {
      logger.warn(`Image class mapping file not found at: ${imageClassMappingPath}`);
    }
    
    if (Fs.existsSync(videoClassMappingPath)) {
      try {
        videoClassMapping = JSON.parse(Fs.readFileSync(videoClassMappingPath, 'utf8'));
        logger.info(`Video class mapping loaded with ${Object.keys(videoClassMapping).length} classes`);
      } catch (error) {
        logger.error('Error parsing video class mapping:', error);
      }
    } else {
      logger.warn(`Video class mapping file not found at: ${videoClassMappingPath}`);
    }
    
    // Load model paths and check if directories and files exist
    const landmarkModelPath = Path.join(
      config.models.directory, 
      config.models.files.landmarkModel
    );
    
    const videoLstmModelPath = Path.join(
      config.models.directory, 
      config.models.files.videoLstmModel
    );
    
    const videoTransformerModelPath = Path.join(
      config.models.directory, 
      config.models.files.videoTransformerModel
    );
    
    logger.info('Checking model files and directories...');
    logger.info(`Landmark model path: ${landmarkModelPath}`);
    logger.info(`Video LSTM model path: ${videoLstmModelPath}`);
    logger.info(`Video transformer model path: ${videoTransformerModelPath}`);
    
    // Check if model directories exist
    const landmarkModelDir = Path.dirname(landmarkModelPath);
    const videoLstmModelDir = Path.dirname(videoLstmModelPath);
    const videoTransformerModelDir = Path.dirname(videoTransformerModelPath);
    
    if (!Fs.existsSync(landmarkModelDir)) {
      logger.warn(`Landmark model directory not found: ${landmarkModelDir}`);
      logger.warn('Creating directory...');
      Fs.mkdirSync(landmarkModelDir, { recursive: true });
    }
    
    if (!Fs.existsSync(videoLstmModelDir)) {
      logger.warn(`Video LSTM model directory not found: ${videoLstmModelDir}`);
      logger.warn('Creating directory...');
      Fs.mkdirSync(videoLstmModelDir, { recursive: true });
    }
    
    if (!Fs.existsSync(videoTransformerModelDir)) {
      logger.warn(`Video transformer model directory not found: ${videoTransformerModelDir}`);
      logger.warn('Creating directory...');
      Fs.mkdirSync(videoTransformerModelDir, { recursive: true });
    }
    
    // Load models with proper error handling
    if (Fs.existsSync(landmarkModelPath)) {
      try {
        logger.info(`Loading landmark model from: ${landmarkModelPath}`);
        // Use full path with file:// protocol
        landmarkModel = await tf.loadLayersModel(`file://${Path.resolve(landmarkModelPath)}`);
        logger.info('Landmark model loaded successfully');
      } catch (error) {
        logger.error('Error loading landmark model:', error);
      }
    } else {
      logger.warn(`Landmark model file not found: ${landmarkModelPath}`);
    }
    
    if (Fs.existsSync(videoLstmModelPath)) {
      try {
        logger.info(`Loading video LSTM model from: ${videoLstmModelPath}`);
        // Use full path with file:// protocol
        videoLstmModel = await tf.loadLayersModel(`file://${Path.resolve(videoLstmModelPath)}`);
        logger.info('Video LSTM model loaded successfully');
      } catch (error) {
        logger.error('Error loading video LSTM model:', error);
      }
    } else {
      logger.warn(`Video LSTM model file not found: ${videoLstmModelPath}`);
    }
    
    if (Fs.existsSync(videoTransformerModelPath)) {
      try {
        logger.info(`Loading video transformer model from: ${videoTransformerModelPath}`);
        // Use full path with file:// protocol
        videoTransformerModel = await tf.loadLayersModel(`file://${Path.resolve(videoTransformerModelPath)}`);
        logger.info('Video transformer model loaded successfully');
      } catch (error) {
        logger.error('Error loading video transformer model:', error);
      }
    } else {
      logger.warn(`Video transformer model file not found: ${videoTransformerModelPath}`);
    }
    
    // Return model status
    const status = {
      landmarkModel: landmarkModel !== null,
      videoLstmModel: videoLstmModel !== null,
      videoTransformerModel: videoTransformerModel !== null,
      imageClassMapping: Object.keys(imageClassMapping).length > 0,
      videoClassMapping: Object.keys(videoClassMapping).length > 0
    };
    
    logger.info('Model loading completed with status:', status);
    return status;
  } catch (error) {
    logger.error('Error in loadModels function:', error);
    throw error;
  }
}

/**
 * Predict static sign (letter) from landmarks
 * @param {Array} landmarks - Flattened array of hand landmarks
 * @returns {Promise<Object>} Prediction result
 */
async function predictStaticSign(landmarks) {
  if (!landmarkModel) {
    throw new Error('Landmark model not loaded');
  }
  
  // Convert landmarks to tensor
  const tensor = tf.tensor2d([landmarks], [1, config.models.params.numLandmarkFeatures]);
  
  // Predict
  const predictions = await landmarkModel.predict(tensor).data();
  
  // Get the highest prediction
  let maxIndex = 0;
  let maxConfidence = 0;
  
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] > maxConfidence) {
      maxConfidence = predictions[i];
      maxIndex = i;
    }
  }
  
  // Get the class name
  const predictedClass = imageClassMapping[maxIndex] || 'Unknown';
  
  // Clean up
  tensor.dispose();
  
  return {
    class: predictedClass,
    confidence: maxConfidence,
    index: maxIndex
  };
}

/**
 * Predict dynamic sign (word) from landmark sequence
 * @param {Array} landmarkSequence - Array of landmark arrays
 * @param {string} modelChoice - 'lstm' or 'transformer'
 * @returns {Promise<Object>} Prediction result
 */
async function predictDynamicSign(landmarkSequence, modelChoice = 'transformer') {
  // Choose model based on modelChoice
  const model = modelChoice === 'transformer' ? videoTransformerModel : videoLstmModel;
  
  if (!model) {
    throw new Error(`${modelChoice} model not loaded`);
  }
  
  // Ensure sequence has correct dimensions
  let processedSequence = landmarkSequence;
  const numFrames = config.models.params.numFramesVideo;
  const numFeatures = config.models.params.numLandmarkFeatures;
  
  // Pad or truncate sequence to correct length
  if (landmarkSequence.length < numFrames) {
    // Pad with zeros
    processedSequence = [
      ...landmarkSequence,
      ...Array(numFrames - landmarkSequence.length).fill(Array(numFeatures).fill(0))
    ];
  } else if (landmarkSequence.length > numFrames) {
    // Truncate
    processedSequence = landmarkSequence.slice(0, numFrames);
  }
  
  // Convert to tensor
  const tensor = tf.tensor3d([processedSequence], [1, numFrames, numFeatures]);
  
  // Predict
  const predictions = await model.predict(tensor).data();
  
  // Get the highest prediction
  let maxIndex = 0;
  let maxConfidence = 0;
  
  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] > maxConfidence) {
      maxConfidence = predictions[i];
      maxIndex = i;
    }
  }
  
  // Get the class name
  const predictedClass = videoClassMapping[maxIndex] || 'Unknown';
  
  // Clean up
  tensor.dispose();
  
  return {
    class: predictedClass,
    confidence: maxConfidence,
    index: maxIndex,
    modelUsed: modelChoice
  };
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
  
  // Parse text and convert to signs
  const words = text.trim().toLowerCase().split(/\s+/);
  const result = [];
  
  for (const word of words) {
    // Check if word exists in video class mapping (known words)
    let isKnownWord = false;
    let mappedWord = word;
    
    for (const [key, value] of Object.entries(videoClassMapping)) {
      if (value.toLowerCase() === word) {
        isKnownWord = true;
        mappedWord = value; // Use the exact case from the mapping
        break;
      }
    }
    
    if (isKnownWord) {
      // Known word - can be represented as a single sign
      result.push({
        type: 'word',
        original: word,
        mapped: mappedWord,
        knownInDataset: true
      });
    } else {
      // Unknown word - needs to be fingerspelled
      const letters = [];
      
      for (const letter of word) {
        // Check if we have this letter in our image classes
        let letterExists = false;
        let mappedLetter = letter.toUpperCase();
        
        // Look through the image class mapping for this letter
        for (const [key, value] of Object.entries(imageClassMapping)) {
          if (value.toLowerCase() === letter.toLowerCase()) {
            letterExists = true;
            mappedLetter = value; // Use the exact case from the mapping
            break;
          }
        }
        
        letters.push({
          letter: letter,
          mapped: mappedLetter,
          exists: letterExists
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
    landmarkModel: landmarkModel !== null,
    videoLstmModel: videoLstmModel !== null,
    videoTransformerModel: videoTransformerModel !== null,
    imageClassMapping: Object.keys(imageClassMapping).length > 0,
    videoClassMapping: Object.keys(videoClassMapping).length > 0
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