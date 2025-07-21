import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SocialMediaRssGuide() {
  const { toast } = useToast();

  const socialPlatforms = [
    {
      name: "YouTube",
      difficulty: "Easy",
      badgeColor: "default" as const,
      description: "Channel RSS feeds available",
      steps: [
        "Go to the YouTube channel you want to follow",
        "Look for the channel ID in the URL or source code",
        "Use: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID"
      ],
      example: "https://www.youtube.com/feeds/videos.xml?channel_id=UCBJycsmduvYEL83R_U4JriQ",
      notes: "Replace CHANNEL_ID with actual channel ID"
    },
    {
      name: "Reddit",
      difficulty: "Easy", 
      badgeColor: "default" as const,
      description: "Subreddit RSS feeds built-in",
      steps: [
        "Navigate to any subreddit",
        "Add .rss to the end of the URL",
        "Copy the RSS feed URL"
      ],
      example: "https://www.reddit.com/r/technology.rss",
      notes: "Works for any public subreddit"
    },
    {
      name: "Medium",
      difficulty: "Easy",
      badgeColor: "default" as const,
      description: "User and publication feeds",
      steps: [
        "Go to the Medium user or publication",
        "Add /feed to the URL",
        "Copy the RSS feed URL"
      ],
      example: "https://medium.com/feed/@username",
      notes: "Works for users and publications"
    },
    {
      name: "LinkedIn",
      difficulty: "Medium",
      badgeColor: "secondary" as const,
      description: "Company pages and some user feeds",
      steps: [
        "Company pages: https://www.linkedin.com/company/COMPANY/posts/",
        "Add .rss to company posts URL",
        "Personal profiles have limited RSS support"
      ],
      example: "https://www.linkedin.com/company/microsoft/posts.rss",
      notes: "Only works for company pages, not personal profiles"
    },
    {
      name: "Instagram",
      difficulty: "Hard",
      badgeColor: "destructive" as const,
      description: "Requires RSS Bridge or third-party tools",
      steps: [
        "Use RSS Bridge (rss-bridge.org)",
        "Select Instagram bridge",
        "Enter username",
        "Generate RSS feed"
      ],
      example: "https://rss-bridge.org/bridge01/?action=display&bridge=Instagram&context=Username&u=USERNAME&format=Atom",
      notes: "Instagram doesn't provide official RSS"
    },
    {
      name: "Twitter/X", 
      difficulty: "Hard",
      badgeColor: "destructive" as const,
      description: "Requires RSS Bridge or third-party tools",
      steps: [
        "Use RSS Bridge or Nitter",
        "Enter Twitter username",
        "Generate RSS feed"
      ],
      example: "Use RSS Bridge Twitter bridge",
      notes: "Twitter removed official RSS support"
    },
    {
      name: "TikTok",
      difficulty: "Very Hard",
      badgeColor: "destructive" as const,
      description: "No official RSS support",
      steps: [
        "Use third-party tools",
        "RSS Bridge may have limited support",
        "Consider web scraping alternatives"
      ],
      example: "Limited options available",
      notes: "TikTok actively blocks RSS access"
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "RSS URL copied successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Social Media RSS Feed Guide</h3>
        <p className="text-gray-600 text-sm mb-4">
          Here's how to get RSS feeds from popular social media platforms:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialPlatforms.map((platform, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {platform.name}
                <Badge variant={platform.badgeColor}>{platform.difficulty}</Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">{platform.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Steps:</h4>
                <ol className="text-xs space-y-1">
                  {platform.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex">
                      <span className="mr-2 text-gray-500">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              {platform.example && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Example:</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 p-1 rounded flex-1 truncate">
                      {platform.example}
                    </code>
                    {platform.example.startsWith('http') && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(platform.example)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-amber-600">{platform.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">RSS Bridge</h4>
        <p className="text-xs text-blue-800 mb-2">
          RSS Bridge is a tool that generates RSS feeds for websites that don't provide them natively.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open('https://rss-bridge.org/', '_blank')}
          className="text-blue-700 border-blue-300 hover:bg-blue-100"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Visit RSS Bridge
        </Button>
      </div>
    </div>
  );
}