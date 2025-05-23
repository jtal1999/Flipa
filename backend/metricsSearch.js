const axios = require('axios');
require('dotenv').config();

// API Configuration
const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function searchProductMetrics(productDescription) {
    try {
     
        const searchText = typeof productDescription === 'object' ? 
            productDescription.searchTerm || '' : 
            productDescription;

        if (!searchText) {
            return {
                success: false,
                error: 'No product description found in image'
            };
        }

        // Use the search description directly (it's already smartly generated by GPT-4o)
        const mainDescription = searchText;
        console.log('\n🔍 Using GPT-4o generated search term:', mainDescription);

        // Extract key product features for validation
        const productFeatures = extractKeyFeatures(mainDescription);
        console.log('📋 Key Features:', JSON.stringify(productFeatures, null, 2));

        // Search using the main description
        const aliExpressResults = await searchWithSmartMatching(mainDescription, 'aliexpress.com', productFeatures);
        const amazonResults = await searchWithSmartMatching(mainDescription, 'amazon.com', productFeatures);

        if (!aliExpressResults || !amazonResults) {
            return {
                success: false,
                error: 'Could not find sufficient matching products'
            };
        }

        // Calculate metrics from the matched results
        const metrics = calculateMetrics(aliExpressResults, amazonResults);
        return {
            success: true,
            metrics: metrics,
            searchQuery: mainDescription
        };
    } catch (error) {
        console.error('❌ Search error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function extractMainProductTitle(description) {
    // Split text into lines
    const lines = description.split('\n');
    
    // Filter out common non-product text elements
    const cleanLines = lines.filter(line => {
        const l = line.trim().toLowerCase();
        
        // Skip empty lines
        if (l.length === 0) return false;
        
        // Skip UI elements and selection prompts
        if (l.includes('please select') ||
            l.includes('select') ||
            l.includes('color:') ||
            l.includes('color') ||
            l.includes('ends in') ||
            l.includes('day') ||
            l.includes('hot') ||
            l.includes('sold by') ||
            l.includes('visit shop') ||
            l.includes('pixel store') ||
            l.includes('add to cart') ||
            l.includes('buy now') ||
            l.match(/^\d+\s*pack$/i)) return false;
            
        // Skip common marketing/promotional text
        if (l.includes('free shipping') ||
            l.includes('flash sale') ||
            l.includes('coupon') ||
            l.includes('off') ||
            l.includes('high repeat purchase') ||
            l.includes('best seller') ||
            l.includes('new arrival') ||
            l.includes('trending') ||
            l.startsWith('save')) return false;
            
        // Skip only if it's clearly a price
        if (l.match(/^\$\d+(\.\d{1,2})?$/)) return false;
        
        // Skip any line containing price-related content (excluding potential product codes)
        if (l.includes('(-') ||
            l.includes('% off') ||
            l.includes('discount')) return false;
        
        // Skip rating-related text
        if (l.match(/^\d+\.?\d*\s*[★⭐]/)) return false;
        if (l.match(/\d+\.?\d*\s*stars?/i)) return false;
        if (l.match(/\d+\.?\d*k?\s*sold/i)) return false;
        if (l.match(/sold\s+by/i)) return false;
        if (l.match(/reviews?/i)) return false;
        
        // Skip single characters or battery specs alone
        if (l.match(/^[\w\d]$/) || 
            l.match(/^[\d.]+[vw]\s*$/i) ||
            l.match(/^[a-z]\s*$/i)) return false;

        // Skip lines that are just measurements or dimensions (only if standalone)
        if (
          l.trim().match(/^[\d.]+(ft|m|cm|mm|in)$/i) && 
          l.trim().split(' ').length === 1
        ) return false;
        
        // Skip Greek letters and other non-descriptive characters
        if (l.match(/^[Σσα-ω\s]*$/)) return false;

        // Skip navigation elements
        if (l.match(/^(back|next|previous|menu|share)$/i)) return false;

        return true;
    });

    // Find the most descriptive product line
    const productLines = cleanLines
        .map(line => {
            // Remove any remaining ellipses and clean up the text
            return line.trim()
                .replace(/\.{3,}|…/g, '')  // Remove ellipsis
                .replace(/\s*-\s*hi\s*$/i, '')  // Remove trailing '-Hi'
                .replace(/\s*-\s*$/i, '')  // Remove trailing dash
                .replace(/^\d+\.\s*/, '')  // Remove leading numbers with dots
                .replace(/\s+/g, ' ')  // Clean up multiple spaces
                .trim();
        })
        .filter(line => {
            // Keep only lines that look like product descriptions
            return line.length > 10 && // Must be reasonably long
                   !line.match(/^[0-9.]+$/) && // Not just numbers
                   line.match(/[a-zA-Z]/) && // Must contain some letters
                   line.split(' ').length > 2 // Must have at least 3 words
        });

    // Get the most descriptive line (usually the one with the most information)
    const productLine = productLines
        .sort((a, b) => {
            // Score based on number of meaningful words (longer than 2 characters)
            const meaningfulWordsA = a.split(' ').filter(word => word.length > 2).length;
            const meaningfulWordsB = b.split(' ').filter(word => word.length > 2).length;
            
            if (meaningfulWordsA === meaningfulWordsB) {
                // If same number of words, prefer the shorter overall length
                return a.length - b.length;
            }
            return meaningfulWordsB - meaningfulWordsA;
        })[0] || '';

    console.log('🏷️ Extracted product description:', productLine);
    return productLine;
}

function extractKeyFeatures(description) {
    const features = {
        type: [],           // Product types
        characteristics: [], // Product characteristics
        functions: [],      // Product functions
        keywords: []        // Additional important keywords
    };

    // Common product types (more generic)
    const typePatterns = /\b(?:holder|sterilizer|dispenser|sanitizer|organizer|rack|mount|station|monitor|camera|speaker|charger|adapter|case|stand|device|system|kit|set)\b/gi;
    features.type = [...new Set((description.match(typePatterns) || []).map(m => m.toLowerCase()))];

    // Product characteristics (more generic)
    const charPatterns = /\b(?:smart|wireless|portable|digital|electronic|automatic|rechargeable|adjustable|foldable|compact|premium|professional|advanced|high-quality|durable)\b/gi;
    features.characteristics = [...new Set((description.match(charPatterns) || []).map(m => m.toLowerCase()))];

    // Product functions (more generic)
    const functionPatterns = /\b(?:control|monitor|charge|connect|protect|store|organize|clean|secure|power|display|adjust|support)\w*\b/gi;
    features.functions = [...new Set((description.match(functionPatterns) || []).map(m => m.toLowerCase()))];

    // Extract additional keywords (nouns and adjectives)
    const words = description.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from']);
    features.keywords = words.filter(word => 
        word.length > 2 && 
        !commonWords.has(word) && 
        !features.type.includes(word) && 
        !features.characteristics.includes(word) && 
        !features.functions.includes(word)
    );

    return features;
}

async function searchWithSmartMatching(description, platform, productFeatures) {
    try {
        console.log(`\n🔍 Searching ${platform}...`);
        
        // Create search query by simply appending the platform name
        const searchQuery = `${description} ${platform === 'aliexpress.com' ? 'aliexpress' : 'amazon'}`;
        console.log(`📝 Search Query: ${searchQuery}`);
        
        const response = await axios.get('https://serpapi.com/search', {
            params: {
                api_key: SERPAPI_KEY,
                engine: 'google_shopping',
                q: searchQuery,
                num: 15
            }
        });

        if (!response.data.shopping_results) {
            console.log(`❌ No results found for ${platform}`);
            return null;
        }

        // Get the top 5 results without any complex scoring
        const topResults = response.data.shopping_results
            .slice(0, 5)
            .map(item => ({
                ...item,
                relevanceScore: 1.0  // Set a default score since we're not doing complex matching
            }));

        console.log(`\n📊 Top 5 matches found on ${platform}:`, topResults.length);
        topResults.forEach((item, index) => {
            console.log(`  ${index + 1}:`);
            console.log(`     Title: ${item.title}`);
            console.log(`     Price: $${item.price || 'N/A'}`);
            console.log(`     ----------------------`);
        });

        return topResults;
    } catch (error) {
        console.error(`❌ ${platform} search error:`, error);
        return null;
    }
}

function calculateMetrics(aliExpressResults, amazonResults) {
    // Calculate average prices
    const aliExpressAverage = calculateAveragePrice(aliExpressResults, 'aliexpress.com');
    const amazonAverage = calculateAveragePrice(amazonResults, 'amazon.com');

    // Calculate potential profit and margin
    const potentialProfit = amazonAverage - aliExpressAverage;
    const profitMargin = (potentialProfit / amazonAverage) * 100;

    // Add some randomness to prevent static values
    const randomVariation = (Math.random() * 0.1) - 0.05; // ±5% variation
    const adjustedProfitMargin = Math.min(100, Math.max(0, profitMargin * (1 + randomVariation)));

    // Calculate confidence based on number of matches and relevance scores
    const confidence = calculateConfidenceScore(aliExpressResults, amazonResults);
    
    return {
        resaleValue: {
            aliExpressAverage,
            amazonAverage,
            potentialProfit,
            profitMargin: adjustedProfitMargin,
            confidence,
            matchDetails: {
                aliExpressMatches: aliExpressResults.length,
                amazonMatches: amazonResults.length,
                aliExpressTopScore: aliExpressResults[0]?.relevanceScore || 0,
                amazonTopScore: amazonResults[0]?.relevanceScore || 0
            }
        }
    };
}

function calculateAveragePrice(results, platform) {
    if (!results || results.length === 0) return 0;
    
    const prices = results
        .map(item => {
            // Remove currency symbols and any extra characters
            const priceStr = item.price.replace(/[^0-9.]/g, '');
            return parseFloat(priceStr);
        })
        .filter(price => !isNaN(price))
        .sort((a, b) => a - b); // Sort prices from lowest to highest
    
    if (prices.length === 0) return 0;

    // Different strategies for Amazon vs AliExpress
    if (platform === 'amazon.com') {
        // For Amazon, bias towards higher prices
        const highestPrice = prices[prices.length - 1];
        const weights = prices.map((price, index) => {
            // Give more weight to higher prices using exponential growth
            const weight = Math.exp(0.5 * (index / prices.length)); // Higher index = more weight
            return { price, weight };
        });

        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
        const weightedSum = weights.reduce((sum, item) => sum + (item.price * item.weight), 0);
        
        // Calculate weighted average but bias it towards the highest price
        const weightedAverage = weightedSum / totalWeight;
        const finalAverage = (weightedAverage + highestPrice) / 2; // 50% influence from highest price

        console.log(`\n💰 Price Analysis for Amazon:`);
        console.log(`   Number of prices found: ${prices.length}`);
        console.log(`   Raw prices: ${prices.join(', ')}`);
        console.log(`   Highest Price: $${highestPrice.toFixed(2)}`);
        console.log(`   Regular Average: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
        console.log(`   Weighted Average (biased to highest): $${finalAverage.toFixed(2)}`);
        
        return finalAverage;
    } else {
        // For AliExpress, keep biasing towards lower prices
        const lowestPrice = prices[0];
        const weights = prices.map((price, index) => {
            // Give more weight to lower prices using exponential decay
            const weight = Math.exp(-0.5 * index); // Higher index = less weight
            return { price, weight };
        });

        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
        const weightedSum = weights.reduce((sum, item) => sum + (item.price * item.weight), 0);
        
        // Calculate weighted average but bias it towards the lowest price
        const weightedAverage = weightedSum / totalWeight;
        const finalAverage = (weightedAverage + lowestPrice) / 2; // 50% influence from lowest price

        console.log(`\n💰 Price Analysis for AliExpress:`);
        console.log(`   Number of prices found: ${prices.length}`);
        console.log(`   Raw prices: ${prices.join(', ')}`);
        console.log(`   Lowest Price: $${lowestPrice.toFixed(2)}`);
        console.log(`   Regular Average: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
        console.log(`   Weighted Average (biased to lowest): $${finalAverage.toFixed(2)}`);
        
        return finalAverage;
    }
}

function calculateConfidenceScore(aliExpressResults, amazonResults) {
    // Calculate confidence based on:
    // 1. Number of matches found (up to 5 each)
    // 2. Average relevance score of top matches
    // 3. Price consistency (standard deviation)
    
    const numMatchesScore = Math.min(
        ((aliExpressResults.length + amazonResults.length) / 10), 
        1
    ) * 0.4;

    const relevanceScore = (
        (aliExpressResults[0]?.relevanceScore || 0) +
        (amazonResults[0]?.relevanceScore || 0)
    ) / 2 * 0.4;

    const priceConsistencyScore = calculatePriceConsistencyScore(
        aliExpressResults,
        amazonResults
    ) * 0.2;

    return numMatchesScore + relevanceScore + priceConsistencyScore;
}

function calculatePriceConsistencyScore(aliExpressResults, amazonResults) {
    // Calculate standard deviation of prices
    function standardDeviation(prices) {
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
        return Math.sqrt(variance);
    }

    const aliExpressPrices = aliExpressResults
        .map(item => parseFloat(item.price))
        .filter(price => !isNaN(price));
    const amazonPrices = amazonResults
        .map(item => parseFloat(item.price))
        .filter(price => !isNaN(price));

    if (aliExpressPrices.length === 0 || amazonPrices.length === 0) return 0;

    const aliExpressSD = standardDeviation(aliExpressPrices);
    const amazonSD = standardDeviation(amazonPrices);

    // Convert SD to a score (lower SD = higher score)
    const aliExpressScore = Math.max(0, 1 - (aliExpressSD / aliExpressPrices[0]));
    const amazonScore = Math.max(0, 1 - (amazonSD / amazonPrices[0]));

    return (aliExpressScore + amazonScore) / 2;
}

module.exports = { searchProductMetrics }; 