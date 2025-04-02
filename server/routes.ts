import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertModelSchema, modelTreeSchema, modelInfoSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import os from "os";

// Configure multer for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), "step-uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only STEP files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.stp' || ext === '.step') {
      cb(null, true);
    } else {
      cb(new Error('Only STEP files are allowed') as any, false);
    }
  }
});

// Simple STEP file parser to extract metadata
function extractStepMetadata(filePath: string): any {
  try {
    // Read first few lines of the file to extract header information
    const header = fs.readFileSync(filePath, 'utf8').slice(0, 5000);
    
    // Very basic parsing - in a real app you'd use a proper STEP parser
    const format = header.includes('AP214') ? 'STEP AP214' : 
                   header.includes('AP203') ? 'STEP AP203' : 'STEP';
    
    const sourceSystemMatch = header.match(/FILE_SCHEMA\s*\(\s*\(\s*'(.+?)'\s*\)/i);
    const sourceSystem = sourceSystemMatch ? sourceSystemMatch[1] : undefined;
    
    // Count entities - this is very simplified
    const parts = 10 + Math.floor(Math.random() * 10); // Would actually parse file
    const assemblies = 2 + Math.floor(Math.random() * 3);
    const surfaces = 100 + Math.floor(Math.random() * 100);
    const solids = 20 + Math.floor(Math.random() * 10);
    
    return {
      format,
      sourceSystem,
      parts,
      assemblies,
      surfaces,
      solids,
      properties: {
        author: "STEP File Author",
        organization: "Organization",
        partNumber: "STEP-" + nanoid(6).toUpperCase(),
        revision: "A"
      }
    };
  } catch (error) {
    console.error("Error parsing STEP file:", error);
    return { format: "Unknown STEP Format" };
  }
}

// Generate a simplified model tree from STEP file
function generateModelTree(filename: string): any {
  // This would normally parse the STEP file to extract the real structure
  // This is just a placeholder to return a mock structure
  const modelId = nanoid(8);
  return {
    id: modelId,
    name: filename,
    type: "model",
    children: [
      {
        id: `${modelId}-assembly-1`,
        name: "Assembly_1",
        type: "assembly",
        children: [
          { id: `${modelId}-part-1`, name: "Part_10032", type: "part" },
          { id: `${modelId}-part-2`, name: "Part_10033", type: "part" },
          { id: `${modelId}-part-3`, name: "Part_10034", type: "part" }
        ]
      },
      {
        id: `${modelId}-assembly-2`,
        name: "Assembly_2",
        type: "assembly",
        children: [
          { id: `${modelId}-part-4`, name: "Part_20021", type: "part" },
          { id: `${modelId}-part-5`, name: "Part_20022", type: "part" }
        ]
      }
    ]
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Upload STEP file
  app.post("/api/models/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const stats = fs.statSync(file.path);
      
      // Extract metadata from the STEP file
      const metadata = extractStepMetadata(file.path);
      
      // Create model record
      const modelData = {
        userId: 1, // In a real app, this would be the logged-in user's ID
        filename: file.originalname,
        filesize: stats.size,
        format: metadata.format,
        created: new Date().toISOString(),
        sourceSystem: metadata.sourceSystem,
        metadata: {
          ...metadata,
          filePath: file.path // Store the file path for later processing
        }
      };
      
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      
      // Return model data
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created
      });
    } catch (error) {
      console.error("Error uploading model:", error);
      res.status(500).json({ message: "Failed to upload model" });
    }
  });

  // Get model info
  app.get("/api/models/:id/info", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      const metadata = model.metadata as any;
      
      const modelInfo = {
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        parts: metadata?.parts,
        assemblies: metadata?.assemblies,
        surfaces: metadata?.surfaces,
        solids: metadata?.solids,
        properties: metadata?.properties
      };
      
      res.json(modelInfoSchema.parse(modelInfo));
    } catch (error) {
      console.error("Error getting model info:", error);
      res.status(500).json({ message: "Failed to get model info" });
    }
  });

  // Get model tree structure
  app.get("/api/models/:id/tree", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Generate a model tree from the STEP file
      const modelTree = generateModelTree(model.filename);
      
      res.json(modelTreeSchema.parse(modelTree));
    } catch (error) {
      console.error("Error getting model tree:", error);
      res.status(500).json({ message: "Failed to get model tree" });
    }
  });

  // Get STEP file for viewing
  app.get("/api/models/:id/file", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      const metadata = model.metadata as any;
      const filePath = metadata?.filePath;
      
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.setHeader('Content-Type', 'application/step');
      res.setHeader('Content-Disposition', `attachment; filename="${model.filename}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error("Error serving model file:", error);
      res.status(500).json({ message: "Failed to serve model file" });
    }
  });

  // Delete model
  app.delete("/api/models/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Delete the file
      const metadata = model.metadata as any;
      const filePath = metadata?.filePath;
      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete the model record
      await storage.deleteModel(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ message: "Failed to delete model" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
