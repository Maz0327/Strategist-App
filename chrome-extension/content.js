// Enhanced content script with smart content extraction
let selectedText = '';
let pageAnalysis = null;

// Initialize content analysis
document.addEventListener('DOMContentLoaded', function() {
  analyzePageContent();
});

// Enhanced text selection with context
document.addEventListener('mouseup', function(e) {
  const selection = window.getSelection();
  if (selection.toString().trim().length > 0) {
    selectedText = selection.toString().trim();
    
    // Get surrounding context
    const range = selection.getRangeAt(0);
    const context = getSelectionContext(range);
    
    // Store enhanced selection data
    chrome.storage.local.set({ 
      selectedText: selectedText,
      selectionContext: context,
      selectionTimestamp: Date.now()
    });
  }
});

// Smart page content analysis
function analyzePageContent() {
  pageAnalysis = {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    metaDescription: getMetaDescription(),
    keywords: extractKeywords(),
    readingTime: estimateReadingTime(),
    contentType: detectContentType(),
    mainContent: extractMainContent(),
    publishDate: extractPublishDate(),
    author: extractAuthor(),
    language: document.documentElement.lang || 'en'
  };
}

// Enhanced message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    const pageInfo = {
      ...pageAnalysis,
      selectedText: selectedText,
      timestamp: Date.now()
    };
    sendResponse(pageInfo);
  } else if (request.action === 'getFullContent') {
    const fullContent = {
      ...pageAnalysis,
      fullText: extractFullText(),
      headings: extractHeadings(),
      images: extractImages(),
      links: extractLinks()
    };
    sendResponse(fullContent);
  } else if (request.action === 'highlightText') {
    highlightText(request.text);
    sendResponse({success: true});
  }
});

// Helper functions
function getMetaDescription() {
  const meta = document.querySelector('meta[name="description"]') || 
               document.querySelector('meta[property="og:description"]');
  return meta ? meta.getAttribute('content') : '';
}

function getSelectionContext(range) {
  const container = range.commonAncestorContainer;
  const parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
  
  // Get surrounding text
  const before = parent.textContent.substring(0, range.startOffset).slice(-100);
  const after = parent.textContent.substring(range.endOffset).slice(0, 100);
  
  return {
    before: before,
    after: after,
    element: parent.tagName,
    className: parent.className
  };
}

function extractKeywords() {
  const keywords = document.querySelector('meta[name="keywords"]');
  if (keywords) return keywords.getAttribute('content').split(',').map(k => k.trim());
  
  // Extract from content
  const text = document.body.textContent.toLowerCase();
  const words = text.match(/\b\w{4,}\b/g) || [];
  const frequency = {};
  
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function estimateReadingTime() {
  const text = document.body.textContent;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200); // 200 words per minute
}

function detectContentType() {
  const url = window.location.href;
  const title = document.title.toLowerCase();
  
  // Enhanced video detection for social media platforms
  if (isVideoUrl(url)) return 'video';
  
  if (url.includes('blog') || url.includes('article')) return 'article';
  if (url.includes('news')) return 'news';
  if (url.includes('research') || url.includes('study')) return 'research';
  if (title.includes('video') || document.querySelector('video')) return 'video';
  if (title.includes('podcast') || document.querySelector('audio')) return 'podcast';
  
  return 'webpage';
}

function isVideoUrl(url) {
  const videoPatterns = [
    // YouTube patterns
    /youtube\.com\/watch/,
    /youtube\.com\/shorts/,
    /youtu\.be\//,
    
    // LinkedIn video patterns
    /linkedin\.com\/.*\/video/,
    /linkedin\.com\/posts\/.*activity/,
    /linkedin\.com\/feed\/update\/urn:li:activity/,
    /linkedin\.com\/embed\/feed\/update\/urn:li:ugcPost/,
    
    // Instagram video patterns
    /instagram\.com\/(p|reel|tv)\//,
    /instagram\.com\/stories\//,
    /instagr\.am\/(p|reel|tv)\//,
    
    // TikTok video patterns
    /tiktok\.com\/.*\/video/,
    /tiktok\.com\/@.*\/video/,
    /vm\.tiktok\.com\//,
    /tiktok\.com\/t\//,
    /m\.tiktok\.com\//,
    
    // Twitter/X video patterns
    /twitter\.com\/.*\/status/,
    /x\.com\/.*\/status/,
    /t\.co\//,
    
    // Other video platforms
    /vimeo\.com\//,
    /dailymotion\.com\//,
    /twitch\.tv\//
  ];
  
  return videoPatterns.some(pattern => pattern.test(url));
}

function extractMainContent() {
  // Try to find main content area
  const candidates = [
    'main', 'article', '.content', '.post', '.entry',
    '#content', '#main', '.main-content'
  ];
  
  for (const selector of candidates) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim().substring(0, 500) + '...';
    }
  }
  
  // Fallback to paragraphs
  const paragraphs = document.querySelectorAll('p');
  let content = '';
  for (let p of paragraphs) {
    if (p.textContent.trim().length > 50) {
      content += p.textContent.trim() + ' ';
      if (content.length > 500) break;
    }
  }
  
  return content.substring(0, 500) + '...';
}

function extractPublishDate() {
  const selectors = [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'time[datetime]',
    '.date',
    '.published',
    '.post-date'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.getAttribute('content') || 
             element.getAttribute('datetime') || 
             element.textContent;
    }
  }
  
  return null;
}

function extractAuthor() {
  const selectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '.author',
    '.byline',
    '.post-author'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.getAttribute('content') || element.textContent.trim();
    }
  }
  
  return null;
}

function extractFullText() {
  return document.body.textContent.trim();
}

function extractHeadings() {
  const headings = [];
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    headings.push({
      level: h.tagName,
      text: h.textContent.trim()
    });
  });
  return headings;
}

function extractImages() {
  const images = [];
  document.querySelectorAll('img').forEach(img => {
    if (img.src && !img.src.includes('data:')) {
      images.push({
        src: img.src,
        alt: img.alt,
        title: img.title
      });
    }
  });
  return images.slice(0, 5); // Limit to 5 images
}

function extractLinks() {
  const links = [];
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.href.startsWith('http')) {
      links.push({
        url: a.href,
        text: a.textContent.trim()
      });
    }
  });
  return links.slice(0, 10); // Limit to 10 links
}

function highlightText(text) {
  // Simple text highlighting for visual feedback
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  textNodes.forEach(textNode => {
    if (textNode.textContent.includes(text)) {
      const parent = textNode.parentNode;
      const highlighted = document.createElement('mark');
      highlighted.style.backgroundColor = '#3b82f6';
      highlighted.style.color = 'white';
      highlighted.textContent = text;
      
      parent.replaceChild(highlighted, textNode);
    }
  });
}