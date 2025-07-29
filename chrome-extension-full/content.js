// Strategic Content Capture Extension - Content Script
console.log('Strategic Content Capture content script loaded');

// Content analysis and extraction functionality
class ContentAnalyzer {
    constructor() {
        this.selectionOverlay = null;
        this.isSelecting = false;
    }

    // Extract page metadata
    extractPageMetadata() {
        const metadata = {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,
            author: this.extractAuthor(),
            publishDate: this.extractPublishDate(),
            description: this.extractDescription(),
            keywords: this.extractKeywords(),
            readingTime: this.estimateReadingTime(),
            contentType: this.detectContentType(),
            socialMetrics: this.extractSocialMetrics(),
            timestamp: new Date().toISOString()
        };
        
        return metadata;
    }

    // Extract author information
    extractAuthor() {
        const selectors = [
            '[rel="author"]',
            '.author',
            '.byline',
            '[itemprop="author"]',
            '.post-author',
            '.article-author',
            '.writer',
            '[data-author]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }
        
        // Check meta tags
        const metaAuthor = document.querySelector('meta[name="author"]');
        if (metaAuthor) return metaAuthor.content;
        
        return null;
    }

    // Extract publish date
    extractPublishDate() {
        const selectors = [
            'time[datetime]',
            '[itemprop="datePublished"]',
            '.publish-date',
            '.post-date',
            '.article-date',
            '[data-date]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const datetime = element.getAttribute('datetime') || element.textContent;
                const date = new Date(datetime);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
        }
        
        return null;
    }

    // Extract description
    extractDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) return metaDesc.content;
        
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) return ogDesc.content;
        
        // Try to find first paragraph
        const firstParagraph = document.querySelector('p');
        if (firstParagraph && firstParagraph.textContent.length > 50) {
            return firstParagraph.textContent.substring(0, 200) + '...';
        }
        
        return null;
    }

    // Extract keywords
    extractKeywords() {
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            return metaKeywords.content.split(',').map(k => k.trim());
        }
        
        // Extract keywords from headings
        const headings = document.querySelectorAll('h1, h2, h3');
        const keywords = [];
        headings.forEach(heading => {
            const words = heading.textContent.toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 3);
            keywords.push(...words);
        });
        
        return [...new Set(keywords)].slice(0, 10);
    }

    // Estimate reading time
    estimateReadingTime() {
        const text = document.body.textContent || '';
        const wordCount = text.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
        return `${readingTime} min read`;
    }

    // Detect content type
    detectContentType() {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        
        if (url.includes('tiktok.com')) return 'tiktok-video';
        if (url.includes('instagram.com')) return 'instagram-post';
        if (url.includes('linkedin.com/posts')) return 'linkedin-post';
        if (url.includes('youtube.com/watch')) return 'youtube-video';
        if (url.includes('reddit.com')) return 'reddit-thread';
        if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter-post';
        
        // Detect by content
        if (document.querySelector('video')) return 'video';
        if (document.querySelector('article')) return 'article';
        if (document.querySelector('.blog')) return 'blog-post';
        
        return 'webpage';
    }

    // Extract social metrics
    extractSocialMetrics() {
        const metrics = {};
        
        // Common selectors for engagement metrics
        const engagementSelectors = [
            { name: 'likes', selectors: ['.like-count', '[data-likes]', '.likes'] },
            { name: 'shares', selectors: ['.share-count', '[data-shares]', '.shares'] },
            { name: 'comments', selectors: ['.comment-count', '[data-comments]', '.comments'] },
            { name: 'views', selectors: ['.view-count', '[data-views]', '.views'] }
        ];
        
        engagementSelectors.forEach(({ name, selectors }) => {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent.trim();
                    const number = this.parseEngagementNumber(text);
                    if (number !== null) {
                        metrics[name] = number;
                        break;
                    }
                }
            }
        });
        
        return metrics;
    }

    // Parse engagement numbers (handles K, M, B suffixes)
    parseEngagementNumber(text) {
        const match = text.match(/(\d+(?:\.\d+)?)\s*([KMB]?)/i);
        if (!match) return null;
        
        let number = parseFloat(match[1]);
        const suffix = match[2].toUpperCase();
        
        switch (suffix) {
            case 'K': number *= 1000; break;
            case 'M': number *= 1000000; break;
            case 'B': number *= 1000000000; break;
        }
        
        return Math.round(number);
    }

    // Extract full text content
    extractFullText() {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
        scripts.forEach(el => el.remove());
        
        // Get main content area
        const contentSelectors = [
            'article',
            '.content',
            '.post-content',
            '.article-content',
            '.main-content',
            'main',
            '.post-body'
        ];
        
        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement) break;
        }
        
        if (!contentElement) {
            contentElement = document.body;
        }
        
        return contentElement.innerText.trim();
    }

    // Create selection overlay for visual feedback
    createSelectionOverlay() {
        if (this.selectionOverlay) return;
        
        this.selectionOverlay = document.createElement('div');
        this.selectionOverlay.style.cssText = `
            position: absolute;
            background: rgba(76, 175, 80, 0.2);
            border: 2px solid #4CAF50;
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(this.selectionOverlay);
    }

    // Show selection overlay
    showSelectionOverlay(rect) {
        if (!this.selectionOverlay) this.createSelectionOverlay();
        
        this.selectionOverlay.style.display = 'block';
        this.selectionOverlay.style.left = rect.left + window.scrollX + 'px';
        this.selectionOverlay.style.top = rect.top + window.scrollY + 'px';
        this.selectionOverlay.style.width = rect.width + 'px';
        this.selectionOverlay.style.height = rect.height + 'px';
    }

    // Hide selection overlay
    hideSelectionOverlay() {
        if (this.selectionOverlay) {
            this.selectionOverlay.style.display = 'none';
        }
    }
}

// Initialize content analyzer
const contentAnalyzer = new ContentAnalyzer();

// Handle text selection
document.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        contentAnalyzer.showSelectionOverlay(rect);
        
        // Hide after 3 seconds
        setTimeout(() => {
            contentAnalyzer.hideSelectionOverlay();
        }, 3000);
    }
});

// Handle click outside selection
document.addEventListener('click', (e) => {
    if (!window.getSelection().toString().trim()) {
        contentAnalyzer.hideSelectionOverlay();
    }
});

// Message handling from popup and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    switch (message.type) {
        case 'getPageMetadata':
            sendResponse(contentAnalyzer.extractPageMetadata());
            break;
        case 'getSelectedText':
            sendResponse({
                text: window.getSelection().toString(),
                html: window.getSelection().toString() // Could enhance with HTML
            });
            break;
        case 'getFullText':
            sendResponse(contentAnalyzer.extractFullText());
            break;
        case 'highlightElement':
            // Highlight specific element for debugging
            const element = document.querySelector(message.selector);
            if (element) {
                element.style.outline = '2px solid red';
                setTimeout(() => {
                    element.style.outline = '';
                }, 3000);
            }
            sendResponse({ success: true });
            break;
    }
});

// Auto-tag detection based on content
function detectStrategicTags() {
    const content = document.body.textContent.toLowerCase();
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    
    const tags = [];
    
    // Cultural moment indicators
    if (content.includes('viral') || content.includes('trending') || content.includes('moment') || 
        url.includes('tiktok') || url.includes('instagram')) {
        tags.push('cultural-moment');
    }
    
    // Human behavior indicators
    if (content.includes('behavior') || content.includes('psychology') || content.includes('user') ||
        content.includes('consumer') || content.includes('audience')) {
        tags.push('human-behavior');
    }
    
    // Competitive content indicators
    if (content.includes('competitor') || content.includes('vs ') || content.includes('comparison') ||
        content.includes('rival') || title.includes('vs ')) {
        tags.push('rival-content');
    }
    
    // Visual hook indicators
    if (content.includes('design') || content.includes('visual') || content.includes('creative') ||
        document.querySelector('img, video, canvas')) {
        tags.push('visual-hook');
    }
    
    // Insight cue indicators
    if (content.includes('insight') || content.includes('analysis') || content.includes('strategy') ||
        content.includes('opportunity') || content.includes('trend')) {
        tags.push('insight-cue');
    }
    
    return tags;
}

// Initialize and send content analysis to background
setTimeout(() => {
    const metadata = contentAnalyzer.extractPageMetadata();
    const suggestedTags = detectStrategicTags();
    
    chrome.runtime.sendMessage({
        type: 'contentAnalysis',
        data: {
            metadata,
            suggestedTags,
            timestamp: new Date().toISOString()
        }
    });
}, 1000);

console.log('Content script initialized for:', window.location.href);