import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Users, Target, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface DailyReport {
  id: string;
  date: string;
  summary: string;
  topSignals: Array<{
    id: number;
    title: string;
    status: string;
    viralPotential: string;
    culturalMoment: string;
    attentionValue: string;
    createdAt: string;
  }>;
  trendingTopics: Array<{
    topic: string;
    category: string;
    urgency: string;
    signalCount: number;
  }>;
  strategicInsights: string[];
  actionItems: string[];
  cohortOpportunities: string[];
  competitiveGaps: string[];
  stats: {
    totalSignals: number;
    newSignals: number;
    potentialSignals: number;
    validatedSignals: number;
    avgConfidence: number;
    topCategories: Array<{ category: string; count: number }>;
  };
}

export function DailyReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/reports/daily', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/reports/daily?date=${selectedDate}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch daily report');
      }
      return response.json() as Promise<DailyReport>;
    },
    retry: false
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signal': return 'bg-green-100 text-green-800 border-green-200';
      case 'potential_signal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'capture': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertCircle className="h-3 w-3" />;
      case 'high': return <Zap className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Daily Signal Report</h2>
          <p className="text-gray-600">Loading report...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Report</h3>
        <p className="text-gray-600 mb-4">Failed to generate daily report</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Report Available</h3>
        <p className="text-gray-600">No data found for the selected date</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daily Signal Report</h2>
          <p className="text-gray-600">Strategic briefing for {new Date(report.date).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.stats.totalSignals}</div>
              <div className="text-sm text-gray-600">Total Signals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{report.stats.newSignals}</div>
              <div className="text-sm text-gray-600">New Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{report.stats.potentialSignals}</div>
              <div className="text-sm text-gray-600">Potential Signals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{report.stats.validatedSignals}</div>
              <div className="text-sm text-gray-600">Validated</div>
            </div>
          </div>
          
          {report.stats.topCategories.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Top Categories</h4>
              <div className="flex flex-wrap gap-2">
                {report.stats.topCategories.map(({ category, count }) => (
                  <Badge key={category} variant="secondary">
                    {category} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Signals */}
      {report.topSignals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Top Performing Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.topSignals.map((signal) => (
                <div key={signal.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{signal.title}</h4>
                    <Badge className={getStatusColor(signal.status)}>
                      {signal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{signal.culturalMoment}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Viral Potential: {signal.viralPotential}</span>
                    <span>Attention: {signal.attentionValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Topics */}
      {report.trendingTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.trendingTopics.map((topic, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{topic.topic}</h4>
                    <Badge className={getUrgencyColor(topic.urgency)}>
                      {getUrgencyIcon(topic.urgency)}
                      {topic.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="outline">{topic.category}</Badge>
                    <span>{topic.signalCount} signals</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Insights & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategic Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.strategicInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.actionItems.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Opportunities & Competitive Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cohort Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.cohortOpportunities.map((cohort, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{cohort}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Competitive Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.competitiveGaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{gap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}