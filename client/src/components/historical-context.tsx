import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

interface HistoricalContextProps {
  historical?: {
    pattern: 'emerging' | 'mature_growth' | 'cyclical' | 'exponential' | 'steady_growth' | 'unknown';
    currentPhase: 'emerging' | 'growing' | 'mature' | 'plateau' | 'declining' | 'cyclical' | 'new_normal' | 'mainstream' | 'analysis_needed';
    insight: string;
    peaks: number[];
  };
}

export function HistoricalContext({ historical }: HistoricalContextProps) {
  if (!historical) return null;

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'emerging': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'mature_growth': return <BarChart3 className="h-3 w-3 text-blue-500" />;
      case 'cyclical': return <Clock className="h-3 w-3 text-purple-500" />;
      case 'exponential': return <TrendingUp className="h-3 w-3 text-orange-500" />;
      case 'steady_growth': return <BarChart3 className="h-3 w-3 text-teal-500" />;
      default: return <AlertCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'emerging': return 'bg-green-100 text-green-800';
      case 'growing': return 'bg-blue-100 text-blue-800';
      case 'mature': return 'bg-orange-100 text-orange-800';
      case 'plateau': return 'bg-yellow-100 text-yellow-800';
      case 'declining': return 'bg-red-100 text-red-800';
      case 'cyclical': return 'bg-purple-100 text-purple-800';
      case 'new_normal': return 'bg-teal-100 text-teal-800';
      case 'mainstream': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case 'emerging': return 'Emerging';
      case 'mature_growth': return 'Mature Growth';
      case 'cyclical': return 'Cyclical';
      case 'exponential': return 'Exponential';
      case 'steady_growth': return 'Steady Growth';
      default: return 'Unknown';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'emerging': return 'Emerging';
      case 'growing': return 'Growing';
      case 'mature': return 'Mature';
      case 'plateau': return 'Plateau';
      case 'declining': return 'Declining';
      case 'cyclical': return 'Cyclical';
      case 'new_normal': return 'New Normal';
      case 'mainstream': return 'Mainstream';
      default: return 'Analysis Needed';
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Historical Context</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getPatternIcon(historical.pattern)}
            <span className="ml-1">{getPatternLabel(historical.pattern)}</span>
          </Badge>
          <Badge className={`text-xs ${getPhaseColor(historical.currentPhase)}`}>
            {getPhaseLabel(historical.currentPhase)}
          </Badge>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">
        {historical.insight}
      </p>
      
      {historical.peaks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Previous peaks:</span>
          {historical.peaks.map((peak, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {peak}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoricalContextSummary({ topics }: { topics: any[] }) {
  const historicalTopics = topics.filter(t => t.metadata?.historical);
  
  if (historicalTopics.length === 0) return null;

  const matureCount = historicalTopics.filter(t => 
    t.metadata?.historical?.currentPhase === 'mature' || 
    t.metadata?.historical?.currentPhase === 'plateau' ||
    t.metadata?.historical?.currentPhase === 'mainstream'
  ).length;

  const emergingCount = historicalTopics.filter(t => 
    t.metadata?.historical?.currentPhase === 'emerging' ||
    t.metadata?.historical?.currentPhase === 'growing'
  ).length;

  const cyclicalCount = historicalTopics.filter(t => 
    t.metadata?.historical?.pattern === 'cyclical'
  ).length;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Historical Trend Analysis</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-600">{matureCount}</div>
            <div className="text-sm text-gray-600">Mature Trends</div>
            <div className="text-xs text-gray-500">Require differentiation</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{emergingCount}</div>
            <div className="text-sm text-gray-600">Emerging Trends</div>
            <div className="text-xs text-gray-500">Early adoption opportunity</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-600">{cyclicalCount}</div>
            <div className="text-sm text-gray-600">Cyclical Trends</div>
            <div className="text-xs text-gray-500">Current wave analysis</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}