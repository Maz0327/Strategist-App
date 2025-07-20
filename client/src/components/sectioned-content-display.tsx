import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, MessageCircle, Image, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ContentSection {
  content: string;
  hasContent: boolean;
}

interface TranscriptSection extends ContentSection {
  platform?: string | null;
  metadata?: any;
}

interface CommentsSection extends ContentSection {
  count: number;
}

interface ImagesSection {
  urls: string[];
  hasContent: boolean;
  count: number;
}

interface ContentSections {
  text: ContentSection;
  transcript: TranscriptSection;
  comments: CommentsSection;
  images: ImagesSection;
}

interface SectionedContentDisplayProps {
  sections: ContentSections;
  onTextChange?: (content: string) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
}

export function SectionedContentDisplay({ 
  sections, 
  onTextChange, 
  isReadOnly = false,
  isLoading = false
}: SectionedContentDisplayProps) {
  // Loading skeleton component
  const LoadingSkeleton = ({ height = "120px" }: { height?: string }) => (
    <div 
      className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md"
      style={{ height }}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        
        {/* Loading Text Section */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <CardTitle className="text-sm font-medium">Extracting Text Content...</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LoadingSkeleton height="100px" />
          </CardContent>
        </Card>

        {/* Loading Video Section */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              <CardTitle className="text-sm font-medium">Checking for Video Content...</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LoadingSkeleton height="80px" />
          </CardContent>
        </Card>

        {/* Loading Comments Section */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              <CardTitle className="text-sm font-medium">Analyzing Comments...</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LoadingSkeleton height="60px" />
          </CardContent>
        </Card>

        {/* Loading Images Section */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              <CardTitle className="text-sm font-medium">Extracting Images...</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <LoadingSkeleton height="60px" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Text Content Section - Always Visible */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <CardTitle className="text-sm font-medium">Text Content</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs w-fit">
              {sections.text.hasContent ? 'Content Found' : 'No Content'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sections.text.hasContent ? (
            <Textarea
              value={sections.text.content}
              onChange={onTextChange ? (e) => onTextChange(e.target.value) : undefined}
              readOnly={isReadOnly}
              className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
              placeholder="Text content will appear here..."
            />
          ) : (
            <div className="flex items-center justify-center h-[100px] sm:h-[120px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center px-4">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs sm:text-sm">No text content detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Transcript Section - Conditional */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-red-500 flex-shrink-0" />
              <CardTitle className="text-sm font-medium">Video Transcript</CardTitle>
            </div>
            <Badge 
              variant={sections.transcript.hasContent ? "default" : "secondary"} 
              className="text-xs w-fit"
            >
              {sections.transcript.hasContent ? 
                `${sections.transcript.platform || 'Video'} Transcript` : 
                'No Transcript'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sections.transcript.hasContent ? (
            <Textarea
              value={sections.transcript.content}
              readOnly={true}
              className="min-h-[80px] sm:min-h-[100px] resize-none bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-sm"
              placeholder="Video transcript will appear here..."
            />
          ) : (
            <div className="flex items-center justify-center h-[80px] sm:h-[100px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center px-4">
                <Video className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs sm:text-sm">No transcript detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section - Conditional */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <CardTitle className="text-sm font-medium">Comments & Discussions</CardTitle>
            </div>
            <Badge 
              variant={sections.comments.hasContent ? "default" : "secondary"} 
              className="text-xs w-fit"
            >
              {sections.comments.hasContent ? 
                `${sections.comments.count} Comments` : 
                'No Comments'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sections.comments.hasContent ? (
            <Textarea
              value={sections.comments.content}
              readOnly={true}
              className="min-h-[60px] sm:min-h-[80px] resize-none bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-sm"
              placeholder="Comments will appear here..."
            />
          ) : (
            <div className="flex items-center justify-center h-[60px] sm:h-[80px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center px-4">
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs sm:text-sm">No comments detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Section - Conditional */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <CardTitle className="text-sm font-medium">Images & Media</CardTitle>
            </div>
            <Badge 
              variant={sections.images.hasContent ? "default" : "secondary"} 
              className="text-xs w-fit"
            >
              {sections.images.hasContent ? 
                `${sections.images.count} Images` : 
                'No Images'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sections.images.hasContent ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {sections.images.urls.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img
                    src={imageUrl}
                    alt={`Extracted image ${index + 1}`}
                    className="w-full h-16 sm:h-20 md:h-24 object-cover rounded-md border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[60px] sm:h-[80px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center px-4">
                <Image className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs sm:text-sm">No images detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}