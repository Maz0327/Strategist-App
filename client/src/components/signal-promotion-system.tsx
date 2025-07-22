import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Flag, 
  Archive,
  Star,
  MessageCircle
} from "lucide-react";

interface SignalPromotionSystemProps {
  signalId: number;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  className?: string;
}

const SIGNAL_STATUSES = {
  capture: {
    label: "Capture",
    description: "Initial content capture",
    color: "bg-gray-100 text-gray-800",
    icon: Archive
  },
  potential_signal: {
    label: "Potential Signal",
    description: "Content flagged for research",
    color: "bg-yellow-100 text-yellow-800",
    icon: Flag
  },
  signal: {
    label: "Signal",
    description: "Validated strategic content",
    color: "bg-blue-100 text-blue-800",
    icon: Target
  },
  validated_signal: {
    label: "Validated Signal",
    description: "High-confidence strategic insight",
    color: "bg-green-100 text-green-800",
    icon: Star
  },
  archived: {
    label: "Archived",
    description: "No longer relevant",
    color: "bg-gray-100 text-gray-600",
    icon: Archive
  }
};

export function SignalPromotionSystem({ 
  signalId, 
  currentStatus, 
  onStatusChange,
  className = ""
}: SignalPromotionSystemProps) {
  const [isPromoting, setIsPromoting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [promotionReason, setPromotionReason] = useState("");
  const { toast } = useToast();

  const currentStatusInfo = SIGNAL_STATUSES[currentStatus as keyof typeof SIGNAL_STATUSES];
  const selectedStatusInfo = SIGNAL_STATUSES[selectedStatus as keyof typeof SIGNAL_STATUSES];

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast({
        title: "No Change",
        description: "Status is already set to this value",
        variant: "default"
      });
      return;
    }

    if (!promotionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this status change",
        variant: "destructive"
      });
      return;
    }

    setIsPromoting(true);

    try {
      const response = await apiRequest('PUT', `/api/signals/${signalId}`, {
        status: selectedStatus,
        promotionReason,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Signal ${getStatusChangeDescription(currentStatus, selectedStatus)}`,
          duration: 3000
        });

        onStatusChange?.(selectedStatus);
        setPromotionReason("");
      } else {
        throw new Error("Failed to update signal status");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update signal status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const getStatusChangeDescription = (from: string, to: string): string => {
    if (from === 'capture' && to === 'potential_signal') return 'flagged for research';
    if (from === 'potential_signal' && to === 'signal') return 'promoted to validated signal';
    if (from === 'signal' && to === 'validated_signal') return 'upgraded to high-confidence signal';
    if (to === 'archived') return 'archived';
    return `status changed to ${SIGNAL_STATUSES[to as keyof typeof SIGNAL_STATUSES]?.label}`;
  };

  const getAvailableStatuses = (): string[] => {
    switch (currentStatus) {
      case 'capture':
        return ['potential_signal', 'archived'];
      case 'potential_signal':
        return ['signal', 'capture', 'archived'];
      case 'signal':
        return ['validated_signal', 'potential_signal', 'archived'];
      case 'validated_signal':
        return ['signal', 'archived'];
      case 'archived':
        return ['capture', 'potential_signal', 'signal', 'validated_signal'];
      default:
        return Object.keys(SIGNAL_STATUSES);
    }
  };

  const getPromotionIcon = () => {
    const statusOrder = ['capture', 'potential_signal', 'signal', 'validated_signal'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const selectedIndex = statusOrder.indexOf(selectedStatus);
    
    if (selectedIndex > currentIndex) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (selectedIndex < currentIndex) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-blue-600" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {currentStatusInfo && React.createElement(currentStatusInfo.icon, { className: "h-5 w-5" })}
          Signal Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge className={currentStatusInfo?.color}>
              {currentStatusInfo?.label}
            </Badge>
          </div>
          <span className="text-xs text-gray-600">
            {currentStatusInfo?.description}
          </span>
        </div>

        {/* Status Change Controls */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Change Status To:
            </label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableStatuses().map(status => {
                  const statusInfo = SIGNAL_STATUSES[status as keyof typeof SIGNAL_STATUSES];
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {React.createElement(statusInfo.icon, { className: "h-4 w-4" })}
                        <span>{statusInfo.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus !== currentStatus && (
            <>
              {/* Change Preview */}
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                {getPromotionIcon()}
                <span className="text-sm">
                  <span className="font-medium">{currentStatusInfo?.label}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium">{selectedStatusInfo?.label}</span>
                </span>
              </div>

              {/* Reason Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Reason for Change: <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Explain why this status change is appropriate..."
                  value={promotionReason}
                  onChange={(e) => setPromotionReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Action Button */}
              <Button
                onClick={handleStatusUpdate}
                disabled={isPromoting || !promotionReason.trim()}
                className="w-full flex items-center gap-2"
              >
                {isPromoting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  getPromotionIcon()
                )}
                {getStatusChangeDescription(currentStatus, selectedStatus)}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}