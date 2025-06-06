'use strict';

const Path = require('path');

// Configuration for the application
module.exports = {
  // Server settings
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  // Model settings
  models: {
    // Directory where models are stored
    directory: Path.join(__dirname, '../models'),
    
    // Model file paths
    files: {
      landmarkModel: 'tfjs_bisindo_landmark_model/model.json',
      videoLstmModel: 'tfjs_bisindo_video_lstm_model/model.json',
      videoTransformerModel: 'tfjs_bisindo_video_transformer_model/model.json',
      imageClassMapping: 'image_class_mapping.json',
      videoClassMapping: 'video_class_mapping.json'
    },
    
    // Model parameters
    params: {
      imageHeight: 224,
      imageWidth: 224,
      numFramesVideo: 30,
      numLandmarkFeatures: 21 * 3, // 21 hand landmarks, each with x, y, z
      confidenceThreshold: 0.5
    }
  },
  
  // Directories
  directories: {
    uploads: Path.join(__dirname, '../uploads'),
    temp: Path.join(__dirname, '../temp'),
    public: Path.join(__dirname, '../public')
  },
  
  // Upload settings
  uploads: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedVideoTypes: ['video/mp4', 'video/avi', 'video/quicktime']
  }
};