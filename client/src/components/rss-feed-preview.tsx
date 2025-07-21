import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, User, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  category?: string;
}

interface RSSFeedPreviewProps {
  feedName: string;
  feedUrl: string;
}

export function RSSFeedPreview({ feedName, feedUrl }: RSSFeedPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [articles, setArticles] = useState<RSSItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFeedPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, we'll show a helpful message since RSS parsing would need a proxy
      // In a production app, you'd send this to your backend to parse
      setError("RSS feed preview is coming soon! For now, this opens the raw feed.");
      
      // Simulate some sample articles for demo
      setTimeout(() => {
        setArticles([
          {
            title: "RSS feed preview is being built",
            link: feedUrl,
            description: "We're working on a proper RSS reader interface that will show articles in a readable format instead of raw XML. Coming soon!",
            pubDate: new Date().toISOString(),
            author: "System"
          }
        ]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      setError("Could not load feed preview");
      setIsLoading(false);
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

  const handleOpenFeed = () => {
    if (isOpen) {
      fetchFeedPreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        fetchFeedPreview();
      }
    }}>
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(feedUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Raw Feed
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchFeedPreview}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading feed preview...</span>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">RSS Reader Coming Soon</p>
                <p className="text-yellow-700 text-sm mt-1">
                  We're building a proper RSS reader that will show articles in a clean, readable format. 
                  For now, you can click "Open Raw Feed" to view the XML feed directly, or copy the URL to use in your favorite RSS reader app.
                </p>
                <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                  <strong>Feed URL:</strong> {feedUrl}
                </div>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(feedUrl);
                      toast({
                        title: "URL Copied",
                        description: "Feed URL copied to clipboard",
                      });
                    }}
                  >
                    Copy Feed URL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {articles.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              Found {articles.length} articles
            </div>
            
            {articles.map((article, index) => (
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
            <p>Last checked: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}