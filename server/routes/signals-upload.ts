import { Router, type Request } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/require-auth";
import multer from 'multer';
import { z } from "zod";
import { analyzeScreenshotWithGemini } from '../gemini-ocr';
import * as fs from 'fs';
import * as path from 'path';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow images, text files, and PDFs
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'text/plain',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().max(10000, 'Content too long').optional(),
  user_notes: z.string().max(2000, 'Notes too long').optional(),
  projectId: z.string().transform(Number).refine(n => n > 0, 'Valid project ID required'),
  isDraft: z.string().transform(s => s === 'true'),
  status: z.enum(['capture', 'potential_signal', 'signal', 'validated_signal']).default('capture')
});

// Mobile upload endpoint
router.post("/", requireAuth, upload.single('file'), async (req: MulterRequest, res) => {
  try {
    console.log('Upload request body:', req.body);
    console.log('Upload file:', req.file ? 'File present' : 'No file');
    
    const result = uploadSchema.safeParse(req.body);
    if (!result.success) {
      console.error('Validation failed:', result.error.errors);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const userId = req.session.userId!;
    let content = result.data.content || '';
    
    // If a file was uploaded, add file info to content
    if (req.file) {
      const fileInfo = `[File Upload: ${req.file.originalname} (${req.file.mimetype}, ${Math.round(req.file.size / 1024)}KB)]`;
      content = content ? `${content}\n\n${fileInfo}` : fileInfo;
      
      // For text files, try to extract content
      if (req.file.mimetype === 'text/plain') {
        const textContent = req.file.buffer.toString('utf-8');
        content += `\n\nFile Content:\n${textContent}`;
      }
    }

    const signalData = {
      userId,
      projectId: result.data.projectId,
      title: result.data.title,
      content,
      userNotes: result.data.user_notes || null,
      status: result.data.status,
      isDraft: result.data.isDraft,
      url: null,
      capturedAt: new Date(),
      browserContext: req.file ? {
        domain: 'mobile-upload',
        metadata: {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      } : null
    };

    console.log('Creating signal with data:', signalData);
    const newSignal = await storage.createSignal(signalData);
    
    res.status(201).json({
      success: true,
      data: newSignal
    });
  } catch (error) {
    console.error("Error uploading content:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to upload content",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Batch screenshot upload endpoint with Gemini OCR
const batchUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Max 20 files at once
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Only allow image files for batch upload
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for batch upload'));
    }
  }
});

router.post("/batch-upload", requireAuth, batchUpload.array('files', 20), async (req: any, res) => {
  try {
    console.log('🔥 Batch upload request:', req.body);
    console.log('📸 Files received:', req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const projectId = parseInt(req.body.projectId);
    if (!projectId || projectId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid project ID required'
      });
    }

    const userId = req.session.userId!;
    const uploadedSignals = [];
    
    // Process each file
    for (const file of req.files) {
      console.log(`📋 Processing: ${file.originalname} (${file.mimetype})`);
      
      try {
        // Create temporary file for Gemini analysis
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, `${Date.now()}-${file.originalname}`);
        fs.writeFileSync(tempFilePath, file.buffer);
        
        console.log(`🤖 Analyzing with Gemini: ${file.originalname}`);
        
        // Analyze with Gemini 2.5 Pro
        const ocrResult = await analyzeScreenshotWithGemini(tempFilePath);
        
        console.log(`✅ OCR Complete for ${file.originalname}:`, {
          textLength: ocrResult.extractedText.length,
          contentType: ocrResult.contentType,
          isTextHeavy: ocrResult.isTextHeavy,
          confidence: ocrResult.confidence
        });
        
        // Create signal with extracted data
        const signalData = {
          userId,
          projectId,
          title: `Screenshot: ${file.originalname}`,
          content: ocrResult.summary || `Screenshot analysis from ${file.originalname}`,
          userNotes: null,
          status: 'capture' as const,
          isDraft: true,
          url: null,
          capturedAt: new Date(),
          browserContext: {
            domain: 'batch-screenshot-upload',
            metadata: {
              filename: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              // Store OCR results in metadata
              ocrData: {
                extractedText: ocrResult.extractedText,
                isTextHeavy: ocrResult.isTextHeavy,
                isCommentScreenshot: ocrResult.isCommentScreenshot,
                contentType: ocrResult.contentType,
                summary: ocrResult.summary,
                confidence: ocrResult.confidence
              }
            }
          }
        };

        const newSignal = await storage.createSignal(signalData);
        uploadedSignals.push({
          signal: newSignal,
          ocrResult: ocrResult
        });
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
      } catch (fileError: any) {
        console.error(`❌ Error processing ${file.originalname}:`, fileError);
        // Continue with other files even if one fails
        uploadedSignals.push({
          error: `Failed to process ${file.originalname}: ${fileError?.message || 'Unknown error'}`,
          fileName: file.originalname
        });
      }
    }
    
    const successCount = uploadedSignals.filter(s => !s.error).length;
    const errorCount = uploadedSignals.filter(s => s.error).length;
    
    console.log(`🎯 Batch upload complete: ${successCount} success, ${errorCount} errors`);
    
    res.status(201).json({
      success: true,
      data: {
        uploadedCount: successCount,
        errorCount: errorCount,
        signals: uploadedSignals,
        summary: `Successfully processed ${successCount} screenshots with Gemini OCR analysis`
      }
    });
    
  } catch (error) {
    console.error("❌ Batch upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process batch upload",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;