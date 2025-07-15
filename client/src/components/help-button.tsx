import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { ChatInterface } from './chat-interface';

interface HelpButtonProps {
  initialMessage?: string;
}

export function HelpButton({ initialMessage }: HelpButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsChatOpen(true)}
        className="h-8 w-8 p-0"
        title="Get help with the platform"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
      
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        initialMessage={initialMessage}
      />
    </>
  );
}