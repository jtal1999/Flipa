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
                    '   - Provide a smart search term that captures what the product actually is. This should be a concise, clear description that would work well for both product searches and social media engagement analysis.\n' +
                    '   - A condensed search term for TikTok (3 words max, space separated, no hashtags or hyphens,focusing on the core product identity)\n' +
                    '3. Identify the category this product belongs to (be specific, e.g., "Cordless Garden Tools" not just "Garden Tools")\n' +
                    '4. Identify an adjacent niche category that would be relevant for cross-selling\n\n' +
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
    console.log('Microniche:', analysis.microniche);
    console.log('Adjacent Microniche:', analysis.adjacentMicroniche);
    console.log('=====================================\n');

    return {
      success: true,
      searchTerm: analysis.searchTerm,  // For resale metrics
      tiktokSearchTerm: analysis.tiktokSearchTerm,     // For TikTok
      rawText: analysis.exactText,
      microniche: analysis.microniche,
      adjacentMicroniche: analysis.adjacentMicroniche
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