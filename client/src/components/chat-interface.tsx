import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, MessageCircle, HelpCircle, BookOpen } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: number;
  message: string;
  response?: string;
  messageType: 'user' | 'assistant';
  createdAt: string;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export function ChatInterface({ isOpen, onClose, initialMessage }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (initialMessage && isOpen) {
      setMessage(initialMessage);
    }
  }, [initialMessage, isOpen]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId: string }) => {
      const response = await apiRequest('/api/chat/message', {
        method: 'POST',
        body: { message, sessionId }
      });
      return response;
    },
    onSuccess: (data) => {
      // Update session ID if new session created
      setSessionId(data.sessionId);
      
      // Add user message and bot response to chat history
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          message: message,
          response: data.response,
          messageType: 'user',
          createdAt: new Date().toISOString()
        }
      ]);
      
      setMessage('');
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Add error message to chat
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          message: message,
          response: "I'm having trouble processing your message right now. Please try again.",
          messageType: 'user',
          createdAt: new Date().toISOString()
        }
      ]);
      setMessage('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      sessionId
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    "Where can I find trending topics?",
    "How do I create a strategic brief?",
    "What's the difference between a signal and a capture?",
    "How do I use the Chrome extension?",
    "What does the Define → Shift → Deliver framework mean?",
    "How do I add an RSS feed to Custom Watch?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Strategic Platform Assistant</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {chatHistory.length === 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-blue-600 mb-4">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">I can help you navigate the platform</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Try asking me about:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-left p-2 text-sm bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg max-w-xs">
                        {chat.message}
                      </div>
                    </div>
                    {chat.response && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg max-w-md">
                          <div className="whitespace-pre-wrap text-sm">{chat.response}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about the platform..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}