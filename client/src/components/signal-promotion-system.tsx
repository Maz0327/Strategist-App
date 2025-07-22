import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Flag, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

type SignalStatus = 'capture' | 'potential_signal' | 'signal' | 'validated_signal';

interface SignalPromotionSystemProps {
  signalId: number;
  currentStatus: SignalStatus;
  title: string;
  onStatusChange?: (newStatus: SignalStatus, reasoning?: string) => void;
  className?: string;
}

const statusConfig = {
  capture: {
    label: 'Capture',
    color: 'secondary',
    icon: Flag,
    description: 'Raw content captured for review'
  },
  potential_signal: {
    label: 'Potential Signal',
    color: 'yellow',
    icon: AlertCircle,
    description: 'Content flagged as potentially valuable'
  },
  signal: {
    label: 'Signal',
    color: 'blue',
    icon: Star,
    description: 'Validated content with strategic value'
  },
  validated_signal: {
    label: 'Validated Signal',
    color: 'green',
    icon: CheckCircle,
    description: 'High-value strategic intelligence'
  }
};

const statusOrder: SignalStatus[] = ['capture', 'potential_signal', 'signal', 'validated_signal'];

export function SignalPromotionSystem({
  signalId,
  currentStatus,
  title,
  onStatusChange,
  className = ''
}: SignalPromotionSystemProps) {
  const [isPromoting, setIsPromoting] = useState(false);
  const [reasoning, setReasoning] = useState('');
  const { toast } = useToast();

  const currentIndex = statusOrder.indexOf(currentStatus);
  const canPromote = currentIndex < statusOrder.length - 1;
  const canDemote = currentIndex > 0;

  const handlePromote = async () => {
    if (!canPromote) return;
    
    const newStatus = statusOrder[currentIndex + 1];
    
    try {
      setIsPromoting(true);
      
      // Call API to update signal status
      const response = await fetch('/api/signals/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          signalId,
          newStatus,
          reasoning: reasoning.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to promote signal');
      }

      const result = await response.json();
      
      if (result.success) {
        onStatusChange?.(newStatus, reasoning);
        toast({
          title: "Signal promoted",
          description: `"${title}" promoted to ${statusConfig[newStatus].label}`,
        });
        setReasoning('');
      } else {
        throw new Error(result.error || 'Promotion failed');
      }
    } catch (error) {
      toast({
        title: "Promotion failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDemote = async () => {
    if (!canDemote) return;
    
    const newStatus = statusOrder[currentIndex - 1];
    
    try {
      setIsPromoting(true);
      
      const response = await fetch('/api/signals/demote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          signalId,
          newStatus,
          reasoning: reasoning.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to demote signal');
      }

      const result = await response.json();
      
      if (result.success) {
        onStatusChange?.(newStatus, reasoning);
        toast({
          title: "Signal demoted",
          description: `"${title}" moved to ${statusConfig[newStatus].label}`,
        });
        setReasoning('');
      } else {
        throw new Error(result.error || 'Demotion failed');
      }
    } catch (error) {
      toast({
        title: "Demotion failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const currentConfig = statusConfig[currentStatus];
  const CurrentIcon = currentConfig.icon;

  return (
    <Card className={`${className} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CurrentIcon className="h-4 w-4" />
          Signal Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={currentConfig.color as any}>
              <CurrentIcon className="h-3 w-3 mr-1" />
              {currentConfig.label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentConfig.description}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / statusOrder.length) * 100}%` }}
          />
        </div>

        {/* Reasoning Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Reasoning (optional)
          </label>
          <Textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Why are you changing this signal's status?"
            className="text-xs"
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePromote}
            disabled={!canPromote || isPromoting}
            size="sm"
            className="flex-1 gap-2"
            variant="default"
          >
            <ChevronUp className="h-3 w-3" />
            Promote
            {canPromote && ` to ${statusConfig[statusOrder[currentIndex + 1]].label}`}
          </Button>
          
          <Button
            onClick={handleDemote}
            disabled={!canDemote || isPromoting}
            size="sm"
            className="flex-1 gap-2"
            variant="outline"
          >
            <ChevronDown className="h-3 w-3" />
            Demote
            {canDemote && ` to ${statusConfig[statusOrder[currentIndex - 1]].label}`}
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="text-xs text-center text-muted-foreground">
          {currentIndex + 1} of {statusOrder.length} stages
        </div>
      </CardContent>
    </Card>
  );
}