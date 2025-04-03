import { users, type User, type InsertUser, models, type Model, type InsertModel } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Model operations
  createModel(model: InsertModel): Promise<Model>;
  getModel(id: number): Promise<Model | undefined>;
  getModelsByUserId(userId: number): Promise<Model[]>;
  updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined>;
  deleteModel(id: number): Promise<boolean>;
  getModels(): Promise<Model[]>; // Dodana metoda do pobierania wszystkich modeli
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private models: Map<number, Model>;
  private userIdCounter: number;
  private modelIdCounter: number;

  constructor() {
    this.users = new Map();
    this.models = new Map();
    this.userIdCounter = 1;
    this.modelIdCounter = 1;
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
    const user: User = { ...insertUser, id };
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
      metadata: insertModel.metadata ?? null
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
      metadata: insertModel.metadata ?? null
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
}

// Use PostgreSQL storage
export const storage = new PostgresStorage();
