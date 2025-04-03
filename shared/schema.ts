import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Define models table for storing model information
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
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
  shareEmail: text("share_email"), // Email osoby, której udostępniono model
  shareNotificationSent: boolean("share_notification_sent").default(false), // Czy powiadomienie zostało wysłane
  shareLastAccessed: text("share_last_accessed"), // Ostatni dostęp do udostępnionego modelu
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true
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
});

// Define schema for share model request
export const shareModelSchema = z.object({
  modelId: z.number(),
  enableSharing: z.boolean(),
  password: z.string().optional(),
  expiryDate: z.string().optional(),
  email: z.string().email("Nieprawidłowy adres email").optional(),
});

// Define schema for accessing shared model with password
export const accessSharedModelSchema = z.object({
  shareId: z.string(),
  password: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type ModelTree = z.infer<typeof modelTreeSchema>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;
export type ShareModelRequest = z.infer<typeof shareModelSchema>;
export type AccessSharedModelRequest = z.infer<typeof accessSharedModelSchema>;
