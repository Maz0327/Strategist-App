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
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, .sidebar, .menu, .advertisement').remove();
      
      // Try to extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled';
      
      // Try to extract main content
      let content = '';
      
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
      
      // Clean up content
      content = content.replace(/\s+/g, ' ').trim();
      
      if (!content) {
        throw new Error('No content found on the page');
      }

      // Extract visual assets
      const visualAssets = await this.extractVisualAssets($, url);
      
      return {
        title: title.substring(0, 200), // Limit title length
        content: content.substring(0, 10000), // Limit content length
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
      // Extract images
      $('img').each((_, element) => {
        const $img = $(element);
        const src = $img.attr('src');
        const alt = $img.attr('alt') || '';
        const width = $img.attr('width');
        const height = $img.attr('height');
        
        if (src) {
          const absoluteUrl = this.makeAbsoluteUrl(src, baseUrl);
          
          // Filter out common non-content images
          if (!this.isContentImage(absoluteUrl, alt)) {
            return;
          }
          
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
      });

      // Note: Video analysis removed - focusing on images only for now

      // Limit to most relevant assets (top 20)
      return visualAssets.slice(0, 20);
      
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

  private isContentImage(url: string, alt: string): boolean {
    // Filter out common non-content images
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
      /ads/i,
      /social/i,
      /share/i
    ];
    
    const urlLower = url.toLowerCase();
    const altLower = alt.toLowerCase();
    
    // Check if image seems to be content-related
    const hasContentKeywords = /article|content|post|product|feature|hero|banner|gallery/i.test(urlLower + altLower);
    
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
