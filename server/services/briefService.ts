import { eq, and } from "drizzle-orm";
import { db } from "../storage";
import { 
  briefTemplates, 
  generatedBriefs, 
  projects, 
  signals,
  type BriefTemplate, 
  type InsertGeneratedBrief,
  type GeneratedBrief 
} from "../../shared/schema";
// Removed openaiAnalysisService import - now using Gemini 2.5 Pro for brief generation

export class BriefService {
  // Get brief template
  async getTemplate(templateId: string): Promise<BriefTemplate | null> {
    const [template] = await db
      .select()
      .from(briefTemplates)
      .where(eq(briefTemplates.id, templateId));
    
    return template || null;
  }

  // Generate brief from project captures
  async generateBrief(projectId: number, userId: number, templateId: string = "jimmy-johns-pac"): Promise<GeneratedBrief> {
    // Get project and template
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!project) {
      throw new Error("Project not found");
    }

    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Get all project captures
    const captures = await db
      .select()
      .from(signals)
      .where(and(eq(signals.projectId, projectId), eq(signals.userId, userId)));

    // Generate brief content using AI
    const briefContent = await this.generateBriefContent(captures, template, project);

    // Save generated brief
    const briefData: InsertGeneratedBrief = {
      projectId,
      userId,
      templateId,
      content: briefContent,
      status: "draft"
    };

    const [brief] = await db.insert(generatedBriefs).values(briefData).returning();
    return brief;
  }

  // Generate brief content using AI
  private async generateBriefContent(captures: any[], template: BriefTemplate, project: any) {
    const templateSections = template.sections as any;
    const briefContent: any = {
      title: project.name,
      sections: {}
    };

    // Organize captures by template section
    const capturesBySection: Record<string, any[]> = {};
    captures.forEach(capture => {
      const section = capture.templateSection || 'platform_signals';
      if (!capturesBySection[section]) {
        capturesBySection[section] = [];
      }
      capturesBySection[section].push(capture);
    });

    // Generate content for each template section
    for (const section of templateSections.sections) {
      const sectionCaptures = capturesBySection[section.id] || [];
      
      if (sectionCaptures.length > 0) {
        briefContent.sections[section.id] = await this.generateSectionContent(
          section, 
          sectionCaptures
        );
      } else {
        // Generate placeholder content if no captures
        briefContent.sections[section.id] = {
          title: section.name,
          content: `No captures available for ${section.name}. Consider adding relevant content to strengthen this section.`,
          captures: []
        };
      }
    }

    return briefContent;
  }

  // Generate content for a specific section using Gemini 2.5 Pro
  private async generateSectionContent(section: any, captures: any[]) {
    try {
      // Import Gemini brief generator
      const { geminiBriefGenerator } = await import('./gemini-brief-generator');
      
      // Use Gemini 2.5 Pro for enterprise-grade brief generation
      const sectionContent = await geminiBriefGenerator.generateSectionContent(
        section, 
        captures,
        `Strategic brief section for ${section.name}`
      );

      return {
        title: sectionContent.title,
        description: sectionContent.description,
        strategicAnalysis: sectionContent.strategicAnalysis,
        culturalContext: sectionContent.culturalContext,
        insights: sectionContent.insights,
        opportunities: sectionContent.opportunities,
        recommendations: sectionContent.recommendations,
        captures: sectionContent.captures
      };
    } catch (error) {
      console.error(`Error generating section content for ${section.id}:`, error);
      return {
        title: section.name,
        description: section.description,
        content: "Error generating content. Please review captures manually.",
        captures: captures.map(c => ({ id: c.id, title: c.title, url: c.url }))
      };
    }
  }

  // Build AI prompt for section content generation
  private buildSectionPrompt(section: any, captures: any[]): string {
    const captureTexts = captures.map(c => 
      `${c.title || 'Untitled'}: ${c.content || c.userNotes || 'No content'}`
    ).join('\n\n');

    return `
You are analyzing content for a strategic brief section: "${section.name}"

Section Description: ${section.description}

Content to analyze:
${captureTexts}

Generate strategic insights that:
1. Identify key patterns and themes
2. Extract cultural and behavioral signals
3. Suggest creative opportunities
4. Provide actionable recommendations

Focus on strategic implications and creative potential. Be specific and actionable.
    `.trim();
  }

  // Extract insights from analysis
  private extractInsights(analysis: any, contentTypes: string[]) {
    const insights = [];
    
    if (contentTypes.includes('culturalMoment') && analysis.culturalMoment) {
      insights.push({
        type: 'cultural',
        content: analysis.culturalMoment,
        confidence: 'high'
      });
    }

    if (contentTypes.includes('humanTruth') && analysis.humanTruth) {
      insights.push({
        type: 'human_truth',
        content: analysis.humanTruth,
        confidence: 'high'
      });
    }

    if (contentTypes.includes('insight') && analysis.truthInsight) {
      insights.push({
        type: 'strategic',
        content: analysis.truthInsight,
        confidence: 'medium'
      });
    }

    return insights;
  }

  // Extract opportunities from analysis
  private extractOpportunities(analysis: any) {
    return analysis.nextActions || [];
  }

  // Extract recommendations from analysis
  private extractRecommendations(analysis: any) {
    return analysis.cohortSuggestions || [];
  }

  // Get user's generated briefs
  async getUserBriefs(userId: number): Promise<GeneratedBrief[]> {
    return await db
      .select()
      .from(generatedBriefs)
      .where(eq(generatedBriefs.userId, userId));
  }

  // Get specific brief
  async getBrief(briefId: number, userId: number): Promise<GeneratedBrief | null> {
    const [brief] = await db
      .select()
      .from(generatedBriefs)
      .where(and(eq(generatedBriefs.id, briefId), eq(generatedBriefs.userId, userId)));
    
    return brief || null;
  }
}

export const briefService = new BriefService();