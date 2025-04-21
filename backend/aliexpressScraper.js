const axios = require('axios');

async function getOrderVolume(searchTerm) {
  const actorId = 'piotrv1001~aliexpress-listings-scraper';
  const apiToken = process.env.APIFY_API_TOKEN;

  if (!apiToken) {
    console.error('❌ APIFY_API_TOKEN is not set');
    throw new Error('APIFY_API_TOKEN is not configured');
  }

  try {
    console.log(`\n🔍 Starting AliExpress scraper for search term: "${searchTerm}"`);
    
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiToken}`,
      {
        searchUrls: [`https://www.aliexpress.us/w/wholesale-${encodeURIComponent(searchTerm)}.html`],
        maxItems: 10 // Get top 10 listings
      }
    );

    console.log(`✅ Received ${runResponse.data.length} listings from AliExpress`);

    const products = runResponse.data.map(item => {
      const rawOrders = item.totalSold || '';
      console.log(`📦 Processing order count: "${rawOrders}"`);
      const cleanedOrders = parseInt(rawOrders.replace(/[^\d]/g, '')) || 0;
      return { orderCount: cleanedOrders };
    });

    // Calculate metrics
    const totalOrders = products.reduce((sum, product) => sum + product.orderCount, 0);
    const averageOrders = totalOrders / products.length;
    const topListingOrders = Math.max(...products.map(p => p.orderCount));

    console.log('\n📊 Order volume metrics:');
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Average Orders: ${averageOrders}`);
    console.log(`   Top Listing Orders: ${topListingOrders}`);

    // Determine volume level
    let volumeLevel = 'low';
    if (averageOrders >= 2000 || topListingOrders >= 5000 || totalOrders >= 15000) {
      volumeLevel = 'high';
    } else if (averageOrders >= 500 || topListingOrders >= 1500 || totalOrders >= 5000) {
      volumeLevel = 'medium';
    }

    console.log(`   Volume Level: ${volumeLevel.toUpperCase()}`);

    return {
      volumeLevel,
      metrics: {
        averageOrders: Math.round(averageOrders),
        topListingOrders,
        totalOrders
      }
    };
  } catch (error) {
    console.error('\n❌ Error in AliExpress scraper:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Failed to fetch AliExpress data: ${error.message}`);
  }
}

module.exports = {
  getOrderVolume
}; 