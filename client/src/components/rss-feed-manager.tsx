import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Rss, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAddRssFeed } from '@/hooks/use-rss-feeds';
import { SocialMediaRssGuide } from '@/components/social-media-rss-guide';

interface RssFeedManagerProps {
  category?: 'client' | 'custom' | 'project';
  onFeedAdded?: () => void;
}

export function RssFeedManager({ category = 'custom', onFeedAdded }: RssFeedManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeed, setNewFeed] = useState({
    name: '',
    rssUrl: '',
    category: category,
    fetchFrequency: 3600, // 1 hour in seconds
  });

  const { toast } = useToast();
  const addFeedMutation = useAddRssFeed();

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.rssUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and RSS URL",
        variant: "destructive",
      });
      return;
    }

    try {
      await addFeedMutation.mutateAsync(newFeed);
      toast({
        title: "RSS Feed Added",
        description: `${newFeed.name} has been added successfully`,
      });
      setIsAddDialogOpen(false);
      setNewFeed({
        name: '',
        rssUrl: '',
        category: category,
        fetchFrequency: 3600,
      });
      onFeedAdded?.();
    } catch (error) {
      toast({
        title: "Error Adding Feed",
        description: error instanceof Error ? error.message : "Failed to add RSS feed",
        variant: "destructive",
      });
    }
  };

  const getCategoryDisplayName = (cat: string) => {
    switch (cat) {
      case 'client': return 'Client Channel';
      case 'custom': return 'Custom Feed';
      case 'project': return 'Project Intelligence';
      default: return 'RSS Feed';
    }
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Rss className="h-4 w-4 mr-2" />
          Add {getCategoryDisplayName(category)}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {getCategoryDisplayName(category)}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="add-feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-feed">Add RSS Feed</TabsTrigger>
            <TabsTrigger value="social-guide">
              <HelpCircle className="h-4 w-4 mr-1" />
              Social Media Guide
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-feed" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="feed-name">Feed Name</Label>
              <Input
                id="feed-name"
                placeholder="e.g., TechCrunch, Industry News"
                value={newFeed.name}
                onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
              />
            </div>
          
            <div>
              <Label htmlFor="feed-url">RSS Feed URL</Label>
              <Input
                id="feed-url"
                placeholder="https://example.com/feed.xml"
                value={newFeed.rssUrl}
                onChange={(e) => setNewFeed({...newFeed, rssUrl: e.target.value})}
              />
              <div className="text-xs text-gray-500 mt-1">
                <p className="mb-1">Enter the RSS or Atom feed URL</p>
                <details className="cursor-pointer">
                  <summary className="text-blue-600 hover:text-blue-800">Social Media RSS Examples</summary>
                  <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200">
                    <p><strong>YouTube Channel:</strong> https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID</p>
                    <p><strong>Reddit Subreddit:</strong> https://www.reddit.com/r/SUBREDDIT.rss</p>
                    <p><strong>Medium User:</strong> https://medium.com/feed/@USERNAME</p>
                    <p><strong>LinkedIn Company:</strong> https://www.linkedin.com/company/COMPANY/posts.rss</p>
                    <p><strong>Instagram (via RSS Bridge):</strong> Use RSS Bridge service</p>
                    <p><strong>Twitter (via RSS Bridge):</strong> Use RSS Bridge service</p>
                    <p className="text-amber-600">Note: Some platforms require special tools or have limited RSS support</p>
                  </div>
                </details>
              </div>
            </div>

            <div>
              <Label htmlFor="feed-category">Category</Label>
              <Select 
                value={newFeed.category} 
                onValueChange={(value: 'client' | 'custom' | 'project') => 
                  setNewFeed({...newFeed, category: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Channels</SelectItem>
                  <SelectItem value="custom">Custom Feeds</SelectItem>
                  <SelectItem value="project">Project Intelligence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fetch-frequency">Update Frequency</Label>
              <Select 
                value={newFeed.fetchFrequency.toString()} 
                onValueChange={(value) => setNewFeed({...newFeed, fetchFrequency: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1800">Every 30 minutes</SelectItem>
                  <SelectItem value="3600">Every hour</SelectItem>
                  <SelectItem value="14400">Every 4 hours</SelectItem>
                  <SelectItem value="43200">Every 12 hours</SelectItem>
                  <SelectItem value="86400">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddFeed}
                disabled={addFeedMutation.isPending}
              >
                {addFeedMutation.isPending ? 'Adding...' : 'Add Feed'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="social-guide" className="mt-4">
            <SocialMediaRssGuide />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}