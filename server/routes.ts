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
import { exec } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules compatibility (replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const stepUpload = multer({
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

// Configure multer for STL file uploads
const stlUpload = multer({
  dest: path.join(os.tmpdir(), "stl-uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only STL files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.stl') {
      cb(null, true);
    } else {
      cb(new Error('Only STL files are allowed') as any, false);
    }
  }
});

// Simple STEP file parser to extract metadata
function extractStepMetadata(filePath: string): any {
  try {
    // Read first few lines of the file to extract header information
    const header = fs.readFileSync(filePath, 'utf8').slice(0, 8000);
    
    // Parsing STEP file header
    const formatMatch = header.match(/FILE_SCHEMA\s*\(\s*\(\s*'(.+?)'/i);
    const format = formatMatch 
                   ? formatMatch[1].includes('AP214') ? 'STEP AP214'
                   : formatMatch[1].includes('AP203') ? 'STEP AP203'
                   : formatMatch[1].includes('AP242') ? 'STEP AP242'
                   : 'STEP'
                   : 'STEP';
    
    const sourceSystemMatch = header.match(/originating_system\s*\>\s*'(.+?)'/i);
    const sourceSystem = sourceSystemMatch ? sourceSystemMatch[1] : 'Unknown';
    
    // Extract more information if available
    const authorMatch = header.match(/author\s*\>\s*\(\s*'(.+?)'\s*\)/i);
    const author = authorMatch && authorMatch[1] ? authorMatch[1] : 'Unknown';
    
    const organizationMatch = header.match(/organization\s*\>\s*\(\s*'(.+?)'\s*\)/i);
    const organization = organizationMatch && organizationMatch[1] ? organizationMatch[1] : 'Unknown';
    
    // Counting entities more reliably
    // These are simplified estimates based on file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const partMatches = fileContent.match(/MANIFOLD_SOLID_BREP/g) || [];
    const parts = partMatches.length > 0 ? partMatches.length : 5;
    
    const assemblyMatches = fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE/g) || [];
    const assemblies = assemblyMatches.length > 0 ? assemblyMatches.length : 2;
    
    const surfaceMatches = fileContent.match(/B_SPLINE_SURFACE/g) || [];
    const surfaces = surfaceMatches.length > 0 ? surfaceMatches.length : 10;
    
    const solidMatches = fileContent.match(/BREP_WITH_VOIDS|MANIFOLD_SOLID_BREP/g) || [];
    const solids = solidMatches.length > 0 ? solidMatches.length : 5;
    
    return {
      format,
      sourceSystem,
      parts,
      assemblies,
      surfaces,
      solids,
      properties: {
        author,
        organization,
        partNumber: "STEP-" + nanoid(6).toUpperCase(),
        revision: "A"
      }
    };
  } catch (error) {
    console.error("Error parsing STEP file:", error);
    return { 
      format: "Unknown STEP Format",
      sourceSystem: "Unknown",
      parts: 1,
      assemblies: 1,
      surfaces: 1,
      solids: 1,
      properties: {
        author: "Unknown",
        organization: "Unknown",
        partNumber: "STEP-" + nanoid(6).toUpperCase(),
        revision: "A"
      }
    };
  }
}

// Konwertuj plik STEP do formatu STL przy użyciu skryptu FreeCAD
// Zastępca dla funkcji konwertującej STEP do STL
// Ponieważ nie mamy dostępu do FreeCAD, używamy silnika JavaScript do renderowania
async function convertStepToStl(stepFilePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(stepFilePath)) {
        console.error("STEP file does not exist:", stepFilePath);
        return resolve(null);
      }
      
      // Tutaj w normalnych warunkach wykonalibyśmy faktyczną konwersję
      // Bez dostępu do FreeCAD, zwracamy null i zdajemy się na bezpośrednie parsowanie
      // pliku STEP przez silnik JavaScript w przeglądarce
      console.log(`Skip conversion: FreeCAD not available. Will use direct STEP parsing.`);
      
      // Symulujemy opóźnienie konwersji
      setTimeout(() => {
        resolve(null);
      }, 500);
    } catch (error) {
      console.error("Error in convertStepToStl:", error);
      resolve(null);
    }
  });
}

// Generate a model tree from STEP file
function generateModelTree(filename: string, filePath?: string): any {
  try {
    const modelId = nanoid(8);
    
    // If we have a file path, try to extract a more meaningful structure
    if (filePath && fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Simplified extraction of assembly and part names
      // Look for product definitions in STEP file
      const assemblyMatches = fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/g) || [];
      const assemblies = assemblyMatches.map(match => {
        const name = match.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/);
        return name ? name[1] : `Assembly_${nanoid(4)}`;
      });
      
      // Look for solid breps that often represent parts
      const partMatches = fileContent.match(/MANIFOLD_SOLID_BREP\('([^']+)'/g) || [];
      const parts = partMatches.map(match => {
        const name = match.match(/MANIFOLD_SOLID_BREP\('([^']+)'/);
        return name ? name[1] : `Part_${nanoid(4)}`;
      });
      
      // If we found meaningful structures, build a tree
      if (assemblies.length > 0 || parts.length > 0) {
        const tree = {
          id: modelId,
          name: filename,
          type: "model",
          children: [] as any[]
        };
        
        // Add assemblies first
        assemblies.forEach((assembly, index) => {
          const assemblyNode = {
            id: `${modelId}-assembly-${index + 1}`,
            name: assembly,
            type: "assembly",
            children: [] as any[]
          };
          
          // Assign some parts to each assembly
          const partsPerAssembly = Math.max(1, Math.floor(parts.length / (assemblies.length || 1)));
          const startIdx = index * partsPerAssembly;
          const endIdx = Math.min(startIdx + partsPerAssembly, parts.length);
          
          for (let i = startIdx; i < endIdx; i++) {
            assemblyNode.children.push({
              id: `${modelId}-part-${i + 1}`,
              name: parts[i],
              type: "part"
            });
          }
          
          tree.children.push(assemblyNode);
        });
        
        // If there are no assemblies, add parts directly to the root
        if (assemblies.length === 0 && parts.length > 0) {
          parts.forEach((part, index) => {
            tree.children.push({
              id: `${modelId}-part-${index + 1}`,
              name: part,
              type: "part"
            });
          });
        }
        
        return tree;
      }
    }
    
    // Fallback to a default structure if parsing failed or no file path
    return {
      id: modelId,
      name: filename,
      type: "model",
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: "Main Assembly",
          type: "assembly",
          children: [
            { id: `${modelId}-part-1`, name: "Component_1", type: "part" },
            { id: `${modelId}-part-2`, name: "Component_2", type: "part" },
            { id: `${modelId}-part-3`, name: "Component_3", type: "part" }
          ]
        }
      ]
    };
  } catch (error) {
    console.error("Error generating model tree:", error);
    
    // Return a minimal tree on error
    const modelId = nanoid(8);
    return {
      id: modelId,
      name: filename,
      type: "model",
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: "Assembly",
          type: "assembly",
          children: [
            { id: `${modelId}-part-1`, name: "Part_1", type: "part" }
          ]
        }
      ]
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Get all models
  app.get("/api/models", async (req: Request, res: Response) => {
    try {
      const models = await storage.getModels();
      
      // Zwróć tylko podstawowe informacje o modelach
      const modelsList = models.map(model => ({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        conversionStatus: (model.metadata as any)?.conversionStatus || 'unknown'
      }));
      
      res.json(modelsList);
    } catch (error) {
      console.error("Error getting models list:", error);
      res.status(500).json({ message: "Failed to get models list" });
    }
  });

  // Upload STEP file
  app.post("/api/models/upload", stepUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const stats = fs.statSync(file.path);
      
      // Extract metadata from the STEP file
      const metadata = extractStepMetadata(file.path);
      
      // Create initial model record
      const modelData = {
        userId: 1, // We now have a user with ID 1 in the database
        filename: file.originalname,
        filesize: stats.size,
        format: metadata.format,
        created: new Date().toISOString(),
        sourceSystem: metadata.sourceSystem,
        metadata: {
          ...metadata,
          filePath: file.path, // Store the file path for later processing
          conversionStatus: 'pending'
        }
      };
      
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      
      // Return model data immediately
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created
      });
      
      // Konwersja STEP do STL w tle, bez blokowania odpowiedzi
      (async () => {
        try {
          console.log(`Starting background conversion for model ID ${model.id}`);
          
          // Konwertuj plik STEP do STL
          const stlFilePath = await convertStepToStl(file.path);
          
          // Zaktualizuj rekord modelu o ścieżkę do pliku STL i status konwersji
          if (stlFilePath && fs.existsSync(stlFilePath)) {
            const updatedMetadata = {
              ...model.metadata as object,
              stlFilePath,
              conversionStatus: 'completed',
              conversionTime: new Date().toISOString()
            };
            
            await storage.updateModel(model.id, {
              metadata: updatedMetadata
            });
            
            console.log(`Conversion completed successfully for model ID ${model.id}`);
          } else {
            // Konwersja nie powiodła się
            const updatedMetadata = {
              ...model.metadata as object,
              conversionStatus: 'failed',
              conversionError: 'STL file was not created'
            };
            
            await storage.updateModel(model.id, {
              metadata: updatedMetadata
            });
            
            console.error(`Conversion failed for model ID ${model.id}`);
          }
        } catch (error) {
          console.error(`Error in background conversion for model ID ${model.id}:`, error);
          
          // Oznacz konwersję jako nieudaną
          const updatedMetadata = {
            ...model.metadata as object,
            conversionStatus: 'failed',
            conversionError: error instanceof Error ? error.message : 'Unknown error'
          };
          
          await storage.updateModel(model.id, {
            metadata: updatedMetadata
          });
        }
      })();
    } catch (error) {
      console.error("Error uploading model:", error);
      res.status(500).json({ message: "Failed to upload model" });
    }
  });

  // Get model basic data
  app.get("/api/models/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      res.json(model);
    } catch (error) {
      console.error("Error getting model:", error);
      res.status(500).json({ message: "Failed to get model" });
    }
  });

  // Get model detailed info
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
      const metadata = model.metadata as any;
      const filePath = metadata?.filePath;
      const modelTree = generateModelTree(model.filename, filePath);
      
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
  
  // Get STL file for 3D viewing (if converted)
  app.get("/api/models/:id/stl", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      const metadata = model.metadata as any;
      const stlFilePath = metadata?.stlFilePath;
      
      // Sprawdź czy istnieje plik STL
      if (!stlFilePath || !fs.existsSync(stlFilePath)) {
        return res.status(404).json({ message: "STL file not found" });
      }
      
      // Ustaw nagłówki dla pliku STL
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(model.filename, path.extname(model.filename))}.stl"`);
      
      // Wyślij plik jako strumień
      fs.createReadStream(stlFilePath).pipe(res);
    } catch (error) {
      console.error("Error serving STL file:", error);
      res.status(500).json({ message: "Failed to serve STL file" });
    }
  });

  // Upload STL file directly (for testing)
  app.post("/api/models/upload-stl", stlUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const stats = fs.statSync(file.path);
      
      // Create model record directly for the STL file
      const modelData = {
        userId: 1, // We now have a user with ID 1 in the database
        filename: file.originalname,
        filesize: stats.size,
        format: 'STL',
        created: new Date().toISOString(),
        sourceSystem: 'direct_upload',
        metadata: {
          filePath: file.path,
          stlFilePath: file.path, // For STL direct upload, the original file is also the STL file
          isDirectStl: true,
          parts: 1,
          assemblies: 1,
          surfaces: 10,
          solids: 1,
          properties: {
            author: "User",
            organization: "Direct Upload",
            partNumber: "STL-" + nanoid(6).toUpperCase(),
            revision: "A"
          }
        }
      };
      
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        isStl: true
      });
    } catch (error) {
      console.error("Error uploading STL model:", error);
      res.status(500).json({ message: "Failed to upload STL model" });
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
      
      // Delete the STEP file
      const metadata = model.metadata as any;
      const filePath = metadata?.filePath;
      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted STEP file: ${filePath}`);
      }
      
      // Delete the STL file if it exists
      const stlFilePath = metadata?.stlFilePath;
      if (stlFilePath && fs.existsSync(stlFilePath)) {
        fs.unlinkSync(stlFilePath);
        console.log(`Deleted STL file: ${stlFilePath}`);
      }
      
      // Delete any JSON info file that might have been created
      const jsonFilePath = stlFilePath ? path.join(
        path.dirname(stlFilePath),
        `${path.basename(stlFilePath, '.stl')}.json`
      ) : null;
      
      if (jsonFilePath && fs.existsSync(jsonFilePath)) {
        fs.unlinkSync(jsonFilePath);
        console.log(`Deleted JSON info file: ${jsonFilePath}`);
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
