import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye, Upload, X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Define types for better TypeScript support
type AnalysisElement = string | { title?: string; description?: string; [key: string]: any };

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface VisualAnalysisResult {
  brandElements: AnalysisElement[];
  culturalMoments: AnalysisElement[];
  competitiveInsights: AnalysisElement[];
  strategicRecommendations: AnalysisElement[];
  confidenceScore: number;
}

export function StandaloneVisualIntelligence() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [contextInput, setContextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VisualAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const imageUrl = URL.createObjectURL(file);
        
        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: imageUrl,
          name: file.name
        };
        
        setUploadedImages(prev => [...prev, newImage]);
      }
    });

    // Reset input
    event.target.value = '';
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Convert images to base64
      const imageData = await Promise.all(
        uploadedImages.map(async (img) => {
          const base64 = await convertToBase64(img.file);
          return `data:${img.file.type};base64,${base64}`;
        })
      );

      const response = await apiRequest('/api/analyze/visual', 'POST', {
        images: imageData,
        context: contextInput || 'Strategic visual analysis of uploaded images',
        analysisType: 'comprehensive'
      });

      // apiRequest returns already parsed JSON
      setAnalysisResults(response);
    } catch (error: any) {
      console.error('Visual analysis error:', error);
      setError(error.message || 'Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
    setUploadedImages([]);
    setContextInput('');
    setAnalysisResults(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Standalone Visual Intelligence
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload images for independent visual analysis using Gemini 2.5 Pro - no URL required
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-upload-standalone" className="text-sm font-medium">
              Upload Images for Analysis
            </Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="image-upload-standalone"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="image-upload-standalone"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                Choose Images
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Upload JPG, PNG, GIF, or WebP images (multiple files supported)
              </p>
            </div>
          </div>

          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Uploaded Images ({uploadedImages.length})
                </h4>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative border rounded-lg overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs">
                      {image.name}
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Context Input Section */}
        <div>
          <Label htmlFor="context-input" className="text-sm font-medium">
            Context (Optional)
          </Label>
          <Textarea
            id="context-input"
            placeholder="Provide context about your images (e.g., brand name, campaign details, industry) to enhance analysis quality..."
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>

        {/* Analysis Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || uploadedImages.length === 0}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Images...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Analyze with Gemini 2.5 Pro
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Visual Analysis Results</h3>
              <Badge variant="outline" className="text-xs">
                Confidence: {analysisResults.confidenceScore}%
              </Badge>
            </div>

            {/* Brand Elements */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="font-semibold text-blue-900">Brand Visual Elements</h4>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-700 leading-relaxed">
                  {Array.isArray(analysisResults.brandElements) 
                    ? analysisResults.brandElements.map((element: AnalysisElement, i: number) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {typeof element === 'string' ? element : element.description || element.title || String(element)}
                        </p>
                      ))
                    : typeof analysisResults.brandElements === 'string'
                      ? <p>{analysisResults.brandElements}</p>
                      : <p>No brand elements identified</p>
                  }
                </div>
              </div>
            </div>

            {/* Cultural Moments */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h4 className="font-semibold text-purple-900">Cultural Visual Moments</h4>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-gray-700 leading-relaxed">
                  {Array.isArray(analysisResults.culturalMoments) 
                    ? analysisResults.culturalMoments.map((moment: AnalysisElement, i: number) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {typeof moment === 'string' ? moment : moment.description || moment.title || String(moment)}
                        </p>
                      ))
                    : typeof analysisResults.culturalMoments === 'string'
                      ? <p>{analysisResults.culturalMoments}</p>
                      : <p>No cultural moments identified</p>
                  }
                </div>
              </div>
            </div>

            {/* Competitive Insights */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold text-green-900">Competitive Visual Positioning</h4>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-gray-700 leading-relaxed">
                  {Array.isArray(analysisResults.competitiveInsights) 
                    ? analysisResults.competitiveInsights.map((insight: AnalysisElement, i: number) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {typeof insight === 'string' ? insight : insight.description || insight.title || String(insight)}
                        </p>
                      ))
                    : typeof analysisResults.competitiveInsights === 'string'
                      ? <p>{analysisResults.competitiveInsights}</p>
                      : <p>No competitive insights identified</p>
                  }
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            {analysisResults.strategicRecommendations && analysisResults.strategicRecommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <h4 className="font-semibold text-orange-900">Strategic Recommendations</h4>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {Array.isArray(analysisResults.strategicRecommendations) 
                      ? analysisResults.strategicRecommendations.map((rec: AnalysisElement, i: number) => (
                          <p key={i} className="mb-2 last:mb-0">
                            • {typeof rec === 'string' ? rec : rec.description || rec.title || String(rec)}
                          </p>
                        ))
                      : <p>{String(analysisResults.strategicRecommendations)}</p>
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}