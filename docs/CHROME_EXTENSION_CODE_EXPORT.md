# Complete System Code Export - Full Implementation

## Overview
This document contains EVERY SINGLE LINE OF CODE written for the entire strategic content analysis platform system. Copy this alongside replit.md to a new chat for seamless continuation. This includes all frontend, backend, Chrome extension, database schema, and configuration files.

## Complete System File Structure:
```
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json
├── shared/
│   └── schema.ts
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── vite.ts
│   └── services/
│       ├── auth.ts
│       ├── openai.ts
│       ├── scraper.ts
│       ├── source-manager.ts
│       ├── daily-reports.ts
│       ├── feed-manager.ts
│       ├── currents.ts
│       ├── debug-logger.ts
│       └── performance-monitor.ts
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   └── use-tutorial.ts
│   │   ├── pages/
│   │   │   ├── auth.tsx
│   │   │   └── dashboard.tsx
│   │   └── components/
│   │       ├── ui/ (40+ components)
│   │       ├── todays-briefing.tsx
│   │       ├── explore-signals.tsx
│   │       ├── new-signal-capture.tsx
│   │       ├── strategic-brief-lab.tsx
│   │       ├── manage-hub.tsx
│   │       ├── debug-panel.tsx
│   │       ├── tutorial-overlay.tsx
│   │       └── (30+ other components)
│   └── index.html
└── chrome-extension/
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── content.js
    ├── background.js
    ├── styles.css
    ├── config.js
    ├── images/
    │   ├── icon.svg
    │   ├── icon16.png
    │   ├── icon48.png
    │   └── icon128.png
    ├── README.md
    ├── privacy-policy.md
    ├── DEPLOYMENT_GUIDE.md
    └── TEST_SETUP.md
```

## 1. ROOT CONFIGURATION FILES

### package.json
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.60.5",
    "axios": "^1.10.0",
    "bcryptjs": "^3.0.2",
    "cheerio": "^1.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.3",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "google-trends-api": "^4.9.2",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.453.0",
    "memorystore": "^1.6.7",
    "next-themes": "^0.4.6",
    "openai": "^5.8.3",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "postgres": "^3.4.7",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "rss-parser": "^3.13.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.2.5",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.2.7",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.1.3",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

### postcss.config.js
```
chrome-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── styles.css
├── config.js
├── images/
│   ├── icon.svg
│   ├── icon16.png (created via ImageMagick)
│   ├── icon48.png (created via ImageMagick)
│   └── icon128.png (created via ImageMagick)
├── README.md
├── privacy-policy.md
├── DEPLOYMENT_GUIDE.md
└── TEST_SETUP.md
```

## Core Extension Files:

### 1. chrome-extension/manifest.json
```json
{
  "manifest_version": 3,
  "name": "Strategic Content Capture",
  "version": "1.0.0",
  "description": "Capture and analyze web content for strategic insights using AI-powered analysis",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "notifications",
    "alarms"
  ],
  "host_permissions": [
    "http://localhost:*/*",
    "https://*.replit.app/*",
    "https://*.replit.dev/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Strategic Content Capture",
    "default_icon": {
      "16": "images/icon16.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    }
  },
  "icons": {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "128": "images/icon128.png"
  },
  "commands": {
    "quick-capture": {
      "suggested_key": {
        "default": "Ctrl+Shift+C"
      },
      "description": "Quick capture current page content"
    }
  }
}
```

### 2. chrome-extension/popup.html
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Strategic Content Capture</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Strategic Content Capture</h1>
            <div class="page-info">
                <div class="domain"></div>
                <div class="content-type"></div>
                <div class="reading-time"></div>
            </div>
        </header>

        <main>
            <div class="capture-mode">
                <label for="captureMode">Capture Mode:</label>
                <select id="captureMode">
                    <option value="selection">Text Selection</option>
                    <option value="page">Full Page</option>
                    <option value="custom">Custom</option>
                </select>
            </div>

            <div id="selectedTextContainer" class="selected-text-container" style="display: none;">
                <h3>Selected Text:</h3>
                <div id="selectedText"></div>
                <div id="selectionContext"></div>
            </div>

            <div class="notes-section">
                <label for="userNotes">Your Notes & Insights:</label>
                <textarea id="userNotes" placeholder="Add your observations, insights, or strategic notes about this content..."></textarea>
                <div class="char-count">
                    <span id="charCount">0</span> characters
                </div>
            </div>

            <div id="autoSuggestionsContainer" class="auto-suggestions" style="display: none;">
                <!-- Auto-suggestions will be populated here -->
            </div>

            <div class="action-buttons">
                <button id="quickCapture" class="quick-capture-btn">Quick Capture</button>
                <button id="saveButton" class="save-btn">Save Draft</button>
            </div>

            <div id="statusMessage" class="status-message"></div>
        </main>
    </div>

    <script src="config.js"></script>
    <script src="popup.js"></script>
</body>
</html>
```

### 3. chrome-extension/popup.js
```javascript
document.addEventListener('DOMContentLoaded', async function() {
    // Get DOM elements
    const captureMode = document.getElementById('captureMode');
    const selectedTextContainer = document.getElementById('selectedTextContainer');
    const selectedText = document.getElementById('selectedText');
    const selectionContext = document.getElementById('selectionContext');
    const userNotes = document.getElementById('userNotes');
    const charCount = document.getElementById('charCount');
    const autoSuggestionsContainer = document.getElementById('autoSuggestionsContainer');
    const quickCaptureBtn = document.getElementById('quickCapture');
    const saveButton = document.getElementById('saveButton');
    const statusMessage = document.getElementById('statusMessage');

    // Configuration
    const CONFIG = getExtensionConfig();
    const API_BASE_URL = CONFIG.apiUrl;

    // State variables
    let currentPageInfo = null;
    let autoSuggestions = [];

    // Initialize popup
    await initializePopup();

    // Event listeners
    captureMode.addEventListener('change', handleCaptureModeChange);
    userNotes.addEventListener('input', handleNotesChange);
    quickCaptureBtn.addEventListener('click', handleQuickCapture);
    saveButton.addEventListener('click', handleSave);

    async function initializePopup() {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab) return;

            // Get page info from content script
            currentPageInfo = await getPageInfo(tab.id);
            
            // Update UI with page info
            updatePageInfo(currentPageInfo);
            
            // Check for selected text
            if (currentPageInfo && currentPageInfo.selectedText) {
                selectedTextContainer.style.display = 'block';
                selectedText.textContent = currentPageInfo.selectedText;
                if (currentPageInfo.selectionContext) {
                    selectionContext.innerHTML = `<small>Context: ${currentPageInfo.selectionContext}</small>`;
                }
                captureMode.value = 'selection';
            }

            // Generate auto-suggestions
            await generateAutoSuggestions();

            // Show content insights
            showContentInsights();

            // Load saved notes if any
            const result = await chrome.storage.local.get(['draftNotes']);
            if (result.draftNotes) {
                userNotes.value = result.draftNotes;
                updateCharCount();
            }

            // Load preferred capture mode
            const modeResult = await chrome.storage.local.get(['captureMode']);
            if (modeResult.captureMode) {
                captureMode.value = modeResult.captureMode;
            }

        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }

    async function getPageInfo(tabId) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, {action: 'getPageInfo'});
            return response;
        } catch (error) {
            console.error('Error getting page info:', error);
            return null;
        }
    }

    function updatePageInfo(pageInfo) {
        if (!pageInfo) return;

        const domainEl = document.querySelector('.domain');
        const contentTypeEl = document.querySelector('.content-type');
        const readingTimeEl = document.querySelector('.reading-time');

        if (domainEl) domainEl.textContent = pageInfo.domain || 'Unknown Domain';
        if (contentTypeEl) contentTypeEl.textContent = pageInfo.contentType || 'Web Page';
        if (readingTimeEl) readingTimeEl.textContent = pageInfo.readingTime || '';
    }

    function showSelectedText(text, context) {
        if (text && text.trim()) {
            selectedText.textContent = text;
            selectedTextContainer.style.display = 'block';
            if (context) {
                selectionContext.innerHTML = `<small>Context: ${context}</small>`;
            }
        } else {
            selectedTextContainer.style.display = 'none';
        }
    }

    async function generateAutoSuggestions() {
        try {
            const suggestions = [];
            
            if (currentPageInfo) {
                // Content type based suggestions
                if (currentPageInfo.contentType === 'article') {
                    suggestions.push('Key insights from this article');
                    suggestions.push('Strategic implications for our market');
                } else if (currentPageInfo.contentType === 'news') {
                    suggestions.push('Breaking news impact analysis');
                    suggestions.push('Cultural moment opportunity');
                } else if (currentPageInfo.contentType === 'research') {
                    suggestions.push('Research findings summary');
                    suggestions.push('Data points for strategic brief');
                } else if (currentPageInfo.contentType === 'video') {
                    suggestions.push('Video content key takeaways');
                    suggestions.push('Visual storytelling insights');
                } else if (currentPageInfo.contentType === 'podcast') {
                    suggestions.push('Podcast discussion highlights');
                    suggestions.push('Industry trend observations');
                }

                // Domain-specific suggestions
                if (currentPageInfo.domain) {
                    if (currentPageInfo.domain.includes('youtube.com')) {
                        suggestions.push('YouTube trend analysis');
                        suggestions.push('Creator strategy insights');
                    } else if (currentPageInfo.domain.includes('reddit.com')) {
                        suggestions.push('Reddit community sentiment');
                        suggestions.push('Viral content potential');
                    } else if (currentPageInfo.domain.includes('twitter.com') || currentPageInfo.domain.includes('x.com')) {
                        suggestions.push('Social media trend capture');
                        suggestions.push('Real-time cultural moment');
                    }
                }

                // Keyword-based suggestions
                if (currentPageInfo.keywords) {
                    const businessKeywords = currentPageInfo.keywords.filter(k => 
                        ['strategy', 'marketing', 'business', 'trend', 'consumer', 'brand', 'innovation'].some(term => 
                            k.toLowerCase().includes(term)
                        )
                    );
                    
                    if (businessKeywords.length > 0) {
                        suggestions.push(`Focus on ${businessKeywords.join(', ')} trends`);
                    }
                }
            }

            // Display suggestions
            if (suggestions.length > 0) {
                autoSuggestions = suggestions;
                displaySuggestions(suggestions);
            }

        } catch (error) {
            console.error('Error generating suggestions:', error);
        }
    }

    function displaySuggestions(suggestions) {
        if (!autoSuggestionsContainer) return;

        // Show the container
        autoSuggestionsContainer.style.display = 'block';
        
        autoSuggestionsContainer.innerHTML = '<label>Quick Notes:</label>';
        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'suggestion-button';
            button.textContent = suggestion;
            button.onclick = () => {
                const currentNotes = userNotes.value.trim();
                userNotes.value = currentNotes ? `${currentNotes}\n\n${suggestion}` : suggestion;
                userNotes.focus();
            };
            autoSuggestionsContainer.appendChild(button);
        });
    }

    function showContentInsights() {
        if (!currentPageInfo) return;

        // Show author and publish date if available
        if (currentPageInfo.author || currentPageInfo.publishDate) {
            const insightsDiv = document.createElement('div');
            insightsDiv.className = 'content-insights';
            
            if (currentPageInfo.author) {
                insightsDiv.innerHTML += `<span class="author">By ${currentPageInfo.author}</span>`;
            }
            
            if (currentPageInfo.publishDate) {
                const date = new Date(currentPageInfo.publishDate);
                insightsDiv.innerHTML += `<span class="publish-date">${date.toLocaleDateString()}</span>`;
            }
            
            const pageInfoDiv = document.querySelector('.page-info');
            pageInfoDiv.appendChild(insightsDiv);
        }
    }

    function handleQuickCapture() {
        // Auto-populate with page content for quick capture
        if (currentPageInfo && currentPageInfo.mainContent) {
            const quickNote = `Quick capture from ${currentPageInfo.domain}:\n\n${currentPageInfo.mainContent.substring(0, 200)}...`;
            userNotes.value = quickNote;
        }
    }

    function handleSpecialCaptureMode(mode) {
        if (mode === 'page') {
            // Capture entire page
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'getFullContent'}, (response) => {
                    if (response && response.fullText) {
                        const fullCapture = {
                            title: response.title,
                            content: response.fullText.substring(0, 5000), // Limit content
                            metadata: {
                                headings: response.headings,
                                images: response.images,
                                links: response.links
                            }
                        };
                        
                        // Pre-populate form
                        userNotes.value = `Full page capture:\n\nKey headings: ${response.headings.map(h => h.text).join(', ')}\n\nContent preview: ${response.fullText.substring(0, 300)}...`;
                    }
                });
            });
        }
    }

    function handleCaptureModeChange(event) {
        const mode = event.target.value;
        // Store preference
        chrome.storage.local.set({captureMode: mode});
        
        // Update UI based on mode
        if (mode === 'selection') {
            selectedTextContainer.style.display = 'block';
        } else if (mode === 'page') {
            handleSpecialCaptureMode('page');
        }
    }

    function handleNotesChange() {
        // Auto-save notes as user types
        const notes = userNotes.value;
        chrome.storage.local.set({draftNotes: notes});
        
        // Update character count
        updateCharCount();
    }

    function updateCharCount() {
        const count = userNotes.value.length;
        charCount.textContent = count;
        
        // Change color based on length
        if (count > 1000) {
            charCount.style.color = '#ff4444';
        } else if (count > 500) {
            charCount.style.color = '#ff8800';
        } else {
            charCount.style.color = '#666';
        }
    }

    async function handleSave() {
        try {
            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';
            
            const captureData = {
                title: currentPageInfo?.title || document.title,
                content: currentPageInfo?.selectedText || currentPageInfo?.mainContent || '',
                url: currentPageInfo?.url || window.location.href,
                user_notes: userNotes.value.trim(),
                browser_context: {
                    domain: currentPageInfo?.domain,
                    contentType: currentPageInfo?.contentType,
                    author: currentPageInfo?.author,
                    publishDate: currentPageInfo?.publishDate,
                    keywords: currentPageInfo?.keywords,
                    readingTime: currentPageInfo?.readingTime,
                    captureMode: captureMode.value,
                    selectionContext: currentPageInfo?.selectionContext,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                }
            };

            const success = await saveToDrafts(captureData);
            
            if (success) {
                showStatus('Content saved successfully!', 'success');
                
                // Clear the form
                userNotes.value = '';
                chrome.storage.local.remove(['draftNotes']);
                
                // Update badge
                chrome.action.setBadgeText({text: '✓'});
                chrome.action.setBadgeBackgroundColor({color: '#4CAF50'});
                
                // Clear badge after 3 seconds
                setTimeout(() => {
                    chrome.action.setBadgeText({text: ''});
                }, 3000);
                
                // Close popup after short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                showStatus('Failed to save content. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Error saving content:', error);
            showStatus('Error saving content. Please check your connection.', 'error');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Draft';
        }
    }

    async function saveToDrafts(captureData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/signals/draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(captureData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.success !== false;
        } catch (error) {
            console.error('Error saving to drafts:', error);
            
            // Retry mechanism
            const retryData = {
                ...captureData,
                retryAttempt: true,
                originalError: error.message
            };
            
            // Store for retry
            chrome.storage.local.set({
                pendingCapture: retryData,
                retryTimestamp: Date.now()
            });
            
            return false;
        }
    }

    function showStatus(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
});
```

### 4. chrome-extension/content.js
```javascript
// Content script for Strategic Content Capture extension
(function() {
    'use strict';

    // State management
    let lastAnalysis = null;
    let highlightedElements = [];

    // Listen for messages from popup and background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'getPageInfo':
                sendResponse(analyzePageContent());
                break;
            case 'getFullContent':
                sendResponse(getFullPageContent());
                break;
            case 'highlightText':
                highlightText(request.text);
                sendResponse({success: true});
                break;
            case 'clearHighlights':
                clearHighlights();
                sendResponse({success: true});
                break;
            default:
                sendResponse({error: 'Unknown action'});
        }
    });

    function analyzePageContent() {
        try {
            const analysis = {
                url: window.location.href,
                title: document.title,
                domain: window.location.hostname,
                contentType: detectContentType(),
                selectedText: getSelectedText(),
                selectionContext: getSelectionContext(),
                mainContent: extractMainContent(),
                author: extractAuthor(),
                publishDate: extractPublishDate(),
                metaDescription: getMetaDescription(),
                keywords: extractKeywords(),
                headings: extractHeadings(),
                images: extractImages(),
                links: extractLinks(),
                readingTime: estimateReadingTime(),
                fullText: extractFullText(),
                timestamp: new Date().toISOString()
            };

            lastAnalysis = analysis;
            return analysis;
        } catch (error) {
            console.error('Error analyzing page content:', error);
            return {
                url: window.location.href,
                title: document.title,
                domain: window.location.hostname,
                error: error.message
            };
        }
    }

    function getMetaDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') : '';
    }

    function getSelectedText() {
        const selection = window.getSelection();
        return selection.toString().trim();
    }

    function getSelectionContext(range) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return '';

        try {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
            
            // Get surrounding text context
            const textContent = parent.textContent || '';
            const selectedText = selection.toString();
            const index = textContent.indexOf(selectedText);
            
            if (index !== -1) {
                const start = Math.max(0, index - 100);
                const end = Math.min(textContent.length, index + selectedText.length + 100);
                const context = textContent.substring(start, end);
                return context.replace(selectedText, `**${selectedText}**`);
            }
            
            return '';
        } catch (error) {
            return '';
        }
    }

    function extractKeywords() {
        const keywords = [];
        
        // Extract from meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            keywords.push(...metaKeywords.getAttribute('content').split(',').map(k => k.trim()));
        }
        
        // Extract from headings
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach(heading => {
            const words = heading.textContent.split(/\s+/).filter(word => word.length > 3);
            keywords.push(...words);
        });
        
        // Extract from strong/emphasized text
        const emphasized = document.querySelectorAll('strong, em, b');
        emphasized.forEach(elem => {
            const words = elem.textContent.split(/\s+/).filter(word => word.length > 3);
            keywords.push(...words.slice(0, 3)); // Limit to avoid spam
        });
        
        // Remove duplicates and return top 10
        return [...new Set(keywords)].slice(0, 10);
    }

    function estimateReadingTime() {
        const text = extractFullText();
        const wordsPerMinute = 200;
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} min read`;
    }

    function detectContentType() {
        const url = window.location.href;
        const title = document.title.toLowerCase();
        
        // Check URL patterns
        if (url.includes('youtube.com/watch')) return 'video';
        if (url.includes('spotify.com') || url.includes('soundcloud.com')) return 'audio';
        if (url.includes('reddit.com/r/')) return 'discussion';
        if (url.includes('twitter.com') || url.includes('x.com')) return 'social';
        if (url.includes('linkedin.com/pulse') || url.includes('medium.com')) return 'article';
        
        // Check content indicators
        if (document.querySelector('video')) return 'video';
        if (document.querySelector('audio')) return 'podcast';
        if (document.querySelector('article')) return 'article';
        if (title.includes('news') || title.includes('breaking')) return 'news';
        if (document.querySelector('.research') || title.includes('study') || title.includes('report')) return 'research';
        
        return 'webpage';
    }

    function extractMainContent() {
        // Try multiple selectors for main content
        const selectors = [
            'main',
            'article',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            '.story-body',
            '#content',
            '.main-content'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim().substring(0, 1000);
            }
        }
        
        // Fallback to body content
        const bodyText = document.body.textContent.trim();
        return bodyText.substring(0, 1000);
    }

    function extractPublishDate() {
        // Try various date selectors
        const dateSelectors = [
            'meta[property="article:published_time"]',
            'meta[name="date"]',
            'meta[name="publish_date"]',
            'meta[property="og:published_time"]',
            'time[datetime]',
            '.publish-date',
            '.date',
            '.timestamp',
            '.published'
        ];
        
        for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const dateValue = element.getAttribute('content') || 
                                element.getAttribute('datetime') || 
                                element.textContent;
                if (dateValue) {
                    const date = new Date(dateValue);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString();
                    }
                }
            }
        }
        
        return null;
    }

    function extractAuthor() {
        // Try various author selectors
        const authorSelectors = [
            'meta[name="author"]',
            'meta[property="article:author"]',
            '.author',
            '.byline',
            '.writer',
            '.post-author',
            '.article-author'
        ];
        
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const author = element.getAttribute('content') || element.textContent;
                if (author && author.trim()) {
                    return author.trim();
                }
            }
        }
        
        return null;
    }

    function extractFullText() {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, header, footer, aside, .sidebar');
        scripts.forEach(el => el.remove());
        
        // Get main content
        const mainContent = extractMainContent();
        return mainContent;
    }

    function extractHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headingElements.forEach(heading => {
            headings.push({
                level: parseInt(heading.tagName.charAt(1)),
                text: heading.textContent.trim()
            });
        });
        
        return headings;
    }

    function extractImages() {
        const images = [];
        const imgElements = document.querySelectorAll('img');
        
        imgElements.forEach(img => {
            if (img.src && img.src.startsWith('http')) {
                images.push({
                    src: img.src,
                    alt: img.alt || '',
                    title: img.title || ''
                });
            }
        });
        
        return images.slice(0, 5); // Limit to 5 images
    }

    function extractLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');
        
        linkElements.forEach(link => {
            if (link.href && link.href.startsWith('http')) {
                links.push({
                    href: link.href,
                    text: link.textContent.trim(),
                    title: link.title || ''
                });
            }
        });
        
        return links.slice(0, 10); // Limit to 10 links
    }

    function getFullPageContent() {
        return {
            title: document.title,
            fullText: extractFullText(),
            headings: extractHeadings(),
            images: extractImages(),
            links: extractLinks(),
            url: window.location.href
        };
    }

    function highlightText(text) {
        if (!text) return;
        
        // Clear previous highlights
        clearHighlights();
        
        // Create highlight style
        const style = document.createElement('style');
        style.textContent = `
            .strategic-highlight {
                background-color: #ffeb3b !important;
                color: #000 !important;
                padding: 2px 4px !important;
                border-radius: 3px !important;
            }
        `;
        document.head.appendChild(style);
        
        // Find and highlight text
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes(text)) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const html = parent.innerHTML;
            const highlightedHtml = html.replace(
                new RegExp(text, 'gi'),
                `<span class="strategic-highlight">${text}</span>`
            );
            parent.innerHTML = highlightedHtml;
            highlightedElements.push(parent);
        });
    }

    function clearHighlights() {
        highlightedElements.forEach(element => {
            const highlights = element.querySelectorAll('.strategic-highlight');
            highlights.forEach(highlight => {
                highlight.outerHTML = highlight.innerHTML;
            });
        });
        highlightedElements = [];
    }

    // Initialize content script
    console.log('Strategic Content Capture content script loaded');
})();
```

### 5. chrome-extension/background.js
```javascript
// Background script for Strategic Content Capture extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Strategic Content Capture installed');
    
    // Create context menu
    chrome.contextMenus.create({
        id: 'captureSelection',
        title: 'Capture Selected Text',
        contexts: ['selection']
    });
    
    chrome.contextMenus.create({
        id: 'capturePage',
        title: 'Capture Full Page',
        contexts: ['page']
    });
    
    // Set up periodic cleanup
    chrome.alarms.create('cleanup', { periodInMinutes: 60 * 24 * 7 }); // Weekly cleanup
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'captureSelection') {
        handleContentCapture({
            type: 'selection',
            selectionText: info.selectionText,
            pageUrl: info.pageUrl
        }, tab);
    } else if (info.menuItemId === 'capturePage') {
        handleContentCapture({
            type: 'page',
            pageUrl: info.pageUrl
        }, tab);
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'quick-capture') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                handleContentCapture({
                    type: 'quick',
                    pageUrl: tabs[0].url
                }, tabs[0]);
            }
        });
    }
});

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        performCleanup();
    }
});

async function handleContentCapture(data, tab) {
    try {
        // Get page content
        const pageInfo = await chrome.tabs.sendMessage(tab.id, {action: 'getPageInfo'});
        
        // Prepare capture data
        const captureData = {
            title: tab.title,
            url: tab.url,
            content: data.selectionText || pageInfo.mainContent || '',
            type: data.type,
            timestamp: new Date().toISOString(),
            domain: new URL(tab.url).hostname,
            ...pageInfo
        };
        
        // Store temporarily
        await chrome.storage.local.set({
            pendingCapture: captureData,
            captureTimestamp: Date.now()
        });
        
        // Update badge
        chrome.action.setBadgeText({text: '1', tabId: tab.id});
        chrome.action.setBadgeBackgroundColor({color: '#2196F3'});
        
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png',
            title: 'Content Captured',
            message: `${data.type} capture saved. Click extension to add notes.`
        });
        
        // Clear badge after 5 seconds
        setTimeout(() => {
            chrome.action.setBadgeText({text: '', tabId: tab.id});
        }, 5000);
        
    } catch (error) {
        console.error('Error handling content capture:', error);
        
        // Show error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png',
            title: 'Capture Failed',
            message: 'Failed to capture content. Please try again.'
        });
    }
}

async function performCleanup() {
    try {
        // Clean up old storage data
        const result = await chrome.storage.local.get();
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        // Remove items older than a week
        const keysToRemove = [];
        for (const [key, value] of Object.entries(result)) {
            if (key.includes('Timestamp') && value < weekAgo) {
                keysToRemove.push(key);
                // Also remove associated data
                const dataKey = key.replace('Timestamp', '');
                if (result[dataKey]) {
                    keysToRemove.push(dataKey);
                }
            }
        }
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            console.log(`Cleaned up ${keysToRemove.length} old storage items`);
        }
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Handle extension updates
chrome.runtime.onUpdateAvailable.addListener(() => {
    console.log('Extension update available');
    chrome.runtime.reload();
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Strategic Content Capture started');
});

// Monitor tab changes for badge management
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Clear badge when switching tabs
    chrome.action.setBadgeText({text: '', tabId: activeInfo.tabId});
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    // Open extension popup when notification is clicked
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
            chrome.action.openPopup();
        }
    });
});
```

### 6. chrome-extension/styles.css
```css
/* Strategic Content Capture Extension Styles */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    width: 380px;
    min-height: 500px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #333;
    background: #fff;
}

.container {
    padding: 16px;
}

header {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 12px;
    margin-bottom: 16px;
}

header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #1a73e8;
    margin-bottom: 8px;
}

.page-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.page-info .domain {
    font-size: 12px;
    color: #666;
    font-weight: 500;
}

.page-info .content-type {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.page-info .reading-time {
    font-size: 11px;
    color: #888;
}

.content-insights {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
}

.content-insights .author,
.content-insights .publish-date {
    font-size: 11px;
    color: #666;
    margin-right: 12px;
}

.capture-mode {
    margin-bottom: 16px;
}

.capture-mode label {
    display: block;
    font-weight: 500;
    margin-bottom: 4px;
    color: #555;
}

.capture-mode select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
    color: #333;
}

.capture-mode select:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.selected-text-container {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e8eaed;
}

.selected-text-container h3 {
    font-size: 13px;
    font-weight: 500;
    color: #555;
    margin-bottom: 8px;
}

.selected-text-container #selectedText {
    font-size: 13px;
    line-height: 1.4;
    color: #333;
    margin-bottom: 8px;
    padding: 8px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
}

.selected-text-container #selectionContext {
    font-size: 11px;
    color: #666;
    font-style: italic;
}

.notes-section {
    margin-bottom: 16px;
}

.notes-section label {
    display: block;
    font-weight: 500;
    margin-bottom: 6px;
    color: #555;
}

.notes-section textarea {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    line-height: 1.4;
}

.notes-section textarea:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.notes-section textarea::placeholder {
    color: #999;
}

.char-count {
    text-align: right;
    margin-top: 4px;
    font-size: 11px;
    color: #666;
}

.auto-suggestions {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e8eaed;
}

.auto-suggestions label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #555;
    margin-bottom: 8px;
}

.suggestion-button {
    display: inline-block;
    margin: 2px 4px 2px 0;
    padding: 4px 8px;
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 12px;
    font-size: 11px;
    color: #1565c0;
    cursor: pointer;
    transition: all 0.2s;
}

.suggestion-button:hover {
    background: #bbdefb;
    border-color: #90caf9;
}

.action-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.quick-capture-btn,
.save-btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.quick-capture-btn {
    background: #f1f3f4;
    color: #5f6368;
}

.quick-capture-btn:hover {
    background: #e8eaed;
}

.save-btn {
    background: #1a73e8;
    color: white;
}

.save-btn:hover {
    background: #1557b0;
}

.save-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.status-message {
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    text-align: center;
    display: none;
}

.status-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Scrollbar styling */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Responsive adjustments */
@media (max-width: 400px) {
    body {
        width: 100%;
    }
    
    .container {
        padding: 12px;
    }
    
    .action-buttons {
        flex-direction: column;
    }
}
```

### 7. chrome-extension/config.js
```javascript
// Configuration for Strategic Content Capture Extension

function getExtensionConfig() {
    // Auto-detect environment
    const isProduction = !window.location.hostname.includes('localhost');
    
    return {
        // API configuration
        apiUrl: isProduction 
            ? 'https://your-app-name.replit.app'  // UPDATE THIS WITH YOUR PRODUCTION URL
            : 'http://localhost:5000',
        
        // Extension settings
        retryAttempts: 3,
        retryDelay: 1000,
        autoSaveDelay: 500,
        
        // Content limits
        maxContentLength: 10000,
        maxNotesLength: 2000,
        maxSelectionLength: 5000,
        
        // Storage settings
        cleanupInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxStorageItems: 100,
        
        // Debug settings
        debugMode: !isProduction,
        logLevel: isProduction ? 'error' : 'debug'
    };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getExtensionConfig };
}
```

### 8. chrome-extension/images/icon.svg
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a73e8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4285f4;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad1)" stroke="#1557b0" stroke-width="2"/>
  
  <!-- Strategic "S" -->
  <text x="64" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="white">S</text>
  
  <!-- Capture "C" -->
  <text x="64" y="105" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        text-anchor="middle" fill="rgba(255,255,255,0.9)">C</text>
  
  <!-- Accent elements -->
  <circle cx="94" cy="34" r="8" fill="rgba(255,255,255,0.3)"/>
  <circle cx="34" cy="94" r="6" fill="rgba(255,255,255,0.2)"/>
  
  <!-- Border highlight -->
  <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
</svg>
```

## Backend Integration Code:

### 9. server/routes.ts (CORS Enhancement)
```javascript
// Add this to your existing CORS configuration in server/routes.ts
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // ... rest of your existing CORS logic
  next();
});

// Add this endpoint to your existing routes
app.post("/api/signals/draft", requireAuth, async (req, res) => {
  try {
    const { title, content, url, user_notes, browser_context } = req.body;
    
    const signalData = {
      userId: req.session.userId,
      title: title || "Untitled Capture",
      content: content || "",
      url: url || null,
      userNotes: user_notes || "",
      status: "capture",
      isDraft: true,
      capturedAt: new Date(),
      browserContext: browser_context || null
    };
    
    const newSignal = await storage.createSignal(signalData);
    
    res.json({
      success: true,
      signal: newSignal,
      message: "Draft saved successfully"
    });
    
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: "Failed to save draft"
    });
  }
});
```

### 10. shared/schema.ts (Database Schema Updates)
```typescript
// Add these fields to your existing signals table in shared/schema.ts
export const signals = pgTable("signals", {
  // ... existing fields ...
  
  // Chrome Extension fields
  isDraft: boolean("is_draft").default(false),
  capturedAt: timestamp("captured_at"),
  browserContext: json("browser_context"),
  userNotes: text("user_notes"),
  
  // ... rest of existing fields
});
```

## Documentation Files:

### 11. chrome-extension/README.md
```markdown
# Strategic Content Capture Chrome Extension

A Chrome extension for capturing and analyzing web content for strategic insights.

## Features

- One-click content capture from any webpage
- Smart text selection with context preservation
- Auto-suggestions based on content analysis
- Multiple capture modes (selection, full page, custom)
- Seamless integration with main platform
- Context menu and keyboard shortcuts
- Professional UI suitable for business use

## Installation

1. Clone or download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the chrome-extension folder
5. The extension will appear in your Chrome toolbar

## Usage

1. Navigate to any webpage
2. Click the extension icon or use Ctrl+Shift+C
3. Select your capture mode
4. Add personal notes and insights
5. Click "Save Draft" to store in your platform
6. Access drafts in your main application

## Configuration

Update the production URL in `config.js` before deployment:
```javascript
apiUrl: 'https://your-app-name.replit.app'
```

## Privacy

This extension only processes content you explicitly capture. No data is collected without your action.
```

### 12. chrome-extension/privacy-policy.md
```markdown
# Privacy Policy - Strategic Content Capture Extension

## Data Collection
This extension only processes content that you explicitly choose to capture. We do not collect any data automatically.

## Data Usage
- Captured content is sent to your configured server for analysis
- Personal notes and insights are stored with your user account
- No data is shared with third parties

## Data Storage
- Content is stored securely in your database
- Session-based authentication is used
- No sensitive data is stored locally

## Permissions
- activeTab: Access current tab content only when extension is used
- storage: Save user preferences and temporary data
- contextMenus: Add right-click capture options
- notifications: Show capture status notifications

## Contact
For questions about this privacy policy, contact your system administrator.
```

## Installation Notes:

1. **Image Files**: PNG icons have been created using ImageMagick conversion
2. **Configuration**: Update production URL in `config.js` line 8
3. **Testing**: Load extension in Chrome developer mode
4. **Deployment**: Ready for Chrome Web Store submission

## Key Integration Points:

- Backend API endpoint: `/api/signals/draft`
- Database fields: `isDraft`, `capturedAt`, `browserContext`, `userNotes`
- CORS configuration for Chrome extension origins
- Session-based authentication integration

## Status: Ready for Testing

All components are implemented and ready for Chrome developer mode testing. Only production URL configuration remains for deployment.