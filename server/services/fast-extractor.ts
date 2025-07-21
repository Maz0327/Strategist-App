import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FastExtractedContent {
  title: string;
  content: string;
  author?: string;
  comments?: string;
  images?: string[];
}

// Ultra-fast content extraction service that prioritizes speed over video transcription
export class FastExtractorService {
  async extractContentFast(url: string): Promise<FastExtractedContent> {
    try {
      // Ultra-fast extraction with 3-second timeout
      const response = await axios.get(url, {
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 2
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements quickly
      $('script, style, nav, footer, header, aside').remove();
      
      // Quick title extraction
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Extracted Content';
      
      // Fast content extraction
      let content = '';
      const contentSelectors = ['article', '.post-content', '.content', 'main'];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }
      
      // Fallback to body
      if (!content) {
        content = $('body').text().trim();
      }
      
      // Clean up content quickly
      content = content.replace(/\s+/g, ' ').trim();
      
      // Quick image extraction (first 3 images only)
      const images: string[] = [];
      $('img').slice(0, 3).each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const imageUrl = src.startsWith('http') ? src : new URL(src, url).toString();
          images.push(imageUrl);
        }
      });

      return {
        title: title.substring(0, 200),
        content: content.substring(0, 8000),
        images,
        comments: '', // No comment extraction in fast mode
        author: $('meta[name="author"]').attr('content') || undefined
      };
    } catch (error) {
      throw new Error(`Fast extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}