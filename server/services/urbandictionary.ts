import axios from 'axios';
import * as cheerio from 'cheerio';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface UrbanDictionaryEntry {
  id: string;
  word: string;
  definition: string;
  example: string;
  thumbs_up: number;
  thumbs_down: number;
  author: string;
  written_on: string;
  permalink: string;
}

export class UrbanDictionaryService {
  private readonly baseUrl = 'https://www.urbandictionary.com';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async getTrendingWords(limit: number = 20): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching trending words from Urban Dictionary');
      
      const response = await axios.get(`${this.baseUrl}/trending`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const words: TrendingTopic[] = [];

      $('.def-panel').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const word = $element.find('.word').text().trim();
        const definition = $element.find('.meaning').text().trim();
        const example = $element.find('.example').text().trim();
        const thumbsUp = parseInt($element.find('.up').text().trim()) || 0;
        const thumbsDown = parseInt($element.find('.down').text().trim()) || 0;
        const author = $element.find('.author').text().trim();
        const permalink = $element.find('.word a').attr('href');

        if (word && definition) {
          words.push({
            id: `ud-${index + 1}`,
            platform: 'urbandictionary',
            title: `"${word}" - New Trending Term`,
            summary: `${definition.substring(0, 200)}${definition.length > 200 ? '...' : ''}`,
            url: permalink ? `${this.baseUrl}${permalink}` : `${this.baseUrl}/define.php?term=${encodeURIComponent(word)}`,
            score: this.calculateWordScore(thumbsUp, thumbsDown, index),
            fetchedAt: new Date().toISOString(),
            engagement: thumbsUp + thumbsDown,
            source: 'Urban Dictionary - Trending',
            keywords: this.extractKeywords(word, definition, example)
          });
        }
      });

      debugLogger.info(`Successfully fetched ${words.length} trending words`);
      return words;

    } catch (error) {
      debugLogger.error('Failed to fetch trending words', error);
      return this.getFallbackWords();
    }
  }

  async getPopularWords(limit: number = 15): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching popular words from Urban Dictionary');
      
      const response = await axios.get(`${this.baseUrl}/popular`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const words: TrendingTopic[] = [];

      $('.def-panel').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const word = $element.find('.word').text().trim();
        const definition = $element.find('.meaning').text().trim();
        const example = $element.find('.example').text().trim();
        const thumbsUp = parseInt($element.find('.up').text().trim()) || 0;
        const thumbsDown = parseInt($element.find('.down').text().trim()) || 0;

        if (word && definition) {
          words.push({
            id: `ud-popular-${index + 1}`,
            platform: 'urbandictionary',
            title: `"${word}" - Popular Definition`,
            summary: `${definition.substring(0, 200)}${definition.length > 200 ? '...' : ''}`,
            url: `${this.baseUrl}/define.php?term=${encodeURIComponent(word)}`,
            score: this.calculateWordScore(thumbsUp, thumbsDown, index, true),
            fetchedAt: new Date().toISOString(),
            engagement: thumbsUp + thumbsDown,
            source: 'Urban Dictionary - Popular',
            keywords: this.extractKeywords(word, definition, example)
          });
        }
      });

      debugLogger.info(`Successfully fetched ${words.length} popular words`);
      return words;

    } catch (error) {
      debugLogger.error('Failed to fetch popular words', error);
      return this.getFallbackWords();
    }
  }

  async getRecentWords(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching recent words from Urban Dictionary');
      
      const response = await axios.get(`${this.baseUrl}/recent`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const words: TrendingTopic[] = [];

      $('.def-panel').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const word = $element.find('.word').text().trim();
        const definition = $element.find('.meaning').text().trim();
        const example = $element.find('.example').text().trim();
        const thumbsUp = parseInt($element.find('.up').text().trim()) || 0;
        const thumbsDown = parseInt($element.find('.down').text().trim()) || 0;

        if (word && definition) {
          words.push({
            id: `ud-recent-${index + 1}`,
            platform: 'urbandictionary',
            title: `"${word}" - New Definition`,
            summary: `${definition.substring(0, 200)}${definition.length > 200 ? '...' : ''}`,
            url: `${this.baseUrl}/define.php?term=${encodeURIComponent(word)}`,
            score: this.calculateWordScore(thumbsUp, thumbsDown, index, false, true),
            fetchedAt: new Date().toISOString(),
            engagement: thumbsUp + thumbsDown,
            source: 'Urban Dictionary - Recent',
            keywords: this.extractKeywords(word, definition, example)
          });
        }
      });

      debugLogger.info(`Successfully fetched ${words.length} recent words`);
      return words;

    } catch (error) {
      debugLogger.error('Failed to fetch recent words', error);
      return [];
    }
  }

  async getWordOfTheDay(): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching word of the day from Urban Dictionary');
      
      const response = await axios.get(`${this.baseUrl}/`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const word = $('.def-header .word').first().text().trim();
      const definition = $('.meaning').first().text().trim();
      const example = $('.example').first().text().trim();
      const thumbsUp = parseInt($('.up').first().text().trim()) || 0;
      const thumbsDown = parseInt($('.down').first().text().trim()) || 0;

      if (word && definition) {
        return [{
          id: 'ud-wotd',
          platform: 'urbandictionary',
          title: `Word of the Day: "${word}"`,
          summary: `${definition.substring(0, 300)}${definition.length > 300 ? '...' : ''}`,
          url: `${this.baseUrl}/define.php?term=${encodeURIComponent(word)}`,
          score: 90, // High score for word of the day
          fetchedAt: new Date().toISOString(),
          engagement: thumbsUp + thumbsDown,
          source: 'Urban Dictionary - Word of the Day',
          keywords: this.extractKeywords(word, definition, example)
        }];
      }

      return [];

    } catch (error) {
      debugLogger.error('Failed to fetch word of the day', error);
      return [];
    }
  }

  private calculateWordScore(thumbsUp: number, thumbsDown: number, position: number, isPopular: boolean = false, isRecent: boolean = false): number {
    let score = 80 - (position * 2);
    
    // Calculate approval ratio
    const totalVotes = thumbsUp + thumbsDown;
    if (totalVotes > 0) {
      const approvalRatio = thumbsUp / totalVotes;
      score += Math.floor(approvalRatio * 20);
    }
    
    // Boost for high engagement
    if (totalVotes > 1000) score += 25;
    else if (totalVotes > 500) score += 20;
    else if (totalVotes > 100) score += 15;
    else if (totalVotes > 50) score += 10;
    
    // Boost for popular section
    if (isPopular) score += 15;
    
    // Boost for recent terms (cultural relevance)
    if (isRecent) score += 10;
    
    return Math.max(Math.min(score, 100), 25);
  }

  private extractKeywords(word: string, definition: string, example: string): string[] {
    const keywords: string[] = [];
    
    // Add the word itself
    if (word) {
      keywords.push(word.toLowerCase());
    }
    
    // Extract from definition
    if (definition) {
      keywords.push(...definition.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 8));
    }
    
    // Extract from example
    if (example) {
      keywords.push(...example.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 3));
    }
    
    // Add language-specific keywords
    keywords.push('slang', 'language', 'culture', 'definition');
    
    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'are', 'was', 'were', 'but', 'not', 'can', 'all', 'any', 'had', 'her', 'his', 'our', 'out', 'day', 'get', 'has', 'him', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'you', 'may', 'one', 'can', 'like', 'when', 'what', 'more', 'time', 'very', 'well', 'come', 'make', 'over', 'such', 'take', 'than', 'only', 'good', 'some', 'could', 'would', 'other', 'into', 'first', 'after', 'being', 'these', 'many', 'most', 'also', 'where', 'much', 'before', 'right', 'through', 'just', 'should', 'those', 'people', 'never', 'being', 'here', 'each', 'which', 'their', 'said', 'them', 'there', 'think', 'want', 'does', 'part', 'even', 'back', 'work', 'life', 'become', 'same', 'tell', 'why', 'ask', 'came', 'show', 'every', 'large', 'find', 'still', 'between', 'name', 'should', 'home', 'give', 'water', 'room', 'turn', 'move', 'because', 'thing', 'place', 'case', 'most', 'used', 'during', 'without', 'again', 'think', 'around', 'however', 'got', 'usually', 'run', 'important', 'until', 'children', 'side', 'feet', 'car', 'mile', 'began', 'grow', 'took', 'river', 'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'without', 'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face', 'watch', 'far', 'indian', 'really', 'almost', 'let', 'above', 'girl', 'sometimes', 'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'leave', 'family', 'below', 'never', 'started', 'city', 'earth', 'eyes', 'light', 'thought', 'head', 'under', 'story', 'saw', 'left', 'don', 'few', 'while', 'along', 'might', 'close', 'something', 'seem', 'next', 'hard', 'open', 'example', 'begin', 'life', 'always', 'those', 'both', 'paper', 'together', 'got', 'group', 'often', 'run', 'important', 'until', 'children', 'side', 'feet', 'car', 'mile', 'began', 'grow', 'took', 'river', 'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'without', 'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face', 'watch', 'far', 'indian', 'really', 'almost', 'let', 'above', 'girl', 'sometimes', 'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'leave', 'family', 'below'];
    
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word) && word.length > 2)
      .slice(0, 8);
  }

  private getFallbackWords(): TrendingTopic[] {
    return [
      {
        id: 'ud-fallback-1',
        platform: 'urbandictionary',
        title: '"Bussin" - Gen Z Slang Trend',
        summary: 'Popular slang term meaning "really good" or "excellent", particularly used to describe food or experiences',
        url: 'https://www.urbandictionary.com/define.php?term=bussin',
        score: 85,
        fetchedAt: new Date().toISOString(),
        engagement: 2500,
        source: 'Urban Dictionary - Fallback',
        keywords: ['bussin', 'genz', 'slang', 'good', 'excellent', 'culture']
      },
      {
        id: 'ud-fallback-2',
        platform: 'urbandictionary',
        title: '"Slay" - Empowerment Expression',
        summary: 'Term meaning to do something exceptionally well or to look amazing, often used as encouragement',
        url: 'https://www.urbandictionary.com/define.php?term=slay',
        score: 80,
        fetchedAt: new Date().toISOString(),
        engagement: 3200,
        source: 'Urban Dictionary - Fallback',
        keywords: ['slay', 'empowerment', 'amazing', 'excellent', 'support', 'culture']
      },
      {
        id: 'ud-fallback-3',
        platform: 'urbandictionary',
        title: '"No Cap" - Authenticity Emphasis',
        summary: 'Phrase meaning "no lie" or "for real", used to emphasize that someone is being truthful',
        url: 'https://www.urbandictionary.com/define.php?term=no%20cap',
        score: 75,
        fetchedAt: new Date().toISOString(),
        engagement: 1800,
        source: 'Urban Dictionary - Fallback',
        keywords: ['nocap', 'truth', 'real', 'authentic', 'honest', 'slang']
      }
    ];
  }
}

export const urbanDictionaryService = new UrbanDictionaryService();