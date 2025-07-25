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

// Get all user projects (simplified for Chrome extension)
router.get("/", requireAuth, async (req, res) => {
  try {
    // For now, return mock data since projects aren't fully implemented in storage
    const mockProjects = [
      { id: 1, name: "Content Strategy Q1", description: "Quarterly strategic content analysis" },
      { id: 2, name: "Competitor Research", description: "Ongoing competitor intelligence" },
      { id: 3, name: "Brand Insights", description: "Cultural moments and brand analysis" }
    ];
    res.json(mockProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create new project (simplified)
router.post("/", requireAuth, async (req, res) => {
  try {
    const result = createProjectSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    // Create mock project for demo
    const newProject = {
      id: Date.now(),
      name: result.data.name,
      description: result.data.description || "",
      userId: req.session.userId,
      createdAt: new Date()
    };

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ error: "Failed to create project" });
  }
});

export default router;