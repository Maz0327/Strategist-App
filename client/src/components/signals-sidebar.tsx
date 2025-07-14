import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

interface SignalsSidebarProps {
  onNavigateToTrending?: (platform?: string) => void;
}

export function SignalsSidebar({ onNavigateToTrending }: SignalsSidebarProps = {}) {
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
      {/* Trending Topics */}
      <Card className="card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900">
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {mockTrendingTopics.map((topic, index) => (
              <div
                key={index}
                onClick={() => onNavigateToTrending?.(topic.platform)}
                className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    {topic.platform.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 truncate">{topic.title}</p>
                    <p className="text-xs text-gray-500">{topic.platform}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {topic.icon}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-7 text-xs"
              onClick={() => onNavigateToTrending?.()}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
