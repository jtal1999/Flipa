const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const GPT_API_KEY = process.env.GPT_API_KEY;
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
console.log('API Keys loaded:', {
  GPT: GPT_API_KEY ? 'Yes' : 'No',
  Imgur: IMGUR_CLIENT_ID ? 'Yes' : 'No'
});

async function uploadToImgur(imagePath) {
  const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });

  const response = await axios.post(
    'https://api.imgur.com/3/image',
    {
      image: imageData,
      type: 'base64'
    },
    {
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
      }
    }
  );

  return response.data.data.link;
}

async function compareImages(localImagePath, imageUrl) {
  try {
    console.log('\n🔍 Starting GPT-4o Vision comparison:');
    console.log('Local image:', localImagePath);
    console.log('URL image:', imageUrl);
    
    // Upload local image to Imgur
    const uploadedImageUrl = await uploadToImgur(localImagePath);
    console.log('Uploaded local image to Imgur:', uploadedImageUrl);

    // Prepare the request to GPT-4o
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'You are a product comparison expert. Compare these two product images to determine if they are the same product, close variants, or entirely different products.\n\n' +
                    'Focus on:\n' +
                    '1. Function and form factor\n' +
                    '2. Structural features (shape, attachments, compartments, mechanisms)\n' +
                    '3. Core design and utility\n\n' +
                    'Guidelines:\n' +
                    '- Ignore branding and color unless they signal fundamentally different functionality\n' +
                    '- Classify knockoffs or duplicate-function alternatives as close variants if they perform the same task similarly\n' +
                    '- Reject matches that differ significantly in core design or utility\n\n' +
                    'Provide your analysis in JSON format with these keys:\n' +
                    '- similarityVerdict (string: "same_product", "close_variant", or "different_product")\n' +
                    '- confidenceScore (number between 0-1)\n' +
                    '- keySimilarities (array of strings describing functional/structural similarities)\n' +
                    '- keyDifferences (array of strings describing core visual/functional differences)\n' +
                    '- explanation (string explaining the verdict)\n' +
                    '- matchRationale (string focusing on function and form factor over branding/color)'
            },
            {
              type: 'image_url',
              image_url: {
                url: uploadedImageUrl
              }
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
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
    const comparison = JSON.parse(gptResponse);

    // Log the comparison results
    console.log('\n📊 Comparison Results:');
    console.log('=====================================');
    console.log('Similarity Verdict:', comparison.similarityVerdict);
    console.log('Confidence Score:', comparison.confidenceScore);
    console.log('Key Similarities:', comparison.keySimilarities);
    console.log('Key Differences:', comparison.keyDifferences);
    console.log('Explanation:', comparison.explanation);
    console.log('Match Rationale:', comparison.matchRationale);
    console.log('=====================================\n');

    return {
      success: true,
      ...comparison
    };
  } catch (error) {
    console.error('❌ GPT Vision comparison error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { compareImages }; 