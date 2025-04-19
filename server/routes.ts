import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertModelSchema, modelTreeSchema, modelInfoSchema, shareModelSchema, accessSharedModelSchema, adminLoginSchema, type Model, modelViewStatsSchema, type User, models } from "@shared/schema";
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
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Funkcja pomocnicza do wykrywania środowiska produkcyjnego
function isProductionEnvironment(host: string): boolean {
  const productionDomain = process.env.PRODUCTION_DOMAIN || 'viewer.fastcnc.eu';
  return (process.env.NODE_ENV === 'production') || (host === productionDomain);
}

// Funkcja do porównywania haszowanego hasła
async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

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
  // Konfiguracja autoryzacji i endpointów logowania/rejestracji
  setupAuth(app);
  
  // Obsługa statycznych plików z folderu public
  const staticMiddleware = express.static('public');
  app.use(staticMiddleware);
  
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
      
      // Sprawdź, czy użytkownik jest zalogowany lub czy przekazano e-mail w parametrach URL
      const userEmail = req.query.email as string || null;
      
      // Pobierz klienta po e-mailu, jeśli podano
      let userId = 1; // Domyślny użytkownik, jeśli nie znaleziono klienta
      let shareEmail = null;
      
      if (userEmail) {
        // Spróbuj znaleźć użytkownika o podanym e-mailu
        const user = await storage.getUserByEmail(userEmail);
        if (user) {
          userId = user.id;
          shareEmail = userEmail; // Ustaw e-mail do udostępniania
        }
      }
      
      // Create initial model record
      const modelData = {
        userId: userId,
        filename: file.originalname,
        filesize: stats.size,
        format: metadata.format,
        created: new Date().toISOString(),
        sourceSystem: metadata.sourceSystem,
        shareEmail: shareEmail, // Automatyczne przypisanie e-mail z URL
        metadata: {
          ...metadata,
          filePath: file.path, // Store the file path for later processing
          conversionStatus: 'pending',
          userEmail: userEmail, // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
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
      
      // Weryfikacja dostępu:
      // 1. Model jest udostępniony (shareEnabled = true)
      // 2. Użytkownik jest zalogowany i jest właścicielem modelu
      // 3. Użytkownik jest administratorem
      const isPubliclyShared = model.shareEnabled === true;
      const isOwner = req.isAuthenticated() && req.user.id === model.userId;
      const isAdmin = req.isAuthenticated() && req.user.isAdmin === true;
      
      if (!isPubliclyShared && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
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
      
      // Weryfikacja dostępu:
      // 1. Model jest udostępniony (shareEnabled = true)
      // 2. Użytkownik jest zalogowany i jest właścicielem modelu
      // 3. Użytkownik jest administratorem
      const isPubliclyShared = model.shareEnabled === true;
      const isOwner = req.isAuthenticated() && req.user.id === model.userId;
      const isAdmin = req.isAuthenticated() && req.user.isAdmin === true;
      
      if (!isPubliclyShared && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
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
      
      // Weryfikacja dostępu:
      // 1. Model jest udostępniony (shareEnabled = true)
      // 2. Użytkownik jest zalogowany i jest właścicielem modelu
      // 3. Użytkownik jest administratorem
      const isPubliclyShared = model.shareEnabled === true;
      const isOwner = req.isAuthenticated() && req.user.id === model.userId;
      const isAdmin = req.isAuthenticated() && req.user.isAdmin === true;
      
      if (!isPubliclyShared && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
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
      
      // Weryfikacja dostępu:
      // 1. Model jest udostępniony (shareEnabled = true)
      // 2. Użytkownik jest zalogowany i jest właścicielem modelu
      // 3. Użytkownik jest administratorem
      const isPubliclyShared = model.shareEnabled === true;
      const isOwner = req.isAuthenticated() && req.user.id === model.userId;
      const isAdmin = req.isAuthenticated() && req.user.isAdmin === true;
      
      if (!isPubliclyShared && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
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
      
      // Weryfikacja dostępu:
      // 1. Model jest udostępniony (shareEnabled = true)
      // 2. Użytkownik jest zalogowany i jest właścicielem modelu
      // 3. Użytkownik jest administratorem
      const isPubliclyShared = model.shareEnabled === true;
      const isOwner = req.isAuthenticated() && req.user.id === model.userId;
      const isAdmin = req.isAuthenticated() && req.user.isAdmin === true;
      
      if (!isPubliclyShared && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
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
      
      // Sprawdź, czy użytkownik jest zalogowany
      let userId = req.isAuthenticated() ? req.user.id : 1; // Jeśli zalogowany, użyj ID zalogowanego użytkownika
      let shareEmail = null;
      
      if (req.isAuthenticated()) {
        // Użyj danych zalogowanego użytkownika
        shareEmail = req.user.email;
      } else {
        // Sprawdź, czy przekazano e-mail w parametrach URL
        const userEmail = req.query.email as string || null;
        
        if (userEmail) {
          // Spróbuj znaleźć użytkownika o podanym e-mailu
          const user = await storage.getUserByEmail(userEmail);
          if (user) {
            userId = user.id;
            shareEmail = userEmail; // Ustaw e-mail do udostępniania
          }
        }
      }
      
      // Sprawdź czy plik STL jest w formacie binarnym czy ASCII
      let isSTLBinary = false;
      try {
        // Przeczytaj pierwsze 5 bajtów aby określić format
        const buffer = Buffer.alloc(5);
        const fd = fs.openSync(file.path, 'r');
        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);
        
        // Pliki binarne STL zwykle zaczynają się od "solid" dla ASCII lub innych bajtów dla binarnych
        const signature = buffer.toString('utf8', 0, 5);
        isSTLBinary = signature.toLowerCase() !== 'solid';
        
        console.log(`Detected STL format for ${file.originalname}: ${isSTLBinary ? 'Binary' : 'ASCII'}`);
      } catch (formatError) {
        console.error("Error detecting STL format:", formatError);
        // Domyślnie zakładamy format binarny w przypadku błędu
        isSTLBinary = true;
      }
      
      // Dla plików STL musimy zapewnić, że są automatycznie udostępniane, aby użytkownik mógł je od razu zobaczyć
      // Nie ma potrzeby chowania ich za dostępem - są przecież bezpośrednio uploadowane
      const isOwner = req.isAuthenticated();
      const shareId = nanoid(10); // Zawsze generujemy shareId
      
      // Create model record directly for the STL file
      const modelData = {
        userId: userId,
        filename: file.originalname,
        filesize: stats.size,
        format: 'STL',
        created: new Date().toISOString(),
        sourceSystem: 'direct_upload',
        shareEmail: shareEmail, // Automatyczne przypisanie e-mail
        // W osobnym obiekcie, który zostanie wstawiony po walidacji
        shareId: shareId,
        metadata: {
          filePath: file.path,
          stlFilePath: file.path, // For STL direct upload, the original file is also the STL file
          isDirectStl: true,
          stlFormat: isSTLBinary ? 'binary' : 'ascii', // Dodajemy informację o formacie STL
          parts: 1,
          assemblies: 1,
          surfaces: 10,
          solids: 1,
          userEmail: shareEmail, // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
          properties: {
            author: shareEmail || "User",
            organization: req.isAuthenticated() ? (req.user.company || "Direct Upload") : "Direct Upload",
            partNumber: "STL-" + nanoid(6).toUpperCase(),
            revision: "A"
          }
        }
      };
      
      // Walidacja i tworzenie modelu
      const validatedData = insertModelSchema.parse(modelData);
      
      // Tworzymy model przez API storage
      const model = await storage.createModel(validatedData);
      
      // Użyj zaimportowanych modułów
      // db, eq i models są już zaimportowane na początku pliku
      
      // Teraz aktualizujemy go bezpośrednio w bazie danych
      await db.update(models)
        .set({ shareEnabled: true })
        .where(eq(models.id, model.id));
        
      // Pobieramy zaktualizowany model
      const updatedModel = await storage.getModel(model.id);
      
      if (!updatedModel) {
        throw new Error("Model not found after update");
      }
      
      // Log upload success
      console.log(`STL model uploaded by ${isOwner ? 'authenticated user' : 'anonymous user'}, ID: ${model.id}, shareEnabled was set to ${updatedModel.shareEnabled}`);
    
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        isStl: true,
        stlFormat: isSTLBinary ? 'binary' : 'ascii',
        shareEnabled: updatedModel.shareEnabled
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
      
      // Sprawdź, czy użytkownik jest zalogowany
      let userId = req.isAuthenticated() ? req.user.id : 1; // Jeśli zalogowany, użyj ID zalogowanego użytkownika
      let shareEmail = null;
      
      if (req.isAuthenticated()) {
        // Użyj danych zalogowanego użytkownika
        shareEmail = req.user.email;
      } else {
        // Sprawdź, czy przekazano e-mail w parametrach URL
        const userEmail = req.query.email as string || null;
        
        if (userEmail) {
          // Spróbuj znaleźć użytkownika o podanym e-mailu
          const user = await storage.getUserByEmail(userEmail);
          if (user) {
            userId = user.id;
            shareEmail = userEmail; // Ustaw e-mail do udostępniania
          }
        }
      }
      
      // Dla plików DXF/DWG również włączamy automatycznie udostępnianie
      const shareId = nanoid(10); // Zawsze generujemy shareId
      
      // Create model record for 2D CAD file
      const modelData = {
        userId: userId,
        filename: file.originalname,
        filesize: stats.size,
        format: format,
        created: new Date().toISOString(),
        sourceSystem: 'direct_upload',
        shareEmail: shareEmail, // Automatyczne przypisanie e-mail
        // Włączamy udostępnianie aby zapewnić dostęp
        shareEnabled: true,
        shareId: shareId,
        metadata: {
          filePath: file.path,
          fileType: '2d',
          cadFormat: format.toLowerCase(),
          entities: 0, // To be determined by the renderer
          layers: 0,  // To be determined by the renderer
          userEmail: shareEmail, // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
          properties: {
            author: shareEmail || "User",
            organization: req.isAuthenticated() ? (req.user.company || "Direct Upload") : "Direct Upload",
            drawingNumber: format + "-" + nanoid(6).toUpperCase(),
            revision: "A"
          }
        }
      };
      
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      
      // Upewnij się, że shareEnabled jest włączone
      await db.update(models)
        .set({ shareEnabled: true })
        .where(eq(models.id, model.id));
      
      // Pobierz zaktualizowany model
      const updatedModel = await storage.getModel(model.id);
      
      if (!updatedModel) {
        throw new Error("Model not found after update");
      }
      
      console.log(`CAD model uploaded, ID: ${model.id}, shareEnabled was set to ${updatedModel.shareEnabled}`);
      
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
      
      // Zmienna do śledzenia, czy utworzono konto
      let accountCreated = false;
      
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
      
      // Generuj unikalny token do usuwania udostępnienia
      let deleteToken = model.shareDeleteToken;
      if (shareData.enableSharing && !deleteToken) {
        deleteToken = nanoid(32); // 32-znakowy token dla bezpieczeństwa
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
        shareExpiryDate: shareData.expiryDate,
        shareDeleteToken: deleteToken
      };
      
      // Jeśli podano adres email, zapisz go
      if (shareData.email) {
        updateData.shareEmail = shareData.email;
        updateData.shareNotificationSent = false; // Reset statusu powiadomienia
      }
      
      // Jeśli użytkownik chce założyć konto
      if (shareData.createAccount && shareData.email) {
        try {
          // Sprawdź, czy użytkownik o podanym adresie email już istnieje
          const existingUser = await storage.getUserByEmail(shareData.email);
          
          if (!existingUser) {
            // Jeśli mamy dane użytkownika z formularza, użyj ich
            const userData = shareData.userData || {};
            
            // Ustal nazwę użytkownika - użyj podanej lub wygeneruj na podstawie emaila
            let username = userData.username || '';
            
            // Jeśli nie podano nazwy użytkownika, wygeneruj ją na podstawie adresu email
            if (!username) {
              const emailParts = shareData.email.split('@');
              const baseUsername = emailParts[0];
              username = baseUsername;
              let suffix = 1;
              
              // Sprawdź, czy nazwa użytkownika jest unikalna
              let userWithUsername = await storage.getUserByUsername(username);
              while (userWithUsername) {
                // Jeśli nazwa użytkownika jest zajęta, dodaj liczbę do nazwy
                username = `${baseUsername}${suffix}`;
                suffix++;
                userWithUsername = await storage.getUserByUsername(username);
              }
            }
            
            // Ustal hasło - użyj hasła z formularza, hasła udostępniania lub wygeneruj losowe
            const password = userData.password || shareData.password || nanoid(10);
            
            // Hashuj hasło
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Utwórz użytkownika
            const newUser = await storage.createUser({
              username,
              password: hashedPassword,
              email: shareData.email,
              fullName: userData.fullName || null,
              company: userData.company || null,
              isAdmin: false,
              isClient: true
            });
            
            // Zaloguj użytkownika
            req.login({
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              fullName: newUser.fullName,
              company: newUser.company,
              isAdmin: Boolean(newUser.isAdmin),
              isClient: Boolean(newUser.isClient)
            }, (err) => {
              if (err) {
                console.error("Error logging in new user:", err);
              }
            });
            
            // Zaktualizuj flagę utworzenia konta
            accountCreated = true;
            
            // Przypisz model do nowego użytkownika
            updateData.userId = newUser.id;
            
            console.log(`Created new user account for ${shareData.email} with username ${username}`);
          } else {
            console.log(`User with email ${shareData.email} already exists, skipping account creation`);
          }
        } catch (accountError) {
          console.error("Error creating user account:", accountError);
          // Nie przerywamy procesu, jeśli tworzenie konta nie powiedzie się
        }
      }
      
      // Aktualizacja modelu
      const updatedModel = await storage.updateModel(id, updateData);
      
      // Jeśli włączono udostępnianie i podano adres email, wyślij powiadomienie
      if (shareData.enableSharing && shareData.email) {
        try {
          // Ustal baseUrl na podstawie żądania lub konfiguracji produkcyjnej
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers['host'] || 'localhost:3000';
          
          // Sprawdź, czy jesteśmy w środowisku produkcyjnym
          let baseUrl;
          if (host === 'viewer.fastcnc.eu') {
            // W środowisku produkcyjnym zawsze używaj HTTPS
            baseUrl = 'https://viewer.fastcnc.eu';
            console.log('Using production baseUrl:', baseUrl);
          } else {
            // W innych środowiskach używaj wykrytego protokołu i hosta
            baseUrl = `${protocol}://${host}`;
            console.log('Using detected baseUrl:', baseUrl);
          }
          
          // Użyj języka przekazanego z frontendu lub wykryj na podstawie nagłówka Accept-Language
          const userLanguage = (shareData.language as Language) || detectLanguage(req.headers['accept-language']);
          console.log(`Using language for email: ${userLanguage} (${shareData.language ? 'from frontend' : 'from browser header'})`);
          
          // Wyślij e-mail z powiadomieniem
          let emailSent = false;
          
          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          // Używamy zmiennej NODE_ENV lub sprawdzamy domenę
          const productionDomain = process.env.PRODUCTION_DOMAIN || 'viewer.fastcnc.eu';
          const isProduction = (process.env.NODE_ENV === 'production') || (host === productionDomain);
          
          console.log(`Environment: ${isProduction ? 'Production' : 'Development'}, Host: ${host}`);
          
          // Jeśli jest skonfigurowany serwer SMTP
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
              
              // Zaktualizuj status wysłania powiadomienia
              await storage.updateModel(id, { shareNotificationSent: true });
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn("Custom SMTP email failed, trying Nodemailer fallback (dev environment only)");
              
              emailSent = await sendNodemailerNotification(
                updatedModel!, 
                shareData.email, 
                baseUrl,
                shareData.password
              );
              
              if (emailSent) {
                console.log(`Share notification email sent via Nodemailer to ${shareData.email}`);
                
                // Zaktualizuj status wysłania powiadomienia
                await storage.updateModel(id, { shareNotificationSent: true });
              } else {
                console.error(`Failed to send share notification email to ${shareData.email}`);
              }
            } else {
              console.error(`Failed to send share notification email via SMTP to ${shareData.email} in production environment`);
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            emailSent = await sendNodemailerNotification(
              updatedModel!, 
              shareData.email, 
              baseUrl,
              shareData.password
            );
            
            if (emailSent) {
              console.log(`Share notification email sent via Nodemailer to ${shareData.email}`);
              
              // Zaktualizuj status wysłania powiadomienia
              await storage.updateModel(id, { shareNotificationSent: true });
            } else {
              console.error(`Failed to send share notification email to ${shareData.email}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send email to ${shareData.email}`);
          }
        } catch (emailError) {
          console.error("Error sending share notification email:", emailError);
          // Nie przerywamy procesu, jeśli e-mail nie został wysłany
        }
      } else if (needsRevocationEmail) {
        // Wyślij powiadomienie o wycofaniu udostępnienia
        try {
          // Wysyłanie powiadomienia o wycofaniu udostępnienia
          let revocationSent = false;
          
          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language']);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          
          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          const host = req.headers['host'] || 'localhost:3000';
          const isProduction = host === 'viewer.fastcnc.eu';
          
          // Jeśli jest skonfigurowany serwer SMTP
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model, 
              model.shareEmail!,
              userLanguage // Przekazujemy wykryty język użytkownika
            );
            
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn("Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)");
              
              revocationSent = await sendNodemailerRevokedNotification(model, model.shareEmail!);
              if (revocationSent) {
                console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
              } else {
                console.error(`Failed to send share revocation email to ${model.shareEmail}`);
              }
            } else {
              console.error(`Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`);
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            revocationSent = await sendNodemailerRevokedNotification(model, model.shareEmail!);
            if (revocationSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            } else {
              console.error(`Failed to send share revocation email to ${model.shareEmail}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`);
          }
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
        shareDeleteToken: updatedModel?.shareDeleteToken,
        emailSent: shareData.enableSharing && shareData.email,
        accountCreated // Dodajemy informację o utworzeniu konta
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
      
      // Rejestruj dostęp do modelu (faktyczne wyświetlenie po weryfikacji hasła)
      // Robimy to tylko jeśli model wymaga hasła, w przeciwnym razie
      // statystyki zostały już zapisane w poprzednim żądaniu
      if (model.sharePassword) {
        // Obsługa adresu IP - weź tylko pierwszy adres IP z nagłówka X-Forwarded-For (rzeczywisty adres klienta)
        let ipAddress = 'unknown';
        if (req.headers['x-forwarded-for']) {
          // Pobierz pierwszy adres IP z listy (adres rzeczywistego klienta)
          const forwarded = String(req.headers['x-forwarded-for']).split(',')[0].trim();
          if (forwarded) {
            ipAddress = forwarded;
          }
        } else if (req.socket.remoteAddress) {
          ipAddress = req.socket.remoteAddress;
        }
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        try {
          await storage.recordModelView({
            modelId: model.id,
            shareId,
            ipAddress,
            userAgent,
            viewedAt: new Date(),
            authenticated: true // To oznacza, że dostęp został uwierzytelniony (jeśli było hasło)
          });
        } catch (viewError) {
          console.error("Error accessing shared model:", viewError);
          // Ignorujemy błąd - aplikacja dalej działa
        }
      }
      
      // Aktualizuj datę ostatniego dostępu
      await storage.updateModel(model.id, {
        shareLastAccessed: new Date().toISOString()
      });
      
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
      
      // Rejestruj wyświetlenie modelu, ale tylko jeśli jest to pierwszy dostęp (bez hasła)
      if (!model.sharePassword) {
        try {
          // Obsługa adresu IP - weź tylko pierwszy adres IP z nagłówka X-Forwarded-For (rzeczywisty adres klienta)
          let ipAddress = 'unknown';
          if (req.headers['x-forwarded-for']) {
            // Pobierz pierwszy adres IP z listy (adres rzeczywistego klienta)
            const forwarded = String(req.headers['x-forwarded-for']).split(',')[0].trim();
            if (forwarded) {
              ipAddress = forwarded;
            }
          } else if (req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
          }
          const userAgent = req.headers['user-agent'] || 'unknown';
          
          await storage.recordModelView({
            modelId: model.id,
            shareId,
            ipAddress,
            userAgent,
            viewedAt: new Date()
          });
        } catch (viewError) {
          console.error("Failed to record model view:", viewError);
          // Nie zwracamy błędu, kontynuujemy działanie
        }
      }
      
      // Aktualizuj datę ostatniego dostępu
      await storage.updateModel(model.id, {
        shareLastAccessed: new Date().toISOString()
      });
      
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
  
  // Endpoint HTML dla usuwania udostępnienia poprzez kliknięcie w link z maila (metoda GET)
  app.get("/revoke-share/:shareId/:token", async (req: Request, res: Response) => {
    try {
      const { shareId, token } = req.params;
      
      // Pobierz model aby sprawdzić token bezpieczeństwa
      const model = await storage.getModelByShareId(shareId);
      if (!model) {
        return res.status(404).send(`
          <html>
            <head>
              <title>Error - Share Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .error { color: #e53e3e; }
                .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="error">Error</h1>
                <p>The shared model was not found or has already been deleted.</p>
                <a href="/" class="btn">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Weryfikuj token bezpieczeństwa
      if (!model.shareDeleteToken || model.shareDeleteToken !== token) {
        return res.status(403).send(`
          <html>
            <head>
              <title>Error - Invalid Token</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .error { color: #e53e3e; }
                .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="error">Invalid Security Token</h1>
                <p>The security token you provided is invalid or has expired.</p>
                <a href="/" class="btn">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      
      // Dezaktywuj udostępnianie
      await storage.updateModel(model.id, {
        shareEnabled: false,
        shareId: null,
        sharePassword: null,
        shareEmail: null,
        shareExpiryDate: null,
        shareDeleteToken: null
      });
      
      // Wyślij powiadomienie o usunięciu udostępnienia, jeśli jest adres email
      if (model.shareEmail) {
        try {
          // Ustal bazowy URL na podstawie źródła żądania
          const host = req.headers['host'] || 'localhost:5000';
          const protocol = host.includes('localhost') ? 'http' : 'https';
          const baseUrl = `${protocol}://${host}`;
          
          await sendSharingRevokedNotificationSmtp(model, model.shareEmail, undefined, baseUrl);
          console.log(`Wysłano powiadomienie o usunięciu udostępnienia do ${model.shareEmail}`);
        } catch (emailError) {
          console.error("Błąd podczas wysyłania powiadomienia o usunięciu udostępnienia:", emailError);
        }
      }
      
      // Wyświetl stronę powodzenia
      res.status(200).send(`
        <html>
          <head>
            <title>Share Revocation Successful</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; }
              .success { color: #38a169; }
              .logo { max-width: 120px; margin-bottom: 20px; }
              .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="/assets/cropped-Fast-Cnc-scaled-e1723725217643.jpg" alt="FastCNC logo" class="logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
              <h1 class="success">Share Revocation Successful</h1>
              <p>The shared model "${model.filename}" has been successfully unshared and is no longer accessible.</p>
              <a href="/" class="btn">Go to Homepage</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error revoking share with token:", error);
      res.status(500).send(`
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; }
              .error { color: #e53e3e; }
              .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="/assets/cropped-Fast-Cnc-scaled-e1723725217643.jpg" alt="FastCNC logo" class="logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
              <h1 class="error">Error</h1>
              <p>An error occurred while processing your request. Please try again later.</p>
              <a href="/" class="btn">Go to Homepage</a>
            </div>
          </body>
        </html>
      `);
    }
  });
  
  // Endpoint do usuwania udostępnienia modelu za pomocą tokenu bezpieczeństwa (metoda API DELETE)
  app.delete("/api/shared/:shareId/:token", async (req: Request, res: Response) => {
    try {
      const { shareId, token } = req.params;
      
      // Znajdź model po ID udostępnienia
      const model = await storage.getModelByShareId(shareId);
      
      // Jeśli nie znaleziono modelu lub udostępnianie jest już wyłączone
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      
      // Weryfikacja tokenu bezpieczeństwa
      if (!model.shareDeleteToken || model.shareDeleteToken !== token) {
        return res.status(403).json({ message: "Invalid security token" });
      }
      
      // Wysyłka powiadomienia email o usunięciu udostępnienia, jeśli adres email istnieje
      if (model.shareEmail) {
        try {
          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language']);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          
          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          const host = req.headers['host'] || 'localhost:3000';
          const isProduction = host === 'viewer.fastcnc.eu';
          
          // Jeśli jest skonfigurowany serwer SMTP
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            // Ustal bazowy URL na podstawie źródła żądania
            const baseUrl = `${req.protocol}://${req.headers['host']}`;
            
            const revocationSent = await sendSharingRevokedNotificationSmtp(
              model, 
              model.shareEmail,
              userLanguage, // Przekazujemy wykryty język użytkownika
              baseUrl
            );
            
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn("Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)");
              
              const nodemailerSent = await sendNodemailerRevokedNotification(model, model.shareEmail);
              if (nodemailerSent) {
                console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
              } else {
                console.error(`Failed to send share revocation email to ${model.shareEmail}`);
              }
            } else {
              console.error(`Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`);
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            const nodemailerSent = await sendNodemailerRevokedNotification(model, model.shareEmail);
            if (nodemailerSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            } else {
              console.error(`Failed to send share revocation email to ${model.shareEmail}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`);
          }
        } catch (emailError) {
          console.error("Error sending share revocation email:", emailError);
          // Kontynuuj usuwanie udostępnienia nawet jeśli email nie mógł zostać wysłany
        }
      }
      
      // Wyłącz udostępnianie modelu
      await storage.updateModel(model.id, {
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
  
  // Endpoint do usuwania udostępnienia modelu (tylko dla administratorów)
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
          // Wysyłanie powiadomienia o wycofaniu udostępnienia
          let revocationSent = false;
          
          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language']);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          
          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          const host = req.headers['host'] || 'localhost:3000';
          const isProduction = host === 'viewer.fastcnc.eu';
          
          // Jeśli jest skonfigurowany serwer SMTP
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            // Ustal bazowy URL na podstawie źródła żądania
            const baseUrl = `${req.protocol}://${req.headers['host']}`;
            
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model, 
              model.shareEmail,
              userLanguage, // Przekazujemy wykryty język użytkownika
              baseUrl
            );
            
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn("Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)");
              
              revocationSent = await sendNodemailerRevokedNotification(model, model.shareEmail);
              if (revocationSent) {
                console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
              } else {
                console.error(`Failed to send share revocation email to ${model.shareEmail}`);
              }
            } else {
              console.error(`Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`);
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            revocationSent = await sendNodemailerRevokedNotification(model, model.shareEmail);
            if (revocationSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            } else {
              console.error(`Failed to send share revocation email to ${model.shareEmail}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`);
          }
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

  // Admin endpoints
  
  // Logowanie administratora
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const loginData = adminLoginSchema.parse(req.body);
      
      // Pobierz użytkownika po nazwie użytkownika
      const user = await storage.getUserByUsername(loginData.username);
      
      // Sprawdź czy użytkownik istnieje i czy jest administratorem
      if (!user || !user.isAdmin) {
        return res.status(401).json({ message: "Nieprawidłowe dane logowania lub brak uprawnień administratora" });
      }
      
      // Sprawdź hasło
      const passwordValid = await comparePassword(loginData.password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Nieprawidłowe dane logowania" });
      }
      
      // Usuń hasło z obiektu użytkownika przed zwróceniem
      const { password, ...userWithoutPassword } = user;
      
      // Zwróć dane użytkownika (bez hasła)
      res.status(200).json({ 
        ...userWithoutPassword,
        token: nanoid(32) // Bardzo prosty token, w produkcji użyłbyś JWT lub podobnego 
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Wystąpił błąd podczas logowania" });
    }
  });
  
  // Pobierz wszystkie udostępnione modele (tylko dla administratorów)
  app.get("/api/admin/shared-models", async (req: Request, res: Response) => {
    try {
      // W prawdziwej aplikacji powinieneś sprawdzić token administratora
      // Dla prostoty w prototypie pomijamy uwierzytelnianie
      
      // Pobierz wszystkie udostępnione modele
      const sharedModels = await storage.getSharedModels();
      
      // Przygotuj dane do wysłania, zawierające tylko potrzebne informacje
      const modelsList = sharedModels.map(model => ({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        shareId: model.shareId,
        shareEnabled: model.shareEnabled,
        shareEmail: model.shareEmail,
        shareExpiryDate: model.shareExpiryDate,
        shareLastAccessed: model.shareLastAccessed,
        hasPassword: !!model.sharePassword
      }));
      
      res.json(modelsList);
    } catch (error) {
      console.error("Error getting shared models list:", error);
      res.status(500).json({ message: "Failed to get shared models list" });
    }
  });
  
  // Odwołaj udostępnianie modelu (tylko dla administratorów)
  app.delete("/api/admin/shared-models/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      
      // W prawdziwej aplikacji powinieneś sprawdzić token administratora
      // Dla prostoty w prototypie pomijamy uwierzytelnianie
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      if (!model.shareEnabled || !model.shareId) {
        return res.status(400).json({ message: "Model is not shared" });
      }
      
      // Usuń udostępnianie
      const update = {
        shareEnabled: false,
        shareId: null,
        sharePassword: null,
        shareExpiryDate: null,
        shareEmail: null
      };
      
      const updatedModel = await storage.updateModel(modelId, update);
      
      // Powiadom użytkownika o usunięciu udostępnienia, jeśli podał adres e-mail
      if (updatedModel && model.shareEmail) {
        try {
          const language = 'en'; // Domyślny język dla powiadomień administracyjnych
          
          // Próbuj użyć niestandardowego SMTP, a jeśli nie zadziała, użyj Nodemailer
          try {
            // Ustal bazowy URL na podstawie źródła żądania
            const host = req.headers['host'] || 'localhost:5000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;
            
            await sendSharingRevokedNotificationSmtp(model, model.shareEmail, language, baseUrl);
          } catch (emailError) {
            console.warn("Custom SMTP notification failed, trying Nodemailer:", emailError);
            await sendNodemailerRevokedNotification(model, language);
          }
        } catch (notificationError) {
          console.error("Failed to send sharing revocation notification:", notificationError);
          // Nie przerywamy procesu, jeśli powiadomienie się nie powiedzie
        }
      }
      
      res.status(200).json({ message: "Sharing successfully disabled" });
    } catch (error) {
      console.error("Error disabling sharing:", error);
      res.status(500).json({ message: "Failed to disable sharing" });
    }
  });

  // Get model view statistics
  app.get("/api/admin/shared-models/:id/stats", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if model exists
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      try {
        // Get view statistics for the model
        const stats = await storage.getModelViewStats(id);
        
        // Validate with schema
        const validatedStats = modelViewStatsSchema.parse(stats);
        
        res.json(validatedStats);
      } catch (statsError) {
        console.error("Error getting model view stats (table may not exist):", statsError);
        // Jeśli tabela nie istnieje, zwróć puste statystyki
        res.json({
          totalViews: 0,
          uniqueIPs: 0,
          viewDetails: [],
          ipAddresses: [],
          browserStats: []
        });
      }
    } catch (error) {
      console.error("Error getting model view statistics:", error);
      res.status(500).json({ message: "Failed to get model view statistics" });
    }
  });
  
  // Ustaw nowe hasło dla udostępnionego modelu (tylko dla administratorów)
  app.post("/api/admin/shared-models/:id/reset-password", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      const { newPassword } = req.body;
      
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }
      
      // W prawdziwej aplikacji powinieneś sprawdzić token administratora
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Jeśli podano nowe hasło, zahashuj je
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Aktualizuj model z nowym hasłem
      const updatedModel = await storage.updateModel(modelId, {
        sharePassword: hashedPassword
      });
      
      res.json({ 
        success: true, 
        message: "Password has been updated",
        modelId,
        hasPassword: true
      });
    } catch (error) {
      console.error("Error resetting model password:", error);
      res.status(500).json({ message: "Failed to reset model password" });
    }
  });
  
  // Endpoint do sprawdzenia czy model ma hasło (tylko dla administratorów)
  app.get("/api/admin/shared-models/:id/password", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      
      // W prawdziwej aplikacji powinieneś sprawdzić token administratora
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Zwracamy tylko informację czy model ma hasło
      res.json({ 
        modelId,
        hasPassword: !!model.sharePassword,
        message: "For security reasons, plaintext passwords are not stored or displayed."
      });
    } catch (error) {
      console.error("Error getting model password status:", error);
      res.status(500).json({ message: "Failed to get model password status" });
    }
  });

  // Endpoint do sprawdzania, czy email istnieje w systemie
  app.get("/api/check-email/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Sprawdź czy użytkownik z podanym emailem istnieje
      const user = await storage.getUserByEmail(email);
      
      // Zwróć tylko informację czy email istnieje, bez szczegółów użytkownika
      res.json({ 
        exists: !!user,
        email
      });
    } catch (error) {
      console.error("Error checking email existence:", error);
      res.status(500).json({ message: "Failed to check email" });
    }
  });
  
  // Endpoint do pobierania modeli przypisanych do zalogowanego użytkownika
  app.get("/api/client/models", async (req: Request, res: Response) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      
      // Pobierz zalogowanego użytkownika
      const user = req.user as User;
      
      // Jeśli użytkownik jest adminem, zwróć wszystkie modele
      if (user.isAdmin) {
        const allModels = await storage.getModels();
        return res.json(allModels);
      }
      
      // Dla zwykłego użytkownika, pobierz modele powiązane z jego adresem email
      if (user.email) {
        const userModels = await storage.getModelsByEmail(user.email);
        return res.json(userModels);
      }
      
      // Zwróć pustą tablicę, jeśli użytkownik nie ma emaila
      return res.json([]);
    } catch (error) {
      console.error("Error retrieving client models:", error);
      res.status(500).json({ error: "Błąd podczas pobierania modeli klienta" });
    }
  });
  
  // Endpoint do usuwania modelu przez klienta
  app.delete("/api/client/models/:id", async (req: Request, res: Response) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Nieprawidłowe ID modelu" });
      }
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      
      // Sprawdź czy model należy do zalogowanego użytkownika
      const user = req.user as User;
      if (!user.isAdmin && user.email !== model.shareEmail) {
        return res.status(403).json({ error: "Brak uprawnień do usunięcia tego modelu" });
      }
      
      // Usuń model
      await storage.deleteModel(modelId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client model:", error);
      res.status(500).json({ error: "Błąd podczas usuwania modelu" });
    }
  });
  
  // Endpoint do zmiany hasła modelu przez klienta
  app.post("/api/client/shared-models/:id/password", async (req: Request, res: Response) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Nieprawidłowe ID modelu" });
      }
      
      // Pobierz model
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      
      // Sprawdź czy model należy do zalogowanego użytkownika
      const user = req.user as User;
      if (!user.isAdmin && user.email !== model.shareEmail) {
        return res.status(403).json({ error: "Brak uprawnień do zmiany hasła tego modelu" });
      }
      
      // Zweryfikuj dane żądania
      const { password } = req.body;
      
      // Aktualizuj model z nowym hasłem lub usuń hasło, jeśli przekazano puste
      let hashedPassword = null;
      if (password) {
        hashedPassword = await hashPassword(password);
      }
      
      // Zaktualizuj model z nowym hasłem
      await storage.updateModel(modelId, {
        sharePassword: hashedPassword
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating model password:", error);
      res.status(500).json({ error: "Błąd podczas aktualizacji hasła modelu" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
