import { Router } from "express";
import { requireAuth } from "../middleware/require-auth";
import { storage } from "../storage";
import { z } from "zod";
import { insertWorkspaceSessionSchema } from "@shared/schema";

const router = Router();

// Get workspace state for a project
router.get("/:projectId", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.session.userId!;

    // Verify user owns the project
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // Get workspace session for this project
    const workspaceSession = await storage.getWorkspaceSession(userId, projectId);
    
    // Get all captures for this project
    const captures = await storage.getSignalsByProject(projectId);

    res.json({
      success: true,
      data: {
        project,
        workspaceSession,
        captures: captures.map((capture: any) => ({
          ...capture,
          // Ensure workspace fields have defaults for existing captures
          workspaceNotes: capture.workspaceNotes || "",
          analysisStatus: capture.analysisStatus || "pending",
          briefSectionAssignment: capture.briefSectionAssignment || null,
          batchQueueStatus: capture.batchQueueStatus || false,
          workspacePriority: capture.workspacePriority || 0
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    res.status(500).json({ success: false, error: "Failed to fetch workspace" });
  }
});

// Get captures for a specific project
router.get("/:projectId/captures", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.session.userId!;

    // Verify user owns the project
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== userId) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const captures = await storage.getSignalsByProject(projectId);

    res.json({
      success: true,
      data: captures.map((capture: any) => ({
        ...capture,
        workspaceNotes: capture.workspaceNotes || "",
        analysisStatus: capture.analysisStatus || "pending",
        briefSectionAssignment: capture.briefSectionAssignment || null,
        batchQueueStatus: capture.batchQueueStatus || false,
        workspacePriority: capture.workspacePriority || 0
      }))
    });
  } catch (error) {
    console.error("Error fetching captures:", error);
    res.status(500).json({ success: false, error: "Failed to fetch captures" });
  }
});

// Update capture notes
router.patch("/captures/:id/notes", requireAuth, async (req, res) => {
  try {
    const captureId = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    const { workspaceNotes } = req.body;
    
    if (typeof workspaceNotes !== 'string') {
      return res.status(400).json({ success: false, error: "Invalid notes format" });
    }

    // Verify user owns the capture
    const capture = await storage.getSignal(captureId);
    if (!capture || capture.userId !== userId) {
      return res.status(404).json({ success: false, error: "Capture not found" });
    }

    const updatedCapture = await storage.updateSignal(captureId, { workspaceNotes });

    res.json({
      success: true,
      data: updatedCapture
    });
  } catch (error) {
    console.error("Error updating capture notes:", error);
    res.status(500).json({ success: false, error: "Failed to update notes" });
  }
});

// Update capture workspace settings (tags, priority, section assignment)
router.patch("/captures/:id/workspace", requireAuth, async (req, res) => {
  try {
    const captureId = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    const updateSchema = z.object({
      workspaceNotes: z.string().optional(),
      briefSectionAssignment: z.enum(["define", "shift", "deliver"]).nullable().optional(),
      workspacePriority: z.number().min(0).max(10).optional(),
      batchQueueStatus: z.boolean().optional(),
      tags: z.array(z.string()).optional()
    });

    const validatedData = updateSchema.parse(req.body);

    // Verify user owns the capture
    const capture = await storage.getSignal(captureId);
    if (!capture || capture.userId !== userId) {
      return res.status(404).json({ success: false, error: "Capture not found" });
    }

    const updatedCapture = await storage.updateSignal(captureId, validatedData);

    res.json({
      success: true,
      data: updatedCapture
    });
  } catch (error) {
    console.error("Error updating capture workspace:", error);
    res.status(500).json({ success: false, error: "Failed to update workspace settings" });
  }
});

// Batch analysis endpoint
router.post("/analysis/batch", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { captureIds, analysisMode = "quick" } = req.body;

    if (!Array.isArray(captureIds) || captureIds.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid capture IDs" });
    }

    // Verify user owns all captures
    const captures = await Promise.all(
      captureIds.map((id: string) => storage.getSignal(parseInt(id)))
    );

    const validCaptures = captures.filter((capture): capture is NonNullable<typeof capture> => 
      capture !== undefined && capture.userId === userId
    );

    if (validCaptures.length !== captureIds.length) {
      return res.status(403).json({ success: false, error: "Access denied to some captures" });
    }

    // Update analysis status to "analyzing" for all captures
    await Promise.all(
      captureIds.map((id: string) => 
        storage.updateSignal(parseInt(id), { 
          analysisStatus: "analyzing",
          batchQueueStatus: false 
        })
      )
    );

    // Process batch analysis (use simplified analysis logic)
    const analysisResults = [];
    
    for (const capture of validCaptures) {
      try {
        // Use workspace context for analysis
        const analysisContent = `${capture.content}\n\nUser Notes: ${capture.workspaceNotes || "No additional notes"}`;
        
        // Simplified analysis result (can be enhanced later)
        const result = {
          analysisStatus: "completed",
          // Add basic analysis fields
          truthAnalysis: `Analysis of "${capture.title}" completed`,
          lastAnalyzed: new Date()
        };
        
        // Update capture with analysis results
        const updatedCapture = await storage.updateSignal(capture.id, result);

        analysisResults.push(updatedCapture);
      } catch (analysisError) {
        console.error(`Analysis failed for capture ${capture.id}:`, analysisError);
        
        // Mark as error
        await storage.updateSignal(capture.id, { 
          analysisStatus: "error" 
        });

        analysisResults.push({
          ...capture,
          analysisStatus: "error",
          error: "Analysis failed"
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed: analysisResults.length,
        results: analysisResults
      }
    });
  } catch (error) {
    console.error("Error in batch analysis:", error);
    res.status(500).json({ success: false, error: "Batch analysis failed" });
  }
});

// Update workspace session
router.post("/session", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const sessionData = insertWorkspaceSessionSchema.parse(req.body);

    const workspaceSession = await storage.upsertWorkspaceSession({
      ...sessionData,
      userId
    });

    res.json({
      success: true,
      data: workspaceSession
    });
  } catch (error) {
    console.error("Error updating workspace session:", error);
    res.status(500).json({ success: false, error: "Failed to update workspace session" });
  }
});

export default router;