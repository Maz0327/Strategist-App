# YouTube API Setup Guide

## Current Issue
Your YouTube API key is blocked from using the Search API due to quota restrictions. Here's how to fix it:

## Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're logged in with the same account that created the API key
3. Select your project (or create a new one if needed)

## Step 2: Enable YouTube Data API v3
1. Go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on it and press **Enable** (if not already enabled)

## Step 3: Check Current Quotas
1. Go to **APIs & Services** > **Quotas**
2. Filter by "YouTube Data API v3"
3. Look for these quota limits:
   - **Queries per day**: Default is usually 10,000
   - **Queries per minute per user**: Default is usually 100

## Step 4: Request Quota Increase (If Needed)
1. In the Quotas page, find "YouTube Data API v3"
2. Click on the quota you want to increase
3. Click **Edit Quotas** button
4. Fill out the form explaining your use case:
   - **Use case**: "Strategic content analysis platform for business intelligence"
   - **Expected QPS**: 1-2 queries per second
   - **Justification**: "Fetching trending business and marketing content for strategic analysis"

## Step 5: Verify API Key Permissions
1. Go to **APIs & Services** > **Credentials**
2. Find your API key and click on it
3. Under **API restrictions**, make sure:
   - **YouTube Data API v3** is enabled
   - No IP restrictions are blocking your requests

## Step 6: Test the API
Once approved, you can test with this command:
```bash
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=business%20marketing&type=video&key=YOUR_API_KEY"
```

## Step 7: Monitor Usage
1. Go to **APIs & Services** > **Dashboard**
2. Click on **YouTube Data API v3**
3. Monitor your daily usage to stay within limits

## Alternative: Use YouTube Trending API
If Search API approval takes too long, you can use the Trending API which has fewer restrictions:
```bash
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&key=YOUR_API_KEY"
```

## Expected Timeline
- **Immediate**: API key verification and quota check
- **1-2 hours**: Quota increase request processing (for small increases)
- **1-3 days**: Review for larger quota requests

## Common Issues
1. **403 Forbidden**: API key needs quota approval
2. **429 Too Many Requests**: You've hit the rate limit
3. **400 Bad Request**: Check your query parameters

## Once Fixed
The system will automatically start pulling real YouTube data instead of showing the "API blocked" messages. You should see 8-10 trending videos instead of just 1 fallback message.