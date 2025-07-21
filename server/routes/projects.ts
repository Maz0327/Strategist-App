import { Router } from "express";
import { projectService } from "../services/projectService";
import { insertProjectSchema } from "../../shared/schema";
import { requireAuth } from "../auth";

const router = Router();

// Get all user projects
router.get("/", requireAuth, async (req, res) => {
  try {
    const projects = await projectService.getUserProjects(req.session.userId!);
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create new project
router.post("/", requireAuth, async (req, res) => {
  try {
    const validatedData = insertProjectSchema.parse({
      ...req.body,
      userId: req.session.userId!
    });

    const project = await projectService.createProject(validatedData);
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ error: "Failed to create project" });
  }
});

// Get project by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await projectService.getProject(projectId, req.session.userId!);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Update project
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const updates = insertProjectSchema.partial().parse(req.body);
    
    const project = await projectService.updateProject(projectId, req.session.userId!, updates);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(400).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const success = await projectService.deleteProject(projectId, req.session.userId!);
    
    if (!success) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get project captures
router.get("/:id/captures", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const captures = await projectService.getProjectCaptures(projectId, req.session.userId!);
    res.json(captures);
  } catch (error) {
    console.error("Error fetching captures:", error);
    res.status(500).json({ error: "Failed to fetch captures" });
  }
});

// Get captures by section
router.get("/:id/captures/:section", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const section = req.params.section;
    const captures = await projectService.getCapturesBySection(projectId, req.session.userId!, section);
    res.json(captures);
  } catch (error) {
    console.error("Error fetching section captures:", error);
    res.status(500).json({ error: "Failed to fetch section captures" });
  }
});

// Assign signal to project
router.post("/:id/assign-signal", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { signalId, templateSection } = req.body;
    
    const signal = await projectService.assignSignalToProject(
      signalId, 
      projectId, 
      req.session.userId!,
      templateSection
    );
    
    if (!signal) {
      return res.status(404).json({ error: "Signal not found" });
    }

    res.json(signal);
  } catch (error) {
    console.error("Error assigning signal:", error);
    res.status(400).json({ error: "Failed to assign signal" });
  }
});

export default router;