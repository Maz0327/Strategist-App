import { GoogleGenAI } from "@google/genai";
import { debugLogger } from "./debug-logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BriefSectionContent {
  title: string;
  description: string;
  insights: string[];
  opportunities: string[];
  recommendations: string[];
  captures: any[];
  strategicAnalysis: string;
  culturalContext: string;
}

export class GeminiBriefGenerator {
  async generateSectionContent(
    section: any, 
    captures: any[],
    projectContext?: string
  ): Promise<BriefSectionContent> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured for brief generation');
    }

    try {
      const prompt = this.buildComprehensiveSectionPrompt(section, captures, projectContext);
      
      debugLogger.info('Generating brief section with Gemini 2.5 Pro', {
        sectionId: section.id,
        captureCount: captures.length,
        contextLength: prompt.length
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              strategicAnalysis: { 
                type: "string", 
                description: "Comprehensive strategic analysis of the section content" 
              },
              culturalContext: { 
                type: "string", 
                description: "Cultural and societal context relevant to this section" 
              },
              insights: {
                type: "array",
                items: { type: "string" },
                description: "Key strategic insights derived from the content"
              },
              opportunities: {
                type: "array",
                items: { type: "string" },
                description: "Strategic opportunities and potential actions"
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Specific actionable recommendations"
              }
            },
            required: ["strategicAnalysis", "culturalContext", "insights", "opportunities", "recommendations"]
          }
        },
        contents: prompt
      });

      const analysis = JSON.parse(response.text || '{}');

      return {
        title: section.name,
        description: section.description,
        strategicAnalysis: analysis.strategicAnalysis || "Strategic analysis pending",
        culturalContext: analysis.culturalContext || "Cultural context being evaluated",
        insights: Array.isArray(analysis.insights) ? analysis.insights : [],
        opportunities: Array.isArray(analysis.opportunities) ? analysis.opportunities : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        captures: captures.map(c => ({
          id: c.id,
          title: c.title,
          url: c.url,
          userNotes: c.userNotes,
          visualAssets: c.visualAssets,
          qualScore: c.qualScore,
          truthAnalysis: c.truthAnalysis
        }))
      };

    } catch (error) {
      debugLogger.error('Gemini brief generation error', { error: (error as Error).message, sectionId: section.id });
      throw new Error(`Failed to generate brief section: ${(error as Error).message}`);
    }
  }

  async generateProjectSynthesis(
    projectData: any,
    allSections: BriefSectionContent[]
  ): Promise<{
    executiveSummary: string;
    keyFindings: string[];
    strategicRecommendations: string[];
    culturalIntelligence: string;
    competitiveAdvantage: string[];
  }> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured for project synthesis');
    }

    try {
      const prompt = this.buildProjectSynthesisPrompt(projectData, allSections);
      
      debugLogger.info('Generating project synthesis with Gemini 2.5 Pro', {
        projectId: projectData.id,
        sectionCount: allSections.length,
        contextLength: prompt.length
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              executiveSummary: { 
                type: "string", 
                description: "Executive summary of the entire project analysis" 
              },
              culturalIntelligence: { 
                type: "string", 
                description: "Overall cultural intelligence and societal context" 
              },
              keyFindings: {
                type: "array",
                items: { type: "string" },
                description: "Top strategic findings across all sections"
              },
              strategicRecommendations: {
                type: "array",
                items: { type: "string" },
                description: "High-level strategic recommendations for the project"
              },
              competitiveAdvantage: {
                type: "array",
                items: { type: "string" },
                description: "Areas of competitive advantage and differentiation"
              }
            },
            required: ["executiveSummary", "culturalIntelligence", "keyFindings", "strategicRecommendations", "competitiveAdvantage"]
          }
        },
        contents: prompt
      });

      return JSON.parse(response.text || '{}');

    } catch (error) {
      debugLogger.error('Gemini project synthesis error', { error: (error as Error).message, projectId: projectData.id });
      throw new Error(`Failed to generate project synthesis: ${(error as Error).message}`);
    }
  }

  private buildComprehensiveSectionPrompt(section: any, captures: any[], projectContext?: string): string {
    const captureDetails = captures.map(c => {
      return `
**Capture: ${c.title || 'Untitled'}**
URL: ${c.url || 'No URL'}
User Notes: ${c.userNotes || 'No notes'}
Content: ${c.content?.substring(0, 2000) || 'No content'}
Truth Analysis: ${JSON.stringify(c.truthAnalysis || {}, null, 2)}
Visual Assets: ${c.visualAssets?.length || 0} images/videos
Quality Score: ${c.qualScore || 'Not rated'}
      `.trim();
    }).join('\n\n---\n\n');

    return `
You are an expert strategic analyst and creative strategist analyzing content for a professional strategic brief. 

**Project Context**: ${projectContext || 'Strategic intelligence gathering'}

**Section**: ${section.name}
**Section Description**: ${section.description}
**Content Types Expected**: ${section.content_types?.join(', ') || 'General analysis'}

**Captured Content for Analysis**:
${captureDetails}

**Analysis Instructions**:
1. **Strategic Analysis**: Provide comprehensive strategic analysis identifying patterns, trends, and implications across all captures
2. **Cultural Context**: Analyze cultural, social, and behavioral signals within this content
3. **Insights**: Extract 5-7 key strategic insights that drive decision-making
4. **Opportunities**: Identify 3-5 strategic opportunities for action or advantage
5. **Recommendations**: Provide 3-5 specific, actionable recommendations

**Focus Areas**:
- Cross-capture pattern recognition
- Cultural moment identification
- Competitive intelligence
- Human behavior analysis
- Strategic positioning opportunities
- Creative and engagement potential

**Output Requirements**:
- Professional strategic brief quality
- Actionable intelligence
- Cultural and behavioral insights
- Specific recommendations
- Executive-level analysis depth

Analyze this content with the depth and sophistication expected in a $5,000 strategic consulting brief.
    `.trim();
  }

  private buildProjectSynthesisPrompt(projectData: any, allSections: BriefSectionContent[]): string {
    const sectionSummaries = allSections.map(section => {
      return `
**${section.title}**:
Strategic Analysis: ${section.strategicAnalysis}
Cultural Context: ${section.culturalContext}
Key Insights: ${section.insights.slice(0, 3).join('; ')}
Top Opportunities: ${section.opportunities.slice(0, 2).join('; ')}
      `.trim();
    }).join('\n\n');

    return `
You are synthesizing a comprehensive strategic intelligence project with multiple analysis sections.

**Project**: ${projectData.name || 'Strategic Intelligence Project'}
**Description**: ${projectData.description || 'Comprehensive strategic analysis'}
**Total Captures**: ${allSections.reduce((sum, s) => sum + s.captures.length, 0)}

**Section Analysis Results**:
${sectionSummaries}

**Synthesis Instructions**:
Create an executive-level synthesis that:

1. **Executive Summary**: Comprehensive overview of all findings and strategic implications
2. **Cultural Intelligence**: Overarching cultural trends and societal context across all sections
3. **Key Findings**: Top 7-10 strategic findings that emerged across all content analysis
4. **Strategic Recommendations**: High-level strategic recommendations for decision-making
5. **Competitive Advantage**: Areas where insights reveal competitive positioning opportunities

**Requirements**:
- Executive-level strategic thinking
- Cross-section pattern recognition
- Cultural intelligence synthesis
- Actionable strategic recommendations
- Professional strategic consulting quality

Think like a senior strategic consultant delivering insights to C-level executives. Focus on strategic implications, cultural intelligence, and actionable recommendations that drive competitive advantage.
    `.trim();
  }
}

export const geminiBriefGenerator = new GeminiBriefGenerator();