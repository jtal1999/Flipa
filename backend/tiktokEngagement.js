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

    posts.forEach(post => {
        // Adjust field names based on the actual response from /user/search/videos
        const createTime = post.create_time || post.createTime; // Adapt as needed
        if (!createTime) return; // Skip posts without a timestamp

        const date = new Date(createTime * 1000);
        let key;

        switch (timeWindow) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
            default:
                key = date.toISOString().slice(0, 7);
                break;
        }

        if (groupedData[key]) {
             // Adapt field names: e.g., post.stats?.diggCount or post.digg_count
            groupedData[key].likes += post.digg_count || post.stats?.diggCount || 0;
            groupedData[key].comments += post.comment_count || post.stats?.commentCount || 0;
            groupedData[key].shares += post.share_count || post.stats?.shareCount || 0;
            groupedData[key].postCount += 1;
        }
    });

    return Object.entries(groupedData).map(([date, data]) => ({
        date,
        likes: Math.round(data.likes / (data.postCount || 1)),
        comments: Math.round(data.comments / (data.postCount || 1)),
        shares: Math.round(data.shares / (data.postCount || 1)),
        totalEngagement: Math.round((data.likes + data.comments + data.shares) / (data.postCount || 1)),
        postCount: data.postCount
    })).sort((a, b) => a.date.localeCompare(b.date));
}

// Main function to get metrics
async function getTikTokEngagementMetrics(searchQuery, bypassDistillation = false) {
    try {
        let finalQuery = searchQuery;
        if (!bypassDistillation) {
            // Only distill if not bypassed
            finalQuery = distillSearchQuery(searchQuery);
            console.log('🔍 Distilled TikTok search query for /search:', finalQuery);
        } else {
            console.log('🧪 Using raw query (Vision labels) for TikTok search:', finalQuery);
        }

        if (!finalQuery || finalQuery.length < 3) {
            console.warn('⚠️ Search query too weak, skipping TikTok API call.');
            return {
                success: true,
                engagement: null
            };
        }

        // --- Step 1: Get Hashtag ID from Name ---
        console.log(`[Step 1/2] Fetching Hashtag ID for name: "${finalQuery}"...`);
        let hashtagId;
        try {
            const idResponse = await axios.get('https://api.tikapi.io/public/hashtag', {
                headers: { 'X-API-KEY': TIKTOK_API_KEY },
                params: { name: finalQuery }
            });

            hashtagId = idResponse.data?.challengeInfo?.challenge?.id;
            if (!hashtagId) {
                console.warn(`⚠️ Hashtag ID not found for name: "${finalQuery}"`);
                return { success: true, engagement: null };
            }
            console.log(`✅ Found Hashtag ID: ${hashtagId}`);
        } catch (error) {
            console.error(`❌ Error fetching Hashtag ID for "${finalQuery}":`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            // Treat as non-critical if hashtag simply doesn't exist, but return error for other issues
            if (error.response && error.response.status === 404) { 
                 return { success: true, engagement: null };
            } else {
                 return { success: false, error: `Failed to get Hashtag ID: ${error.message}` };
            }
        }

        // --- Step 2: Get Posts using Hashtag ID ---
        console.log(`[Step 2/2] Fetching posts using Hashtag ID: ${hashtagId}...`);
        const response = await axios.get('https://api.tikapi.io/public/hashtag', {
            headers: {
                'X-API-KEY': TIKTOK_API_KEY
            },
            params: {
                id: hashtagId, // Use the retrieved Hashtag ID
                count: 30      // Adjust count to API limit (max 30 for ID search)
            }
        });

        // Extract posts using itemList (common for hashtag endpoint)
        const posts = response.data?.itemList || []; 
        console.log(`Fetched ${posts.length} posts using Hashtag ID.`);

        if (!posts.length) {
             console.log('No posts returned from public hashtag search.');
            return {
                success: true,
                engagement: null // Return null if no posts found
            };
        }
        
        // Group posts by different time windows
        const monthlyData = groupPostsByTimeWindow(posts, 'month');
        const weeklyData = groupPostsByTimeWindow(posts, 'week');
        const dailyData = groupPostsByTimeWindow(posts, 'day');

        // Calculate overall averages based on fetched posts
        const numPosts = posts.length;
        const totalLikes = posts.reduce((sum, post) => sum + (post.digg_count || post.stats?.diggCount || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comment_count || post.stats?.commentCount || 0), 0);
        const totalShares = posts.reduce((sum, post) => sum + (post.share_count || post.stats?.shareCount || 0), 0);

        // Log the processed data for debugging
        console.log('Processed engagement data:', {
            monthly: { posts: monthlyData.length, averages: { likes: totalLikes/numPosts, comments: totalComments/numPosts, shares: totalShares/numPosts } },
            week: { posts: weeklyData.length },
            day: { posts: dailyData.length }
        });

        return {
            success: true,
            engagement: {
                monthly: {  // Changed from 'month' to 'monthly' to match frontend
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
            }
        };
    } catch (error) {
        console.error('❌ TikTok engagement error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    getTikTokEngagementMetrics
}; 