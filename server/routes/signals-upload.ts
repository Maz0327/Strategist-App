import { Router, type Request } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/require-auth";
import multer from 'multer';
import { z } from "zod";

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

export default router;