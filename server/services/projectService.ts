import { eq, and, desc } from "drizzle-orm";
import { db } from "../storage.js";
import { projects, signals, type InsertProject, type Project } from "../../shared/schema.js";

export class ProjectService {
  // Create new project
  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  // Get all projects for a user
  async getUserProjects(userId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  // Get project by ID (with user verification)
  async getProject(projectId: number, userId: number): Promise<Project | null> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    
    return project || null;
  }

  // Update project
  async updateProject(projectId: number, userId: number, updates: Partial<InsertProject>): Promise<Project | null> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();
    
    return project || null;
  }

  // Delete project
  async deleteProject(projectId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    
    return result.length > 0;
  }

  // Get project captures (signals)
  async getProjectCaptures(projectId: number, userId: number) {
    return await db
      .select()
      .from(signals)
      .where(and(eq(signals.projectId, projectId), eq(signals.userId, userId)))
      .orderBy(desc(signals.createdAt));
  }

  // Get captures by template section
  async getCapturesBySection(projectId: number, userId: number, templateSection: string) {
    return await db
      .select()
      .from(signals)
      .where(and(
        eq(signals.projectId, projectId),
        eq(signals.userId, userId),
        eq(signals.templateSection, templateSection)
      ))
      .orderBy(desc(signals.createdAt));
  }

  // Update signal's project assignment
  async assignSignalToProject(signalId: number, projectId: number, userId: number, templateSection?: string) {
    const updateData: any = { projectId };
    if (templateSection) {
      updateData.templateSection = templateSection;
    }

    const [signal] = await db
      .update(signals)
      .set(updateData)
      .where(and(eq(signals.id, signalId), eq(signals.userId, userId)))
      .returning();

    return signal || null;
  }

  // Generate capture session ID
  generateCaptureSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const projectService = new ProjectService();