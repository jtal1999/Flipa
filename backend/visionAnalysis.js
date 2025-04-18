const vision = require('@google-cloud/vision');
const fs = require('fs');
require('dotenv').config();

// Initialize Google Cloud Vision client
// The client will automatically read credentials from GOOGLE_APPLICATION_CREDENTIALS env var
const client = new vision.ImageAnnotatorClient();

async function analyzeImage(imagePath) {
  try {
    console.log('\n🔍 Starting Google Cloud Vision analysis for image:', imagePath);
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Perform both text and label detection
    const [textResult] = await client.textDetection(imageBuffer);
    const [labelResult] = await client.labelDetection(imageBuffer);
    
    const detections = textResult.textAnnotations;
    const labels = labelResult.labelAnnotations || [];

    // Log label detections
    if (labels.length > 0) {
      console.log('\n🏷️ Detected Labels:');
      console.log('=====================================');
      labels.forEach(label => {
        console.log(`${label.description} (confidence: ${(label.score * 100).toFixed(1)}%)`);
      });
      console.log('=====================================\n');
    } else {
      console.log('No labels detected in the image');
    }

    if (!detections || detections.length === 0) {
      console.log('No text detected in the image');
      return {
        success: true,
        labels: labels,  // Still return labels even if no text
        error: 'No text detected in the image'
      };
    }

    // The first detection contains the full text
    const fullText = detections[0].description;
    console.log('\n📝 Google Cloud Vision Generated Text:');
    console.log('=====================================');
    console.log(fullText);
    console.log('=====================================\n');

    // Extract structured information from the text
    const structuredInfo = extractStructuredInfo(fullText);

    return {
      success: true,
      searchDescription: structuredInfo,
      rawText: fullText,
      labels: labels  // Include the detected labels in the response
    };
  } catch (error) {
    console.error('❌ Vision analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function extractStructuredInfo(text) {
  // This function will parse the text to extract structured information
  // You may need to adjust the parsing logic based on your specific needs
  const info = {
    brand: extractBrand(text),
    productType: extractProductType(text),
    price: extractPrice(text),
    modelDetails: extractModelDetails(text),
    physicalAttributes: extractPhysicalAttributes(text)
  };

  return info;
}

function extractBrand(text) {
  // Implement brand extraction logic
  // This is a placeholder - you'll need to implement actual brand detection
  const brandRegex = /(?:brand|by|from)\s*[:]?\s*([A-Za-z0-9\s]+)/i;
  const match = text.match(brandRegex);
  return match ? match[1].trim() : null;
}

function extractProductType(text) {
  // Implement product type extraction logic
  const typeRegex = /(?:product|item|type)\s*[:]?\s*([A-Za-z0-9\s]+)/i;
  const match = text.match(typeRegex);
  return match ? match[1].trim() : null;
}

function extractPrice(text) {
  // Implement price extraction logic
  const priceRegex = /\$(\d+(?:\.\d{2})?)/;
  const match = text.match(priceRegex);
  return match ? parseFloat(match[1]) : null;
}

function extractModelDetails(text) {
  // Implement model details extraction logic
  const modelRegex = /(?:model|sku|item\s*#)\s*[:]?\s*([A-Za-z0-9\s-]+)/i;
  const match = text.match(modelRegex);
  return match ? match[1].trim() : null;
}

function extractPhysicalAttributes(text) {
  // Implement physical attributes extraction logic
  const attributes = {
    color: extractColor(text),
    material: extractMaterial(text),
    dimensions: extractDimensions(text)
  };
  return attributes;
}

function extractColor(text) {
  const colorRegex = /(?:color|colour)\s*[:]?\s*([A-Za-z\s]+)/i;
  const match = text.match(colorRegex);
  return match ? match[1].trim() : null;
}

function extractMaterial(text) {
  const materialRegex = /(?:material|made\s*of)\s*[:]?\s*([A-Za-z\s]+)/i;
  const match = text.match(materialRegex);
  return match ? match[1].trim() : null;
}

function extractDimensions(text) {
  const dimensionsRegex = /(\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?\s*(?:x|×)?\s*\d*(?:\.\d+)?\s*(?:in|cm|mm))/i;
  const match = text.match(dimensionsRegex);
  return match ? match[1].trim() : null;
}

module.exports = { analyzeImage }; 