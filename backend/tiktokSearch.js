const axios = require('axios');
require('dotenv').config();

const TIKTOK_API_KEY = process.env.TIKAPI_KEY;

async function getTikTokEngagementMetrics(searchTerm, isFallback = false) {
    try {
        console.log('\n🔍 Starting TikTok engagement analysis...');
        console.log('📝 Search term:', searchTerm);

        // Use the search term directly (it's already formatted by GPT-4o)
        const finalQuery = searchTerm;
        console.log('🔍 Final search query:', finalQuery);

        // Fetch TikTok data with pagination
        let allPosts = [];
        let cursor = '';
        let hasMore = true;
        let page = 0;
        const maxPages = 50; // Increased from 5 to 50 pages (1500 posts max)
        const postsPerPage = 30;
        const maxPosts = 2000; // TikAPI limit

        while (hasMore && page < maxPages && allPosts.length < maxPosts) {
            console.log(`\n📄 Fetching page ${page + 1}...`);
            
            const response = await axios.get('https://api.tikapi.io/public/search/general', {
                headers: { 'X-API-KEY': TIKTOK_API_KEY },
                params: { 
                    query: finalQuery,
                    count: postsPerPage,
                    nextCursor: cursor
                }
            });

            const newPosts = response.data?.data || [];
            
            if (newPosts.length === 0) {
                console.log('No more posts found, stopping pagination');
                
                // Get top 5 posts by total engagement
                const top5Posts = allPosts
                    .map(post => ({
                        totalEngagement: (post.item?.stats?.diggCount || 0) + 
                                       (post.item?.stats?.commentCount || 0) + 
                                       (post.item?.stats?.shareCount || 0),
                        likes: post.item?.stats?.diggCount || 0,
                        comments: post.item?.stats?.commentCount || 0,
                        shares: post.item?.stats?.shareCount || 0,
                        date: new Date(post.item?.createTime * 1000).toISOString().split('T')[0],
                        url: `https://www.tiktok.com/@${post.item?.author?.uniqueId || ''}/video/${post.item?.id || ''}`
                    }))
                    .sort((a, b) => b.totalEngagement - a.totalEngagement)
                    .slice(0, 5);

                console.log('\n🏆 Top 5 Most Engaging Posts:');
                console.log('=====================================');
                top5Posts.forEach((post, index) => {
                    console.log(`${index + 1}. ${post.date}`);
                    console.log(`   Total Engagement: ${post.totalEngagement}`);
                    console.log(`   Likes: ${post.likes}, Comments: ${post.comments}, Shares: ${post.shares}`);
                    console.log(`   URL: ${post.url}`);
                    console.log('-------------------------------------');
                });
                console.log('=====================================\n');
                
                break;
            }

            // Sort posts by likes and log in a concise format
            const sortedPosts = newPosts
                .map(post => ({
                    date: new Date(post.item?.createTime * 1000).toISOString().split('T')[0],
                    likes: post.item?.stats?.diggCount || 0,
                    comments: post.item?.stats?.commentCount || 0,
                    shares: post.item?.stats?.shareCount || 0,
                    url: `https://www.tiktok.com/@${post.item?.author?.uniqueId || ''}/video/${post.item?.id || ''}`
                }))
                .sort((a, b) => b.likes - a.likes);

            console.log(`Found ${newPosts.length} posts:`);
            sortedPosts.forEach(post => {
                console.log(`${post.date}: ${post.likes} likes, ${post.comments} comments, ${post.shares} shares | ${post.url}`);
            });

            allPosts.push(...newPosts);
            cursor = response.data?.nextCursor;
            hasMore = !!cursor;
            page++;

            console.log(`📊 Total posts so far: ${allPosts.length}`);

            // Add a small delay between requests to avoid rate limiting
            if (hasMore && page < maxPages && allPosts.length < maxPosts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n📈 Final total posts collected: ${allPosts.length}`);

        if (allPosts.length === 0) {
            console.log('⚠️ No posts found');
            return {
                success: true,
                engagement: null
            };
        }

        // Calculate engagement metrics for all posts
        const engagement = calculateEngagementMetrics(allPosts);
        console.log('\n📊 Engagement metrics:', JSON.stringify(engagement, null, 2));

        return {
            success: true,
            engagement
        };
    } catch (error) {
        console.error('❌ TikTok API error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

function calculateEngagementMetrics(posts) {
    // Filter posts from January 2024 onwards
    const startDate = new Date('2024-01-01');
    const filteredPosts = posts.filter(post => {
        const postDate = new Date(post.item?.createTime * 1000);
        return postDate >= startDate;
    });

    console.log(`Filtered to ${filteredPosts.length} posts from January 2024 onwards`);

    // Calculate averages from filtered posts
    const totalLikes = filteredPosts.reduce((sum, post) => sum + (post.item?.stats?.diggCount || 0), 0);
    const totalComments = filteredPosts.reduce((sum, post) => sum + (post.item?.stats?.commentCount || 0), 0);
    const totalShares = filteredPosts.reduce((sum, post) => sum + (post.item?.stats?.shareCount || 0), 0);

    const averageLikes = totalLikes / filteredPosts.length;
    const averageComments = totalComments / filteredPosts.length;
    const averageShares = totalShares / filteredPosts.length;

    // Format posts for the graph - no time filtering, show all posts from 2024
    const formatPostsForGraph = (posts) => {
        return posts
            .map(post => ({
                date: new Date(post.item?.createTime * 1000).toISOString().split('T')[0],
                likes: post.item?.stats?.diggCount || 0,
                comments: post.item?.stats?.commentCount || 0,
                shares: post.item?.stats?.shareCount || 0,
                totalEngagement: (post.item?.stats?.diggCount || 0) + 
                               (post.item?.stats?.commentCount || 0) + 
                               (post.item?.stats?.shareCount || 0)
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const formattedPosts = formatPostsForGraph(filteredPosts);

    // Group posts for current month view
    const getCurrentMonthPosts = (posts) => {
        const now = new Date('2025-04-18');
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        console.log('Filtering posts for current month:', startOfMonth.toISOString(), 'to', now.toISOString());
        
        const monthPosts = posts.filter(post => {
            const postDate = new Date(post.date);
            const isIncluded = postDate >= startOfMonth && postDate <= now;
            console.log(`Post date ${post.date}: ${isIncluded ? 'included' : 'excluded'}`);
            return isIncluded;
        });
        
        console.log(`Found ${monthPosts.length} posts for current month`);
        return monthPosts;
    };

    return {
        monthly: {
            posts: formattedPosts, // All posts from 2024 onwards
            averageLikes,
            averageComments,
            averageShares,
            totalPosts: filteredPosts.length
        },
        month: {
            posts: getCurrentMonthPosts(formattedPosts), // Current month (April 2025)
            averageLikes,
            averageComments,
            averageShares,
            totalPosts: filteredPosts.length
        }
    };
}

module.exports = { getTikTokEngagementMetrics }; 