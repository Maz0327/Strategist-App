import axios from "axios";
import * as cheerio from "cheerio";

export class ScraperService {
  async extractContent(url: string): Promise<{ title: string; content: string }> {
    // Validate URL first
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Please enter a valid URL (e.g., https://example.com)`);
    }

    // Check if URL starts with http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://');
    }

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
        throw new Error('Unable to extract readable content from this webpage. The page may be protected, require JavaScript, or have an unusual format.');
      }
      
      return {
        title: title.substring(0, 200), // Limit title length
        content: content.substring(0, 10000) // Limit content length
      };
    } catch (error: any) {
      // Provide more specific error messages based on error type
      if (error.code === 'ENOTFOUND') {
        throw new Error('Website not found. Please check the URL and try again.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Connection refused. The website may be down or blocking requests.');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. The website is taking too long to respond.');
      } else if (error.response?.status === 404) {
        throw new Error('Page not found (404). Please check the URL.');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden (403). The website is blocking our request.');
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        throw new Error(`Website returned an error (${error.response.status}). Please check the URL.`);
      } else if (error.response?.status >= 500) {
        throw new Error('The website is experiencing server issues. Please try again later.');
      } else if (error.message?.includes('Invalid URL format')) {
        throw error; // Re-throw our custom validation error
      } else {
        throw new Error(`Unable to extract content: ${error.message}`);
      }
    }
  }
}

export const scraperService = new ScraperService();
