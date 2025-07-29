// Modern Content Script for Strategic Content Capture
(function() {
    'use strict';
    
    // Enhanced content extraction
    function extractPageContent() {
        const content = {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,
            selectedText: window.getSelection().toString().trim(),
            fullText: '',
            metadata: {
                author: null,
                publishDate: null,
                readingTime: null,
                keywords: [],
                description: null
            }
        };
        
        // Extract main content
        const contentSelectors = [
            'main',
            'article',
            '[role="main"]',
            '.content',
            '#content',
            '.post-content',
            '.entry-content',
            '.article-content'
        ];
        
        let mainContent = null;
        for (const selector of contentSelectors) {
            mainContent = document.querySelector(selector);
            if (mainContent) break;
        }
        
        if (!mainContent) {
            mainContent = document.body;
        }
        
        content.fullText = mainContent.innerText.trim();
        
        // Extract metadata
        extractMetadata(content);
        
        return content;
    }
    
    function extractMetadata(content) {
        // Author extraction
        const authorSelectors = [
            '[rel="author"]',
            '.author',
            '.byline',
            '[class*="author"]',
            '[name="author"]',
            '.post-author',
            '.article-author'
        ];
        
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content.metadata.author = element.textContent || element.content || element.getAttribute('content');
                if (content.metadata.author) {
                    content.metadata.author = content.metadata.author.trim();
                    break;
                }
            }
        }
        
        // Meta tag author
        const authorMeta = document.querySelector('meta[name="author"]');
        if (authorMeta && !content.metadata.author) {
            content.metadata.author = authorMeta.getAttribute('content');
        }
        
        // Publish date extraction
        const dateSelectors = [
            'time[datetime]',
            '.publish-date',
            '.post-date',
            '.article-date',
            '[class*="date"]'
        ];
        
        for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                content.metadata.publishDate = element.getAttribute('datetime') || element.textContent;
                if (content.metadata.publishDate) break;
            }
        }
        
        // Description extraction
        const descMeta = document.querySelector('meta[name="description"]') || 
                        document.querySelector('meta[property="og:description"]');
        if (descMeta) {
            content.metadata.description = descMeta.getAttribute('content');
        }
        
        // Keywords extraction
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        if (keywordsMeta) {
            content.metadata.keywords = keywordsMeta.getAttribute('content')
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);
        }
        
        // Estimate reading time
        const wordCount = content.fullText.split(/\s+/).length;
        content.metadata.readingTime = Math.ceil(wordCount / 200); // Average reading speed
    }
    
    // Enhanced text selection with context
    function getEnhancedSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;
        
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        
        if (!selectedText) return null;
        
        // Get surrounding context
        const container = range.commonAncestorContainer;
        const paragraph = container.nodeType === Node.TEXT_NODE ? 
                         container.parentElement : container;
        
        let contextBefore = '';
        let contextAfter = '';
        
        try {
            // Get text before selection
            const beforeRange = document.createRange();
            beforeRange.setStart(paragraph, 0);
            beforeRange.setEnd(range.startContainer, range.startOffset);
            contextBefore = beforeRange.toString().slice(-100); // Last 100 chars
            
            // Get text after selection
            const afterRange = document.createRange();
            afterRange.setStart(range.endContainer, range.endOffset);
            afterRange.setEnd(paragraph, paragraph.childNodes.length);
            contextAfter = afterRange.toString().slice(0, 100); // First 100 chars
        } catch (e) {
            // Fallback to paragraph text if range creation fails
            const paragraphText = paragraph.textContent || '';
            const selectionStart = paragraphText.indexOf(selectedText);
            if (selectionStart !== -1) {
                contextBefore = paragraphText.slice(Math.max(0, selectionStart - 100), selectionStart);
                contextAfter = paragraphText.slice(selectionStart + selectedText.length, selectionStart + selectedText.length + 100);
            }
        }
        
        return {
            text: selectedText,
            contextBefore: contextBefore,
            contextAfter: contextAfter,
            fullContext: contextBefore + selectedText + contextAfter,
            position: {
                start: range.startOffset,
                end: range.endOffset
            }
        };
    }
    
    // Visual feedback for text selection
    function highlightSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'strategic-capture-highlight';
        span.style.cssText = `
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2)) !important;
            border-radius: 4px !important;
            padding: 1px 2px !important;
            animation: highlightPulse 1s ease-in-out !important;
        `;
        
        try {
            range.surroundContents(span);
            
            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes highlightPulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
                if (span.parentNode) {
                    const parent = span.parentNode;
                    parent.replaceChild(document.createTextNode(span.textContent), span);
                    parent.normalize();
                }
                style.remove();
            }, 2000);
        } catch (e) {
            // Selection might span multiple elements, skip highlighting
            console.log('Could not highlight selection:', e);
        }
    }
    
    // Platform-specific content detection
    function detectPlatformSpecifics() {
        const hostname = window.location.hostname.toLowerCase();
        const specifics = {
            platform: 'generic',
            contentType: 'article',
            engagement: null,
            metadata: {}
        };
        
        // YouTube
        if (hostname.includes('youtube.com')) {
            specifics.platform = 'youtube';
            specifics.contentType = 'video';
            
            const views = document.querySelector('#info-strings yt-formatted-string');
            if (views) specifics.engagement = views.textContent;
            
            const likes = document.querySelector('#top-level-buttons-computed button[aria-label*="like"]');
            if (likes) specifics.metadata.likes = likes.getAttribute('aria-label');
            
        // TikTok
        } else if (hostname.includes('tiktok.com')) {
            specifics.platform = 'tiktok';
            specifics.contentType = 'video';
            
            const stats = document.querySelectorAll('[data-e2e="video-stats"] strong');
            if (stats.length > 0) {
                specifics.metadata.likes = stats[0]?.textContent;
                specifics.metadata.comments = stats[1]?.textContent;
                specifics.metadata.shares = stats[2]?.textContent;
            }
            
        // LinkedIn
        } else if (hostname.includes('linkedin.com')) {
            specifics.platform = 'linkedin';
            specifics.contentType = 'professional';
            
            const reactions = document.querySelector('.social-counts-reactions__count');
            if (reactions) specifics.engagement = reactions.textContent;
            
        // Twitter/X
        } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
            specifics.platform = 'twitter';
            specifics.contentType = 'social';
            
            const stats = document.querySelectorAll('[data-testid="app-text-transition-container"]');
            if (stats.length > 0) {
                specifics.metadata.retweets = stats[0]?.textContent;
                specifics.metadata.likes = stats[1]?.textContent;
            }
            
        // Instagram
        } else if (hostname.includes('instagram.com')) {
            specifics.platform = 'instagram';
            specifics.contentType = 'visual';
            
            const likes = document.querySelector('section[class*="likes"] button span');
            if (likes) specifics.engagement = likes.textContent;
            
        // Reddit
        } else if (hostname.includes('reddit.com')) {
            specifics.platform = 'reddit';
            specifics.contentType = 'discussion';
            
            const upvotes = document.querySelector('[data-click-id="upvote"] + div');
            if (upvotes) specifics.engagement = upvotes.textContent;
        }
        
        return specifics;
    }
    
    // Context menu enhancement
    function addContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            const selection = window.getSelection().toString().trim();
            if (selection) {
                // Store selection for context menu action
                window.strategicCaptureSelection = getEnhancedSelection();
            }
        });
    }
    
    // Message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'GET_PAGE_CONTENT':
                sendResponse(extractPageContent());
                break;
                
            case 'GET_ENHANCED_SELECTION':
                sendResponse(getEnhancedSelection());
                break;
                
            case 'HIGHLIGHT_SELECTION':
                highlightSelection();
                sendResponse({ success: true });
                break;
                
            case 'GET_PLATFORM_SPECIFICS':
                sendResponse(detectPlatformSpecifics());
                break;
                
            case 'EXTRACT_FULL_CONTENT':
                const fullContent = extractPageContent();
                const platformSpecifics = detectPlatformSpecifics();
                sendResponse({
                    ...fullContent,
                    platformSpecifics
                });
                break;
                
            case 'PING':
                sendResponse({ success: true });
                break;
        }
    });
    
    // Initialize content script
    function initialize() {
        addContextMenu();
        
        // Add visual feedback styles
        const style = document.createElement('style');
        style.textContent = `
            .strategic-capture-highlight {
                transition: all 0.3s ease !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('Strategic Content Capture content script initialized');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();