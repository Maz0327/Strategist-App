import axios from 'axios';

export interface PerspectiveScore {
  attributeScore: number;
  summaryScore: number;
  confidence: number;
}

export interface PerspectiveAnalysis {
  toxicity: PerspectiveScore;
  severeToxicity: PerspectiveScore;
  identityAttack: PerspectiveScore;
  insult: PerspectiveScore;
  profanity: PerspectiveScore;
  threat: PerspectiveScore;
  overall: {
    safe: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    primaryConcerns: string[];
  };
}

export class PerspectiveAPIService {
  private apiKey: string;
  private baseUrl = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERSPECTIVE_API_KEY || '';
  }

  async analyzeText(text: string): Promise<PerspectiveAnalysis | null> {
    if (!this.apiKey) {
      console.warn('Perspective API key not configured');
      return null;
    }

    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          comment: { text },
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            PROFANITY: {},
            THREAT: {}
          },
          languages: ['en']
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const attributeScores = response.data.attributeScores;
      
      const analysis: PerspectiveAnalysis = {
        toxicity: this.extractScore(attributeScores.TOXICITY),
        severeToxicity: this.extractScore(attributeScores.SEVERE_TOXICITY),
        identityAttack: this.extractScore(attributeScores.IDENTITY_ATTACK),
        insult: this.extractScore(attributeScores.INSULT),
        profanity: this.extractScore(attributeScores.PROFANITY),
        threat: this.extractScore(attributeScores.THREAT),
        overall: {
          safe: true,
          riskLevel: 'low',
          primaryConcerns: []
        }
      };

      // Calculate overall risk assessment
      analysis.overall = this.calculateOverallRisk(analysis);

      return analysis;
    } catch (error) {
      console.error('Perspective API error:', error);
      return null;
    }
  }

  private extractScore(attributeData: any): PerspectiveScore {
    if (!attributeData || !attributeData.summaryScore) {
      return { attributeScore: 0, summaryScore: 0, confidence: 0 };
    }

    return {
      attributeScore: attributeData.summaryScore.value || 0,
      summaryScore: attributeData.summaryScore.value || 0,
      confidence: attributeData.summaryScore.confidence || 0
    };
  }

  private calculateOverallRisk(analysis: PerspectiveAnalysis): PerspectiveAnalysis['overall'] {
    const scores = [
      analysis.toxicity.summaryScore,
      analysis.severeToxicity.summaryScore,
      analysis.identityAttack.summaryScore,
      analysis.insult.summaryScore,
      analysis.profanity.summaryScore,
      analysis.threat.summaryScore
    ];

    const maxScore = Math.max(...scores);
    const concerns: string[] = [];

    // Identify primary concerns (scores above 0.5)
    if (analysis.toxicity.summaryScore > 0.5) concerns.push('toxicity');
    if (analysis.severeToxicity.summaryScore > 0.5) concerns.push('severe toxicity');
    if (analysis.identityAttack.summaryScore > 0.5) concerns.push('identity attack');
    if (analysis.insult.summaryScore > 0.5) concerns.push('insult');
    if (analysis.profanity.summaryScore > 0.5) concerns.push('profanity');
    if (analysis.threat.summaryScore > 0.5) concerns.push('threat');

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let safe = true;

    if (maxScore > 0.7) {
      riskLevel = 'high';
      safe = false;
    } else if (maxScore > 0.4) {
      riskLevel = 'medium';
      safe = false;
    }

    return {
      safe,
      riskLevel,
      primaryConcerns: concerns
    };
  }

  async analyzeBatch(texts: string[]): Promise<(PerspectiveAnalysis | null)[]> {
    if (!this.apiKey) {
      return texts.map(() => null);
    }

    // Process in batches to avoid rate limits
    const batchSize = 5;
    const results: (PerspectiveAnalysis | null)[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.analyzeText(text))
      );
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

export const perspectiveAPIService = new PerspectiveAPIService();