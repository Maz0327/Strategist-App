import axios from "axios";
import * as cheerio from "cheerio";

export class ScraperService {
  async extractContent(url: string): Promise<{ title: string; content: string }> {
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
      
      return {
        title: title.substring(0, 200), // Limit title length
        content: content.substring(0, 10000) // Limit content length
      };
    } catch (error) {
      console.error("Scraping error:", error);
      throw new Error("Failed to extract content from URL");
    }
  }
}

export const scraperService = new ScraperService();
