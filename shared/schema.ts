import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Email jest teraz wymagany i używany do logowania
  username: text("username").unique(), // Username jest teraz opcjonalny 
  password: text("password").notNull(),
  fullName: text("full_name"),
  company: text("company"),
  isAdmin: boolean("is_admin").default(false), // Pole określające, czy użytkownik jest administratorem
  isClient: boolean("is_client").default(false), // Pole określające, czy użytkownik jest klientem
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  resetToken: text("reset_token"), // Token do resetowania hasła
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  company: true,
  isAdmin: true,
  isClient: true,
});

// Schema for client registration
export const clientRegistrationSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
  fullName: z.string().min(1, "Imię i nazwisko są wymagane"),
  company: z.string().optional(),
  username: z.string().min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki").optional(),
});

// Schema for client login
export const clientLoginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Define categories table for model classification
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  namePl: text("name_pl").notNull(),
  nameDe: text("name_de").notNull(),
  nameFr: text("name_fr").notNull(),
  nameCs: text("name_cs").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionPl: text("description_pl"),
  descriptionDe: text("description_de"),
  descriptionFr: text("description_fr"),
  descriptionCs: text("description_cs"),
  icon: text("icon"), // Lucide icon name
  color: text("color").default("#3B82F6"), // Hex color for category
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

// Define tags table for flexible tagging system
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  namePl: text("name_pl").notNull(),
  nameDe: text("name_de").notNull(),
  nameFr: text("name_fr").notNull(),
  nameCs: text("name_cs").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),
  color: text("color").default("#6B7280"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

// Junction table for model-tag relationships
export const modelTags = pgTable("model_tags", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define models table for storing model information
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").unique(), // Maskowany identyfikator do użytku w URL-ach
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  format: text("format"),
  created: text("created").notNull(),
  sourceSystem: text("source_system"),
  metadata: jsonb("metadata"), // Zawiera wszystkie dodatkowe dane, w tym ścieżki do plików STL i JSON
  shareId: text("share_id").unique(), // Unikalny identyfikator do udostępniania
  shareEnabled: boolean("share_enabled").default(false), // Czy udostępnianie jest włączone
  sharePassword: text("share_password"), // Opcjonalne hasło do zabezpieczenia pliku (przechowywane jako hash)
  shareExpiryDate: text("share_expiry_date"), // Data wygaśnięcia udostępniania (opcjonalnie)
  shareDeleteToken: text("share_delete_token"), // Unikalny token do usuwania udostępnienia przez użytkownika
  shareEmail: text("share_email"), // Email osoby, której udostępniono model
  shareNotificationSent: boolean("share_notification_sent").default(false), // Czy powiadomienie zostało wysłane
  shareLastAccessed: text("share_last_accessed"), // Ostatni dostęp do udostępnionego modelu
  tags: text("tags").array(), // Tablica tagów dla łatwego wyszukiwania
  categoryId: integer("category_id").references(() => categories.id),
  isPublic: boolean("is_public").default(false), // Czy model jest dostępny w publicznej bibliotece CAD
});

// Define model descriptions table for multilingual descriptions
export const modelDescriptions = pgTable("model_descriptions", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  descriptionEn: text("description_en"),
  descriptionPl: text("description_pl"),
  descriptionCs: text("description_cs"),
  descriptionDe: text("description_de"),
  descriptionFr: text("description_fr"),
  descriptionEs: text("description_es"),
  originalLanguage: text("original_language").notNull(), // Język oryginalnego opisu
  originalDescription: text("original_description").notNull(), // Oryginalny opis użytkownika
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true
});

export const insertModelDescriptionSchema = createInsertSchema(modelDescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define the ModelTree type for the frontend - usztywnione aby uniknąć problemów z rekurencją
export const modelTreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["model", "assembly", "part", "feature"]),
  children: z.array(z.any()).optional(),
  selected: z.boolean().optional(),
});

// Define the ModelInfo type for the frontend
export const modelInfoSchema = z.object({
  filename: z.string(),
  filesize: z.number(),
  format: z.string().optional(),
  created: z.string(),
  sourceSystem: z.string().optional(),
  parts: z.number().optional(),
  assemblies: z.number().optional(),
  surfaces: z.number().optional(),
  solids: z.number().optional(),
  properties: z.record(z.string(), z.string()).optional(),
  // Dodane pola dotyczące udostępniania
  shareEnabled: z.boolean().optional(),
  shareId: z.string().optional(),
  hasPassword: z.boolean().optional(),
  shareEmail: z.string().optional(),
  shareExpiryDate: z.string().optional(),
  shareLastAccessed: z.string().optional(),
  shareDeleteToken: z.string().optional(),
  tags: z.array(z.string()).optional(), // Lista tagów do wyszukiwania
});

// Tabela galerii zdjęć modeli
export const modelGallery = pgTable("model_gallery", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filesize: integer("filesize").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  isThumbnail: boolean("is_thumbnail").default(false).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  s3Key: varchar("s3_key", { length: 500 }),
});

// Relacje dla galerii
export const modelGalleryRelations = relations(modelGallery, ({ one }) => ({
  model: one(models, {
    fields: [modelGallery.modelId],
    references: [models.id],
  }),
}));

// Relations for model descriptions
export const modelDescriptionsRelations = relations(modelDescriptions, ({ one }) => ({
  model: one(models, {
    fields: [modelDescriptions.modelId],
    references: [models.id],
  }),
}));



// Typy dla galerii
export type ModelGalleryImage = typeof modelGallery.$inferSelect;
export type InsertModelGalleryImage = typeof modelGallery.$inferInsert;

// Typy dla opisów modeli
export type ModelDescription = typeof modelDescriptions.$inferSelect;
export type InsertModelDescription = typeof modelDescriptions.$inferInsert;

// Schemat Zod dla galerii
export const insertModelGallerySchema = createInsertSchema(modelGallery);
export const selectModelGallerySchema = createInsertSchema(modelGallery);

// Schemat danych użytkownika do rejestracji podczas udostępniania
export const userDataSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  fullName: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email("Nieprawidłowy adres email").optional(),
});

// Define schema for share model request
export const shareModelSchema = z.object({
  modelId: z.number(),
  enableSharing: z.boolean(),
  password: z.string().optional(),
  expiryDate: z.string().optional(),
  email: z.string().email("Nieprawidłowy adres email").optional(),
  language: z.string().optional(), // Język używany do wiadomości e-mail
  createAccount: z.boolean().optional(), // Czy utworzyć konto podczas udostępniania
  userData: userDataSchema.optional(), // Dane użytkownika do rejestracji podczas udostępniania
});

// Define schema for accessing shared model with password
export const accessSharedModelSchema = z.object({
  shareId: z.string(),
  password: z.string().optional(),
});

// Define schema for admin login
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Nazwa użytkownika jest wymagana"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Define table for model view statistics
export const modelViews = pgTable("model_views", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id).notNull(),
  shareId: text("share_id"), // Może być null jeśli wyświetlenie nastąpiło przez standardowy dostęp
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  authenticated: boolean("authenticated").default(false), // Czy użytkownik przeszedł uwierzytelnienie (np. hasło)
});

export const insertModelViewSchema = createInsertSchema(modelViews).omit({
  id: true,
});

// Schema for view statistics response
export const modelViewStatsSchema = z.object({
  totalViews: z.union([z.number(), z.string()]).transform(val => Number(val)),
  uniqueIPs: z.union([z.number(), z.string()]).transform(val => Number(val)),  // Uwaga: zmienione na 'uniqueIPs' dla spójności z UI
  firstView: z.string().optional(),
  lastView: z.string().optional(),
  viewDetails: z.array(z.object({
    ipAddress: z.string(),
    userAgent: z.string().optional(),
    viewedAt: z.string(),
    authenticated: z.boolean().optional(),
  })),
  ipAddresses: z.array(z.object({
    address: z.string(),
    count: z.union([z.number(), z.string()]).transform(val => Number(val)),
    lastView: z.string().optional(),
  })).optional(),
  browserStats: z.array(z.object({
    name: z.string(),
    count: z.union([z.number(), z.string()]).transform(val => Number(val)),
  })).optional(),
});

// Define schemas for client functionality
export const clientPasswordChangeSchema = z.object({
  oldPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
  newPassword: z.string().min(6, "Nowe hasło musi mieć co najmniej 6 znaków"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, "Nowe hasło musi mieć co najmniej 6 znaków"),
});

// Define schema for changing shared model settings
export const updateSharedModelSchema = z.object({
  modelId: z.number(),
  password: z.string().optional(),
  expiryDate: z.string().optional(),
});

// Define schema for updating model tags
export const updateModelTagsSchema = z.object({
  modelId: z.number(),
  tags: z.array(z.string()),
});

// Define schema for searching library models
export const searchLibrarySchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ClientRegistration = z.infer<typeof clientRegistrationSchema>;
export type ClientLogin = z.infer<typeof clientLoginSchema>;
export type ClientPasswordChange = z.infer<typeof clientPasswordChangeSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type UpdateSharedModel = z.infer<typeof updateSharedModelSchema>;
export type UpdateModelTags = z.infer<typeof updateModelTagsSchema>;
export type SearchLibrary = z.infer<typeof searchLibrarySchema>;
// Definicje typów metadanych dla różnych rodzajów modeli
export const stlModelMetadataSchema = z.object({
  filePath: z.string(),
  stlFilePath: z.string(),
  s3Key: z.string().nullable(), // Klucz S3 dla plików przechowywanych w chmurze
  isDirectStl: z.boolean().default(false),
  stlFormat: z.string().default('unknown'),
  parts: z.number(),
  assemblies: z.number(),
  surfaces: z.number(),
  solids: z.number(),
  userEmail: z.string().nullable(),
  properties: z.object({
    author: z.string(),
    organization: z.string(),
    partNumber: z.string(),
    revision: z.string()
  }),
  viewToken: z.string().optional() // Token dostępu dla niezalogowanych użytkowników
});

export const cadModelMetadataSchema = z.object({
  filePath: z.string(),
  fileType: z.string(),
  cadFormat: z.string(),
  entities: z.number(),
  layers: z.number(),
  userEmail: z.string().nullable(),
  properties: z.object({
    author: z.string(),
    organization: z.string(),
    drawingNumber: z.string(),
    revision: z.string()
  }),
  viewToken: z.string().optional() // Token dostępu dla niezalogowanych użytkowników
});

export type ModelView = typeof modelViews.$inferSelect;
export type InsertModelView = z.infer<typeof insertModelViewSchema>;
export type ModelTree = z.infer<typeof modelTreeSchema>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;
export type ShareModelRequest = z.infer<typeof shareModelSchema>;
export type AccessSharedModelRequest = z.infer<typeof accessSharedModelSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
export type ModelViewStats = z.infer<typeof modelViewStatsSchema>;
export type UserData = z.infer<typeof userDataSchema>;
export type StlModelMetadata = z.infer<typeof stlModelMetadataSchema>;
export type CadModelMetadata = z.infer<typeof cadModelMetadataSchema>;

// Relations for categories, tags, and models
export const categoriesRelations = relations(categories, ({ many }) => ({
  models: many(models),
  tags: many(tags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  category: one(categories, {
    fields: [tags.categoryId],
    references: [categories.id],
  }),
  modelTags: many(modelTags),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  user: one(users, {
    fields: [models.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [models.categoryId],
    references: [categories.id],
  }),
  description: one(modelDescriptions, {
    fields: [models.id],
    references: [modelDescriptions.modelId],
  }),
  modelTags: many(modelTags),
  gallery: many(modelGallery),
  views: many(modelViews),
}));

export const modelTagsRelations = relations(modelTags, ({ one }) => ({
  model: one(models, {
    fields: [modelTags.modelId],
    references: [models.id],
  }),
  tag: one(tags, {
    fields: [modelTags.tagId],
    references: [tags.id],
  }),
}));

// Types for categories and tags
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type ModelTag = typeof modelTags.$inferSelect;
