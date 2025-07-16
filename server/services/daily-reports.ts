import { storage } from "../storage";
import { openaiService } from "./openai";
import { debugLogger } from "./debug-logger";

export interface DailyReport {
  id: string;
  date: string;
  summary: string;
  topSignals: Array<{
    id: number;
    title: string;
    status: string;
    viralPotential: string;
    culturalMoment: string;
    attentionValue: string;
    createdAt: string;
  }>;
  trendingTopics: Array<{
    topic: string;
    category: string;
    urgency: string;
    signalCount: number;
  }>;
  strategicInsights: string[];
  actionItems: string[];
  cohortOpportunities: string[];
  competitiveGaps: string[];
  stats: {
    totalSignals: number;
    newSignals: number;
    potentialSignals: number;
    validatedSignals: number;
    avgConfidence: number;
    topCategories: Array<{ category: string; count: number }>;
  };
}

class DailyReportsService {
  async generateDailyReport(userId: number, date?: string): Promise<DailyReport> {
    const reportDate = date || new Date().toISOString().split('T')[0];
    const startDate = new Date(reportDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    try {
      debugLogger.info("Generating daily report", { userId, reportDate });

      // Get all signals for the user (last 24 hours for "new" signals)
      const allSignals = await storage.getSignalsByUserId(userId);
      const recentSignals = allSignals.filter(signal => 
        signal.createdAt && new Date(signal.createdAt) >= startDate && new Date(signal.createdAt) < endDate
      );

      // Calculate statistics
      const stats = this.calculateStats(allSignals, recentSignals);
      
      // Get top performing signals based on various criteria
      const topSignals = this.getTopSignals(allSignals, 5);
      
      // Extract trending topics from signals
      const trendingTopics = this.extractTrendingTopics(allSignals);
      
      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(allSignals, recentSignals);
      
      const report: DailyReport = {
        id: `report-${userId}-${reportDate}`,
        date: reportDate,
        summary: aiInsights.summary,
        topSignals,
        trendingTopics,
        strategicInsights: aiInsights.strategicInsights,
        actionItems: aiInsights.actionItems,
        cohortOpportunities: aiInsights.cohortOpportunities,
        competitiveGaps: aiInsights.competitiveGaps,
        stats
      };

      debugLogger.info("Daily report generated successfully", { 
        userId, 
        reportDate, 
        signalCount: allSignals.length,
        newSignals: recentSignals.length
      });

      return report;
    } catch (error) {
      debugLogger.error("Error generating daily report", error, { userId, reportDate });
      throw new Error("Failed to generate daily report");
    }
  }

  private calculateStats(allSignals: any[], recentSignals: any[]) {
    const statusCounts = {
      capture: 0,
      potential_signal: 0,
      signal: 0
    };

    let totalConfidence = 0;
    let confidenceCount = 0;
    const categories = new Map<string, number>();

    allSignals.forEach(signal => {
      // Count by status
      if (signal.status && statusCounts.hasOwnProperty(signal.status)) {
        statusCounts[signal.status as keyof typeof statusCounts]++;
      }

      // Calculate average confidence
      if (signal.confidence && signal.confidence !== 'unknown') {
        const confidence = parseFloat(signal.confidence);
        if (!isNaN(confidence)) {
          totalConfidence += confidence;
          confidenceCount++;
        }
      }

      // Count categories from tags
      if (signal.tags && Array.isArray(signal.tags)) {
        signal.tags.forEach((tag: string) => {
          categories.set(tag, (categories.get(tag) || 0) + 1);
        });
      }
    });

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const topCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      totalSignals: allSignals.length,
      newSignals: recentSignals.length,
      potentialSignals: statusCounts.potential_signal,
      validatedSignals: statusCounts.signal,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      topCategories
    };
  }

  private getTopSignals(signals: any[], limit: number) {
    return signals
      .filter(signal => signal.title && signal.viralPotential)
      .sort((a, b) => {
        // Sort by viral potential, then by creation date
        const aViral = this.parseViralPotential(a.viralPotential);
        const bViral = this.parseViralPotential(b.viralPotential);
        if (aViral !== bViral) return bViral - aViral;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit)
      .map(signal => ({
        id: signal.id,
        title: signal.title,
        status: signal.status,
        viralPotential: signal.viralPotential,
        culturalMoment: signal.culturalMoment,
        attentionValue: signal.attentionValue,
        createdAt: signal.createdAt
      }));
  }

  private parseViralPotential(viralPotential: string): number {
    // Extract numeric value from viral potential string
    const match = viralPotential.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractTrendingTopics(signals: any[]) {
    const topics = new Map<string, { category: string; count: number; urgency: string }>();

    signals.forEach(signal => {
      if (signal.culturalMoment && signal.tags) {
        const topic = signal.culturalMoment.split('.')[0]; // Take first sentence
        const category = signal.tags[0] || 'general';
        const urgency = this.determineUrgency(signal.attentionValue, signal.viralPotential);

        if (topics.has(topic)) {
          topics.get(topic)!.count++;
        } else {
          topics.set(topic, { category, count: 1, urgency });
        }
      }
    });

    return Array.from(topics.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([topic, data]) => ({
        topic,
        category: data.category,
        urgency: data.urgency,
        signalCount: data.count
      }));
  }

  private determineUrgency(attentionValue: string, viralPotential: string): string {
    const attention = this.parseViralPotential(attentionValue || '0');
    const viral = this.parseViralPotential(viralPotential || '0');
    const combined = attention + viral;

    if (combined > 150) return 'critical';
    if (combined > 100) return 'high';
    if (combined > 50) return 'medium';
    return 'low';
  }

  private async generateAIInsights(allSignals: any[], recentSignals: any[]) {
    try {
      const signalSummaries = allSignals.slice(0, 10).map(signal => ({
        title: signal.title,
        culturalMoment: signal.culturalMoment,
        attentionValue: signal.attentionValue,
        viralPotential: signal.viralPotential,
        cohortSuggestions: signal.cohortSuggestions,
        competitiveInsights: signal.competitiveInsights,
        nextActions: signal.nextActions
      }));

      const prompt = `Generate a strategic daily report based on these signals:

SIGNALS DATA:
${JSON.stringify(signalSummaries, null, 2)}

STATISTICS:
- Total signals: ${allSignals.length}
- New signals today: ${recentSignals.length}

Please provide:
1. A 2-3 sentence executive summary
2. 5 key strategic insights
3. 5 priority action items
4. 3-5 cohort opportunities
5. 3-5 competitive gaps or opportunities

Format as JSON with these exact keys:
{
  "summary": "string",
  "strategicInsights": ["string1", "string2", ...],
  "actionItems": ["string1", "string2", ...],
  "cohortOpportunities": ["string1", "string2", ...],
  "competitiveGaps": ["string1", "string2", ...]
}`;

      const response = await openaiService.generateInsights(prompt);
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        debugLogger.warn("Failed to parse AI insights JSON, using fallback");
        return {
          summary: "Daily analysis of signals reveals ongoing trends and strategic opportunities.",
          strategicInsights: ["Monitor emerging cultural moments", "Track attention arbitrage opportunities"],
          actionItems: ["Review top-performing signals", "Prepare reactive content strategies"],
          cohortOpportunities: ["Early adopters", "Cultural trend followers"],
          competitiveGaps: ["Untapped cultural moments", "Emerging platform opportunities"]
        };
      }
    } catch (error) {
      debugLogger.error("Error generating AI insights for daily report", error);
      return {
        summary: "Daily analysis of signals reveals ongoing trends and strategic opportunities.",
        strategicInsights: ["Monitor emerging cultural moments", "Track attention arbitrage opportunities"],
        actionItems: ["Review top-performing signals", "Prepare reactive content strategies"],
        cohortOpportunities: ["Early adopters", "Cultural trend followers"],
        competitiveGaps: ["Untapped cultural moments", "Emerging platform opportunities"]
      };
    }
  }
}

export const dailyReportsService = new DailyReportsService();