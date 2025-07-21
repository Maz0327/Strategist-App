import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, User, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  category?: string;
}

interface FeedData {
  articles: FeedItem[];
}

interface FeedViewerProps {
  feedId: number;
  feedName: string;
  feedUrl: string;
}

export function FeedViewer({ feedId, feedName, feedUrl }: FeedViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: feedData, isLoading, error, refetch } = useQuery<FeedData>({
    queryKey: [`/api/rss-feeds/${feedId}/articles`],
    enabled: isOpen,
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Feed refreshed",
        description: "Latest articles loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh failed", 
        description: "Could not fetch latest articles",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View Feed
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{feedName}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading feed articles...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Failed to load feed</p>
            <p className="text-red-600 text-sm mt-1">
              The RSS feed might be temporarily unavailable or the URL might be incorrect.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        )}

        {feedData?.articles && feedData.articles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No articles found in this feed</p>
            <p className="text-gray-500 text-sm mt-1">
              The feed might be empty or not updated recently
            </p>
          </div>
        )}

        {feedData?.articles && feedData.articles.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              Found {feedData.articles.length} articles
            </div>
            
            {feedData.articles.map((article: FeedItem, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-2 leading-tight">
                      {article.title}
                    </h3>
                    
                    {article.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {stripHtml(article.description)}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {article.pubDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(article.pubDate)}
                        </div>
                      )}
                      
                      {article.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {article.author}
                        </div>
                      )}
                      
                      {article.category && (
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(article.link, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Read
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="mb-1">RSS Feed URL: {feedUrl}</p>
            <p>Last refreshed: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}