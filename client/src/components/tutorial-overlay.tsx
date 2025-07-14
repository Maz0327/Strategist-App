import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  page: string;
}

interface TutorialOverlayProps {
  currentPage: string;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const tutorialSteps: TutorialStep[] = [
  // Today's Briefing Page
  {
    id: "briefing-overview",
    target: "[data-tutorial='briefing-tabs']",
    title: "Three Intelligence Feeds",
    content: "Your strategic intelligence is organized into three feeds: Client Pulse (project data), Custom Watch (RSS feeds), and Market Intelligence (filtered content).",
    position: "bottom",
    page: "briefing"
  },
  {
    id: "briefing-refresh",
    target: "[data-tutorial='refresh-button']",
    title: "Refresh Content",
    content: "Click here to fetch the latest content from your configured feeds and data sources.",
    position: "left",
    page: "briefing"
  },
  {
    id: "briefing-settings",
    target: "[data-tutorial='settings-button']",
    title: "Feed Settings",
    content: "Configure your RSS feeds and topic preferences to personalize your intelligence feeds.",
    position: "left",
    page: "briefing"
  },

  // New Signal Capture Page
  {
    id: "capture-input",
    target: "[data-tutorial='content-input']",
    title: "Content Analysis",
    content: "Enter text or paste a URL to analyze content for strategic insights and cultural intelligence.",
    position: "bottom",
    page: "capture"
  },
  {
    id: "capture-analyze",
    target: "[data-tutorial='analyze-button']",
    title: "AI Analysis",
    content: "Our AI analyzes content for sentiment, cultural moments, viral potential, and strategic opportunities.",
    position: "top",
    page: "capture"
  },
  {
    id: "capture-results",
    target: "[data-tutorial='analysis-results']",
    title: "Strategic Insights",
    content: "Review the comprehensive analysis including truth frameworks, cohort suggestions, and competitive insights.",
    position: "top",
    page: "capture"
  },

  // Explore Signals Page
  {
    id: "explore-tabs",
    target: "[data-tutorial='explore-tabs']",
    title: "Signal Discovery",
    content: "Explore trending topics, signal mining, reactive opportunities, and smart prompts across 16+ platforms.",
    position: "bottom",
    page: "explore"
  },
  {
    id: "explore-trending",
    target: "[data-tutorial='trending-topics']",
    title: "Real-time Trends",
    content: "Monitor trending topics from Google Trends, Reddit, YouTube, and multiple news sources for strategic opportunities.",
    position: "bottom",
    page: "explore"
  },
  {
    id: "explore-analyze",
    target: "[data-tutorial='trend-analyze']",
    title: "Convert to Signal",
    content: "Transform trending topics into strategic signals with one-click analysis and cultural intelligence.",
    position: "top",
    page: "explore"
  },

  // Strategic Brief Lab Page
  {
    id: "brief-framework",
    target: "[data-tutorial='brief-framework']",
    title: "Define → Shift → Deliver",
    content: "Build strategic briefs using our proven framework: Define the challenge, Shift the perspective, Deliver the solution.",
    position: "bottom",
    page: "brief"
  },
  {
    id: "brief-signals",
    target: "[data-tutorial='signal-selection']",
    title: "Signal Selection",
    content: "Choose from your validated signals to build compelling strategic narratives and briefs.",
    position: "right",
    page: "brief"
  },

  // Manage Page
  {
    id: "manage-dashboard",
    target: "[data-tutorial='dashboard-view']",
    title: "Signal Management",
    content: "Manage your signals, view performance metrics, and track the progression from capture to insight.",
    position: "bottom",
    page: "manage"
  },
  {
    id: "manage-sources",
    target: "[data-tutorial='sources-tab']",
    title: "Source Management",
    content: "Track and manage all your content sources with reliability scoring and metadata.",
    position: "bottom",
    page: "manage"
  }
];

export function TutorialOverlay({ currentPage, isEnabled, onToggle }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const currentPageSteps = tutorialSteps.filter(step => step.page === currentPage);

  useEffect(() => {
    if (isEnabled && currentPageSteps.length > 0) {
      setCurrentStep(0);
      setShowWelcome(true);
    }
  }, [isEnabled, currentPage]);

  const nextStep = () => {
    if (currentStep < currentPageSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getElementPosition = (target: string) => {
    const element = document.querySelector(target);
    if (!element) return { top: 0, left: 0, width: 0, height: 0 };
    
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  };

  const getTooltipPosition = (step: TutorialStep) => {
    const elementPos = getElementPosition(step.target);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(320, viewportWidth - 40);
    const tooltipHeight = Math.min(200, viewportHeight - 40);
    const padding = 12;

    let position = { top: 0, left: 0 };

    // Calculate initial position based on preferred direction
    switch (step.position) {
      case 'top':
        position = {
          top: elementPos.top - tooltipHeight - padding,
          left: elementPos.left + (elementPos.width / 2) - (tooltipWidth / 2)
        };
        break;
      case 'bottom':
        position = {
          top: elementPos.top + elementPos.height + padding,
          left: elementPos.left + (elementPos.width / 2) - (tooltipWidth / 2)
        };
        break;
      case 'left':
        position = {
          top: elementPos.top + (elementPos.height / 2) - (tooltipHeight / 2),
          left: elementPos.left - tooltipWidth - padding
        };
        break;
      case 'right':
        position = {
          top: elementPos.top + (elementPos.height / 2) - (tooltipHeight / 2),
          left: elementPos.left + elementPos.width + padding
        };
        break;
      default:
        position = { top: 0, left: 0 };
    }

    // Adjust for viewport boundaries
    // Keep tooltip within horizontal bounds
    if (position.left < padding) {
      position.left = padding;
    } else if (position.left + tooltipWidth > viewportWidth - padding) {
      position.left = viewportWidth - tooltipWidth - padding;
    }

    // Keep tooltip within vertical bounds
    if (position.top < padding) {
      position.top = padding;
    } else if (position.top + tooltipHeight > viewportHeight - padding) {
      position.top = viewportHeight - tooltipHeight - padding;
    }

    return position;
  };

  if (!isEnabled) {
    return (
      <Button
        onClick={() => onToggle(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        title="Enable Tutorial"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    );
  }

  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <Card className="w-96 max-w-md mx-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Welcome to the Tutorial</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This guided walkthrough will help you understand all the features on this page. You can disable it anytime using the help button.
            </p>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => onToggle(false)}
              >
                Skip Tutorial
              </Button>
              <Button
                onClick={() => setShowWelcome(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPageSteps.length === 0) {
    return (
      <Button
        onClick={() => onToggle(false)}
        className="fixed bottom-4 right-4 z-50 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-3 shadow-lg"
        title="Disable Tutorial"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    );
  }

  const step = currentPageSteps[currentStep];
  const tooltipPos = getTooltipPosition(step);
  const elementPos = getElementPosition(step.target);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />
      
      {/* Highlight */}
      <div
        className="fixed z-41 border-2 border-blue-500 bg-blue-100 bg-opacity-20 rounded-md pointer-events-none"
        style={{
          top: elementPos.top - 4,
          left: elementPos.left - 4,
          width: elementPos.width + 8,
          height: elementPos.height + 8
        }}
      />

      {/* Tooltip */}
      <Card
        className="fixed z-50 shadow-xl max-w-sm"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: `${Math.min(320, window.innerWidth - 40)}px`
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm break-words pr-2 flex-1">{step.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(false)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-4 break-words leading-relaxed">{step.content}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {currentStep + 1} of {currentPageSteps.length}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextStep}
                disabled={currentStep === currentPageSteps.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}