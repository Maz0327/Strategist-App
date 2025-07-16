import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Video, Eye, Trash2, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VisualCapture {
  id: number;
  captureType: 'screenshot' | 'recording';
  imageData?: string;
  extractedText?: string;
  ocrMetadata?: any;
  recordingData?: any;
  tabInfo?: {
    title: string;
    url: string;
    favicon?: string;
  };
  isProcessed: boolean;
  analysisId?: number;
  createdAt: string;
}

interface VisualCapturesProps {
  userId?: number;
}

export default function VisualCaptures({ userId }: VisualCapturesProps) {
  const [selectedCapture, setSelectedCapture] = useState<VisualCapture | null>(null);
  const { toast } = useToast();

  const { data: captures, isLoading, refetch } = useQuery({
    queryKey: ['/api/visual-captures'],
    queryFn: async () => {
      const response = await fetch('/api/visual-captures', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch visual captures');
      }
      const data = await response.json();
      return data.captures as VisualCapture[];
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/visual-captures/${id}`, {
        method: 'DELETE',
      });
      toast({
        title: "Success",
        description: "Visual capture deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete visual capture",
        variant: "destructive",
      });
    }
  };

  const handleViewAnalysis = (analysisId: number) => {
    // Navigate to the analysis (signal) view
    window.location.href = `/signals/${analysisId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!captures || captures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Visual Captures
          </CardTitle>
          <CardDescription>
            No visual captures yet. Use the Chrome extension to capture screenshots and recordings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visual Captures</h2>
        <Badge variant="secondary">
          {captures.length} capture{captures.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {captures.map((capture) => (
          <Card key={capture.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {capture.captureType === 'screenshot' ? (
                    <Camera className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Video className="h-5 w-5 text-purple-600" />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {capture.tabInfo?.title || 'Untitled Capture'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(capture.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {capture.isProcessed && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Processed
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {capture.captureType}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {capture.tabInfo?.url && (
                <div className="text-sm text-gray-600 truncate">
                  {capture.tabInfo.url}
                </div>
              )}

              {capture.extractedText && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Extracted Text</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {capture.extractedText}
                  </p>
                </div>
              )}

              {capture.imageData && (
                <div className="relative">
                  <img
                    src={capture.imageData}
                    alt="Screenshot"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => setSelectedCapture(capture)}
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedCapture(capture)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {capture.analysisId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAnalysis(capture.analysisId!)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Analysis
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(capture.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for viewing full screenshot */}
      {selectedCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedCapture.tabInfo?.title || 'Visual Capture'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCapture(null)}
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4">
              {selectedCapture.imageData && (
                <img
                  src={selectedCapture.imageData}
                  alt="Full screenshot"
                  className="w-full h-auto"
                />
              )}
              {selectedCapture.extractedText && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Extracted Text:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedCapture.extractedText}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}