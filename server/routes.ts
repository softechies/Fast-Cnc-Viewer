import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertModelSchema, modelTreeSchema, modelInfoSchema, shareModelSchema, accessSharedModelSchema, type Model } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import os from "os";
import { exec } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import util from "util";
import bcrypt from "bcryptjs";
import { initializeEmailService, sendShareNotification as sendNodemailerNotification, sendSharingRevokedNotification as sendNodemailerRevokedNotification, detectLanguage } from "./email";
import type { Language } from "../client/src/lib/translations";
import { initializeCustomSmtpService, sendShareNotificationSmtp, sendSharingRevokedNotificationSmtp } from "./custom-smtp";

// ES modules compatibility (replacement for __dirname)
const execPromise = util.promisify(exec);

// Funkcja do konwersji pliku DXF do SVG
async function convertDxfToSvg(dxfFilePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(dxfFilePath)) {
      console.error("DXF file does not exist:", dxfFilePath);
      return null;
    }
    
    const pythonScript = path.join(__dirname, 'dxf_converter.py');
    if (!fs.existsSync(pythonScript)) {
      console.error("DXF converter script not found:", pythonScript);
      return null;
    }
    
    // Utwórz tymczasowy plik dla SVG
    const tempSvgPath = path.join(os.tmpdir(), `${path.parse(dxfFilePath).name}_${Date.now()}.svg`);
    
    try {
      // Uruchom skrypt Pythona do konwersji DXF na SVG z zapisem do pliku
      await execPromise(`python3 "${pythonScript}" "${dxfFilePath}" svg "${tempSvgPath}"`);
      
      // Sprawdź czy plik SVG został utworzony
      if (fs.existsSync(tempSvgPath)) {
        // Odczytaj plik SVG
        const svgContent = fs.readFileSync(tempSvgPath, 'utf8');
        
        // Usuń plik tymczasowy
        try { fs.unlinkSync(tempSvgPath); } catch (e) { /* ignore */ }
        
        if (svgContent) {
          return svgContent;
        } else {
          console.error("Empty SVG file created");
          return null;
        }
      } else {
        console.error("SVG file was not created");
        return null;
      }
    } catch (error) {
      console.error("Error executing DXF to SVG conversion:", error);
      
      // Sprawdź czy istnieje plik debugowania
      const debugLogPath = '/tmp/dxf_debug.log';
      let debugInfo = "";
      
      if (fs.existsSync(debugLogPath)) {
        try {
          debugInfo = fs.readFileSync(debugLogPath, 'utf8');
          debugInfo = debugInfo.split('\n').slice(-5).join('\n'); // Ostatnie 5 linii
        } catch (e) { /* ignore */ }
      }
      
      // Zwróć podstawowy SVG z informacją o błędzie
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
          <rect width="400" height="200" fill="#f8f8f8" />
          <text x="50" y="80" font-family="Arial" font-size="16" fill="red">Error converting DXF to SVG</text>
          <text x="50" y="110" font-family="Arial" font-size="12">${error instanceof Error ? error.message : "Unknown error"}</text>
          ${debugInfo ? `<text x="50" y="130" font-family="Arial" font-size="10" fill="#666">Debug: ${debugInfo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>` : ''}
        </svg>
      `;
    }
  } catch (error) {
    console.error("Error in convertDxfToSvg:", error);
    return null;
  }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const stepUpload = multer({
  dest: path.join(os.tmpdir(), "step-uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept STEP and IGES files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.stp' || ext === '.step' || ext === '.igs' || ext === '.iges') {
      cb(null, true);
    } else {
      cb(new Error('Only STEP and IGES files are allowed') as any, false);
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

// Configure multer for 2D CAD file uploads (DXF/DWG)
const cadUpload = multer({
  dest: path.join(os.tmpdir(), "cad-uploads"),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only DXF/DWG files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.dxf' || ext === '.dwg') {
      cb(null, true);
    } else {
      cb(new Error('Only DXF or DWG files are allowed') as any, false);
    }
  }
});

// Extracts metadata from STEP or IGES files
function extractStepMetadata(filePath: string): any {
  try {
    // Read first few lines of the file to extract header information
    const header = fs.readFileSync(filePath, 'utf8').slice(0, 8000);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Determine if it's an IGES file
    const isIges = fileExt === '.igs' || fileExt === '.iges';
    
    // Default format based on file extension
    let format = isIges ? 'IGES' : 'STEP';
    let sourceSystem = 'Unknown';
    let author = 'Unknown';
    let organization = 'Unknown';
    
    if (isIges) {
      // IGES format parsing
      const igesStartMatch = header.match(/S\s+([^;]+);/);
      const igesSystemMatch = header.match(/,[^,]*,([^,]*),/);
      
      if (igesSystemMatch && igesSystemMatch[1]) {
        sourceSystem = igesSystemMatch[1].trim();
      }
      
      // Look for author in IGES header
      const authorMatch = header.match(/AUTHOR:?\s*([^,]+)/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1].trim();
      }
      
      // Look for organization in IGES header
      const orgMatch = header.match(/ORGANIZATION:?\s*([^,]+)/i);
      if (orgMatch && orgMatch[1]) {
        organization = orgMatch[1].trim();
      }
    } else {
      // STEP file parsing
      const formatMatch = header.match(/FILE_SCHEMA\s*\(\s*\(\s*'(.+?)'/i);
      format = formatMatch 
              ? formatMatch[1].includes('AP214') ? 'STEP AP214'
              : formatMatch[1].includes('AP203') ? 'STEP AP203'
              : formatMatch[1].includes('AP242') ? 'STEP AP242'
              : 'STEP'
              : 'STEP';
      
      const sourceSystemMatch = header.match(/originating_system\s*\>\s*'(.+?)'/i);
      if (sourceSystemMatch) {
        sourceSystem = sourceSystemMatch[1];
      }
      
      // Extract more information if available
      const authorMatch = header.match(/author\s*\>\s*\(\s*'(.+?)'\s*\)/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1];
      }
      
      const organizationMatch = header.match(/organization\s*\>\s*\(\s*'(.+?)'\s*\)/i);
      if (organizationMatch && organizationMatch[1]) {
        organization = organizationMatch[1];
      }
    }
    
    // Counting entities - works for both formats with different patterns
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Patterns to search for in both formats
    const partMatches = isIges
      ? fileContent.match(/(\d+)0\s+0\s+1\s+1/g) || [] // IGES entity pattern
      : fileContent.match(/MANIFOLD_SOLID_BREP/g) || [];
    const parts = partMatches.length > 0 ? partMatches.length : 5;
    
    const assemblyMatches = isIges
      ? fileContent.match(/(\d+)0\s+0\s+1\s+2/g) || []
      : fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE/g) || [];
    const assemblies = assemblyMatches.length > 0 ? assemblyMatches.length : 2;
    
    const surfaceMatches = isIges
      ? fileContent.match(/(\d+)0\s+0\s+1\s+(128|144)/g) || [] // IGES surface entities
      : fileContent.match(/B_SPLINE_SURFACE/g) || [];
    const surfaces = surfaceMatches.length > 0 ? surfaceMatches.length : 10;
    
    const solidMatches = isIges
      ? fileContent.match(/(\d+)0\s+0\s+1\s+(186|514)/g) || [] // IGES solid entities
      : fileContent.match(/BREP_WITH_VOIDS|MANIFOLD_SOLID_BREP/g) || [];
    const solids = solidMatches.length > 0 ? solidMatches.length : 5;
    
    // Generate a unique part number prefix based on format
    const partNumberPrefix = isIges ? "IGES-" : "STEP-";
    
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
        partNumber: partNumberPrefix + nanoid(6).toUpperCase(),
        revision: "A"
      }
    };
  } catch (error) {
    console.error("Error parsing CAD file:", error);
    
    // Check if it's an IGES file based on file extension
    const fileExt = path.extname(filePath).toLowerCase();
    const isIges = fileExt === '.igs' || fileExt === '.iges';
    const format = isIges ? "IGES" : "Unknown STEP Format";
    const partNumberPrefix = isIges ? "IGES-" : "STEP-";
    
    return { 
      format,
      sourceSystem: "Unknown",
      parts: 1,
      assemblies: 1,
      surfaces: 1,
      solids: 1,
      properties: {
        author: "Unknown",
        organization: "Unknown",
        partNumber: partNumberPrefix + nanoid(6).toUpperCase(),
        revision: "A"
      }
    };
  }
}

// Konwertuj plik STEP/IGES do formatu STL przy użyciu skryptu FreeCAD
// Zastępca dla funkcji konwertującej STEP/IGES do STL
// Ponieważ nie mamy dostępu do FreeCAD, używamy silnika JavaScript do renderowania
async function convertStepToStl(filePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error("CAD file does not exist:", filePath);
        return resolve(null);
      }
      
      // Sprawdź rozszerzenie pliku
      const fileExt = path.extname(filePath).toLowerCase();
      const isIges = fileExt === '.igs' || fileExt === '.iges';
      const fileType = isIges ? "IGES" : "STEP";
      
      // Tutaj w normalnych warunkach wykonalibyśmy faktyczną konwersję
      // Bez dostępu do FreeCAD, zwracamy null i zdajemy się na bezpośrednie parsowanie
      // pliku przez silnik JavaScript w przeglądarce
      console.log(`Skip conversion: FreeCAD not available. Will use direct ${fileType} parsing.`);
      
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

// Generate a model tree from STEP or IGES file
function generateModelTree(filename: string, filePath?: string): any {
  try {
    const modelId = nanoid(8);
    
    // If we have a file path, try to extract a more meaningful structure
    if (filePath && fs.existsSync(filePath)) {
      const fileExt = path.extname(filePath).toLowerCase();
      const isIges = fileExt === '.igs' || fileExt === '.iges';
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      let assemblies: string[] = [];
      let parts: string[] = [];
      
      if (isIges) {
        // IGES file format handling
        // IGES entities in the directory entry section
        const directoryEntries = fileContent.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+/gm) || [];
        
        // Extract entity names
        const entityMatches = fileContent.match(/([A-Z0-9_]+)\s+ENTITY\s+(\d+)/g) || [];
        parts = entityMatches.map((match, index) => {
          const name = match.match(/([A-Z0-9_]+)\s+ENTITY/);
          return name ? name[1] : `Part_${index + 1}`;
        });
        
        // If not enough parts found, use generic naming
        if (parts.length < 3) {
          parts = [];
          for (let i = 0; i < Math.min(directoryEntries.length, 10); i++) {
            parts.push(`Part_${i + 1}`);
          }
        }
        
        // For IGES, usually there is just one assembly containing all parts
        assemblies = ['Main Assembly'];
      } else {
        // STEP file parsing (existing code)
        // Simplified extraction of assembly and part names
        // Look for product definitions in STEP file
        const assemblyMatches = fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/g) || [];
        assemblies = assemblyMatches.map(match => {
          const name = match.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/);
          return name ? name[1] : `Assembly_${nanoid(4)}`;
        });
        
        // Look for solid breps that often represent parts
        const partMatches = fileContent.match(/MANIFOLD_SOLID_BREP\('([^']+)'/g) || [];
        parts = partMatches.map(match => {
          const name = match.match(/MANIFOLD_SOLID_BREP\('([^']+)'/);
          return name ? name[1] : `Part_${nanoid(4)}`;
        });
      }
      
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
  // Inicjalizacja usług e-mail
  try {
    // Inicjalizujemy podstawowy serwis Nodemailer (Ethereal) - tylko do testów
    await initializeEmailService();
    
    // Sprawdzamy czy możemy zainicjalizować własny serwer SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const smtpInitialized = initializeCustomSmtpService({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM
      });
      
      if (smtpInitialized) {
        console.log("Custom SMTP email service initialized successfully");
      }
    } else {
      console.warn("No custom SMTP credentials provided, email notifications will use test service only");
    }
  } catch (error) {
    console.error("Failed to initialize email services, sharing notifications will not work correctly:", error);
  }

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
        properties: metadata?.properties,
        // Dodane informacje o udostępnianiu
        shareEnabled: model.shareEnabled || false,
        shareId: model.shareId,
        hasPassword: !!model.sharePassword
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

  // Get STEP/IGES file for viewing
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
      
      // Ustaw odpowiedni Content-Type na podstawie formatu pliku
      const fileExt = path.extname(filePath).toLowerCase();
      const isIges = fileExt === '.igs' || fileExt === '.iges';
      
      if (isIges) {
        res.setHeader('Content-Type', 'application/iges');
      } else {
        res.setHeader('Content-Type', 'application/step');
      }
      
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
  
  // Konwertowanie pliku DXF do formatu SVG i zwracanie wyniku
  app.get("/api/models/:id/svg", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Sprawdź czy model jest w formacie DXF
      if (model.format !== 'DXF' && model.format !== 'DWG') {
        return res.status(400).json({ 
          message: "SVG conversion is only available for DXF/DWG files",
          format: model.format
        });
      }
      
      const metadata = model.metadata as any;
      
      // Sprawdź czy mamy ścieżkę do pliku DXF
      if (!metadata?.filePath || !fs.existsSync(metadata.filePath)) {
        return res.status(404).json({ message: "DXF file not found" });
      }
      
      // Konwertuj DXF do SVG
      const svgContent = await convertDxfToSvg(metadata.filePath);
      
      if (!svgContent) {
        return res.status(500).json({ message: "Failed to convert DXF to SVG" });
      }
      
      // Ustaw nagłówki dla SVG
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgContent);
      
    } catch (error) {
      console.error("Error converting DXF to SVG:", error);
      res.status(500).json({ message: "Failed to convert DXF to SVG" });
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

  // Upload DXF/DWG file
  app.post("/api/models/upload-cad", cadUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const stats = fs.statSync(file.path);
      
      // Determine file format based on extension
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const format = fileExtension === '.dxf' ? 'DXF' : 'DWG';
      
      // Create model record for 2D CAD file
      const modelData = {
        userId: 1,
        filename: file.originalname,
        filesize: stats.size,
        format: format,
        created: new Date().toISOString(),
        sourceSystem: 'direct_upload',
        metadata: {
          filePath: file.path,
          fileType: '2d',
          cadFormat: format.toLowerCase(),
          entities: 0, // To be determined by the renderer
          layers: 0,  // To be determined by the renderer
          properties: {
            author: "User",
            organization: "Direct Upload",
            drawingNumber: format + "-" + nanoid(6).toUpperCase(),
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
        is2D: true
      });
    } catch (error) {
      console.error("Error uploading CAD model:", error);
      res.status(500).json({ message: "Failed to upload CAD model" });
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
      
      // Delete the CAD file (STEP/IGES)
      const metadata = model.metadata as any;
      const filePath = metadata?.filePath;
      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        const fileExt = path.extname(filePath).toLowerCase();
        const isIges = fileExt === '.igs' || fileExt === '.iges';
        const fileType = isIges ? "IGES" : "STEP";
        console.log(`Deleted ${fileType} file: ${filePath}`);
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

  // Endpoint do udostępniania modelu
  app.post("/api/models/:id/share", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      
      // Walidacja danych wejściowych
      const shareData = shareModelSchema.parse(req.body);
      
      // Pobierz model
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Generowanie unikalnego ID udostępniania
      let shareId = model.shareId;
      
      // Sprawdź czy potrzebujemy wysłać powiadomienie o wycofaniu udostępnienia
      const needsRevocationEmail = model.shareEnabled && 
                                  !shareData.enableSharing && 
                                  model.shareEmail;
                                  
      // Jeśli włączamy udostępnianie i nie ma jeszcze shareId, generujemy nowy
      if (shareData.enableSharing && !shareId) {
        shareId = nanoid(10); // Generuj 10-znakowy identyfikator
      }
      
      // Hashowanie hasła, jeśli zostało podane
      let sharePassword = null;
      if (shareData.password) {
        sharePassword = await bcrypt.hash(shareData.password, 10);
      }
      
      // Przygotuj aktualizację modelu
      const updateData: Partial<Model> = {
        shareId: shareId,
        shareEnabled: shareData.enableSharing,
        sharePassword: sharePassword,
        shareExpiryDate: shareData.expiryDate
      };
      
      // Jeśli podano adres email, zapisz go
      if (shareData.email) {
        updateData.shareEmail = shareData.email;
        updateData.shareNotificationSent = false; // Reset statusu powiadomienia
      }
      
      // Aktualizacja modelu
      const updatedModel = await storage.updateModel(id, updateData);
      
      // Jeśli włączono udostępnianie i podano adres email, wyślij powiadomienie
      if (shareData.enableSharing && shareData.email) {
        try {
          // Ustal baseUrl na podstawie żądania
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers['host'] || 'localhost:3000';
          const baseUrl = `${protocol}://${host}`;
          
          // Użyj języka przekazanego z frontendu lub wykryj na podstawie nagłówka Accept-Language
          const userLanguage = (shareData.language as Language) || detectLanguage(req.headers['accept-language']);
          console.log(`Using language for email: ${userLanguage} (${shareData.language ? 'from frontend' : 'from browser header'})`);
          
          // Wyślij e-mail z powiadomieniem - próbuj własny SMTP, a potem Nodemailer jako fallback
          let emailSent = false;
          
          // Najpierw spróbuj własny serwer SMTP (jeśli skonfigurowany)
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            emailSent = await sendShareNotificationSmtp(
              updatedModel!, 
              shareData.email, 
              baseUrl,
              shareData.password, // Przekazujemy niezahashowane hasło
              userLanguage // Przekazujemy wykryty język użytkownika
            );
            
            if (emailSent) {
              console.log(`Share notification email sent via custom SMTP to ${shareData.email} in ${userLanguage}`);
            } else {
              console.warn("Custom SMTP email failed, trying Nodemailer fallback");
            }
          }
          
          // Jako ostatnią opcję, użyj Nodemailer z Ethereal
          if (!emailSent) {
            emailSent = await sendNodemailerNotification(
              updatedModel!, 
              shareData.email, 
              baseUrl,
              shareData.password
            );
            
            if (emailSent) {
              console.log(`Share notification email sent via Nodemailer to ${shareData.email}`);
            }
          }
          
          if (emailSent) {
            // Zaktualizuj status wysłania powiadomienia
            await storage.updateModel(id, { shareNotificationSent: true });
            console.log(`Share notification email sent to ${shareData.email}`);
          } else {
            console.error(`Failed to send share notification email to ${shareData.email}`);
          }
        } catch (emailError) {
          console.error("Error sending share notification email:", emailError);
          // Nie przerywamy procesu, jeśli e-mail nie został wysłany
        }
      } else if (needsRevocationEmail) {
        // Wyślij powiadomienie o wycofaniu udostępnienia
        try {
          // Próbuj wysłać przez własny SMTP, a potem przez Nodemailer
          let revocationSent = false;
          
          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language']);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          
          // Najpierw spróbuj własny serwer SMTP (jeśli skonfigurowany)
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model, 
              model.shareEmail!,
              userLanguage // Przekazujemy wykryty język użytkownika
            );
            
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else {
              console.warn("Custom SMTP email failed, trying Nodemailer fallback");
            }
          }
          
          // Jako ostatnią opcję, spróbuj Nodemailer
          if (!revocationSent) {
            revocationSent = await sendNodemailerRevokedNotification(model, model.shareEmail!);
            if (revocationSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            }
          }
          console.log(`Share revocation notification email sent to ${model.shareEmail}`);
        } catch (emailError) {
          console.error("Error sending share revocation email:", emailError);
        }
      }
      
      // Zwróć informacje o udostępnieniu
      res.json({
        modelId: id,
        shareId: updatedModel?.shareId,
        shareEnabled: updatedModel?.shareEnabled,
        hasPassword: !!sharePassword,
        shareUrl: shareData.enableSharing ? `/shared/${shareId}` : null,
        expiryDate: updatedModel?.shareExpiryDate,
        emailSent: shareData.enableSharing && shareData.email
      });
    } catch (error) {
      console.error("Error sharing model:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sharing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to share model" });
    }
  });

  // Endpoint do sprawdzania i dostępu do udostępnionych modeli
  app.post("/api/shared/:shareId/access", async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      
      // Walidacja danych wejściowych (opcjonalne hasło)
      const accessData = accessSharedModelSchema.parse({
        ...req.body,
        shareId
      });
      
      // Znajdź model po ID udostępnienia
      const model = await storage.getModelByShareId(shareId);
      
      // Jeśli nie znaleziono modelu lub udostępnianie jest wyłączone
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      
      // Sprawdź czy link wygasł
      if (model.shareExpiryDate) {
        const expiryDate = new Date(model.shareExpiryDate);
        const now = new Date();
        if (now > expiryDate) {
          return res.status(403).json({ message: "This shared link has expired" });
        }
      }
      
      // Sprawdź hasło (jeśli jest wymagane)
      if (model.sharePassword) {
        if (!accessData.password) {
          return res.status(401).json({ message: "Password required", requiresPassword: true });
        }
        
        const passwordIsValid = await bcrypt.compare(accessData.password, model.sharePassword);
        if (!passwordIsValid) {
          return res.status(401).json({ message: "Invalid password" });
        }
      }
      
      // Zwróć podstawowe dane modelu po weryfikacji
      res.json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem
      });
    } catch (error) {
      console.error("Error accessing shared model:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid access data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to access shared model" });
    }
  });

  // Endpoint do pobierania udostępnionego modelu
  app.get("/api/shared/:shareId", async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      
      // Znajdź model po ID udostępnienia
      const model = await storage.getModelByShareId(shareId);
      
      // Jeśli nie znaleziono modelu lub udostępnianie jest wyłączone
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      
      // Sprawdź czy link wygasł
      if (model.shareExpiryDate) {
        const expiryDate = new Date(model.shareExpiryDate);
        const now = new Date();
        if (now > expiryDate) {
          return res.status(403).json({ message: "This shared link has expired" });
        }
      }
      
      // Sprawdź czy model jest chroniony hasłem
      const requiresPassword = !!model.sharePassword;
      
      // Zwróć podstawowe informacje o modelu (bez pełnych danych, które będą dostępne po weryfikacji hasła)
      res.json({
        filename: model.filename,
        format: model.format,
        created: model.created,
        requiresPassword
      });
    } catch (error) {
      console.error("Error getting shared model info:", error);
      res.status(500).json({ message: "Failed to get shared model info" });
    }
  });
  
  // Endpoint do usuwania udostępnienia modelu
  app.delete("/api/shared/:shareId", async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      
      // Znajdź model po ID udostępnienia
      const model = await storage.getModelByShareId(shareId);
      
      // Jeśli nie znaleziono modelu lub udostępnianie jest już wyłączone
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      
      // Wysyłka powiadomienia email o usunięciu udostępnienia, jeśli adres email istnieje
      if (model.shareEmail) {
        try {
          // Próbuj wysłać przez własny SMTP, a potem przez Nodemailer
          let revocationSent = false;
          
          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language']);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model, 
              model.shareEmail,
              userLanguage // Przekazujemy wykryty język użytkownika
            );
            
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else {
              console.warn("Custom SMTP email failed, trying Nodemailer fallback");
            }
          }
          
          // Jako ostatnią opcję, spróbuj Nodemailer
          if (!revocationSent) {
            revocationSent = await sendNodemailerRevokedNotification(model, model.shareEmail);
            if (revocationSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            }
          }
          console.log(`Share revocation notification email sent to ${model.shareEmail}`);
        } catch (emailError) {
          console.error("Error sending share revocation email:", emailError);
          // Kontynuuj usuwanie udostępnienia nawet jeśli email nie mógł zostać wysłany
        }
      }
      
      // Wyłącz udostępnianie modelu
      const updatedModel = await storage.updateModel(model.id, {
        shareEnabled: false
      });
      
      res.status(200).json({ 
        message: "Sharing has been revoked",
        modelId: model.id
      });
    } catch (error) {
      console.error("Error revoking shared model:", error);
      res.status(500).json({ message: "Failed to revoke shared model" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
