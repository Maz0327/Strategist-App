import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Users, ExternalLink, RefreshCw, Plus, Rss } from 'lucide-react';
import { StandardizedLoading } from '@/components/ui/standardized-loading';
import { RssFeedManager } from '@/components/rss-feed-manager';
import { useRssFeeds, useRssArticles } from '@/hooks/use-rss-feeds';
import { formatDistanceToNow } from 'date-fns';

interface FeedsHubProps {
  activeSubTab?: string;
  onNavigateToCapture: () => void;
  onNavigateToBrief: () => void;
}

export function FeedsHub({ activeSubTab = "client-feeds", onNavigateToCapture, onNavigateToBrief }: FeedsHubProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch RSS feeds and articles for each category
  const { data: clientFeeds } = useRssFeeds('client');
  const { data: customFeeds } = useRssFeeds('custom');
  const { data: projectFeeds } = useRssFeeds('project');
  
  const { data: clientArticles } = useRssArticles('client', 5);
  const { data: customArticles } = useRssArticles('custom', 5);
  const { data: projectArticles } = useRssArticles('project', 5);

  const renderClientChannels = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Channels</h2>
          <p className="text-gray-600">Industry intelligence and competitive monitoring</p>
        </div>
        <RssFeedManager category="client" />
      </div>
      
      {clientFeeds?.feeds?.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Client Channels</h3>
          <p className="text-gray-600 mb-4">Add RSS feeds to monitor client industry trends and competitive intelligence</p>
          <RssFeedManager category="client" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientFeeds?.feeds?.map((feed) => (
              <Card key={feed.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {feed.name}
                    <Badge variant={feed.status === 'active' ? 'default' : 'secondary'}>
                      {feed.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {feed.lastFetched ? formatDistanceToNow(new Date(feed.lastFetched), { addSuffix: true }) : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-medium">{feed.errorCount}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open(feed.rssUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Feed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {clientArticles?.articles && clientArticles.articles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Recent Articles</h3>
              <div className="space-y-2">
                {clientArticles.articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-600">
                        {article.author && `${article.author} • `}
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(article.url, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCustomFeeds = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Feeds</h2>
          <p className="text-gray-600">RSS feeds and curated data sources</p>
        </div>
        <RssFeedManager category="custom" />
      </div>
      
      {customFeeds?.feeds?.length === 0 ? (
        <div className="text-center py-12">
          <Rss className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Feeds</h3>
          <p className="text-gray-600 mb-4">Add RSS feeds from your favorite blogs, news sources, and industry publications</p>
          <RssFeedManager category="custom" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customFeeds?.feeds?.map((feed) => (
              <Card key={feed.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {feed.name}
                    <Badge variant="outline">RSS</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={feed.status === 'active' ? 'default' : 'secondary'}>
                        {feed.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {feed.lastFetched ? formatDistanceToNow(new Date(feed.lastFetched), { addSuffix: true }) : 'Never'}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open(feed.rssUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Feed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {customArticles?.articles && customArticles.articles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Recent Articles</h3>
              <div className="space-y-2">
                {customArticles.articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-600">
                        {article.author && `${article.author} • `}
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(article.url, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderProjectIntelligence = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Intelligence</h2>
          <p className="text-gray-600">Market trends and strategic insights</p>
        </div>
        <RssFeedManager category="project" />
      </div>
      
      {projectFeeds?.feeds?.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Intelligence Feeds</h3>
          <p className="text-gray-600 mb-4">Add RSS feeds to monitor market trends and strategic insights for your projects</p>
          <RssFeedManager category="project" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectFeeds?.feeds?.map((feed) => (
              <Card key={feed.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {feed.name}
                    <Badge variant="outline">Intelligence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={feed.status === 'active' ? 'default' : 'secondary'}>
                        {feed.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {feed.lastFetched ? formatDistanceToNow(new Date(feed.lastFetched), { addSuffix: true }) : 'Never'}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open(feed.rssUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Feed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {projectArticles?.articles && projectArticles.articles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Recent Articles</h3>
              <div className="space-y-2">
                {projectArticles.articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-xs text-gray-600">
                        {article.author && `${article.author} • `}
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Recently'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(article.url, '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <StandardizedLoading 
        title="Loading Feeds"
        subtitle="Gathering your intelligence sources"
      />
    );
  }

  return (
    <div className="space-y-6">
      {activeSubTab === "client-feeds" && renderClientChannels()}
      {activeSubTab === "custom-feeds" && renderCustomFeeds()}
      {activeSubTab === "project-feeds" && renderProjectIntelligence()}
      
      {!activeSubTab && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Intelligence Feeds</h2>
            <p className="text-gray-600">Select a feed type from the sidebar to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}