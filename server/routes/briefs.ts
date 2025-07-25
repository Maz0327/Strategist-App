import express from 'express';
import { requireAuth } from '../middleware/require-auth';
import { db } from '../db';
import { briefs, briefSections, projects, signals } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { debugLogger } from '../services/debug-logger';

const router = express.Router();

// Get all briefs for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    
    const userBriefs = await db
      .select({
        id: briefs.id,
        title: briefs.title,
        projectId: briefs.projectId,
        templateType: briefs.templateType,
        status: briefs.status,
        createdAt: briefs.createdAt,
        updatedAt: briefs.updatedAt
      })
      .from(briefs)
      .innerJoin(projects, eq(briefs.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(briefs.createdAt));

    // Get sections for each brief
    const briefsWithSections = await Promise.all(
      userBriefs.map(async (brief) => {
        const sections = await db
          .select()
          .from(briefSections)
          .where(eq(briefSections.briefId, brief.id))
          .orderBy(briefSections.order);

        return {
          ...brief,
          sections: sections.map(section => ({
            id: section.sectionId,
            name: section.name,
            description: section.description,
            content: section.content || '',
            contentTypes: section.contentTypes || [],
            mappedFields: section.mappedFields || [],
            order: section.order
          }))
        };
      })
    );

    res.json(briefsWithSections);
  } catch (error) {
    debugLogger.error('Error fetching briefs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch briefs' 
    });
  }
});

// Create a new brief
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { title, projectId, templateType, description, sections } = req.body;

    // Verify project belongs to user
    const project = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, parseInt(projectId)),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (project.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    // Create the brief
    const [newBrief] = await db
      .insert(briefs)
      .values({
        title,
        projectId: parseInt(projectId),
        templateType: templateType || 'jimmy-johns',
        description: description || null,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Create sections for the brief
    if (sections && sections.length > 0) {
      const sectionsToInsert = sections.map((section: any, index: number) => ({
        briefId: newBrief.id,
        sectionId: section.id,
        name: section.name,
        description: section.description,
        content: section.content || '',
        contentTypes: section.contentTypes || [],
        mappedFields: section.mappedFields || [],
        order: section.order || index + 1
      }));

      await db.insert(briefSections).values(sectionsToInsert);
    }

    // Return the brief with sections
    const briefWithSections = {
      ...newBrief,
      sections: sections.map((section: any) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        content: section.content || '',
        contentTypes: section.contentTypes || [],
        mappedFields: section.mappedFields || [],
        order: section.order
      }))
    };

    debugLogger.info('Brief created successfully', { 
      briefId: newBrief.id, 
      userId,
      projectId 
    });

    res.status(201).json(briefWithSections);
  } catch (error) {
    debugLogger.error('Error creating brief:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create brief' 
    });
  }
});

// Auto-populate brief sections with project data
router.post('/:briefId/auto-populate', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const briefId = parseInt(req.params.briefId);

    // Verify brief belongs to user
    const brief = await db
      .select({
        id: briefs.id,
        projectId: briefs.projectId,
        templateType: briefs.templateType
      })
      .from(briefs)
      .innerJoin(projects, eq(briefs.projectId, projects.id))
      .where(and(
        eq(briefs.id, briefId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (brief.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brief not found or access denied'
      });
    }

    // Get project signals/captures for analysis
    const projectSignals = await db
      .select()
      .from(signals)
      .where(and(
        eq(signals.projectId, brief[0].projectId),
        eq(signals.status, 'analyzed')
      ))
      .orderBy(desc(signals.createdAt))
      .limit(10);

    if (projectSignals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No analyzed signals found in project for auto-population'
      });
    }

    // Get brief sections
    const sections = await db
      .select()
      .from(briefSections)
      .where(eq(briefSections.briefId, briefId))
      .orderBy(briefSections.order);

    // Auto-populate sections based on Truth Analysis data
    const updates = await Promise.all(
      sections.map(async (section) => {
        let content = '';
        
        // Map Truth Analysis fields to section content
        const relevantSignals = projectSignals.filter(signal => 
          signal.truthAnalysis && typeof signal.truthAnalysis === 'object'
        );

        if (section.mappedFields && section.mappedFields.length > 0) {
          section.mappedFields.forEach((field: string) => {
            const fieldContent = relevantSignals
              .map(signal => {
                const analysis = signal.truthAnalysis as any;
                return analysis[field];
              })
              .filter(Boolean)
              .join('\n\n');
            
            if (fieldContent) {
              content += `**${field.charAt(0).toUpperCase() + field.slice(1)} Insights:**\n${fieldContent}\n\n`;
            }
          });
        }

        // Add general signal information if no specific mapping
        if (!content && relevantSignals.length > 0) {
          content = relevantSignals
            .slice(0, 3)
            .map(signal => `• ${signal.title}\n  ${signal.content?.substring(0, 200)}...`)
            .join('\n\n');
        }

        if (content) {
          await db
            .update(briefSections)
            .set({ 
              content: content.trim(),
              updatedAt: new Date()
            })
            .where(eq(briefSections.id, section.id));
        }

        return { sectionId: section.sectionId, updated: !!content };
      })
    );

    // Update brief status
    await db
      .update(briefs)
      .set({ 
        status: 'complete',
        updatedAt: new Date()
      })
      .where(eq(briefs.id, briefId));

    debugLogger.info('Brief auto-populated successfully', { 
      briefId, 
      userId,
      sectionsUpdated: updates.filter(u => u.updated).length
    });

    res.json({
      success: true,
      message: 'Brief sections auto-populated successfully',
      sectionsUpdated: updates.filter(u => u.updated).length
    });
  } catch (error) {
    debugLogger.error('Error auto-populating brief:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to auto-populate brief' 
    });
  }
});

// Update brief section content
router.patch('/:briefId/sections/:sectionId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const briefId = parseInt(req.params.briefId);
    const sectionId = req.params.sectionId;
    const { content } = req.body;

    // Verify brief belongs to user
    const brief = await db
      .select({ id: briefs.id })
      .from(briefs)
      .innerJoin(projects, eq(briefs.projectId, projects.id))
      .where(and(
        eq(briefs.id, briefId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (brief.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brief not found or access denied'
      });
    }

    // Update section content
    await db
      .update(briefSections)
      .set({ 
        content,
        updatedAt: new Date()
      })
      .where(and(
        eq(briefSections.briefId, briefId),
        eq(briefSections.sectionId, sectionId)
      ));

    // Update brief timestamp
    await db
      .update(briefs)
      .set({ updatedAt: new Date() })
      .where(eq(briefs.id, briefId));

    res.json({
      success: true,
      message: 'Section updated successfully'
    });
  } catch (error) {
    debugLogger.error('Error updating brief section:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update section' 
    });
  }
});

// Delete a brief
router.delete('/:briefId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const briefId = parseInt(req.params.briefId);

    // Verify brief belongs to user
    const brief = await db
      .select({ id: briefs.id })
      .from(briefs)
      .innerJoin(projects, eq(briefs.projectId, projects.id))
      .where(and(
        eq(briefs.id, briefId),
        eq(projects.userId, userId)
      ))
      .limit(1);

    if (brief.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Brief not found or access denied'
      });
    }

    // Delete sections first (cascade)
    await db
      .delete(briefSections)
      .where(eq(briefSections.briefId, briefId));

    // Delete brief
    await db
      .delete(briefs)
      .where(eq(briefs.id, briefId));

    debugLogger.info('Brief deleted successfully', { briefId, userId });

    res.json({
      success: true,
      message: 'Brief deleted successfully'
    });
  } catch (error) {
    debugLogger.error('Error deleting brief:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete brief' 
    });
  }
});

export default router;