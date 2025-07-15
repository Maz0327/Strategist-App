import { spawn } from 'child_process';
import path from 'path';
import type { TrendingTopic } from './trends';

export interface NgramAnalysis {
  term: string;
  pattern: 'emerging' | 'mature_growth' | 'cyclical' | 'exponential' | 'steady_growth' | 'unknown';
  peaks: number[];
  current_phase: 'emerging' | 'growing' | 'mature' | 'plateau' | 'declining' | 'cyclical' | 'new_normal' | 'mainstream' | 'analysis_needed';
  insight: string;
}

export interface NgramResult {
  term: string;
  status: 'success' | 'fallback' | 'error';
  historical_analysis: NgramAnalysis;
}

export class GoogleNgramService {
  private pythonScript: string;

  constructor() {
    this.pythonScript = path.join(process.cwd(), 'server', 'python', 'google_ngram_service.py');
  }

  async getHistoricalContext(term: string): Promise<NgramResult | null> {
    return new Promise((resolve) => {
      try {
        const pythonProcess = spawn('python3', [this.pythonScript, term]);
        
        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0 && outputData.trim()) {
            try {
              const result = JSON.parse(outputData.trim());
              resolve(result);
            } catch (parseError) {
              console.error('Error parsing Python output:', parseError);
              resolve(this.getFallbackAnalysis(term));
            }
          } else {
            console.error('Python script error:', errorData);
            resolve(this.getFallbackAnalysis(term));
          }
        });

        // Set timeout to prevent hanging
        setTimeout(() => {
          pythonProcess.kill();
          resolve(this.getFallbackAnalysis(term));
        }, 10000); // 10 second timeout

      } catch (error) {
        console.error('Error running Python script:', error);
        resolve(this.getFallbackAnalysis(term));
      }
    });
  }

  private getFallbackAnalysis(term: string): NgramResult {
    // Curated historical insights for common business terms
    const businessTerms: Record<string, NgramAnalysis> = {
      'artificial intelligence': {
        pattern: 'cyclical',
        peaks: [1985, 2015],
        current_phase: 'mature',
        insight: 'Third wave of AI interest - previous peaks 1980s, 2010s. Focus on integration rather than adoption'
      },
      'ai': {
        pattern: 'cyclical',
        peaks: [1985, 2015],
        current_phase: 'mature',
        insight: 'Third wave of AI interest - focus on specific applications rather than general AI messaging'
      },
      'sustainability': {
        pattern: 'mature_growth',
        peaks: [2010],
        current_phase: 'plateau',
        insight: 'Mature sustainability movement - focus on differentiation and measurable impact'
      },
      'remote work': {
        pattern: 'exponential',
        peaks: [2020],
        current_phase: 'new_normal',
        insight: 'Permanent shift from temporary adaptation - invest in long-term remote infrastructure'
      },
      'digital transformation': {
        pattern: 'steady_growth',
        peaks: [2015],
        current_phase: 'mainstream',
        insight: 'Digital transformation is table stakes - focus on specific implementations'
      },
      'influencer marketing': {
        pattern: 'emerging',
        peaks: [2018],
        current_phase: 'mature',
        insight: 'Rapid rise 2010-2020, now maturing - pivot to authenticity and micro-influencers'
      },
      'blockchain': {
        pattern: 'cyclical',
        peaks: [2017],
        current_phase: 'plateau',
        insight: 'Post-hype plateau - focus on practical applications rather than technology itself'
      },
      'machine learning': {
        pattern: 'exponential',
        peaks: [2015],
        current_phase: 'mainstream',
        insight: 'Mainstream adoption phase - focus on specific use cases and ROI'
      }
    };

    const cleanTerm = term.toLowerCase().trim();
    const analysis = businessTerms[cleanTerm] || {
      pattern: 'unknown',
      peaks: [],
      current_phase: 'analysis_needed',
      insight: `Historical context analysis needed for "${term}" - check trend maturity and cyclical patterns`
    };

    return {
      term: cleanTerm,
      status: 'fallback',
      historical_analysis: analysis
    };
  }

  async enhanceTrendingTopics(topics: TrendingTopic[]): Promise<TrendingTopic[]> {
    try {
      // Enhance top 5 topics with historical context
      const topTopics = topics.slice(0, 5);
      
      const enhancedTopics = await Promise.all(
        topTopics.map(async (topic) => {
          const historicalContext = await this.getHistoricalContext(topic.title);
          
          if (historicalContext) {
            return {
              ...topic,
              metadata: {
                ...topic.metadata,
                historical: {
                  pattern: historicalContext.historical_analysis.pattern,
                  currentPhase: historicalContext.historical_analysis.current_phase,
                  insight: historicalContext.historical_analysis.insight,
                  peaks: historicalContext.historical_analysis.peaks
                }
              }
            };
          }
          
          return topic;
        })
      );

      // Return enhanced topics plus remaining unenhanced ones
      return [...enhancedTopics, ...topics.slice(5)];
    } catch (error) {
      console.error('Historical context enhancement failed:', error);
      return topics;
    }
  }

  async getStrategicSummary(topics: TrendingTopic[]): Promise<string> {
    const topTopics = topics.slice(0, 5);
    const contexts = await Promise.all(
      topTopics.map(topic => this.getHistoricalContext(topic.title))
    );

    const matureTerms: string[] = [];
    const emergingTerms: string[] = [];
    const cyclicalTerms: string[] = [];

    contexts.forEach((context, index) => {
      if (context) {
        const pattern = context.historical_analysis.pattern;
        const phase = context.historical_analysis.current_phase;
        const term = topTopics[index].title;

        if (pattern === 'mature_growth' || phase === 'plateau' || phase === 'mainstream') {
          matureTerms.push(term);
        } else if (pattern === 'emerging' || phase === 'emerging') {
          emergingTerms.push(term);
        } else if (pattern === 'cyclical') {
          cyclicalTerms.push(term);
        }
      }
    });

    const summaryParts: string[] = [];
    
    if (matureTerms.length > 0) {
      summaryParts.push(`Mature trends requiring differentiation: ${matureTerms.join(', ')}`);
    }
    if (emergingTerms.length > 0) {
      summaryParts.push(`Emerging opportunities for early adoption: ${emergingTerms.join(', ')}`);
    }
    if (cyclicalTerms.length > 0) {
      summaryParts.push(`Cyclical trends in current wave: ${cyclicalTerms.join(', ')}`);
    }

    return summaryParts.length > 0 
      ? summaryParts.join('; ')
      : 'Mixed trend maturity - strategic timing analysis recommended';
  }
}

export const googleNgramService = new GoogleNgramService();