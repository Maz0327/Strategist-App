import React from 'react';
import { HelpButton } from './help-button';

interface ContextualHelpProps {
  section: string;
  helpText?: string;
}

export function ContextualHelp({ section, helpText }: ContextualHelpProps) {
  const getHelpMessage = (section: string) => {
    switch (section) {
      case 'briefing':
        return "How do I use Today's Briefing? What are the different feed types?";
      case 'explore':
        return "Where can I find trending topics? How do I explore signals?";
      case 'capture':
        return "How do I capture content? What's the difference between text and URL analysis?";
      case 'brief':
        return "How do I create a strategic brief? What is the Define → Shift → Deliver framework?";
      case 'manage':
        return "How do I manage my signals? Where can I view my analytics?";
      case 'chrome-extension':
        return "How do I install and use the Chrome extension for content capture?";
      case 'feeds':
        return "How do I add RSS feeds? What are the different feed types?";
      case 'analysis':
        return "How does the AI analysis work? What do the different analysis results mean?";
      case 'signals':
        return "What's the difference between captures, potential signals, and signals?";
      default:
        return helpText || "How can I help you with this section?";
    }
  };

  return (
    <HelpButton initialMessage={getHelpMessage(section)} />
  );
}

// Quick help messages for common sections
export const HELP_MESSAGES = {
  briefing: "Today's Briefing is your homepage with three main feeds: Client Channels (industry updates), Custom Feeds (your RSS feeds), and Project Intelligence (market trends). Click on any feed to see more details.",
  
  explore: "Explore Signals has two main sections: Trending Topics (real-time trends from 17+ platforms) and Signal Mining (cultural intelligence). Use the platform filters to focus on specific sources.",
  
  capture: "Signal Capture lets you analyze content three ways: paste text directly, enter a URL for automatic scraping, or use the Chrome extension. All content gets analyzed by AI for strategic insights.",
  
  brief: "Strategic Brief Lab uses the Define → Shift → Deliver framework. Define your target audience, Shift the conversation, and Deliver your message. You can also build cohorts using the 7 pillars methodology.",
  
  manage: "Manage section has your Dashboard (view all signals), Sources (manage content sources), Daily Reports (automated briefings), and Audience Insights (user analytics).",
  
  workflow: "The platform follows a simple workflow: Capture content → Review as potential signal → Flag as signal → Create insights → Build strategic briefs. Each step adds more strategic value.",
  
  chrome: "The Chrome extension lets you capture content from any webpage. Install it, click the extension icon, add notes, and content saves as drafts in your platform. Use Ctrl+Shift+C for quick capture.",
  
  feeds: "Custom Feeds support RSS feeds, social media APIs, and website monitoring. Add feeds in Today's Briefing → Custom Feeds → Add Feed. Choose from project data, custom feeds, or intelligence feeds."
};