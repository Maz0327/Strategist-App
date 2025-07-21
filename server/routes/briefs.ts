import { Router } from "express";
import { briefService } from "../services/briefService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get user's generated briefs
router.get("/", requireAuth, async (req, res) => {
  try {
    const briefs = await briefService.getUserBriefs(req.session.userId!);
    res.json(briefs);
  } catch (error) {
    console.error("Error fetching briefs:", error);
    res.status(500).json({ error: "Failed to fetch briefs" });
  }
});

// Generate brief from project
router.post("/generate/:projectId", requireAuth, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { templateId = "jimmy-johns-pac" } = req.body;
    
    const brief = await briefService.generateBrief(projectId, req.session.userId!, templateId);
    res.status(201).json(brief);
  } catch (error) {
    console.error("Error generating brief:", error);
    res.status(400).json({ error: error.message || "Failed to generate brief" });
  }
});

// Get specific brief
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const briefId = parseInt(req.params.id);
    const brief = await briefService.getBrief(briefId, req.session.userId!);
    
    if (!brief) {
      return res.status(404).json({ error: "Brief not found" });
    }

    res.json(brief);
  } catch (error) {
    console.error("Error fetching brief:", error);
    res.status(500).json({ error: "Failed to fetch brief" });
  }
});

// Get available templates
router.get("/templates/list", requireAuth, async (req, res) => {
  try {
    const template = await briefService.getTemplate("jimmy-johns-pac");
    res.json([template]); // For now, just return the default template
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

export default router;