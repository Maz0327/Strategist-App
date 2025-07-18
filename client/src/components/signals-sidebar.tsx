import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Signal } from "@shared/schema";

interface SignalsSidebarProps {
  onNavigateToTrending?: (platform?: string) => void;
  onNavigateToCapture?: () => void;
  onNavigateToBrief?: () => void;
  collapsed?: boolean;
}

export function SignalsSidebar({ 
  onNavigateToTrending, 
  onNavigateToCapture, 
  onNavigateToBrief, 
  collapsed = false 
}: SignalsSidebarProps = {}) {
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
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-l border-gray-200 transition-all duration-300 ${collapsed ? 'overflow-hidden' : ''}`}>
      <div className="p-4 space-y-4">
        {/* Recent Signals */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className={`font-semibold ${collapsed ? 'text-xs text-center' : 'text-lg'}`}>
              {collapsed ? 'Recent' : 'Recent Signals'}
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-3 ${collapsed ? 'p-2' : ''}`}>
            {error && (
              <div className="text-center py-4">
                <p className={`text-gray-500 ${collapsed ? 'text-xs' : 'text-sm'}`}>
                  {collapsed ? 'Error' : 'Unable to load signals'}
                </p>
              </div>
            )}
            {!error && signals.length === 0 && (
              <div className="text-center py-4">
                <p className={`text-gray-500 ${collapsed ? 'text-xs' : 'text-sm'}`}>
                  {collapsed ? 'No data' : 'No signals yet'}
                </p>
                {!collapsed && (
                  <p className="text-xs text-gray-400 mt-1">Analyze content to create your first signal</p>
                )}
              </div>
            )}
            {signals.slice(0, collapsed ? 1 : 3).map((signal) => (
              <div key={signal.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <div className={`flex items-start ${collapsed ? 'flex-col' : 'justify-between'} gap-2`}>
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-medium truncate ${collapsed ? 'text-xs' : 'text-sm'}`}>
                      {collapsed ? signal.title.substring(0, 10) + '...' : signal.title}
                    </h4>
                    {!collapsed && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className={`${getSentimentColor(signal.sentiment)} ${collapsed ? 'text-xs px-1' : ''}`}>
                    {collapsed ? signal.sentiment.substring(0, 3) : signal.sentiment}
                  </Badge>
                </div>
              </div>
            ))}
            {signals.length > 3 && !collapsed && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'manage' } }))}
              >
                View All Signals
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
