import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { openaiService } from '../services/openai';
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
  mode: z.enum(['quick', 'deep'], { 
    errorMap: () => ({ message: 'Analysis mode must be "quick" or "deep"' })
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
  analysisMode: z.enum(['quick', 'deep']).default('quick'),
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

    // Perform Truth Analysis with two-tier system
    const analysis = await openaiService.analyzeContent({
      content: extractedContent.content,
      title: extractedContent.title,
      url: url
    }, lengthPreference, mode);

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

    const { content, title, analysisMode, lengthPreference, userNotes } = result.data;
    
    debugLogger.info('Starting text analysis', { 
      title, 
      contentLength: content.length,
      analysisMode, 
      lengthPreference, 
      userId: req.session.userId 
    }, req);

    // Perform Truth Analysis with two-tier system
    const analysis = await openaiService.analyzeContent({
      content: content,
      title: title,
      url: ''
    }, lengthPreference, analysisMode);

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
      analysisMode: analysisMode
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

// Streaming Analysis Route - Server-Sent Events for real-time progress
router.post("/stream", requireAuth, async (req, res) => {
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

    const { content, title, analysisMode, lengthPreference, userNotes } = result.data;
    
    debugLogger.info('Starting streaming analysis', { 
      title, 
      contentLength: content.length,
      analysisMode, 
      lengthPreference, 
      userId: req.session.userId 
    }, req);

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send progress updates
    const sendProgress = (stage: string, progress: number) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', stage, progress })}\n\n`);
    };

    try {
      // Stage 1: Initialize - immediate response
      sendProgress('Starting analysis...', 15);
      
      // Stage 2: Processing content - quick feedback
      await new Promise(resolve => setTimeout(resolve, 200));
      sendProgress('Processing content...', 25);
      
      // Stage 3: Begin AI analysis
      await new Promise(resolve => setTimeout(resolve, 300));
      sendProgress(`Generating ${analysisMode === 'deep' ? 'comprehensive strategic' : 'quick strategic'} insights...`, 40);
      
      // Perform actual analysis with progress updates during AI call
      const analysisPromise = openaiService.analyzeContent({ content, title, url: '' }, lengthPreference, analysisMode);
      
      // Send periodic progress updates while waiting for AI
      let progressValue = 45;
      const progressInterval = setInterval(() => {
        if (progressValue < 75) {
          progressValue += 5;
          sendProgress(analysisMode === 'deep' ? 'Analyzing cultural intelligence...' : 'Processing strategic insights...', progressValue);
        }
      }, 800);
      
      const analysis = await analysisPromise;
      clearInterval(progressInterval);

      sendProgress('Finalizing results...', 85);
      
      // Create signal quickly
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

      sendProgress('Complete!', 100);

      // Send final result
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        data: { 
          signal,
          analysis
        }
      })}\n\n`);

      debugLogger.info('Streaming analysis completed successfully', { 
        signalId: signal.id,
        userId: req.session.userId,
        analysisMode: analysisMode
      }, req);

    } catch (analysisError: any) {
      debugLogger.error('Streaming analysis failed', analysisError, req);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: analysisError.message || 'Analysis failed'
      })}\n\n`);
    }

    res.end();
  } catch (error: any) {
    debugLogger.error('Streaming setup failed', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Streaming analysis failed",
      message: error.message,
      code: 'STREAMING_FAILED'
    });
  }
});

// Visual Analysis Route - Enhanced with Real Gemini 2.5 Pro Processing
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
    
    debugLogger.info('Starting visual analysis with Gemini 2.5 Pro', { 
      signalId, 
      imageCount: imageUrls.length,
      analysisType,
      userId: req.session.userId,
      totalPayloadSize: JSON.stringify(req.body).length
    }, req);

    if (!process.env.GEMINI_API_KEY) {
      debugLogger.error('GEMINI_API_KEY not configured', {}, req);
      return res.status(500).json({ 
        success: false, 
        error: 'Visual analysis service unavailable',
        message: 'Gemini API key not configured',
        code: 'GEMINI_NOT_CONFIGURED'
      });
    }

    // Validate image URLs and sizes for payload optimization
    const validImageUrls = imageUrls.filter((url: string) => {
      if (typeof url !== 'string') return false;
      if (url.length > 2000000) { // 2MB limit per image
        debugLogger.warn('Image too large, skipping', { 
          imageSize: url.length, 
          userId: req.session.userId 
        }, req);
        return false;
      }
      return true;
    });

    if (validImageUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid images found - images may be too large',
        code: 'NO_VALID_IMAGES'
      });
    }

    // Import Gemini visual analysis service
    const { GeminiVisualAnalysisService } = await import('../services/visual-analysis-gemini');
    const visualAnalysisService = new GeminiVisualAnalysisService();

    // Convert URLs to visual assets format
    const visualAssets = validImageUrls.map(url => ({
      type: 'image' as const,
      url: url,
      alt: '',
      caption: ''
    }));

    // Get signal context for analysis
    const signal = await storage.getSignal(signalId);
    const contentContext = signal?.content || signal?.title || 'Strategic visual analysis of uploaded images';

    debugLogger.info('Processing visual assets with Gemini', { 
      assetCount: visualAssets.length,
      contextLength: contentContext?.length,
      sourceUrl: signal?.url
    }, req);

    // Perform visual analysis with Gemini 2.5 Pro
    const visualAnalysis = await visualAnalysisService.analyzeVisualAssets(
      visualAssets,
      contentContext,
      signal?.url || undefined
    );

    // Format response to match frontend expectations
    const formattedResponse = {
      brandElements: visualAnalysis.brandElements || [],
      culturalMoments: visualAnalysis.culturalVisualMoments || [],
      competitiveInsights: visualAnalysis.competitiveVisualInsights || [],
      strategicRecommendations: visualAnalysis.strategicRecommendations || [],
      summary: visualAnalysis.strategicRecommendations?.join('. ') || 'Visual analysis completed',
      confidenceScore: visualAnalysis.confidenceScore || 75
    };

    debugLogger.info('Visual analysis completed with Gemini 2.5 Pro', { 
      signalId,
      userId: req.session.userId,
      analysisType,
      confidenceScore: visualAnalysis.confidenceScore,
      brandElementsCount: formattedResponse.brandElements.length,
      culturalMomentsCount: formattedResponse.culturalMoments.length,
      competitiveInsightsCount: formattedResponse.competitiveInsights.length
    }, req);

    res.json({ 
      success: true, 
      data: {
        visualAnalysis: formattedResponse,
        signalId,
        imageCount: validImageUrls.length,
        processedWith: 'Gemini 2.5 Pro',
        confidenceScore: formattedResponse.confidenceScore
      }
    });
  } catch (error: any) {
    debugLogger.error('Visual analysis failed', error, req);
    
    // Provide specific error handling
    let errorCode = 'VISUAL_ANALYSIS_FAILED';
    let errorMessage = 'Visual analysis failed. Please try again.';
    
    if (error.message?.includes('No visual assets provided')) {
      errorCode = 'NO_IMAGES_PROVIDED';
      errorMessage = 'No images available for analysis';
    } else if (error.message?.includes('Invalid base64')) {
      errorCode = 'INVALID_IMAGE_FORMAT';
      errorMessage = 'Invalid image format. Please try with different images.';
    } else if (error.message?.includes('timeout')) {
      errorCode = 'ANALYSIS_TIMEOUT';
      errorMessage = 'Analysis timed out. Try with fewer or smaller images.';
    } else if (error.message?.includes('API key')) {
      errorCode = 'GEMINI_API_ERROR';
      errorMessage = 'Visual analysis service unavailable';
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: error.message,
      code: errorCode
    });
  }
});

// Standalone Visual Intelligence Route - Independent Analysis
router.post("/visual-intelligence/analyze", requireAuth, async (req, res) => {
  try {
    const { images, context, analysisType } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No images provided',
        code: 'NO_IMAGES_PROVIDED'
      });
    }

    debugLogger.info('Starting standalone visual intelligence analysis', { 
      imageCount: images.length,
      contextLength: context?.length || 0,
      analysisType,
      userId: req.session.userId
    }, req);

    if (!process.env.GEMINI_API_KEY) {
      debugLogger.error('GEMINI_API_KEY not configured for standalone analysis', {}, req);
      return res.status(500).json({ 
        success: false, 
        error: 'Visual intelligence service unavailable',
        message: 'Gemini API key not configured',
        code: 'GEMINI_NOT_CONFIGURED'
      });
    }

    // Validate image data and sizes
    const validImages = images.filter((imageData: string) => {
      if (typeof imageData !== 'string') return false;
      if (imageData.length > 2000000) { // 2MB limit per image
        debugLogger.warn('Image too large, skipping', { 
          imageSize: imageData.length, 
          userId: req.session.userId 
        }, req);
        return false;
      }
      return imageData.startsWith('data:image/');
    });

    if (validImages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid images found - images may be too large or invalid format',
        code: 'NO_VALID_IMAGES'
      });
    }

    // Import Gemini visual analysis service
    const { GeminiVisualAnalysisService } = await import('../services/visual-analysis-gemini');
    const visualAnalysisService = new GeminiVisualAnalysisService();

    // Convert image data to visual assets format
    const visualAssets = validImages.map((imageData: string, index: number) => ({
      type: 'image' as const,
      url: imageData,
      alt: `Uploaded image ${index + 1}`,
      caption: ''
    }));

    const analysisContext = context || 'Strategic visual analysis of uploaded images for brand elements, cultural moments, and competitive positioning';

    debugLogger.info('Processing standalone visual assets with Gemini 2.5 Pro', { 
      assetCount: visualAssets.length,
      contextLength: analysisContext.length
    }, req);

    // Perform visual analysis with Gemini 2.5 Pro
    const visualAnalysis = await visualAnalysisService.analyzeVisualAssets(
      visualAssets,
      analysisContext
    );

    // Format response to match existing structure
    const formattedResponse = {
      brandElements: visualAnalysis.brandElements || [],
      culturalMoments: visualAnalysis.culturalVisualMoments || [],
      competitiveInsights: visualAnalysis.competitiveVisualInsights || [],
      strategicRecommendations: visualAnalysis.strategicRecommendations || [],
      confidenceScore: visualAnalysis.confidenceScore || 75
    };

    debugLogger.info('Standalone visual analysis completed with Gemini 2.5 Pro', { 
      userId: req.session.userId,
      analysisType,
      confidenceScore: visualAnalysis.confidenceScore,
      brandElementsCount: formattedResponse.brandElements.length,
      culturalMomentsCount: formattedResponse.culturalMoments.length,
      competitiveInsightsCount: formattedResponse.competitiveInsights.length
    }, req);

    res.json({ 
      success: true, 
      data: {
        visualAnalysis: formattedResponse,
        imageCount: validImages.length,
        processedWith: 'Gemini 2.5 Pro',
        confidenceScore: formattedResponse.confidenceScore,
        analysisType: 'standalone'
      }
    });
  } catch (error: any) {
    debugLogger.error('Standalone visual analysis failed', error, req);
    
    // Provide specific error handling
    let errorCode = 'VISUAL_ANALYSIS_FAILED';
    let errorMessage = 'Visual analysis failed. Please try again.';
    
    if (error.message?.includes('No visual assets provided')) {
      errorCode = 'NO_IMAGES_PROVIDED';
      errorMessage = 'No images available for analysis';
    } else if (error.message?.includes('Invalid base64')) {
      errorCode = 'INVALID_IMAGE_FORMAT';
      errorMessage = 'Invalid image format. Please try with different images.';
    } else if (error.message?.includes('timeout')) {
      errorCode = 'ANALYSIS_TIMEOUT';
      errorMessage = 'Analysis timed out. Try with fewer or smaller images.';
    } else if (error.message?.includes('API key')) {
      errorCode = 'GEMINI_API_ERROR';
      errorMessage = 'Visual analysis service unavailable';
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      message: error.message,
      code: errorCode
    });
  }
});

export default router;