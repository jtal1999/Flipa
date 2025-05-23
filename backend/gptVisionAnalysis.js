const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const GPT_API_KEY = process.env.GPT_API_KEY;

async function analyzeImage(imagePath) {
  try {
    console.log('\n🔍 Starting GPT-4o Vision analysis for image:', imagePath);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare the request to GPT-4o
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',  // Using GPT-4o model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'You are a product analysis expert. Analyze this product image and provide the following information in JSON format:\n' +
                    '1. Extract the exact text visible in the image\n' +
                    '2. Based on the text and visual analysis, provide two search terms:\n' +
                    '   - The *exact product label or name* as written in the image (or packaging), reworded *only if necessary* to match what TikTok creators would likely use in captions or hashtags — no hyphens, no hashtags, just the keyword phrase. For example: "led eyelash curler", "usb heating lunchbox", "waterproof couch cover". This should be lowercase, concise, and match real-world TikTok phrasing.\n' +
                    '   - The *exact product label or name* as written in the image (or packaging), reworded *only if necessary* to match what TikTok creators would likely use in captions or hashtags — no hyphens, no hashtags, just the keyword phrase. For example: "led eyelash curler", "usb heating lunchbox", "waterproof couch cover". This should be lowercase, concise, and match real-world TikTok phrasing.\n' +
                    'Format the response as a JSON object with these keys: exactText, searchTerm, tiktokSearchTerm, microniche, adjacentMicroniche'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,  // Lower temperature for more consistent results
      response_format: { type: "json_object" }  // Ensure JSON response
    }, {
      headers: {
        'Authorization': `Bearer ${GPT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Parse the GPT response
    const gptResponse = response.data.choices[0].message.content;
    console.log('\n🤖 GPT-4o Response:', gptResponse);

    // Parse the JSON response
    const analysis = JSON.parse(gptResponse);

    // Log the analysis results
    console.log('\n📊 Analysis Results:');
    console.log('=====================================');
    console.log('Exact Text:', analysis.exactText);
    console.log('Search Term:', analysis.searchTerm);
    console.log('TikTok Search Term:', analysis.tiktokSearchTerm);
    console.log('=====================================\n');

    return {
      success: true,
      searchTerm: analysis.searchTerm,  // For resale metrics
      tiktokSearchTerm: analysis.tiktokSearchTerm,     // For TikTok
      rawText: analysis.exactText
    };
  } catch (error) {
    console.error('❌ GPT Vision analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { analyzeImage }; 