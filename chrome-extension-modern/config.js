// Modern Chrome Extension Configuration
const CONFIG = {
    // Production Replit URL
    API_BASE_URL: 'https://60011746-76d1-4a07-8b52-69bb642792b8-00-7v62f6wvgff1.worf.replit.dev',
    
    // Extension metadata
    EXTENSION_VERSION: '3.0.0',
    EXTENSION_NAME: 'Strategic Content Capture',
    
    // Connection testing
    async testConnection() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok || response.status === 401; // 401 means server is reachable but not logged in
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    },
    
    // Strategic tags configuration
    STRATEGIC_TAGS: [
        {
            id: 'cultural-moment',
            name: 'Cultural Moment',
            emoji: '🌊',
            description: 'Zeitgeist & trending culture',
            domains: ['tiktok.com', 'twitter.com', 'x.com'],
            keywords: ['viral', 'trending', 'culture', 'moment', 'zeitgeist']
        },
        {
            id: 'human-behavior',
            name: 'Human Behavior',
            emoji: '🧠',
            description: 'Psychology & patterns',
            domains: ['reddit.com', 'medium.com'],
            keywords: ['behavior', 'psychology', 'pattern', 'habit', 'mindset']
        },
        {
            id: 'rival-content',
            name: 'Rival Content',
            emoji: '⚔️',
            description: 'Competitive intelligence',
            domains: ['linkedin.com', 'producthunt.com'],
            keywords: ['competitor', 'rival', 'competition', 'market', 'industry']
        },
        {
            id: 'visual-hook',
            name: 'Visual Hook',
            emoji: '🎨',
            description: 'Design & creative trends',
            domains: ['instagram.com', 'dribbble.com', 'behance.net'],
            keywords: ['design', 'visual', 'creative', 'aesthetic', 'art']
        },
        {
            id: 'insight-cue',
            name: 'Insight Cue',
            emoji: '💡',
            description: 'Strategic intelligence',
            domains: ['linkedin.com', 'substack.com'],
            keywords: ['insight', 'strategy', 'intelligence', 'analysis', 'data']
        },
        {
            id: 'trend-signal',
            name: 'Trend Signal',
            emoji: '📈',
            description: 'Market & data trends',
            domains: ['techcrunch.com', 'venturebeat.com'],
            keywords: ['trend', 'signal', 'market', 'growth', 'forecast']
        },
        {
            id: 'attention-arbitrage',
            name: 'Attention Arbitrage',
            emoji: '🎯',
            description: 'Engagement opportunities',
            domains: ['youtube.com', 'tiktok.com'],
            keywords: ['attention', 'engagement', 'viral', 'reach', 'audience']
        },
        {
            id: 'bridge-worthy',
            name: 'Bridge Worthy',
            emoji: '🌉',
            description: 'Cross-platform potential',
            domains: ['all'],
            keywords: ['bridge', 'cross-platform', 'adaptation', 'translate']
        },
        {
            id: 'consumer-shift',
            name: 'Consumer Shift',
            emoji: '🔄',
            description: 'Behavior changes',
            domains: ['news', 'research'],
            keywords: ['consumer', 'shift', 'change', 'behavior', 'preference']
        },
        {
            id: 'platform-native',
            name: 'Platform Native',
            emoji: '📱',
            description: 'Platform-specific content',
            domains: ['all'],
            keywords: ['native', 'platform', 'format', 'specific', 'optimized']
        }
    ],
    
    // Smart suggestions based on content type
    SMART_SUGGESTIONS: {
        'social': ['Cultural relevance?', 'Engagement patterns?', 'Viral potential?'],
        'news': ['Market impact?', 'Consumer implications?', 'Strategic insights?'],
        'research': ['Key findings?', 'Methodology insights?', 'Application potential?'],
        'video': ['Hook effectiveness?', 'Visual storytelling?', 'Audience retention?'],
        'article': ['Core argument?', 'Supporting evidence?', 'Counterpoints?']
    }
};

// Auto-tagging intelligence
CONFIG.getAutoTags = function(url, content = '') {
    const domain = url ? new URL(url).hostname.toLowerCase() : '';
    const suggestedTags = [];
    
    // Domain-based suggestions
    this.STRATEGIC_TAGS.forEach(tag => {
        if (tag.domains.includes('all') || tag.domains.some(d => domain.includes(d))) {
            suggestedTags.push(tag.id);
        }
    });
    
    // Content-based suggestions
    const contentLower = content.toLowerCase();
    this.STRATEGIC_TAGS.forEach(tag => {
        if (tag.keywords.some(keyword => contentLower.includes(keyword))) {
            if (!suggestedTags.includes(tag.id)) {
                suggestedTags.push(tag.id);
            }
        }
    });
    
    return suggestedTags.slice(0, 4); // Max 4 auto-suggestions
};

// Content type detection
CONFIG.detectContentType = function(url, title = '', content = '') {
    const domain = url ? new URL(url).hostname.toLowerCase() : '';
    
    if (domain.includes('youtube.com') || domain.includes('vimeo.com')) return 'video';
    if (domain.includes('twitter.com') || domain.includes('x.com') || domain.includes('tiktok.com')) return 'social';
    if (domain.includes('arxiv.org') || domain.includes('researchgate.net')) return 'research';
    if (title.toLowerCase().includes('news') || domain.includes('news')) return 'news';
    
    return 'article';
};

// Smart suggestions based on content
CONFIG.getSmartSuggestions = function(contentType, domain = '') {
    const suggestions = this.SMART_SUGGESTIONS[contentType] || this.SMART_SUGGESTIONS['article'];
    
    // Add domain-specific suggestions
    if (domain.includes('linkedin.com')) {
        suggestions.push('Professional insights?', 'Industry implications?');
    } else if (domain.includes('tiktok.com')) {
        suggestions.push('Creative format?', 'Trend potential?');
    } else if (domain.includes('youtube.com')) {
        suggestions.push('Video strategy?', 'Audience engagement?');
    }
    
    return [...new Set(suggestions)].slice(0, 6); // Remove duplicates, max 6
};

// Make globally available
window.CONFIG = CONFIG;