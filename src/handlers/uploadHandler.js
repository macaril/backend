'use strict';

const Fs = require('fs');
const Path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Handle file upload
 * @param {Object} file - File object from payload
 * @param {string} type - Type of file (image or video)
 * @returns {Promise<Object>} Upload result
 */
async function handleFileUpload(file, type = 'unknown') {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type
      const fileExtension = Path.extname(file.hapi.filename).toLowerCase();
      const mimeType = file.hapi.headers['content-type'];
      
      let isValidType = false;
      
      if (type === 'image') {
        isValidType = config.uploads.allowedImageTypes.includes(mimeType);
      } else if (type === 'video') {
        isValidType = config.uploads.allowedVideoTypes.includes(mimeType);
      } else {
        // Accept both image and video
        isValidType = [...config.uploads.allowedImageTypes, ...config.uploads.allowedVideoTypes].includes(mimeType);
      }
      
      if (!isValidType) {
        return reject(new Error(`Invalid file type: ${mimeType}. Allowed types for ${type}: ${
          type === 'image' 
            ? config.uploads.allowedImageTypes.join(', ') 
            : config.uploads.allowedVideoTypes.join(', ')
        }`));
      }
      
      // Generate a unique filename
      const filename = `${uuidv4()}${fileExtension}`;
      const filepath = Path.join(config.directories.uploads, filename);
      
      // Create writable stream
      const fileStream = Fs.createWriteStream(filepath);
      
      // Write file
      file.pipe(fileStream);
      
      file.on('end', () => {
        resolve({
          success: true,
          filename,
          filepath,
          originalName: file.hapi.filename,
          mimeType,
          type
        });
      });
      
      file.on('error', (err) => {
        // Clean up file if it was created
        try {
          if (Fs.existsSync(filepath)) {
            Fs.unlinkSync(filepath);
          }
        } catch (e) {
          logger.error('Error cleaning up file after upload failure:', e);
        }
        
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Process an uploaded image file
 * @param {string} filepath - Path to the uploaded image file
 * @returns {Promise<Object>} Processing result
 */
async function processImageFile(filepath) {
  // This function would normally process the image for landmark extraction
  // but since we're receiving landmarks directly from the frontend, it's simpler
  const fileStats = Fs.statSync(filepath);
  
  return {
    filepath,
    size: fileStats.size,
    lastModified: fileStats.mtime
  };
}

/**
 * Process an uploaded video file
 * @param {string} filepath - Path to the uploaded video file
 * @returns {Promise<Object>} Processing result
 */
async function processVideoFile(filepath) {
  // This function would normally process the video for landmark extraction
  // but since we're receiving landmarks directly from the frontend, it's simpler
  const fileStats = Fs.statSync(filepath);
  
  return {
    filepath,
    size: fileStats.size,
    lastModified: fileStats.mtime
  };
}

/**
 * Clean up old files in the uploads directory
 * @param {number} maxAgeMinutes - Maximum age of files to keep in minutes
 */
function cleanupUploads(maxAgeMinutes = 60) {
  try {
    const files = Fs.readdirSync(config.directories.uploads);
    const now = Date.now();
    
    files.forEach(file => {
      const filepath = Path.join(config.directories.uploads, file);
      const stats = Fs.statSync(filepath);
      
      // Calculate file age in minutes
      const ageMinutes = (now - stats.mtime.getTime()) / (1000 * 60);
      
      if (ageMinutes > maxAgeMinutes) {
        // Delete old files
        Fs.unlinkSync(filepath);
        logger.info(`Deleted old file: ${filepath}`);
      }
    });
  } catch (err) {
    logger.error('Error cleaning up uploads directory:', err);
  }
}

module.exports = {
  handleFileUpload,
  processImageFile,
  processVideoFile,
  cleanupUploads
};