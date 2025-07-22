# Instagram Data Collection Guide - Bright Data Integration

## Available Instagram Data Through Your Platform

### **Current API Endpoints**

You already have these Instagram data endpoints set up:

1. **`POST /api/social/instagram/hashtags`** - Get hashtag data and trending posts
2. **`GET /api/trending/instagram`** - Get general Instagram trending data  
3. **`POST /api/bright-data/social`** - Advanced social media data collection

### **How to Access Full Instagram Data**

#### **Method 1: Using the Frontend Interface**

1. **Go to "Explore Signals" tab**
2. **Select "Trending Topics"**
3. **Filter by Instagram platform**
4. **Choose data type**:
   - Trending hashtags
   - Popular posts
   - Creator insights
   - Brand mentions

#### **Method 2: Direct API Calls**

**Get Hashtag Analysis:**
```bash
curl -X POST "http://localhost:5000/api/social/instagram/hashtags" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "hashtags": ["ai", "tech", "innovation"],
    "postType": "post",
    "limit": 50,
    "includeEngagement": true,
    "includeComments": true
  }'
```

**Get Profile Data:**
```bash
curl -X POST "http://localhost:5000/api/bright-data/social" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "platform": "instagram",
    "type": "profile",
    "usernames": ["nike", "apple", "tesla"],
    "includeMetrics": true
  }'
```

**Get Trending Content:**
```bash
curl -X GET "http://localhost:5000/api/trending/instagram" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### **Available Data Fields**

#### **Post Data**
- `caption` - Full post text with hashtags
- `likes` - Total like count
- `comments` - Comment count and comment text
- `shares` - Share/save counts
- `media` - Photos, videos, carousel items
- `hashtags` - All tags used
- `mentions` - User mentions
- `location` - Geo-tagged location data
- `timestamp` - Post creation time

#### **Profile Data**
- `username` - Account handle
- `displayName` - Profile display name
- `bio` - Profile description
- `followerCount` - Total followers
- `followingCount` - Accounts followed
- `postCount` - Total posts
- `verified` - Verification status
- `profileImage` - Profile photo URL
- `externalUrl` - Link in bio

#### **Engagement Metrics**
- `engagementRate` - Calculated engagement percentage
- `avgLikes` - Average likes per post
- `avgComments` - Average comments per post
- `reachEstimate` - Estimated post reach
- `viralityScore` - Trending potential

### **Advanced Data Collection**

#### **Competitor Analysis**
```javascript
// Analyze competitor Instagram strategy
const competitorData = await fetch('/api/bright-data/social', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'instagram',
    type: 'competitor_analysis',
    brands: ['nike', 'adidas', 'puma'],
    metrics: ['engagement', 'hashtags', 'posting_frequency'],
    timeframe: '30_days'
  })
});
```

#### **Trend Discovery**
```javascript
// Discover emerging Instagram trends
const trendData = await fetch('/api/social/instagram/hashtags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hashtags: ['fashion', 'beauty', 'lifestyle'],
    discoverRelated: true,
    includeInfluencers: true,
    sortBy: 'growth_rate'
  })
});
```

#### **Content Performance**
```javascript
// Analyze content performance patterns
const contentData = await fetch('/api/bright-data/social', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'instagram',
    type: 'content_analysis',
    hashtags: ['marketing', 'strategy'],
    filters: {
      minLikes: 1000,
      verified_only: false,
      timeframe: '7_days'
    }
  })
});
```

### **Integration with Truth Analysis**

All Instagram data flows through your Truth Analysis framework:

1. **Fact** - Raw engagement metrics and post data
2. **Observation** - Content patterns and trends
3. **Insight** - Strategic opportunities 
4. **Human Truth** - Audience behavior and preferences
5. **Cultural Moment** - Viral trends and cultural shifts

### **Current Collector Configuration**

Your Instagram collector ID: `gd_l1vikfch901nx3by4`

This collector can pull:
- Hashtag performance data
- Post engagement metrics
- Profile analytics
- Trending content discovery
- Creator insights
- Brand mention tracking

### **Rate Limits & Best Practices**

- **Cost Control**: Limited to 3 hashtags per request
- **Rate Limiting**: 2-second delays between requests
- **Data Freshness**: Real-time data with 3-8 second response times
- **Caching**: Results cached for 5 minutes to optimize performance

### **Example Response Data**

```json
{
  "platform": "instagram",
  "hashtag": "ai",
  "posts": [
    {
      "id": "post_123456",
      "caption": "The future of AI is here! 🚀 #ai #tech #innovation",
      "likes": 1247,
      "comments": 89,
      "engagement_rate": 0.078,
      "posted_at": "2025-01-22T10:30:00Z",
      "profile": {
        "username": "techcreator",
        "verified": true,
        "followers": 125000
      },
      "media": {
        "photos": ["https://instagram.com/p/photo1.jpg"],
        "type": "photo"
      },
      "hashtags": ["ai", "tech", "innovation", "future"],
      "location": "San Francisco, CA"
    }
  ],
  "totalPosts": 25,
  "avgEngagement": 0.065
}
```

## Next Steps

1. **Test the existing endpoints** to see current data quality
2. **Request additional data fields** if needed
3. **Configure custom collectors** for specific use cases
4. **Set up automated data collection** for ongoing intelligence

The Instagram data integration is fully operational and ready to provide comprehensive social media intelligence for your strategic analysis!