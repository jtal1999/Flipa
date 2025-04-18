const axios = require('axios');
require('dotenv').config();

const TIKTOK_API_KEY = process.env.TIKAPI_KEY;

// Simple function to calculate similarity based on keyword overlap
function calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard index
}

// Simplified distillation for user search
function distillSearchQuery(description) {
    if (!description || typeof description !== 'string') return '';

    return description
        .toLowerCase()
        .replace(/[^\w\s]/g, '')                                              // remove special chars but keep alphanumeric
        .replace(/\b(?:free|shipping|discount|extra|new|best|off|hot)\b/g, '') // remove marketing terms
        .replace(/\s+/g, ' ')                                                // normalize spaces
        .trim()
        .split(' ')
        .filter(w => w.length > 2 && !/^\d+$/.test(w))                      // remove short words & pure numbers
        .slice(0, 6)                                                        // keep up to 6 most relevant terms
        .join(' ');
}

function groupPostsByTimeWindow(posts, timeWindow = 'month') {
    const now = new Date();
    let startDate;
    let endDate = now;
    switch (timeWindow) {
        case 'day':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
        default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
    }

    const initializeTimePeriods = () => {
        const periods = {};
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            let key;
            switch (timeWindow) {
                case 'day':
                    key = currentDate.toISOString().split('T')[0];
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'week':
                    const weekStart = new Date(currentDate);
                    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'month':
                default:
                    key = currentDate.toISOString().slice(0, 7);
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
            periods[key] = {
                likes: 0,
                comments: 0,
                shares: 0,
                postCount: 0
            };
        }
        return periods;
    };

    let groupedData = initializeTimePeriods();

    posts.forEach((post, index) => {
        // Use createTime from item sub-object
        const createTime = post.item?.createTime;
        if (!createTime) return; 

        const date = new Date(createTime * 1000);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        let key;
        switch (timeWindow) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay()); 
                weekStart.setHours(0, 0, 0, 0);
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
            default:
                key = date.toISOString().slice(0, 7); // YYYY-MM
                break;
        }

        if (groupedData.hasOwnProperty(key)) {
             // Access stats from item.stats sub-object
             const stats = post.item?.stats || {};
             groupedData[key].likes += stats.diggCount ?? 0;
             groupedData[key].comments += stats.commentCount ?? 0;
             groupedData[key].shares += stats.shareCount ?? 0;
             groupedData[key].postCount += 1;
        }
    });

    // Map to the format expected by the frontend chart
    return Object.entries(groupedData).map(([dateKey, data]) => {
        const avgLikes = Math.round(data.likes / (data.postCount || 1));
        const avgComments = Math.round(data.comments / (data.postCount || 1));
        const avgShares = Math.round(data.shares / (data.postCount || 1));
        return {
            date: dateKey, 
            likes: avgLikes,
            comments: avgComments,
            shares: avgShares,
            totalEngagement: avgLikes + avgComments + avgShares, 
            postCount: data.postCount
        };
    }).sort((a, b) => a.date.localeCompare(b.date));
}

// Helper function to process posts into the final engagement structure
function _processPosts(posts) {
    if (!posts || posts.length === 0) {
        return null; // Return null if no posts to process
    }
    
    const monthlyData = groupPostsByTimeWindow(posts, 'month');
    const weeklyData = groupPostsByTimeWindow(posts, 'week');
    const dailyData = groupPostsByTimeWindow(posts, 'day');

    const numPosts = posts.length;
    // Use correct path for overall stat calculation
    const totalLikes = posts.reduce((sum, post) => sum + (post.item?.stats?.diggCount ?? 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.item?.stats?.commentCount ?? 0), 0);
    const totalShares = posts.reduce((sum, post) => sum + (post.item?.stats?.shareCount ?? 0), 0);

    return {
        monthly: {
            posts: monthlyData,
            averageLikes: numPosts > 0 ? Math.round(totalLikes / numPosts) : 0,
            averageComments: numPosts > 0 ? Math.round(totalComments / numPosts) : 0,
            averageShares: numPosts > 0 ? Math.round(totalShares / numPosts) : 0,
            totalPosts: numPosts
        },
        week: {
            posts: weeklyData,
            averageLikes: numPosts > 0 ? Math.round(totalLikes / numPosts) : 0,
            averageComments: numPosts > 0 ? Math.round(totalComments / numPosts) : 0,
            averageShares: numPosts > 0 ? Math.round(totalShares / numPosts) : 0,
            totalPosts: numPosts
        },
        day: {
            posts: dailyData,
            averageLikes: numPosts > 0 ? Math.round(totalLikes / numPosts) : 0,
            averageComments: numPosts > 0 ? Math.round(totalComments / numPosts) : 0,
            averageShares: numPosts > 0 ? Math.round(totalShares / numPosts) : 0,
            totalPosts: numPosts
        }
    };
}

// Renamed function for the hashtag fallback logic
async function _searchTikTokByHashtag(searchQuery) {
    console.log('🔄 Falling back to TikTok Hashtag search for:', searchQuery);
    try {
        // --- Step 1: Get Hashtag ID from Name ---
        console.log(`[Hashtag Step 1/2] Fetching ID for name: "${searchQuery}"...`);
        let hashtagId;
        try {
            const idResponse = await axios.get('https://api.tikapi.io/public/hashtag', {
                headers: { 'X-API-KEY': TIKTOK_API_KEY },
                params: { name: searchQuery } // Use raw query for hashtag name
            });
            hashtagId = idResponse.data?.challengeInfo?.challenge?.id;
            if (!hashtagId) {
                console.warn(`[Hashtag Step 1/2] ⚠️ ID not found for name: "${searchQuery}"`);
                return { success: true, engagement: null }; // Not an error, just no hashtag
            }
            console.log(`[Hashtag Step 1/2] ✅ Found ID: ${hashtagId}`);
        } catch (error) {
            console.error(`[Hashtag Step 1/2] ❌ Error fetching ID for "${searchQuery}":`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            if (error.response && error.response.status === 404) {
                 return { success: true, engagement: null }; // Hashtag doesn't exist
            }
            // Propagate other errors
            return { success: false, error: `Failed to get Hashtag ID: ${error.message}` };
        }

        // --- Step 2: Get Posts using Hashtag ID ---
        console.log(`[Hashtag Step 2/2] Fetching posts using ID: ${hashtagId}...`);
        const response = await axios.get('https://api.tikapi.io/public/hashtag', {
            headers: { 'X-API-KEY': TIKTOK_API_KEY },
            params: { id: hashtagId, count: 30 } // Max 30 for ID search
        });

        const posts = response.data?.itemList || [];
        console.log(`[Hashtag Step 2/2] Fetched ${posts.length} posts using ID.`);

        const engagementData = _processPosts(posts);

        return {
            success: true,
            engagement: engagementData // Will be null if no posts found
        };

    } catch (error) {
        console.error('❌ TikTok Hashtag Search Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return { success: false, error: error.message };
    }
}

// Main function: Tries general search first, falls back to hashtag search
async function getTikTokEngagementMetrics(searchQuery, bypassDistillation = false) {
    let finalQuery = searchQuery;
    if (!bypassDistillation) {
        finalQuery = distillSearchQuery(searchQuery);
        console.log('🔍 Distilled TikTok search query:', finalQuery);
    } else {
        console.log('🧪 Using raw query for TikTok search:', finalQuery);
    }

    if (!finalQuery || finalQuery.length < 3) {
        console.warn('⚠️ Search query too weak, skipping TikTok API call.');
        return { success: true, engagement: null };
    }

    try {
        // --- Primary Method: General Search ---
        console.log(`[Primary Search] Fetching posts from /public/search/general for query: "${finalQuery}"...`);
        const response = await axios.get('https://api.tikapi.io/public/search/general', {
            headers: { 'X-API-KEY': TIKTOK_API_KEY },
            params: { query: finalQuery, count: 30 } // Use 'query', limit count
        });

        // Check common response structures for search results
        const posts = response.data?.data || response.data?.itemList || []; 
        console.log(`[Primary Search] Fetched ${posts.length} posts.`);

        if (posts.length > 0) {
            const engagementData = _processPosts(posts);
            if (engagementData) {
                console.log('[Primary Search] ✅ Successfully processed general search results.');
                return { success: true, engagement: engagementData };
            } else {
                 console.warn('[Primary Search] ⚠️ Found posts but failed to process them.');
                 // Proceed to fallback
            }
        } else {
            console.log('[Primary Search] No results found, proceeding to fallback.');
            // Proceed to fallback
        }

    } catch (error) {
        console.error(`[Primary Search] ❌ Error during general search for "${finalQuery}":`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        console.log('Proceeding to fallback due to error.');
        // Proceed to fallback on error
    }

    // --- Fallback Method: Hashtag Search ---
    // Use the original searchQuery for hashtag search, as distillation might be too aggressive
    // And respect the bypassDistillation flag for the raw Vision label if needed
    const hashtagQuery = bypassDistillation ? searchQuery : finalQuery; 
    return await _searchTikTokByHashtag(hashtagQuery);
}

module.exports = {
    getTikTokEngagementMetrics
}; 