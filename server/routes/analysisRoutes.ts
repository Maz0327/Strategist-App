import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { analyzeWithOpenAI as analyzeContentWithOpenAI } from '../services/openaiAnalysisService';
import { scraperService } from '../services/scraper';
import { storage } from '../storage';
import { videoTranscriptionService } from '../services/video-transcription';

const router = Router();

// Comprehensive validation schemas with enhanced security
const analyzeUrlSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .refine((url) => {
      try {
        const domain = new URL(url).hostname;
        return !['localhost', '127.0.0.1', '0.0.0.0'].includes(domain);
      } catch {
        return false;
      }
    }, 'Local URLs are not allowed for security reasons'),
  mode: z.enum(['speed', 'quick', 'deep'], { 
    errorMap: () => ({ message: 'Analysis mode must be "speed", "quick", or "deep"' })
  }).default('quick'),
  lengthPreference: z.enum(['short', 'medium', 'long'], {
    errorMap: () => ({ message: 'Length preference must be "short", "medium", or "long"' })
  }).default('medium'),
  userNotes: z.string().max(1000, 'User notes cannot exceed 1000 characters').optional().default(''),
  forceAnalysis: z.boolean().default(false)
});

const analyzeTextSchema = z.object({
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content too long (max 50,000 characters)'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  mode: z.enum(['speed', 'quick', 'deep']).default('quick'),
  lengthPreference: z.enum(['short', 'medium', 'long']).default('medium'),
  userNotes: z.string().max(1000, 'User notes cannot exceed 1000 characters').optional().default(''),
  author: z.string().max(100, 'Author name too long').optional(),
  publishDate: z.string().optional()
});

const extractUrlSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .refine((url) => {
      try {
        const domain = new URL(url).hostname;
        return !['localhost', '127.0.0.1', '0.0.0.0'].includes(domain);
      } catch {
        return false;
      }
    }, 'Local URLs are not allowed for security reasons'),
  includeImages: z.boolean().default(true),
  includeVideo: z.boolean().default(true),
  maxImages: z.number().int().min(1).max(20).default(10)
});

const visualAnalysisSchema = z.object({
  signalId: z.number().int().positive('Signal ID must be a positive integer'),
  imageUrls: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed'),
  analysisType: z.enum(['brand', 'cultural', 'competitive'], {
    errorMap: () => ({ message: 'Analysis type must be "brand", "cultural", or "competitive"' })
  }).default('brand')
});

// Analysis routes



router.post("/", requireAuth, async (req, res) => {
  try {
    const result = analyzeUrlSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { url, mode, lengthPreference, userNotes } = result.data;
    
    debugLogger.info('Starting content analysis', { 
      url, 
      mode, 
      lengthPreference, 
      userId: req.session.userId 
    }, req);

    // Check if it's a video URL
    const isVideo = videoTranscriptionService.isVideoUrl(url);
    let extractedContent;
    let videoTranscription = null;

    if (isVideo) {
      try {
        extractedContent = await videoTranscriptionService.extractContentWithVideoDetection(url);
        videoTranscription = {
          transcript: extractedContent.content,
          title: extractedContent.title,
          author: extractedContent.author
        };
      } catch (videoError) {
        debugLogger.warn('Video transcription failed, falling back to regular extraction', videoError, req);
        extractedContent = await scraperService.extractContent(url);
      }
    } else {
      extractedContent = await scraperService.extractContent(url);
    }

    if (!extractedContent || !extractedContent.content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unable to extract content from URL',
        code: 'CONTENT_EXTRACTION_FAILED'
      });
    }

    // Perform Truth Analysis with new three-tier system
    const analysis = await analyzeContentWithOpenAI(
      extractedContent.content,
      lengthPreference,
      mode // This now supports 'speed', 'quick', 'deep'
    );

    // Create signal with source traceability
    const signalData = {
      userId: req.session.userId!,
      title: extractedContent.title,
      content: extractedContent.content,
      url: url,
      userNotes: userNotes || '',
      status: 'capture' as const,
      truthAnalysis: analysis,
      author: extractedContent.author,
      publishDate: (extractedContent as any).publishDate || null
    };

    const signal = await storage.createSignal(signalData);

    // MANDATORY: Create source record for complete traceability
    // Every analyzed signal must have a corresponding source record
    const source = await storage.createSource({
      url: url,
      title: extractedContent.title || 'Untitled',
      domain: new URL(url).hostname,
      userId: req.session.userId!,
      sourceType: isVideo ? 'video' : 'webpage',
      description: extractedContent.content?.substring(0, 200) || '',
      firstCaptured: new Date(),
      lastAccessed: new Date(),
      reliability: 'unknown' // Will be updated based on analysis success
    });

    // Source metadata is handled in the source record creation above
    // signalData already contains all required fields
    
    debugLogger.info('Source record created for signal traceability', {
      sourceId: source.id,
      signalId: signal.id,
      domain: source.domain,
      userId: req.session.userId
    }, req);

    debugLogger.info('Content analysis completed successfully', { 
      signalId: signal.id,
      sourceId: source.id,
      userId: req.session.userId,
      analysisMode: mode,
      isVideo
    }, req);

    res.json({ 
      success: true, 
      data: { 
        signal,
        source,
        analysis,
        extractedContent,
        isVideo,
        videoTranscription
      }
    });
  } catch (error: any) {
    debugLogger.error('Content analysis failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Content analysis failed",
      message: error.message,
      code: 'ANALYSIS_FAILED'
    });
  }
});

router.post("/text", requireAuth, async (req, res) => {
  try {
    const result = analyzeTextSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { content, title, mode, lengthPreference, userNotes } = result.data;
    
    debugLogger.info('Starting text analysis', { 
      title, 
      contentLength: content.length,
      mode, 
      lengthPreference, 
      userId: req.session.userId 
    }, req);

    // Perform Truth Analysis with three-tier system
    const analysis = await analyzeContentWithOpenAI(
      content,
      lengthPreference,
      mode // This now supports 'speed', 'quick', 'deep'
    );

    // Create signal
    const signalData = {
      userId: req.session.userId!,
      title: title,
      content: content,
      url: '',
      userNotes: userNotes || '',
      status: 'capture' as const,
      truthAnalysis: analysis
    };

    const signal = await storage.createSignal(signalData);

    debugLogger.info('Text analysis completed successfully', { 
      signalId: signal.id,
      userId: req.session.userId,
      analysisMode: mode
    }, req);

    res.json({ 
      success: true, 
      data: { 
        signal,
        analysis
      }
    });
  } catch (error: any) {
    debugLogger.error('Text analysis failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Text analysis failed",
      message: error.message,
      code: 'TEXT_ANALYSIS_FAILED'
    });
  }
});

router.post("/extract-url", requireAuth, async (req, res) => {
  try {
    const result = extractUrlSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { url } = result.data;
    
    debugLogger.info('Starting URL extraction', { url, userId: req.session.userId }, req);

    // Check if it's a video URL
    const isVideo = videoTranscriptionService.isVideoUrl(url);
    let extractedContent;
    let videoTranscription = null;

    if (isVideo) {
      try {
        extractedContent = await videoTranscriptionService.extractContentWithVideoDetection(url);
        videoTranscription = {
          transcript: extractedContent.content,
          title: extractedContent.title,
          author: extractedContent.author
        };
        // Add video section if not already present
        if (!(extractedContent as any).sections) {
          (extractedContent as any).sections = [{
            type: 'video',
            title: 'Video Transcript',
            content: extractedContent.content || ''
          }];
        }
      } catch (videoError) {
        debugLogger.warn('Video transcription failed, falling back to regular extraction', videoError, req);
        extractedContent = await scraperService.extractContent(url);
      }
    } else {
      extractedContent = await scraperService.extractContent(url);
    }

    if (!extractedContent || !extractedContent.content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Unable to extract content from URL',
        code: 'CONTENT_EXTRACTION_FAILED'
      });
    }

    debugLogger.info('URL extraction completed successfully', { 
      url,
      userId: req.session.userId,
      contentLength: extractedContent.content?.length || 0,
      isVideo
    }, req);

    res.json({ 
      success: true, 
      data: {
        ...extractedContent,
        isVideo,
        videoTranscription
      }
    });
  } catch (error: any) {
    debugLogger.error('URL extraction failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "URL extraction failed",
      message: error.message,
      code: 'URL_EXTRACTION_FAILED'
    });
  }
});

// Visual Analysis Route - Enhanced with Gemini
router.post("/analyze/visual", requireAuth, async (req, res) => {
  try {
    const result = visualAnalysisSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const { signalId, imageUrls, analysisType } = result.data;
    
    debugLogger.info('Starting visual analysis', { 
      signalId, 
      imageCount: imageUrls.length,
      analysisType,
      userId: req.session.userId 
    }, req);

    // Import Gemini visual analysis service
    const { GeminiVisualAnalysisService } = await import('../services/visual-analysis-gemini');
    const visualAnalysisService = new GeminiVisualAnalysisService();

    // Convert URLs to visual assets format
    const visualAssets = imageUrls.map(url => ({
      type: 'image' as const,
      url: url,
      alt: '',
      caption: ''
    }));

    // Get signal context for analysis
    const signal = await storage.getSignal(signalId);
    const contentContext = signal?.content || '';

    // Perform visual analysis with Gemini
    const visualAnalysis = await visualAnalysisService.analyzeVisualAssets(
      visualAssets,
      contentContext,
      signal?.url || undefined
    );

    // Format response to match frontend expectations
    const formattedResponse = {
      brandElements: visualAnalysis.brandElements,
      culturalMoments: visualAnalysis.culturalVisualMoments,
      competitiveInsights: visualAnalysis.competitiveVisualInsights,
      summary: visualAnalysis.strategicRecommendations?.join('. '),
      confidenceScore: visualAnalysis.confidenceScore
    };

    debugLogger.info('Visual analysis completed successfully', { 
      signalId,
      userId: req.session.userId,
      analysisType,
      confidenceScore: visualAnalysis.confidenceScore
    }, req);

    res.json({ 
      success: true, 
      data: {
        visualAnalysis: formattedResponse,
        signalId,
        imageCount: imageUrls.length
      }
    });
  } catch (error: any) {
    debugLogger.error('Visual analysis failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Visual analysis failed",
      message: error.message,
      code: 'VISUAL_ANALYSIS_FAILED'
    });
  }
});

export default router;