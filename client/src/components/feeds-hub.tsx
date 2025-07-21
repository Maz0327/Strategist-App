import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Users, ExternalLink, RefreshCw, Plus } from 'lucide-react';
import { StandardizedLoading } from '@/components/ui/standardized-loading';

interface FeedsHubProps {
  activeSubTab?: string;
  onNavigateToCapture: () => void;
  onNavigateToBrief: () => void;
}

export function FeedsHub({ activeSubTab = "client-feeds", onNavigateToCapture, onNavigateToBrief }: FeedsHubProps) {
  const [isLoading, setIsLoading] = useState(false);

  const renderClientChannels = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Channels</h2>
          <p className="text-gray-600">Industry intelligence and competitive monitoring</p>
        </div>
        <Button onClick={onNavigateToCapture}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Industry News", sources: 12, status: "Active", updates: 24 },
          { name: "Competitor Watch", sources: 8, status: "Active", updates: 16 },
          { name: "Market Reports", sources: 5, status: "Active", updates: 8 }
        ].map((channel, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {channel.name}
                <Badge variant="secondary">{channel.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sources:</span>
                  <span className="font-medium">{channel.sources}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today's Updates:</span>
                  <span className="font-medium">{channel.updates}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomFeeds = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Feeds</h2>
          <p className="text-gray-600">RSS feeds and curated data sources</p>
        </div>
        <Button onClick={onNavigateToCapture}>
          <Plus className="h-4 w-4 mr-2" />
          Add RSS Feed
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Tech Blogs", type: "RSS", items: 45, status: "Active" },
          { name: "Marketing News", type: "RSS", items: 32, status: "Active" },
          { name: "Startup Updates", type: "RSS", items: 28, status: "Active" }
        ].map((feed, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {feed.name}
                <Badge variant="outline">{feed.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary">{feed.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{feed.items}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Feed
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProjectIntelligence = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Intelligence</h2>
          <p className="text-gray-600">Market trends and strategic insights</p>
        </div>
        <Button onClick={onNavigateToBrief}>
          <Brain className="h-4 w-4 mr-2" />
          Generate Brief
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Market Trends", insights: 18, priority: "High", updated: "2h ago" },
          { name: "Consumer Behavior", insights: 23, priority: "Medium", updated: "4h ago" },
          { name: "Cultural Moments", insights: 15, priority: "High", updated: "6h ago" }
        ].map((project, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {project.name}
                <Badge variant={project.priority === "High" ? "destructive" : "secondary"}>
                  {project.priority}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Insights:</span>
                  <span className="font-medium">{project.insights}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">{project.updated}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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