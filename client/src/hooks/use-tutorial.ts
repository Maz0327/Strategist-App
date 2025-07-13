import { useState, useEffect } from "react";

interface TutorialState {
  isEnabled: boolean;
  hasSeenWelcome: boolean;
  completedPages: string[];
}

const TUTORIAL_STORAGE_KEY = 'tutorial-state';

export function useTutorial() {
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
    const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          isEnabled: true,
          hasSeenWelcome: false,
          completedPages: []
        };
      }
    }
    return {
      isEnabled: true,
      hasSeenWelcome: false,
      completedPages: []
    };
  });

  useEffect(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(tutorialState));
  }, [tutorialState]);

  const toggleTutorial = (enabled: boolean) => {
    setTutorialState(prev => ({
      ...prev,
      isEnabled: enabled
    }));
  };

  const markPageCompleted = (page: string) => {
    setTutorialState(prev => ({
      ...prev,
      completedPages: [...prev.completedPages, page]
    }));
  };

  const resetTutorial = () => {
    setTutorialState({
      isEnabled: true,
      hasSeenWelcome: false,
      completedPages: []
    });
  };

  const isPageCompleted = (page: string) => {
    return tutorialState.completedPages.includes(page);
  };

  return {
    isEnabled: tutorialState.isEnabled,
    hasSeenWelcome: tutorialState.hasSeenWelcome,
    toggleTutorial,
    markPageCompleted,
    resetTutorial,
    isPageCompleted
  };
}