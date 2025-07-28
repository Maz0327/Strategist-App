import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Search, Plus, FolderOpen, Target, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const NAV_ITEMS = [
  { id: 'briefing', label: 'Briefing', icon: Home },
  { id: 'workspaces', label: 'Workspaces', icon: FolderOpen },
  { id: 'capture', label: 'Capture', icon: Plus },
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'brief', label: 'Brief', icon: Target },
  { id: 'manage', label: 'Manage', icon: Settings }
];

export function MobileNav({ activeTab, onTabChange, className }: MobileNavProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom",
      className
    )}>
      <div className="grid grid-cols-6 h-16">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-none h-full border-0",
              "min-h-[64px] py-2 text-xs font-medium",
              activeTab === item.id 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] leading-none">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}