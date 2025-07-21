import axios from "axios";
import * as cheerio from "cheerio";

export interface VisualAsset {
  type: 'image';
  url: string;
  alt?: string;
  dimensions?: { width: number; height: number };
  fileSize?: number;
  format?: string;
}

export interface ExtractedContent {
  title: string;
  content: string;
  author?: string;
  images?: string[]; // Add images array for compatibility
  visualAssets: VisualAsset[];
  metadata: {
    images: number;
    totalVisualAssets: number;
  };
}

export class ScraperService {
  async extractContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await axios.get(url, {
        timeout: 5000, // Reduced from 10 seconds to 5 seconds
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 3 // Limit redirects to speed up requests
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, .sidebar, .menu, .advertisement').remove();
      
      // Try to extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled';
      
      // Try to extract main content (text only - no comments)
      let content = '';
      
      // Social media-specific extraction for post text
      if (url.includes('linkedin.com')) {
        // LinkedIn post content selectors
        const linkedinSelectors = [
          '.feed-shared-text',
          '.attributed-text-segment-list__content',
          '.feed-shared-update-v2__commentary',
          '.feed-shared-text__text-view',
          '[data-test-id="main-feed-activity-card"] .break-words',
          '.feed-shared-text span[dir="ltr"]'
        ];
        
        for (const selector of linkedinSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            content = element.text().trim();
            break;
          }
        }
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        // Twitter/X post content
        const twitterSelectors = [
          '[data-testid="tweetText"]',
          '.tweet-text',
          '[data-testid="tweet"] [lang]'
        ];
        
        for (const selector of twitterSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            content = element.text().trim();
            break;
          }
        }
      } else if (url.includes('instagram.com')) {
        // Instagram post content
        const instagramSelectors = [
          'article [role="button"] span',
          '._a9zs h1',
          '._a9zr span'
        ];
        
        for (const selector of instagramSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            content = element.text().trim();
            break;
          }
        }
      }
      
      // If LinkedIn-specific extraction didn't work, use general selectors
      if (!content) {
        // Common content selectors
        const contentSelectors = [
          'article',
          '.post-content',
          '.entry-content',
          '.content',
          'main',
          '.main-content',
          '.post-body',
          '.article-body'
        ];
      
        for (const selector of contentSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            content = element.text().trim();
            break;
          }
        }
        
        // Fallback to body content
        if (!content) {
          content = $('body').text().trim();
        }
      }
      
      // Clean up content
      content = content.replace(/\s+/g, ' ').trim();
      
      if (!content) {
        throw new Error('No content found on the page');
      }

      // Extract visual assets with debug logging
      console.log('Extracting visual assets for URL:', url);
      const visualAssets = await this.extractVisualAssets($, url);
      console.log('Visual assets found:', visualAssets.length, visualAssets.map(a => ({ url: a.url, alt: a.alt })));
      
      return {
        title: title.substring(0, 200), // Limit title length
        content: content.substring(0, 10000), // Limit content length
        images: visualAssets.map(asset => asset.url), // Extract image URLs for compatibility
        visualAssets,
        metadata: {
          images: visualAssets.length, // All assets are images now
          totalVisualAssets: visualAssets.length
        }
      };
    } catch (error) {
      console.error("Scraping error:", error);
      throw new Error("Failed to extract content from URL");
    }
  }

  private async extractVisualAssets($: cheerio.CheerioAPI, baseUrl: string): Promise<VisualAsset[]> {
    const visualAssets: VisualAsset[] = [];
    
    try {
      // Enhanced image extraction optimized for social media platforms

      // Enhanced image extraction with comprehensive social media selectors
      const imageSelectors = [
        'img', // Standard img tags
        '[style*="background-image"]', // CSS background images
        '[data-background-image]', // Data attributes
        
        // LinkedIn specific selectors - more comprehensive
        '.feed-shared-image img',
        '.feed-shared-update-v2 img', 
        '[data-test-id*="image"] img',
        '.update-components-image img',
        '.feed-shared-image-thumbnail img',
        '.feed-shared-content img',
        '.feed-shared-mini-update-v2 img',
        '.share-image img',
        '.share-content img',
        'article img',
        '.post img',
        '.update img',
        '[class*="feed"] img',
        '[class*="share"] img',
        '[class*="update"] img',
        '[class*="post"] img',
        '.shared-image img'
      ];
      
      for (const selector of imageSelectors) {
        $(selector).each((_, element) => {
          const $el = $(element);
          let src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-background-image') || 
                   $el.attr('data-delayed-url') || $el.attr('data-original') || $el.attr('data-lazy-src');
          
          // Handle CSS background-image
          if (!src && $el.attr('style')) {
            const styleMatch = $el.attr('style')?.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
            if (styleMatch) {
              src = styleMatch[1];
            }
          }
          
          // Process found image source
          if (src) {
            console.log('Found image source:', src);
            const alt = $el.attr('alt') || $el.attr('title') || '';
            const width = $el.attr('width');
            const height = $el.attr('height');
            
            const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
            
            // More permissive filtering for social media images
            const isValid = this.isContentImage(absoluteUrl, alt, baseUrl);
            console.log('Image validation:', absoluteUrl, 'valid:', isValid);
            if (isValid) {
              visualAssets.push({
                type: 'image',
                url: absoluteUrl,
                alt,
                dimensions: width && height ? { 
                  width: parseInt(width), 
                  height: parseInt(height) 
                } : undefined,
                format: this.getFileExtension(absoluteUrl)
              });
            }
          }
        });
      }

      // Remove duplicates based on URL
      const uniqueAssets = visualAssets.filter((asset, index, self) => 
        index === self.findIndex(a => a.url === asset.url)
      );

      // Limit to most relevant assets (top 20)
      return uniqueAssets.slice(0, 20);
      
    } catch (error) {
      console.error("Visual asset extraction error:", error);
      return [];
    }
  }

  private makeAbsoluteUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }

  private isContentImage(url: string, alt: string, baseUrl: string = ''): boolean {
    const urlLower = url.toLowerCase();
    const altLower = alt.toLowerCase();
    
    // Always include social media platform images
    if (baseUrl.includes('linkedin.com') || baseUrl.includes('twitter.com') || 
        baseUrl.includes('instagram.com') || baseUrl.includes('facebook.com')) {
      
      // TEMPORARY: Very permissive filtering to debug - BLOCK only obvious UI elements
      if (url.includes('static.licdn.com/aero-v1/sc/h/')) {
        console.log('BLOCKED UI icon:', url);
        return false; // Block UI icons
      }
      
      if (url.includes('reaction-type') || alt.includes('reaction-type')) {
        console.log('BLOCKED reaction icon:', url);
        return false; // Block reaction icons
      }
      
      if (url.includes('profile-displayphoto')) {
        console.log('BLOCKED profile photo:', url);
        return false; // Block profile pictures
      }
      
      if (url.includes('company-logo')) {
        console.log('BLOCKED company logo:', url);
        return false; // Block company logos
      }
      
      if (url.includes('profile-displaybackgroundimage')) {
        console.log('BLOCKED background image:', url);
        return false; // Block background images
      }
      
      // TEMPORARY: Allow ALL other LinkedIn images to see what we're missing
      console.log('ALLOWING LinkedIn image:', url);
      return true;
    }
    
    // For non-social media sites, use more strict filtering
    const excludePatterns = [
      /favicon/i,
      /logo/i,
      /icon/i,
      /button/i,
      /arrow/i,
      /spacer/i,
      /pixel/i,
      /tracking/i,
      /analytics/i,
      /advertisement/i,
      /ads/i
    ];
    
    // Check if image seems to be content-related
    const hasContentKeywords = /article|content|post|product|feature|hero|banner|gallery|media|photo/i.test(urlLower + altLower);
    
    // Check size indicators (avoid tiny images)
    const hasSize = url.includes('w=') || url.includes('width=') || url.includes('size=');
    
    // Exclude obvious non-content images
    const isExcluded = excludePatterns.some(pattern => pattern.test(urlLower) || pattern.test(altLower));
    
    return !isExcluded && (hasContentKeywords || hasSize || alt.length > 10);
  }

  private getFileExtension(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([^.]+)$/);
      return match ? match[1].toLowerCase() : undefined;
    } catch {
      return undefined;
    }
  }
}

export const scraperService = new ScraperService();
