import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, MessageCircle, Image, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
}

export function SectionedContentDisplay({ 
  sections, 
  onTextChange, 
  isReadOnly = false 
}: SectionedContentDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Text Content Section - Always Visible */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">Text Content</CardTitle>
            <Badge variant="outline" className="text-xs">
              {sections.text.hasContent ? 'Content Found' : 'No Content'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sections.text.hasContent ? (
            <Textarea
              value={sections.text.content}
              onChange={onTextChange ? (e) => onTextChange(e.target.value) : undefined}
              readOnly={isReadOnly}
              className="min-h-[120px] resize-none"
              placeholder="Text content will appear here..."
            />
          ) : (
            <div className="flex items-center justify-center h-[120px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No text content detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Transcript Section - Conditional */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-red-500" />
            <CardTitle className="text-sm font-medium">Video Transcript</CardTitle>
            <Badge 
              variant={sections.transcript.hasContent ? "default" : "secondary"} 
              className="text-xs"
            >
              {sections.transcript.hasContent ? 
                `${sections.transcript.platform || 'Video'} Transcript` : 
                'No Transcript'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sections.transcript.hasContent ? (
            <Textarea
              value={sections.transcript.content}
              readOnly={true}
              className="min-h-[100px] resize-none bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              placeholder="Video transcript will appear here..."
            />
          ) : (
            <div className="flex items-center justify-center h-[100px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No transcript detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section - Conditional */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <CardTitle className="text-sm font-medium">Comments & Discussions</CardTitle>
            <Badge 
              variant={sections.comments.hasContent ? "default" : "secondary"} 
              className="text-xs"
            >
              {sections.comments.hasContent ? 
                `${sections.comments.count} Comments` : 
                'No Comments'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sections.comments.hasContent ? (
            <Textarea
              value={sections.comments.content}
              readOnly={true}
              className="min-h-[80px] resize-none bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
              placeholder="Comments will appear here..."
            />
          ) : (
            <div className="flex items-center justify-center h-[80px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No comments detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Section - Conditional */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-medium">Images & Media</CardTitle>
            <Badge 
              variant={sections.images.hasContent ? "default" : "secondary"} 
              className="text-xs"
            >
              {sections.images.hasContent ? 
                `${sections.images.count} Images` : 
                'No Images'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sections.images.hasContent ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sections.images.urls.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img
                    src={imageUrl}
                    alt={`Extracted image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[80px] text-muted-foreground bg-muted/30 rounded-md border-2 border-dashed">
              <div className="text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No images detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}