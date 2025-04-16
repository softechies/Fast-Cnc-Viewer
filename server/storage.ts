import { 
  users, type User, type InsertUser, 
  models, type Model, type InsertModel,
  modelViews, type ModelView, type InsertModelView,
  type ModelViewStats
} from "@shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { db } from "./db";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Model operations
  createModel(model: InsertModel): Promise<Model>;
  getModel(id: number): Promise<Model | undefined>;
  getModelsByUserId(userId: number): Promise<Model[]>;
  updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined>;
  deleteModel(id: number): Promise<boolean>;
  getModels(): Promise<Model[]>;
  
  // Share operations
  getModelByShareId(shareId: string): Promise<Model | undefined>;
  getSharedModels(): Promise<Model[]>;
  
  // View statistics operations
  recordModelView(viewData: InsertModelView): Promise<ModelView>;
  getModelViewStats(modelId: number): Promise<ModelViewStats>;
  getModelViewCount(modelId: number): Promise<number>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private models: Map<number, Model>;
  private modelViews: Map<number, ModelView[]>;
  private userIdCounter: number;
  private modelIdCounter: number;
  private viewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.models = new Map();
    this.modelViews = new Map();
    this.userIdCounter = 1;
    this.modelIdCounter = 1;
    this.viewIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false 
    };
    this.users.set(id, user);
    return user;
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.modelIdCounter++;
    // Ensure all nullable fields are explicitly null rather than undefined
    const modelData = { 
      ...insertModel, 
      userId: insertModel.userId ?? null,
      format: insertModel.format ?? null,
      sourceSystem: insertModel.sourceSystem ?? null,
      metadata: insertModel.metadata ?? null,
      shareId: insertModel.shareId ?? null,
      shareEnabled: insertModel.shareEnabled ?? false,
      sharePassword: insertModel.sharePassword ?? null,
      shareExpiryDate: insertModel.shareExpiryDate ?? null,
      shareEmail: insertModel.shareEmail ?? null,
      shareNotificationSent: insertModel.shareNotificationSent ?? false,
      shareLastAccessed: insertModel.shareLastAccessed ?? null
    };
    const model: Model = { ...modelData, id };
    this.models.set(id, model);
    return model;
  }

  async getModel(id: number): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async getModelsByUserId(userId: number): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.userId === userId
    );
  }

  async deleteModel(id: number): Promise<boolean> {
    return this.models.delete(id);
  }
  
  async updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined> {
    const model = this.models.get(id);
    if (!model) return undefined;
    
    const updatedModel = { ...model, ...updates };
    this.models.set(id, updatedModel);
    return updatedModel;
  }
  
  async getModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }
  
  async getModelByShareId(shareId: string): Promise<Model | undefined> {
    return Array.from(this.models.values()).find(
      (model) => model.shareId === shareId && model.shareEnabled === true
    );
  }
  
  async getSharedModels(): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.shareEnabled === true && model.shareId !== null
    );
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async recordModelView(viewData: InsertModelView): Promise<ModelView> {
    const id = this.viewIdCounter++;
    const view: ModelView = {
      ...viewData,
      id,
      shareId: viewData.shareId || null,
      userAgent: viewData.userAgent || null,
      viewedAt: viewData.viewedAt || new Date(),
    };

    // Initialize array for the model if it doesn't exist
    if (!this.modelViews.has(viewData.modelId)) {
      this.modelViews.set(viewData.modelId, []);
    }

    // Add the view to the array
    const views = this.modelViews.get(viewData.modelId)!;
    views.push(view);

    return view;
  }

  async getModelViewStats(modelId: number): Promise<ModelViewStats> {
    const views = this.modelViews.get(modelId) || [];
    
    // Count unique IPs
    const uniqueIps = new Set(views.map(view => view.ipAddress)).size;

    // Format the view details
    const viewDetails = views.map(view => ({
      ipAddress: view.ipAddress,
      userAgent: view.userAgent || undefined,
      viewedAt: view.viewedAt ? view.viewedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      totalViews: views.length,
      uniqueIps,
      viewDetails,
    };
  }

  async getModelViewCount(modelId: number): Promise<number> {
    const views = this.modelViews.get(modelId) || [];
    return views.length;
  }
}

// PostgreSQL storage implementation
export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    // Ensure all nullable fields are explicitly null rather than undefined
    const modelData = { 
      ...insertModel, 
      userId: insertModel.userId ?? null,
      format: insertModel.format ?? null,
      sourceSystem: insertModel.sourceSystem ?? null,
      metadata: insertModel.metadata ?? null,
      shareId: insertModel.shareId ?? null,
      shareEnabled: insertModel.shareEnabled ?? false,
      sharePassword: insertModel.sharePassword ?? null,
      shareExpiryDate: insertModel.shareExpiryDate ?? null,
      shareEmail: insertModel.shareEmail ?? null,
      shareNotificationSent: insertModel.shareNotificationSent ?? false,
      shareLastAccessed: insertModel.shareLastAccessed ?? null
    };
    const result = await db.insert(models).values(modelData).returning();
    return result[0];
  }

  async getModel(id: number): Promise<Model | undefined> {
    const result = await db.select().from(models).where(eq(models.id, id)).limit(1);
    return result[0];
  }

  async getModelsByUserId(userId: number): Promise<Model[]> {
    return await db.select().from(models).where(eq(models.userId, userId));
  }

  async deleteModel(id: number): Promise<boolean> {
    const result = await db.delete(models).where(eq(models.id, id)).returning({ id: models.id });
    return result.length > 0;
  }
  
  async updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined> {
    const result = await db
      .update(models)
      .set(updates)
      .where(eq(models.id, id))
      .returning();
    
    return result[0];
  }
  
  async getModels(): Promise<Model[]> {
    return await db.select().from(models);
  }
  
  async getModelByShareId(shareId: string): Promise<Model | undefined> {
    // Używamy pojedynczego warunku do filtrowania modeli
    const result = await db.select()
      .from(models)
      .where(eq(models.shareId, shareId))
      .limit(1);

    // Sprawdzamy warunek shareEnabled po pobraniu
    if (result.length > 0 && result[0].shareEnabled) {
      return result[0];
    }
    return undefined;
  }
  
  async getSharedModels(): Promise<Model[]> {
    // Pobierz wszystkie modele z włączonym udostępnianiem
    const result = await db.select()
      .from(models)
      .where(
        eq(models.shareEnabled, true)
      );
    
    return result;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }

  async recordModelView(viewData: InsertModelView): Promise<ModelView> {
    const result = await db.insert(modelViews).values(viewData).returning();
    return result[0];
  }

  async getModelViewStats(modelId: number): Promise<ModelViewStats> {
    // Pobierz wszystkie wyświetlenia dla danego modelu, sortowane od najnowszych
    const views = await db
      .select()
      .from(modelViews)
      .where(eq(modelViews.modelId, modelId))
      .orderBy(desc(modelViews.viewedAt));

    // Pobierz liczbę unikalnych adresów IP
    const uniqueIpsResult = await db
      .select({ count: sql<number>`count(distinct ${modelViews.ipAddress})` })
      .from(modelViews)
      .where(eq(modelViews.modelId, modelId));

    const uniqueIps = uniqueIpsResult[0]?.count || 0;

    // Format the view details
    const viewDetails = views.map(view => ({
      ipAddress: view.ipAddress,
      userAgent: view.userAgent || undefined,
      viewedAt: view.viewedAt.toISOString(),
    }));

    return {
      totalViews: views.length,
      uniqueIps,
      viewDetails,
    };
  }

  async getModelViewCount(modelId: number): Promise<number> {
    // Pobierz liczbę wyświetleń dla danego modelu
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelViews)
      .where(eq(modelViews.modelId, modelId));

    return countResult[0]?.count || 0;
  }
}

// Use PostgreSQL storage
export const storage = new PostgresStorage();
