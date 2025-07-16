import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, Edit, Trash2, Tag, Globe, Calendar, ArrowUp } from "lucide-react";
import type { Signal } from "@shared/schema";

interface SignalCardProps {
  signal: Signal;
  onPromote?: (id: number, reason: string) => void;
  onUpdate?: (id: number, updates: Partial<Signal>) => void;
  onDelete?: (id: number) => void;
}

export function SignalCard({ signal, onPromote, onUpdate, onDelete }: SignalCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState(signal.userNotes || "");
  const [promotionReason, setPromotionReason] = useState("");

  const handlePromote = () => {
    if (onPromote) {
      onPromote(signal.id, promotionReason);
    }
  };

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(signal.id, { userNotes: editNotes });
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(signal.id);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'capture': return 'bg-blue-100 text-blue-800';
      case 'potential_signal': return 'bg-yellow-100 text-yellow-800';
      case 'signal': return 'bg-green-100 text-green-800';
      case 'insight': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {signal.title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusBadgeColor(signal.status)}>
              {signal.status.replace('_', ' ')}
            </Badge>
            {signal.confidence && (
              <Badge variant="outline">
                {signal.confidence}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}</span>
          </div>
          {signal.url && (
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <a href={signal.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View Source
              </a>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-700 line-clamp-3">
            {signal.summary}
          </p>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center space-x-1">
              <span className="text-gray-600">Sentiment:</span>
              <span className={getSentimentColor(signal.sentiment)}>
                {signal.sentiment}
              </span>
            </span>
            {signal.tone && (
              <span className="flex items-center space-x-1">
                <span className="text-gray-600">Tone:</span>
                <span>{signal.tone}</span>
              </span>
            )}
          </div>
        </div>

        {signal.keywords && signal.keywords.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-gray-600" />
            <div className="flex flex-wrap gap-1">
              {signal.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {signal.userNotes && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{signal.userNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Signal Notes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add your notes..."
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate}>
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>

          {signal.status === 'capture' && (
            <Button size="sm" onClick={handlePromote}>
              <ArrowUp className="h-4 w-4 mr-1" />
              Promote
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}