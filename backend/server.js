const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { analyzeImage } = require('./visionAnalysis');
const { searchProductMetrics } = require('./metricsSearch');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Verify API configurations at startup
async function verifyAPIs() {
    console.log('\n🔍 Verifying API configurations...');
    
    // Check SerpAPI
    if (!process.env.SERPAPI_KEY) {
        console.error('❌ SERPAPI_KEY environment variable is not set');
        process.exit(1);
    }
    
    try {
        // Test SerpAPI with a simple search
        console.log('Testing SerpAPI...');
        const serpResponse = await axios.get('https://serpapi.com/search', {
            params: {
                api_key: process.env.SERPAPI_KEY,
                engine: 'google_shopping',
                q: 'test product',
                num: 1
            }
        });
        console.log('✅ SerpAPI connection successful');
    } catch (error) {
        console.error('❌ SerpAPI test failed:', error.message);
        process.exit(1);
    }

    // Check Google Cloud Vision
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
        process.exit(1);
    }

    try {
        // Test Vision API with a simple image
        console.log('Testing Google Cloud Vision API...');
        const vision = require('@google-cloud/vision');
        const client = new vision.ImageAnnotatorClient();
        
        // Create a simple test image buffer
        const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        
        const [result] = await client.textDetection({
            image: { content: testImage }
        });
        console.log('✅ Google Cloud Vision API connection successful');
    } catch (error) {
        console.error('❌ Google Cloud Vision API test failed:', error.message);
        process.exit(1);
    }
}

// Run API verification before starting the server
verifyAPIs().then(() => {
    console.log('\n🚀 All APIs verified successfully. Starting server...\n');
    
    // Add more detailed logging
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });

    // Configure CORS to accept requests from your app
    app.use(cors({
      origin: '*' // Be more restrictive in production
    }));

    // Add request logging middleware
    app.use((req, res, next) => {
      console.log('🚦 Incoming request:', req.method, req.url);
      next();
    });

    // Test endpoint
    app.get('/', (req, res) => {
      res.json({ message: 'Server is running' });
    });

    // Configure multer for file uploads
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, uniqueSuffix + '.' + extension);
      }
    });

    const upload = multer({ 
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
      }
    }).single('photo');

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }

    // Photo upload endpoint with vision analysis and metrics search
    app.post('/api/upload', async (req, res) => {
      console.log('\n🔥 Received upload request');
      
      upload(req, res, async function(err) {
        console.log('\n📦 Processing upload request');
        console.log('Headers:', req.headers);
        
        if (err instanceof multer.MulterError) {
          console.error('❌ Multer error:', err);
          return res.status(400).json({ 
            error: true, 
            message: `Upload error: ${err.message}` 
          });
        } else if (err) {
          console.error('❌ Unknown error:', err);
          return res.status(500).json({ 
            error: true, 
            message: 'Unknown error occurred during upload' 
          });
        }

        if (!req.file) {
          console.error('❌ No file received in request');
          console.log('Request body:', req.body);
          return res.status(400).json({ 
            error: true, 
            message: 'No file uploaded' 
          });
        }

        try {
          console.log('\n📸 File details:');
          console.log('   Name:', req.file.originalname);
          console.log('   Path:', req.file.path);
          console.log('   Size:', req.file.size, 'bytes');
          console.log('   Type:', req.file.mimetype);
          
          // Step 1: Analyze the image with Google Cloud Vision
          console.log('\n🔍 Starting Google Cloud Vision analysis...');
          const analysis = await analyzeImage(req.file.path);
          console.log('✅ Vision API Response:', JSON.stringify(analysis, null, 2));
          
          if (!analysis.success) {
            throw new Error(analysis.error);
          }

          // Step 2: Search for metrics using the description
          console.log('\n🔎 Starting metrics search...');
          const metricsResult = await searchProductMetrics(analysis);

          if (!metricsResult.success) {
            throw new Error(metricsResult.error);
          }

          console.log('\n✅ Process completed successfully');
          res.json({
            success: true,
            filePath: req.file.path,
            filename: req.file.filename,
            metrics: metricsResult.metrics
          });
        } catch (error) {
          console.error('\n❌ Processing error:', error);
          res.status(500).json({
            error: true,
            message: 'Error processing image',
            details: error.message
          });
        } finally {
          // Clean up: Delete the uploaded file
          if (req.file && req.file.path) {
            try {
              fs.unlinkSync(req.file.path);
              console.log('\n🗑️ Cleaned up:', req.file.path);
            } catch (deleteError) {
              console.error('❌ Error deleting file:', deleteError);
            }
          }
        }
      });
    });

    // Basic error handling
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ 
        error: true, 
        message: 'Internal server error' 
      });
    });

    // Start server on all network interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Try accessing:`);
      console.log(`- http://localhost:${PORT}`);
      console.log(`- http://100.64.24.35:${PORT}`);
    });
}); 