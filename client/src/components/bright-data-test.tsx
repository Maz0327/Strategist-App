import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Instagram, Twitter, Linkedin, Music } from 'lucide-react';

interface BrightDataResults {
  platform: string;
  results: any;
  count: number;
  timestamp: string;
}

export default function BrightDataTest() {
  const [platform, setPlatform] = useState<string>('');
  const [hashtags, setHashtags] = useState<string>('ai,tech,strategy');
  const [keywords, setKeywords] = useState<string>('ai,innovation');
  const [location, setLocation] = useState<string>('worldwide');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BrightDataResults | null>(null);
  const [error, setError] = useState<string>('');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'tiktok': return <Music className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleTest = async () => {
    if (!platform) {
      setError('Please select a platform');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const params: any = {};
      
      if (platform === 'instagram') {
        params.hashtags = hashtags.split(',').map(h => h.trim());
      } else if (platform === 'twitter') {
        params.location = location;
      } else if (platform === 'linkedin') {
        params.keywords = keywords.split(',').map(k => k.trim());
      }

      const response = await fetch('/api/bright-data/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          platform,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to test Bright Data integration');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlatformParams = () => {
    switch (platform) {
      case 'instagram':
        return (
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="ai,tech,strategy"
            />
          </div>
        );
      case 'twitter':
        return (
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="worldwide"
            />
          </div>
        );
      case 'linkedin':
        return (
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="ai,innovation"
            />
          </div>
        );
      case 'tiktok':
        return (
          <div className="space-y-2">
            <Label>TikTok Trends</Label>
            <p className="text-sm text-muted-foreground">No additional parameters needed</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!results) return null;

    const data = results.results;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPlatformIcon(results.platform)}
            {results.platform.charAt(0).toUpperCase() + results.platform.slice(1)} Results
            <Badge variant="secondary">{results.count} items</Badge>
          </CardTitle>
          <CardDescription>
            Retrieved at {new Date(results.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.platform === 'instagram' && data.posts && (
              <div>
                <h4 className="font-semibold mb-2">Posts ({data.posts.length})</h4>
                {data.posts.map((post: any, i: number) => (
                  <div key={i} className="border rounded p-3 mb-2">
                    <p className="text-sm mb-1">{post.caption}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>❤️ {post.likes?.toLocaleString()}</span>
                      <span>💬 {post.comments}</span>
                      <span>📈 {(post.engagement_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {post.hashtags?.map((tag: string, j: number) => (
                        <Badge key={j} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.platform === 'twitter' && data.trends && (
              <div>
                <h4 className="font-semibold mb-2">Trending Topics</h4>
                {data.trends.map((trend: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border rounded p-2 mb-1">
                    <span className="font-medium">{trend.name}</span>
                    <Badge variant="secondary">{trend.tweet_volume?.toLocaleString()} tweets</Badge>
                  </div>
                ))}
              </div>
            )}

            {results.platform === 'tiktok' && data.videos && (
              <div>
                <h4 className="font-semibold mb-2">Trending Videos</h4>
                {data.videos.map((video: any, i: number) => (
                  <div key={i} className="border rounded p-3 mb-2">
                    <p className="text-sm mb-1">{video.description}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>👀 {video.views?.toLocaleString()}</span>
                      <span>❤️ {video.likes?.toLocaleString()}</span>
                      <span>🔄 {video.shares}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.platform === 'linkedin' && data.posts && (
              <div>
                <h4 className="font-semibold mb-2">Professional Posts</h4>
                {data.posts.map((post: any, i: number) => (
                  <div key={i} className="border rounded p-3 mb-2">
                    <p className="text-sm mb-2">{post.text}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{post.profile?.name} • {post.profile?.company}</span>
                      <div className="flex gap-2">
                        <span>👍 {post.reactions}</span>
                        <span>💬 {post.comments}</span>
                        <span>🔄 {post.reposts}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-muted rounded text-sm">
              <strong>Raw API Response:</strong>
              <pre className="mt-2 overflow-x-auto text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Bright Data Social Media Scrapers Test</CardTitle>
          <CardDescription>
            Test the integration with Bright Data's specialized social media APIs for Instagram, Twitter, TikTok, and LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Select Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a social media platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram Posts & Profiles
                  </div>
                </SelectItem>
                <SelectItem value="twitter">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter Trends & Posts
                  </div>
                </SelectItem>
                <SelectItem value="tiktok">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    TikTok Trending Videos
                  </div>
                </SelectItem>
                <SelectItem value="linkedin">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn Professional Content
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {platform && renderPlatformParams()}

          <Button 
            onClick={handleTest} 
            disabled={isLoading || !platform}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing {platform} integration...
              </>
            ) : (
              <>
                {getPlatformIcon(platform)}
                <span className="ml-2">Test {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Platform'} Scraper</span>
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {renderResults()}
    </div>
  );
}