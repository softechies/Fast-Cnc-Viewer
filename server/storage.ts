import { users, type User, type InsertUser, models, type Model, type InsertModel } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Model operations
  createModel(model: InsertModel): Promise<Model>;
  getModel(id: number): Promise<Model | undefined>;
  getModelsByUserId(userId: number): Promise<Model[]>;
  deleteModel(id: number): Promise<boolean>;
}

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
    const model: Model = { ...insertModel, id };
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
}

export const storage = new MemStorage();
