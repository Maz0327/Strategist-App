import { openaiService } from "./openai";
import { storage } from "../storage";
import { analyticsService } from "./analytics";
import { debugLogger } from "./debug-logger";
import { v4 as uuidv4 } from "uuid";

export class ChatService {
  private systemContext = `You are a helpful AI assistant for the Strategic Content Analysis Platform. You have comprehensive knowledge of the system architecture, features, and workflows.

SYSTEM OVERVIEW:
- Platform for strategic content analysis using AI
- Workflow: Capture → Potential Signal → Signal → Insight → Brief
- 5 main sections: Today's Briefing, Explore Signals, Signal Mining, Manage Dashboard, Strategic Brief Lab
- Chrome extension for content capture
- 17+ integrated platforms (Reddit, YouTube, Giphy, Imgur, etc.)

NAVIGATION STRUCTURE:
1. Today's Briefing (Homepage)
   - Client Channels: Industry updates and competitive intelligence
   - Custom Feeds: RSS feeds and curated data sources
   - Project Intelligence: Market trends and strategic insights

2. Explore Signals
   - Trending Topics: Real-time trends from 17+ platforms
   - Signal Mining: Cultural intelligence and reactive content opportunities

3. Signal Mining Dashboard
   - Real-time cultural intelligence
   - Bridge-worthy content identification
   - Competitor gap analysis

4. Manage Dashboard
   - View and edit all signals
   - Status management (capture → potential signal → signal)
   - Analytics and performance tracking

5. Strategic Brief Lab
   - Define → Shift → Deliver framework
   - Brief creation and export
   - Strategic cohort building

KEY FEATURES:
- AI-powered content analysis using OpenAI
- Truth-based analysis framework (fact → observation → insight → human truth)
- Cultural intelligence and attention arbitrage detection
- Visual intelligence through Giphy and Imgur
- Chrome extension for frictionless capture
- Session-based authentication
- Real-time trending data

TERMINOLOGY:
- Capture: Raw analyzed content
- Potential Signal: Content flagged for strategic review
- Signal: Validated strategically important content
- Insight: Deeper analysis of signals
- Brief: Strategic deliverable using Define → Shift → Deliver

HELP GUIDANCE:
- Always provide specific navigation instructions
- Reference actual UI elements and button names
- Explain workflows step-by-step
- Clarify system terminology when needed
- Suggest alternatives when features aren't working

Keep responses concise, helpful, and focused on practical guidance.`;

  async createChatSession(userId?: number): Promise<string> {
    const sessionId = uuidv4();
    
    try {
      await storage.createChatSession({
        userId,
        sessionId,
      });
      
      return sessionId;
    } catch (error) {
      debugLogger.error("Failed to create chat session", error);
      throw new Error("Failed to create chat session");
    }
  }

  async sendMessage(
    sessionId: string,
    message: string,
    userId?: number
  ): Promise<{ response: string; sessionId: string }> {
    try {
      // Get or create session
      let session = await storage.getChatSessionBySessionId(sessionId);
      if (!session) {
        const newSessionId = await this.createChatSession(userId);
        session = await storage.getChatSessionBySessionId(newSessionId);
        sessionId = newSessionId;
      }

      // Get recent chat history for context
      const recentMessages = await storage.getChatMessagesBySessionId(session.id, 10);
      
      // Build conversation context
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.messageType === 'user' ? msg.message : msg.response || ''
      })).filter(msg => msg.content).reverse();

      // Add user context if available
      let userContext = "";
      if (userId) {
        const userStats = await storage.getUserSignalStats(userId);
        userContext = `
USER CONTEXT:
- Total signals: ${userStats.total}
- Captures: ${userStats.captures}
- Potential signals: ${userStats.potentialSignals}
- Validated signals: ${userStats.signals}
- Recent activity: User has been actively using the platform
        `;
      }

      // Generate AI response
      const response = await openaiService.generateChatResponse(
        message,
        this.systemContext + userContext,
        conversationHistory
      );

      // Store the message and response
      await storage.createChatMessage({
        sessionId: session.id,
        userId,
        message,
        response,
        messageType: 'user',
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: 'chat-system'
        }
      });

      // Track analytics
      if (userId) {
        await analyticsService.trackUserAction(userId, 'chat_message', 'help_system', {
          messageLength: message.length,
          responseLength: response.length,
          sessionId
        });
      }

      return { response, sessionId };
    } catch (error) {
      debugLogger.error("Failed to send chat message", error);
      throw new Error("Failed to process chat message");
    }
  }

  async getChatHistory(sessionId: string, limit: number = 50): Promise<any[]> {
    try {
      const session = await storage.getChatSessionBySessionId(sessionId);
      if (!session) {
        return [];
      }

      const messages = await storage.getChatMessagesBySessionId(session.id, limit);
      return messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        response: msg.response,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
        metadata: msg.metadata
      }));
    } catch (error) {
      debugLogger.error("Failed to get chat history", error);
      return [];
    }
  }

  async deleteChatSession(sessionId: string, userId?: number): Promise<void> {
    try {
      const session = await storage.getChatSessionBySessionId(sessionId);
      if (!session) {
        return;
      }

      // Verify user ownership if userId provided
      if (userId && session.userId !== userId) {
        throw new Error("Unauthorized to delete this chat session");
      }

      await storage.deleteChatSession(session.id);
    } catch (error) {
      debugLogger.error("Failed to delete chat session", error);
      throw new Error("Failed to delete chat session");
    }
  }
}

export const chatService = new ChatService();