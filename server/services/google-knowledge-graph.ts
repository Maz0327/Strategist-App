import axios from 'axios';
import type { TrendingTopic } from './trends';

export interface KnowledgeGraphEntity {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  image?: string;
  url?: string;
  types: string[];
  score: number;
}

export class GoogleKnowledgeGraphService {
  private apiKey: string;
  private baseUrl = 'https://kgsearch.googleapis.com/v1/entities:search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY || '';
  }

  async searchEntities(query: string, limit: number = 10): Promise<KnowledgeGraphEntity[]> {
    if (!this.apiKey) {
      console.warn('Google Knowledge Graph API key not configured');
      return [];
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          query,
          key: this.apiKey,
          limit,
          indent: true
        },
        timeout: 10000
      });

      if (response.data.itemListElement) {
        return response.data.itemListElement.map((item: any) => ({
          id: item.result['@id'] || `kg-${Date.now()}`,
          name: item.result.name || query,
          description: item.result.description || '',
          detailedDescription: item.result.detailedDescription?.articleBody || '',
          image: item.result.image?.contentUrl || '',
          url: item.result.url || '',
          types: item.result['@type'] || [],
          score: item.resultScore || 0
        }));
      }

      return [];
    } catch (error) {
      console.error('Google Knowledge Graph API error:', error);
      return [];
    }
  }

  async getEntityContext(entityName: string): Promise<KnowledgeGraphEntity | null> {
    const entities = await this.searchEntities(entityName, 1);
    return entities.length > 0 ? entities[0] : null;
  }

  async analyzeTrendingTopics(topics: TrendingTopic[]): Promise<TrendingTopic[]> {
    if (!this.apiKey || topics.length === 0) {
      return topics;
    }

    const enhancedTopics = await Promise.all(
      topics.map(async (topic) => {
        try {
          const entity = await this.getEntityContext(topic.title);
          if (entity) {
            return {
              ...topic,
              description: entity.description || topic.description,
              keywords: [...(topic.keywords || []), ...entity.types],
              metadata: {
                ...topic.metadata,
                knowledgeGraph: {
                  entityId: entity.id,
                  types: entity.types,
                  detailedDescription: entity.detailedDescription,
                  image: entity.image,
                  url: entity.url
                }
              }
            };
          }
        } catch (error) {
          console.error(`Knowledge Graph enhancement failed for ${topic.title}:`, error);
        }
        return topic;
      })
    );

    return enhancedTopics;
  }
}

export const googleKnowledgeGraphService = new GoogleKnowledgeGraphService();