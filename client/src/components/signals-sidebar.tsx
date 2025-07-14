import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

export function SignalsSidebar() {
  const { data: signalsData, error } = useQuery<{ signals: Signal[] }>({
    queryKey: ["/api/signals"],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/signals', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch signals");
        }
        return response.json();
      } catch (error) {
        console.warn('Failed to fetch signals for sidebar:', error);
        return { signals: [] };
      }
    },
  });

  const signals = signalsData?.signals || [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const mockTrendingTopics = [
    {
      title: "Gen Z Marketing",
      platform: "reddit",
      icon: "🔥",
      status: "Hot"
    },
    {
      title: "Voice Search SEO",
      platform: "twitter",
      icon: "📈",
      status: "Rising"
    },
    {
      title: "Privacy-First Marketing",
      platform: "google",
      icon: "🚀",
      status: "Trending"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Recent Signals */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Recent Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {signals.length === 0 ? (
              <p className="text-sm text-gray-500">No signals yet. Analyze some content to get started!</p>
            ) : (
              signals.slice(0, 3).map((signal) => (
                <div
                  key={signal.id}
                  className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {signal.title || "Untitled Analysis"}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(signal.createdAt!), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {signal.summary || "Analysis in progress..."}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge
                      className={getSentimentColor(signal.sentiment || "neutral")}
                      variant="secondary"
                    >
                      {signal.sentiment || "Neutral"}
                    </Badge>
                    <div className="flex space-x-1">
                      <span className="text-xs text-gray-500">
                        {signal.keywords?.length || 0} keywords
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {signals.length > 3 && (
            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-blue-700">
              View All Signals
              <ArrowRight size={16} className="ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-32 overflow-y-auto">
            {mockTrendingTopics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    {topic.platform.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{topic.title}</p>
                    <p className="text-xs text-gray-500">{topic.platform}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {topic.icon} {topic.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
