import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { HELP_MESSAGES } from './contextual-help';

interface QuickHelpTooltipProps {
  section: keyof typeof HELP_MESSAGES;
  children: React.ReactNode;
}

export function QuickHelpTooltip({ section, children }: QuickHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div className="relative group">
            {children}
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              <HelpCircle className="h-3 w-3 text-blue-500" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{HELP_MESSAGES[section]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}