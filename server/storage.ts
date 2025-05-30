import { 
  users, type User, type InsertUser, 
  models, type Model, type InsertModel,
  modelViews, type ModelView, type InsertModelView,
  type ModelViewStats
} from "@shared/schema";
import { eq, sql, and, desc, or, like, ilike } from "drizzle-orm";
import { db } from "./db";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  
  // Model operations
  createModel(model: InsertModel): Promise<Model>;
  getModel(id: number): Promise<Model | undefined>;
  getModelsByUserId(userId: number): Promise<Model[]>;
  getModelsByEmail(email: string): Promise<Model[]>;
  updateModel(id: number, updates: Partial<Model>): Promise<Model | undefined>;
  deleteModel(id: number): Promise<boolean>;
  getModels(): Promise<Model[]>;
  
  // Share operations
  getModelByShareId(shareId: string): Promise<Model | undefined>;
  getSharedModels(): Promise<Model[]>;
  getModelsByClientId(clientId: number): Promise<Model[]>;
  getSharedModelsByEmail(email: string): Promise<Model[]>;
  
  // View statistics operations
  recordModelView(viewData: InsertModelView): Promise<ModelView>;
  getModelViewStats(modelId: number): Promise<ModelViewStats>;
  getModelViewCount(modelId: number): Promise<number>;
  
  // Library operations
  getLibraryModels(options: { query?: string; tags?: string[]; page?: number; limit?: number; }): Promise<Model[]>;
  updateModelTags(modelId: number, tags: string[]): Promise<Model | undefined>;
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token,
    );
  }
  
  async searchUsers(query: string): Promise<User[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(
      (user) => 
        (user.username && user.username.toLowerCase().includes(lowercaseQuery)) ||
        (user.email && user.email.toLowerCase().includes(lowercaseQuery)) ||
        (user.fullName && user.fullName.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  async getModelsByEmail(email: string): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.shareEmail === email
    );
  }
  
  async getModelsByClientId(clientId: number): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.userId === clientId
    );
  }
  
  async getSharedModelsByEmail(email: string): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.shareEmail === email && model.shareEnabled === true
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false,
      isClient: insertUser.isClient ?? false,
      email: insertUser.email ?? "",
      fullName: insertUser.fullName ?? null,
      company: insertUser.company ?? null,
      username: insertUser.username ?? null,
      createdAt: new Date(),
      lastLogin: null,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.modelIdCounter++;
    // Ensure all nullable fields are explicitly null rather than undefined
    const model: Model = { 
      ...insertModel, 
      id,
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
      shareLastAccessed: insertModel.shareLastAccessed ?? null,
      shareDeleteToken: insertModel.shareDeleteToken ?? null,
      tags: insertModel.tags ?? null
    };
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
      id,
      modelId: viewData.modelId,
      ipAddress: viewData.ipAddress,
      shareId: viewData.shareId || null,
      userAgent: viewData.userAgent || null,
      viewedAt: viewData.viewedAt || new Date(),
      authenticated: viewData.authenticated === undefined ? null : viewData.authenticated,
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
    
    // Sortuj widoki według daty (najnowsze pierwsze)
    const sortedViews = [...views].sort((a, b) => 
      new Date(b.viewedAt || new Date()).getTime() - new Date(a.viewedAt || new Date()).getTime()
    );
    
    // Pobierz unikalną listę IP i policz wystąpienia
    const ipCounts: Record<string, { count: number, lastView?: Date }> = {};
    const browserCounts: Record<string, number> = {};
    
    for (const view of sortedViews) {
      // Liczenie IP
      if (!ipCounts[view.ipAddress]) {
        ipCounts[view.ipAddress] = { count: 0 };
      }
      ipCounts[view.ipAddress].count += 1;
      
      // Aktualizacja ostatniego widoku dla IP
      if (!ipCounts[view.ipAddress].lastView || 
          (view.viewedAt && new Date(view.viewedAt) > new Date(ipCounts[view.ipAddress].lastView!))) {
        ipCounts[view.ipAddress].lastView = view.viewedAt;
      }
      
      // Liczenie przeglądarek (uproszczone)
      if (view.userAgent) {
        const browserName = this.detectBrowser(view.userAgent);
        browserCounts[browserName] = (browserCounts[browserName] || 0) + 1;
      }
    }
    
    // Formatowanie szczegółów widoku
    const viewDetails = sortedViews.map(view => ({
      ipAddress: view.ipAddress,
      userAgent: view.userAgent || undefined,
      viewedAt: view.viewedAt ? view.viewedAt.toISOString() : new Date().toISOString(),
      authenticated: view.authenticated || false,
    }));
    
    // Formatowanie adresów IP
    const ipAddresses = Object.entries(ipCounts).map(([address, data]) => ({
      address,
      count: data.count,
      lastView: data.lastView ? data.lastView.toISOString() : undefined,
    }));
    
    // Formatowanie statystyk przeglądarek
    const browserStats = Object.entries(browserCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Znajdź pierwszy i ostatni widok
    const firstView = sortedViews.length > 0 ? 
      (sortedViews[sortedViews.length - 1].viewedAt || new Date()).toISOString() : 
      undefined;
    
    const lastView = sortedViews.length > 0 ? 
      (sortedViews[0].viewedAt || new Date()).toISOString() : 
      undefined;

    return {
      totalViews: views.length,
      uniqueIPs: Object.keys(ipCounts).length,
      firstView,
      lastView,
      viewDetails,
      ipAddresses,
      browserStats,
    };
  }
  
  // Pomocnicza funkcja do wykrywania przeglądarki na podstawie userAgent
  private detectBrowser(userAgent: string): string {
    userAgent = userAgent.toLowerCase();
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('edg')) return 'Edge';
    if (userAgent.includes('opera') || userAgent.includes('opr')) return 'Opera';
    if (userAgent.includes('msie') || userAgent.includes('trident')) return 'Internet Explorer';
    return 'Other';
  }

  async getModelViewCount(modelId: number): Promise<number> {
    const views = this.modelViews.get(modelId) || [];
    return views.length;
  }
  
  // Implementacja metod dla otwartej biblioteki
  async getLibraryModels(options: { query?: string; tags?: string[]; page?: number; limit?: number; }): Promise<Model[]> {
    const { query, tags, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    // Filtruj modele: tylko te oznaczone jako publiczne (isPublic = true)
    let filteredModels = Array.from(this.models.values()).filter(
      (model) => model.isPublic === true
    );
    
    // Filtruj po nazwie pliku lub tagach
    if (query) {
      const queryLowerCase = query.toLowerCase();
      filteredModels = filteredModels.filter(
        (model) => {
          // Sprawdzamy nazwę pliku
          const filenameMatch = model.filename.toLowerCase().includes(queryLowerCase);
          
          // Sprawdzamy tagi
          const tagsMatch = model.tags?.some(tag => tag.toLowerCase().includes(queryLowerCase));
          
          return filenameMatch || tagsMatch;
        }
      );
    }
    
    // Filtruj po konkretnych tagach
    if (tags && tags.length > 0) {
      const tagsLowerCase = tags.map(tag => tag.toLowerCase());
      filteredModels = filteredModels.filter(
        (model) => {
          if (!model.tags || model.tags.length === 0) return false;
          
          // Sprawdź czy model zawiera wszystkie podane tagi
          const modelTagsLowerCase = model.tags.map(tag => tag.toLowerCase());
          return tagsLowerCase.every(tagToFind => modelTagsLowerCase.includes(tagToFind));
        }
      );
    }
    
    // Sortuj po dacie utworzenia (od najnowszych)
    filteredModels.sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return dateB - dateA;
    });
    
    // Paginacja
    return filteredModels.slice(offset, offset + limit);
  }
  
  async updateModelTags(modelId: number, tags: string[]): Promise<Model | undefined> {
    const model = this.models.get(modelId);
    if (!model) return undefined;
    
    const updatedModel = { ...model, tags: tags.length > 0 ? tags : null };
    this.models.set(modelId, updatedModel);
    
    return updatedModel;
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.resetToken, token))
      .limit(1);
    return result[0];
  }
  
  async searchUsers(query: string): Promise<User[]> {
    const result = await db.select().from(users)
      .where(
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.email, `%${query}%`),
          ilike(users.fullName, `%${query}%`)
        )
      );
    return result;
  }
  
  async getModelsByEmail(email: string): Promise<Model[]> {
    return await db.select().from(models)
      .where(eq(models.shareEmail, email));
  }
  
  async getModelsByClientId(clientId: number): Promise<Model[]> {
    return await db.select().from(models)
      .where(eq(models.userId, clientId));
  }
  
  async getSharedModelsByEmail(email: string): Promise<Model[]> {
    return await db.select().from(models)
      .where(
        and(
          eq(models.shareEmail, email),
          eq(models.shareEnabled, true)
        )
      );
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
    // Pobierz wszystkie modele przypisane do użytkowników (userId jest not null)
    const result = await db.select()
      .from(models)
      .where(
        sql`${models.userId} IS NOT NULL`  // Modele przypisane do użytkowników
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

    // Jeśli nie ma wyświetleń, zwróć puste statystyki
    if (views.length === 0) {
      return {
        totalViews: 0,
        uniqueIPs: 0,
        viewDetails: [],
      };
    }

    // Oblicz unikalne adresy IP
    // Adresy IP są już prawidłowo zapisane w bazie danych jako jeden adres klienta
    const uniqueClientIPs = new Set();
    for (const view of views) {
      uniqueClientIPs.add(view.ipAddress);
    }
    
    const uniqueIPsCount = uniqueClientIPs.size;

    // Pobierz pierwszy i ostatni widok
    const firstView = views[views.length - 1].viewedAt.toISOString();
    const lastView = views[0].viewedAt.toISOString();

    // Format the view details
    const viewDetails = views.map(view => ({
      ipAddress: view.ipAddress,
      userAgent: view.userAgent || undefined,
      viewedAt: view.viewedAt.toISOString(),
      authenticated: view.authenticated || false,
    }));

    // Generuj statystyki adresów IP
    // Adresy IP są już prawidłowo zapisane w bazie danych jako jeden adres klienta
    const ipAddressMap: Record<string, { count: number, lastView: Date }> = {};
    
    for (const view of views) {
      const ipAddress = view.ipAddress;
      if (!ipAddressMap[ipAddress]) {
        ipAddressMap[ipAddress] = { count: 0, lastView: view.viewedAt };
      }
      
      ipAddressMap[ipAddress].count += 1;
      
      // Aktualizuj lastView jeśli ten widok jest nowszy
      if (view.viewedAt > ipAddressMap[ipAddress].lastView) {
        ipAddressMap[ipAddress].lastView = view.viewedAt;
      }
    }
    
    const ipAddresses = Object.entries(ipAddressMap).map(([address, data]) => ({
      address,
      count: data.count,
      lastView: data.lastView.toISOString()
    }));

    // Generuj statystyki przeglądarek
    // Uproszczona implementacja - w pełnej wersji można by użyć biblioteki user-agent-parser
    const browserStats: {name: string, count: number}[] = [];
    const browserMap: Record<string, number> = {};

    for (const view of views) {
      if (view.userAgent) {
        const browserName = this.detectBrowser(view.userAgent);
        browserMap[browserName] = (browserMap[browserName] || 0) + 1;
      }
    }

    for (const [name, count] of Object.entries(browserMap)) {
      browserStats.push({ name, count });
    }

    // Sortuj statystyki przeglądarek malejąco według liczby wyświetleń
    browserStats.sort((a, b) => b.count - a.count);

    return {
      totalViews: views.length,
      uniqueIPs: uniqueIPsCount,
      firstView,
      lastView,
      viewDetails,
      ipAddresses,
      browserStats,
    };
  }
  
  // Pomocnicza funkcja do wykrywania przeglądarki na podstawie userAgent
  private detectBrowser(userAgent: string): string {
    userAgent = userAgent.toLowerCase();
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('edg')) return 'Edge';
    if (userAgent.includes('opera') || userAgent.includes('opr')) return 'Opera';
    if (userAgent.includes('msie') || userAgent.includes('trident')) return 'Internet Explorer';
    return 'Other';
  }

  async getModelViewCount(modelId: number): Promise<number> {
    // Pobierz liczbę wyświetleń dla danego modelu
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(modelViews)
      .where(eq(modelViews.modelId, modelId));

    return countResult[0]?.count || 0;
  }
  
  // Implementacja metod dla biblioteki otwartej
  async getLibraryModels(options: { query?: string; tags?: string[]; page?: number; limit?: number; }): Promise<Model[]> {
    try {
      const { query, tags, page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      // Podstawowe zapytanie - modele oznaczone jako publiczne
      let baseQuery = eq(models.isPublic, true);
      
      // Dodaj filtrowanie po nazwie pliku lub tagach, jeśli zostały podane
      if (query) {
        baseQuery = and(
          baseQuery,
          or(
            like(models.filename, `%${query}%`),
            // Używamy PostgreSQL-owej składni dla sprawdzania tablicy JSON
            sql`${models.tags}::jsonb @> ${JSON.stringify([query])}::jsonb`
          )
        );
      }
      
      // Dodaj filtrowanie po tagach, jeśli zostały podane
      if (tags && tags.length > 0) {
        baseQuery = and(
          baseQuery,
          sql`${models.tags}::jsonb @> ${JSON.stringify(tags)}::jsonb`
        );
      }
      
      // Wykonaj zapytanie z pełnym filtrowaniem
      const result = await db.select()
        .from(models)
        .where(baseQuery)
        .orderBy(desc(models.created))
        .limit(limit)
        .offset(offset);
      
      return result;
    } catch (error) {
      console.error("Error getting library models:", error);
      return [];
    }
  }
  
  async updateModelTags(modelId: number, tags: string[]): Promise<Model | undefined> {
    try {
      const [updatedModel] = await db.update(models)
        .set({ tags: tags.length > 0 ? tags : null })
        .where(eq(models.id, modelId))
        .returning();
      
      return updatedModel;
    } catch (error) {
      console.error("Error updating model tags:", error);
      return undefined;
    }
  }
}

// Use PostgreSQL storage
export const storage = new PostgresStorage();
