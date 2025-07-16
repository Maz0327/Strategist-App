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
      {/* Sidebar content removed - trending moved to dedicated section */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">
          Navigation focused on core workflow
        </p>
      </div>
    </div>
  );
}
