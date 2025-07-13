import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Smile, VolumeX, TrendingUp, Edit, Save, FileText } from "lucide-react";

interface AnalysisResultsProps {
  analysis: {
    analysis: {
      summary: string;
      sentiment: string;
      tone: string;
      keywords: string[];
      confidence: string;
    };
    signalId: number;
  };
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const { summary, sentiment, tone, keywords, confidence } = analysis.analysis;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <Smile className="text-green-600" size={16} />;
      case 'negative':
        return <VolumeX className="text-red-600" size={16} />;
      default:
        return <TrendingUp className="text-yellow-600" size={16} />;
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Analysis Results
          </CardTitle>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle size={12} className="mr-1" />
            Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">AI Summary</h4>
          <p className="text-sm text-blue-800">{summary}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`border rounded-lg p-4 ${getSentimentColor(sentiment)}`}>
            <div className="flex items-center gap-2">
              {getSentimentIcon(sentiment)}
              <div>
                <p className="text-sm font-medium">Sentiment</p>
                <p className="text-sm">{sentiment}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <VolumeX className="text-purple-600" size={16} />
              <div>
                <p className="text-sm font-medium text-purple-900">Tone</p>
                <p className="text-sm text-purple-700">{tone}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-orange-600" size={16} />
              <div>
                <p className="text-sm font-medium text-orange-900">Confidence</p>
                <p className="text-sm text-orange-700">{confidence}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Strategic Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" size="sm">
            <Edit size={16} className="mr-2" />
            Edit Tags
          </Button>
          <Button variant="ghost" size="sm">
            <Save size={16} className="mr-2" />
            Save Signal
          </Button>
          <Button size="sm">
            <FileText size={16} className="mr-2" />
            Export Brief
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
