const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { analyzeImage } = require('./gptVisionAnalysis');
const { searchProductMetrics } = require('./metricsSearch');
const axios = require('axios');
const { getTikTokEngagementMetrics } = require('./tiktokSearch');
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

    // Check GPT API Key
    if (!process.env.GPT_API_KEY) {
        console.error('❌ GPT_API_KEY environment variable is not set');
        process.exit(1);
    }

    try {
        // Test GPT API with a simple request
        console.log('Testing GPT API...');
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GPT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ GPT API connection successful');
    } catch (error) {
        console.error('❌ GPT API test failed:', error.message);
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
          
          // Step 1: Analyze the image with GPT-4o Vision
          console.log('\n🔍 Starting GPT-4o Vision analysis...');
          const analysis = await analyzeImage(req.file.path);
          console.log('✅ GPT-4o Vision Response:', JSON.stringify({
            success: true,
            searchTerm: analysis.searchTerm,
            tiktokSearchTerm: analysis.tiktokSearchTerm,
            rawText: analysis.exactText,
            microniche: analysis.microniche,
            adjacentMicroniche: analysis.adjacentMicroniche
          }, null, 2));
          
          if (!analysis.success) {
            throw new Error(analysis.error);
          }

          // Step 2: Search for metrics using the description
          console.log('\n🔎 Starting metrics search...');
          const metricsResult = await searchProductMetrics({
            searchTerm: analysis.searchTerm,
            tiktokSearchTerm: analysis.tiktokSearchTerm,
            exactText: analysis.exactText,
            microniche: analysis.microniche,
            adjacentMicroniche: analysis.adjacentMicroniche
          });

          if (!metricsResult.success) {
            throw new Error(metricsResult.error);
          }

          // Step 3: Get TikTok engagement metrics
          console.log('\n📱 Getting TikTok engagement metrics...');
          const engagementMetrics = await getTikTokEngagementMetrics(analysis.tiktokSearchTerm);

          // Prepare the response
          const responseMetrics = {
            resaleValue: metricsResult.metrics.resaleValue,
            engagement: engagementMetrics.engagement
          };

          // Send the complete response
          res.json({
            success: true,
            searchTerm: analysis.searchTerm,
            tiktokSearchTerm: analysis.tiktokSearchTerm,
            rawText: analysis.exactText,
            microniche: analysis.microniche,
            adjacentMicroniche: analysis.adjacentMicroniche,
            metrics: responseMetrics
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

    app.post('/api/analyze-product', async (req, res) => {
        try {
            const { imageUrl, description } = req.body;

            // Get resale metrics
            const resaleMetrics = await searchProductMetrics(description);

            // Get TikTok engagement metrics
            const engagementMetrics = await getTikTokEngagementMetrics(description);

            // Combine the results
            const response = {
                success: true,
                description: description,
                metrics: {
                    resaleValue: resaleMetrics.success ? resaleMetrics.metrics : null,
                    engagement: engagementMetrics.success ? engagementMetrics.engagement : null
                }
            };

            res.json(response);
        } catch (error) {
            console.error('Error analyzing product:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to analyze product'
            });
        }
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