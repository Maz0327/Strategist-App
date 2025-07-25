import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth } from "../middleware/require-auth";

// Simple project schema for Chrome extension
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional()
});

const router = Router();

// Get all user projects
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const projects = await storage.getProjectsByUserId(userId);
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch projects",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create new project
router.post("/", requireAuth, async (req, res) => {
  try {
    const result = createProjectSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const userId = req.session.userId!;
    const projectData = {
      userId,
      name: result.data.name,
      description: result.data.description || ""
    };

    const newProject = await storage.createProject(projectData);
    res.status(201).json({
      success: true,
      data: newProject
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ 
      success: false,
      error: "Failed to create project",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get single project by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid project ID" 
      });
    }

    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
    }

    // Verify ownership
    if (project.userId !== req.session.userId) {
      return res.status(403).json({ 
        success: false,
        error: "Unauthorized access to project" 
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch project",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update project
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid project ID" 
      });
    }

    const result = createProjectSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    // Check if project exists and user owns it
    const existingProject = await storage.getProject(projectId);
    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
    }

    if (existingProject.userId !== req.session.userId) {
      return res.status(403).json({ 
        success: false,
        error: "Unauthorized access to project" 
      });
    }

    const updatedProject = await storage.updateProject(projectId, result.data);
    res.json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update project",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Delete project
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid project ID" 
      });
    }

    // Check if project exists and user owns it
    const existingProject = await storage.getProject(projectId);
    if (!existingProject) {
      return res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
    }

    if (existingProject.userId !== req.session.userId) {
      return res.status(403).json({ 
        success: false,
        error: "Unauthorized access to project" 
      });
    }

    await storage.deleteProject(projectId);
    res.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete project",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;