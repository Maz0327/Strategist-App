import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Star, X, Send, Bug, Lightbulb, MessageCircle, ThumbsUp } from "lucide-react";

interface FeedbackData {
  type: string;
  category: string;
  rating?: number;
  title: string;
  description: string;
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    type: '',
    category: '',
    rating: undefined,
    title: '',
    description: '',
  });
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackData) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
      });
      setIsOpen(false);
      setFeedbackData({
        type: '',
        category: '',
        rating: undefined,
        title: '',
        description: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackData.type || !feedbackData.title || !feedbackData.description) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    submitFeedbackMutation.mutate(feedbackData);
  };

  const handleStarClick = (rating: number) => {
    setFeedbackData(prev => ({ ...prev, rating }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature_request': return <Lightbulb className="h-4 w-4" />;
      case 'rating': return <Star className="h-4 w-4" />;
      case 'general': return <MessageCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 border-red-200';
      case 'feature_request': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rating': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'general': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-4 right-20 z-50 md:bottom-20 md:right-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-shadow"
              size="sm"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="feedback-dialog-desc">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Feedback
              </DialogTitle>
            </DialogHeader>
            <div id="feedback-dialog-desc" className="sr-only">
              Submit feedback about your experience with the platform, including bug reports, feature requests, and ratings.
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type Selection */}
              <div className="space-y-3">
                <Label>What type of feedback is this?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'bug', label: 'Bug Report', icon: <Bug className="h-4 w-4" /> },
                    { value: 'feature_request', label: 'Feature Request', icon: <Lightbulb className="h-4 w-4" /> },
                    { value: 'rating', label: 'Rating', icon: <Star className="h-4 w-4" /> },
                    { value: 'general', label: 'General', icon: <MessageCircle className="h-4 w-4" /> },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={feedbackData.type === type.value ? "default" : "outline"}
                      onClick={() => setFeedbackData(prev => ({ ...prev, type: type.value }))}
                      className="h-auto p-3 flex-col gap-1"
                    >
                      {type.icon}
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={feedbackData.category} onValueChange={(value) => setFeedbackData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui">User Interface</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="functionality">Functionality</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating (if rating type selected) */}
              {feedbackData.type === 'rating' && (
                <div className="space-y-2">
                  <Label>How would you rate your experience?</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (hoveredStar || feedbackData.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={feedbackData.title}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={feedbackData.description}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about your feedback..."
                  rows={4}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitFeedbackMutation.isPending}>
                  {submitFeedbackMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

// Quick feedback component for specific actions
interface QuickFeedbackProps {
  feature: string;
  onFeedback: (rating: number, comment?: string) => void;
}

export function QuickFeedback({ feature, onFeedback }: QuickFeedbackProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleRating = (rating: number) => {
    if (rating <= 3) {
      setShowComment(true);
    } else {
      onFeedback(rating);
    }
  };

  const handleSubmitWithComment = () => {
    onFeedback(3, comment);
    setShowComment(false);
    setComment('');
  };

  return (
    <Card className="max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">How was your experience with {feature}?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Star className="h-5 w-5 text-gray-300 hover:text-yellow-400" />
            </button>
          ))}
        </div>
        
        {showComment && (
          <div className="space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could we improve?"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmitWithComment}>
                Submit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowComment(false)}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}