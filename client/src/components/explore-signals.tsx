import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingTopics } from "@/components/trending-topics";
import { SignalMiningDashboard } from "@/components/signal-mining-dashboard";
import { ReactiveContentBuilder } from "@/components/reactive-content-builder";
import { SystemSuggestions } from "@/components/system-suggestions";
import { TrendingUp, Zap, Activity, Brain } from "lucide-react";

interface ExploreSignalsProps {
  activeSubTab?: string;
}

export function ExploreSignals({ activeSubTab }: ExploreSignalsProps) {
  const [activeTab, setActiveTab] = useState(activeSubTab || "trending");
  const [selectedNiche, setSelectedNiche] = useState<string>("all");

  const niches = [
    { value: "all", label: "All Industries" },
    { value: "tech", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "retail", label: "Retail & E-commerce" },
    { value: "entertainment", label: "Entertainment" },
    { value: "education", label: "Education" },
    { value: "automotive", label: "Automotive" },
    { value: "food", label: "Food & Beverage" },
    { value: "fashion", label: "Fashion & Beauty" },
    { value: "travel", label: "Travel & Hospitality" },
    { value: "sports", label: "Sports & Fitness" },
    { value: "sustainability", label: "Sustainability" },
    { value: "b2b", label: "B2B Services" },
    { value: "nonprofit", label: "Non-profit" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Explore Signals</h2>
          <p className="text-gray-600 mt-1">Discover what's happening across platforms and identify opportunities</p>
        </div>
        
        {/* Niche Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filter by niche:</span>
          <select 
            value={selectedNiche} 
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {niches.map(niche => (
              <option key={niche.value} value={niche.value}>
                {niche.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explore Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4" data-tutorial="explore-tabs">
          <TabsTrigger value="trending" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trending Topics</span>
          </TabsTrigger>
          <TabsTrigger value="signals" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Signal Mining</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Real-time Opportunities</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Smart Prompts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Across Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div data-tutorial="trending-topics">
                <TrendingTopics />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Cultural Intelligence Mining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SignalMiningDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Real-time Content Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReactiveContentBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Smart Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SystemSuggestions />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}