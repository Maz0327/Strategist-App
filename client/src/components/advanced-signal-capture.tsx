import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe2, 
  Camera, 
  Video, 
  FileText, 
  Zap, 
  Target, 
  Brain,
  Link,
  Upload,
  Sparkles,
  Activity,
  Eye,
  Users,
  TrendingUp
} from "lucide-react";
import { AnimatedLoadingState } from "@/components/ui/animated-loading-state";

interface SocialMediaMetadata {
  platform: string;
  engagement: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  profile: {
    username: string;
    verified: boolean;
    followers?: number;
  };
  extractionMethod: string;
}

interface CaptureResult {
  success: boolean;
  analysis: any;
  socialMetadata?: SocialMediaMetadata;
  visualAssets?: any[];
  extractionMethod: string;
}

export function AdvancedSignalCapture() {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [activeTab, setActiveTab] = useState('url-capture');

  // Platform detection
  const detectPlatform = (url: string) => {
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('youtube.com')) return 'YouTube';
    if (url.includes('trends.google.com')) return 'Google Trends';
    return 'Web';
  };

  const handleAdvancedCapture = async () => {
    if (!url.trim()) return;

    setIsCapturing(true);
    setCaptureResult(null);

    try {
      const platform = detectPlatform(url);
      const isSocialMedia = ['Instagram', 'Twitter', 'TikTok', 'LinkedIn'].includes(platform);

      // Use enhanced analysis endpoint for social media URLs
      const endpoint = isSocialMedia ? '/api/analyze/deep' : '/api/analyze';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: url.trim(),
          userNotes: notes.trim(),
          lengthPreference: 'medium',
          enhancedSocial: isSocialMedia,
          extractVisuals: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      setCaptureResult({
        success: true,
        analysis: result.analysis,
        socialMetadata: result.socialMediaMetadata,
        visualAssets: result.visualAssets,
        extractionMethod: result.extractionMethod || (isSocialMedia ? 'Browser API' : 'Standard')
      });

    } catch (error: any) {
      setCaptureResult({
        success: false,
        analysis: { error: error.message },
        extractionMethod: 'Failed'
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleTestBrowserAPI = async () => {
    if (!url.trim()) return;

    setIsCapturing(true);
    try {
      const response = await fetch('/api/bright-data/browser-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();
      setCaptureResult({
        success: result.success,
        analysis: result.data,
        extractionMethod: result.method
      });
    } catch (error: any) {
      setCaptureResult({
        success: false,
        analysis: { error: error.message },
        extractionMethod: 'Browser API Failed'
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const platform = detectPlatform(url);
  const isSocialMedia = ['Instagram', 'Twitter', 'TikTok', 'LinkedIn'].includes(platform);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Signal Capture</h2>
            <p className="text-gray-600">Enhanced with Bright Data Browser API for real-time social intelligence</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Browser API</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Real browser instances</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Live Engagement</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Real-time metrics</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Anti-Detection</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Residential IPs</p>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Truth Analysis</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Strategic insights</p>
          </div>
        </div>
      </div>

      {/* Capture Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url-capture" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL Capture
          </TabsTrigger>
          <TabsTrigger value="media-capture" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Media Capture
          </TabsTrigger>
          <TabsTrigger value="batch-capture" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Batch Capture
          </TabsTrigger>
        </TabsList>

        {/* URL Capture Tab */}
        <TabsContent value="url-capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Enhanced URL Analysis
                {isSocialMedia && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Activity className="h-3 w-3 mr-1" />
                    Browser API Enabled
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://instagram.com/p/... or any URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  {url && (
                    <Badge variant="outline" className="px-3 py-2">
                      {platform}
                    </Badge>
                  )}
                </div>
                {isSocialMedia && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Enhanced with real-time engagement data via Browser API
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Strategic Notes (Optional)</label>
                <Textarea
                  placeholder="Add context, observations, or strategic insights..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleAdvancedCapture}
                  disabled={!url.trim() || isCapturing}
                  className="flex items-center gap-2 flex-1"
                >
                  {isCapturing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Truth Analysis
                    </>
                  )}
                </Button>

                {isSocialMedia && (
                  <Button 
                    onClick={handleTestBrowserAPI}
                    disabled={!url.trim() || isCapturing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Globe2 className="h-4 w-4" />
                    Test Browser API
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {captureResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {captureResult.success ? (
                    <>
                      <Sparkles className="h-5 w-5 text-green-500" />
                      Analysis Complete
                    </>
                  ) : (
                    <>
                      <Target className="h-5 w-5 text-red-500" />
                      Analysis Failed
                    </>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {captureResult.extractionMethod}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Social Media Metadata */}
                {captureResult.socialMetadata && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Live Social Intelligence
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-blue-700">Platform</p>
                        <p className="font-medium text-blue-900">{captureResult.socialMetadata.platform}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Username</p>
                        <p className="font-medium text-blue-900 flex items-center gap-1">
                          {captureResult.socialMetadata.profile.username}
                          {captureResult.socialMetadata.profile.verified && (
                            <Badge className="text-xs bg-blue-600">✓</Badge>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Engagement</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(captureResult.socialMetadata.engagement).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Method</p>
                        <p className="font-medium text-blue-900">{captureResult.socialMetadata.extractionMethod}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                <div className="space-y-3">
                  <h4 className="font-medium">Extracted Content</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap text-gray-700">
                      {JSON.stringify(captureResult.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Media Capture Tab */}
        <TabsContent value="media-capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Visual & Video Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Chrome extension screenshot and video analysis coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Capture Tab */}
        <TabsContent value="batch-capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Batch URL Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">Batch URL Processing</h4>
                <p className="text-gray-600 mb-4">Upload multiple URLs for simultaneous analysis</p>
                <Button disabled className="bg-gray-300 hover:bg-gray-300 cursor-not-allowed">
                  <Upload className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
                <p className="text-xs text-gray-500 mt-2">Feature under development - will support CSV upload and bulk processing</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}