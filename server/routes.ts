import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction
} from 'express'
import { createServer, type Server } from 'http'
import { storage } from './storage'
import multer from 'multer'
import {
  insertModelSchema,
  modelTreeSchema,
  modelInfoSchema,
  shareModelSchema,
  accessSharedModelSchema,
  adminLoginSchema,
  type Model,
  modelViewStatsSchema,
  type User,
  models,
  type StlModelMetadata,
  type CadModelMetadata,
  updateModelTagsSchema
} from '@shared/schema'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'
import os from 'os'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import util from 'util'
import bcrypt from 'bcryptjs'
import {
  initializeEmailService,
  sendShareNotification as sendNodemailerNotification,
  sendSharingRevokedNotification as sendNodemailerRevokedNotification,
  detectLanguage
} from './email'
import type { Language } from '../client/src/lib/translations'
import {
  initializeCustomSmtpService,
  sendShareNotificationSmtp,
  sendSharingRevokedNotificationSmtp,
  ContactFormData
} from './custom-smtp'
import { initializeS3Service, s3Service } from './s3-service'
import { setupAuth, comparePasswords, hashPassword } from './auth'
import { db } from './db'
import { eq } from 'drizzle-orm'
import session from 'express-session'
import { generateThumbnail, getThumbnailPath } from './thumbnail-generator'
import {
  translateDescription,
  detectLanguage as detectTextLanguage,
  mapToSupportedLanguage,
  type SupportedLanguage
} from './google-translate'

// Rozszerzenie typu Session aby zawierał viewTokens
declare module 'express-session' {
  interface SessionData {
    viewTokens?: Record<string, string>
  }
}

// Funkcja pomocnicza do wykrywania środowiska produkcyjnego
function isProductionEnvironment (host: string): boolean {
  const productionDomain = process.env.PRODUCTION_DOMAIN || 'viewer.fastcnc.eu'
  return process.env.NODE_ENV === 'production' || host === productionDomain
}

// Funkcja do porównywania haszowanego hasła
async function comparePassword (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

// Funkcja sprawdzająca dostęp do modelu
async function hasAccessToModel (
  req: Request,
  modelId: number
): Promise<boolean> {
  try {
    const model = await storage.getModel(modelId)
    if (!model) return false

    // Administrator ma dostęp do wszystkich modeli
    if (req.isAuthenticated() && req.user.isAdmin) {
      return true
    }

    // Właściciel modelu ma dostęp do modelu
    if (req.isAuthenticated() && model.userId === req.user.id) {
      return true
    }

    // Jeśli model jest udostępniony publicznie, każdy ma dostęp
    if (model.shareEnabled) {
      return true
    }

    // Sprawdź, czy w sesji użytkownika jest zapisany token dostępu dla tego modelu
    const viewTokens = req.session.viewTokens || {}
    if (viewTokens[modelId.toString()]) {
      // Sprawdź, czy token zgadza się z tokenem w metadanych
      const metadata = model.metadata as any
      if (
        metadata &&
        metadata.viewToken &&
        metadata.viewToken === viewTokens[modelId.toString()]
      ) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking model access:', error)
    return false
  }
}

// ES modules compatibility (replacement for __dirname)
const execPromise = util.promisify(exec)

// Funkcja do konwersji pliku DXF do SVG
async function convertDxfToSvg (dxfFilePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(dxfFilePath)) {
      console.error('DXF file does not exist:', dxfFilePath)
      return null
    }

    // Najpierw próbuj użyć rozszerzonego konwertera DXF
    const enhancedScript = path.join(__dirname, 'enhanced_dxf_converter.py')
    const matplotlibScript = path.join(__dirname, 'dxf_matplotlib_converter.py')
    const fallbackScript = path.join(__dirname, 'dxf_converter.py')

    // Określ, którego skryptu konwersji użyć, z odpowiednim fallbackiem
    let scriptToUse = enhancedScript
    let scriptName = 'enhanced'

    // Sprawdź dostępność skryptów
    if (!fs.existsSync(enhancedScript)) {
      console.warn(
        'Enhanced DXF converter not found, falling back to matplotlib converter'
      )

      if (!fs.existsSync(matplotlibScript)) {
        console.warn(
          'Matplotlib DXF converter script not found, falling back to original converter'
        )

        if (!fs.existsSync(fallbackScript)) {
          console.error('No DXF converter scripts found')
          return null
        }

        scriptToUse = fallbackScript
        scriptName = 'fallback'
      } else {
        scriptToUse = matplotlibScript
        scriptName = 'matplotlib'
      }
    }

    // Utwórz tymczasowy plik dla SVG
    const tempSvgPath = path.join(
      './uploads',
      `${path.parse(dxfFilePath).name}_${Date.now()}.svg`
    )

    try {
      // Uruchom skrypt Pythona do konwersji DXF na SVG z zapisem do pliku
      const scriptCommand = `python3 "${scriptToUse}" "${dxfFilePath}" svg "${tempSvgPath}"`
      console.log(`Executing: ${scriptCommand}`)

      await execPromise(scriptCommand)

      // Sprawdź czy plik SVG został utworzony
      if (fs.existsSync(tempSvgPath)) {
        // Odczytaj plik SVG
        const svgContent = fs.readFileSync(tempSvgPath, 'utf8')

        // Usuń plik tymczasowy (ale pozostaw go na razie dla debugowania)
        // try { fs.unlinkSync(tempSvgPath); } catch (e) { /* ignore */ }

        if (svgContent) {
          console.log(
            `Successfully converted DXF to SVG using ${scriptName} converter`
          )
          return svgContent
        } else {
          console.error('Empty SVG file created')
          return null
        }
      } else {
        console.error('SVG file was not created')
        return null
      }
    } catch (error) {
      console.error(
        `Error executing DXF to SVG conversion with ${scriptName} converter:`,
        error
      )

      // Sprawdź czy istnieje plik debugowania
      const debugLogPath = '/tmp/enhanced_dxf_converter.log'
      let debugInfo = ''

      if (fs.existsSync(debugLogPath)) {
        try {
          debugInfo = fs.readFileSync(debugLogPath, 'utf8')
          debugInfo = debugInfo.split('\n').slice(-5).join('\n') // Ostatnie 5 linii
        } catch (e) {
          /* ignore */
        }
      }

      // Kaskadowy fallback - spróbuj użyć kolejnych konwerterów, jeśli aktualny zawiedzie
      if (scriptToUse === enhancedScript && fs.existsSync(matplotlibScript)) {
        console.log('Enhanced converter failed, trying matplotlib converter')

        try {
          await execPromise(
            `python3 "${matplotlibScript}" "${dxfFilePath}" svg "${tempSvgPath}"`
          )

          if (fs.existsSync(tempSvgPath)) {
            const svgContent = fs.readFileSync(tempSvgPath, 'utf8')
            // try { fs.unlinkSync(tempSvgPath); } catch (e) { /* ignore */ }

            if (svgContent) {
              console.log(
                'Successfully converted DXF to SVG using matplotlib converter'
              )
              return svgContent
            }
          }
        } catch (matplotlibError) {
          console.error('Matplotlib conversion also failed:', matplotlibError)

          // Jeśli matplotlib również zawiedzie, spróbuj oryginalny konwerter
          if (fs.existsSync(fallbackScript)) {
            console.log('Trying original fallback converter')

            try {
              await execPromise(
                `python3 "${fallbackScript}" "${dxfFilePath}" svg "${tempSvgPath}"`
              )

              if (fs.existsSync(tempSvgPath)) {
                const svgContent = fs.readFileSync(tempSvgPath, 'utf8')
                // try { fs.unlinkSync(tempSvgPath); } catch (e) { /* ignore */ }

                if (svgContent) {
                  console.log(
                    'Successfully converted DXF to SVG using original fallback converter'
                  )
                  return svgContent
                }
              }
            } catch (fallbackError) {
              console.error('All converters failed')
            }
          }
        }
      } else if (
        scriptToUse === matplotlibScript &&
        fs.existsSync(fallbackScript)
      ) {
        // Jeśli używaliśmy matplotlib i wystąpił błąd, spróbuj z fallbackiem
        console.log('Matplotlib converter failed, trying fallback converter')

        try {
          await execPromise(
            `python3 "${fallbackScript}" "${dxfFilePath}" svg "${tempSvgPath}"`
          )

          if (fs.existsSync(tempSvgPath)) {
            const svgContent = fs.readFileSync(tempSvgPath, 'utf8')
            // try { fs.unlinkSync(tempSvgPath); } catch (e) { /* ignore */ }

            if (svgContent) {
              console.log(
                'Successfully converted DXF to SVG using fallback converter'
              )
              return svgContent
            }
          }
        } catch (fallbackError) {
          console.error('Fallback conversion also failed:', fallbackError)
        }
      }

      // Zwróć podstawowy SVG z informacją o błędzie
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
          <rect width="400" height="200" fill="#f8f8f8" />
          <text x="50" y="80" font-family="Arial" font-size="16" fill="red">Error converting DXF to SVG</text>
          <text x="50" y="110" font-family="Arial" font-size="12">${
            error instanceof Error ? error.message : 'Unknown error'
          }</text>
          ${
            debugInfo
              ? `<text x="50" y="130" font-family="Arial" font-size="10" fill="#666">Debug: ${debugInfo
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')}</text>`
              : ''
          }
        </svg>
      `
    }
  } catch (error) {
    console.error('Error in convertDxfToSvg:', error)
    return null
  }
}
async function convertDwgToSvg(filePath: string): Promise<string | null> {
  try {
    // Create a temporary directory for output if it doesn't exist
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Generate unique output path
    const outputPath = path.join(
      tmpDir,
      `${path.parse(filePath).name}_${Date.now()}.svg`
    );

    // Path to the Python converter script
    const converterScript = path.join(__dirname, 'scripts/dwg_to_svg.py');

    if (!fs.existsSync(converterScript)) {
      console.error('DWG to SVG converter script not found:', converterScript);
      return null;
    }

    console.log('Converting DWG to SVG...');
    console.log('Input:', filePath);
    console.log('Output:', outputPath);
    
    // Run the conversion script
    const { stdout, stderr } = await execPromise(
      `python3 "${converterScript}" "${filePath}" "${outputPath}"`
    );

    if (stderr) {
      console.error('Conversion stderr:', stderr);
    }

    if (stdout) {
      console.log('Conversion stdout:', stdout);
    }

    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      console.error('SVG file was not created');
      return null;
    }

    // Read the generated SVG
    const svgContent = fs.readFileSync(outputPath, 'utf-8');

    // Validate SVG content
    if (!svgContent || !svgContent.includes('<svg')) {
      console.error('Invalid SVG content generated');
      return null;
    }

    try {
      // Cleanup the temporary SVG file
      fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError);
      // Continue even if cleanup fails
    }

    return svgContent;
  } catch (error) {
    console.error('DWG conversion error:', error);
    
    // Return a fallback SVG with error message
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
        <rect width="400" height="200" fill="#f8f8f8" />
        <text x="50" y="80" font-family="Arial" font-size="16" fill="red">Error converting DWG to SVG</text>
        <text x="50" y="110" font-family="Arial" font-size="12">${
          error instanceof Error ? error.message : 'Unknown error'
        }</text>
      </svg>
    `;
  }
}
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configure multer for file uploads
const stepUpload = multer({
  dest: './uploads/step-uploads',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only STEP files
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.stp' || ext === '.step') {
      cb(null, true)
    } else {
      cb(new Error('Only STEP files are allowed') as any, false)
    }
  }
})

// Configure multer for STL file uploads
const stlUpload = multer({
  dest: './uploads/stl-uploads',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only STL files
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.stl') {
      cb(null, true)
    } else {
      cb(new Error('Only STL files are allowed') as any, false)
    }
  }
})

// Configure multer for 2D CAD file uploads (DXF/DWG)
const cadUpload = multer({
  dest: './uploads/cad-uploads',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only DXF/DWG files
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.dxf' || ext === '.dwg') {
      cb(null, true)
    } else {
      cb(new Error('Only DXF or DWG files are allowed') as any, false)
    }
  }
})

// Simple STEP file parser to extract metadata
function extractStepMetadata (filePath: string): any {
  try {
    // Read first few lines of the file to extract header information
    const header = fs.readFileSync(filePath, 'utf8').slice(0, 8000)

    // Parsing STEP file header
    const formatMatch = header.match(/FILE_SCHEMA\s*\(\s*\(\s*'(.+?)'/i)
    const format = formatMatch
      ? formatMatch[1].includes('AP214')
        ? 'STEP AP214'
        : formatMatch[1].includes('AP203')
        ? 'STEP AP203'
        : formatMatch[1].includes('AP242')
        ? 'STEP AP242'
        : 'STEP'
      : 'STEP'

    const sourceSystemMatch = header.match(/originating_system\s*\>\s*'(.+?)'/i)
    const sourceSystem = sourceSystemMatch ? sourceSystemMatch[1] : 'Unknown'

    // Extract more information if available
    const authorMatch = header.match(/author\s*\>\s*\(\s*'(.+?)'\s*\)/i)
    const author = authorMatch && authorMatch[1] ? authorMatch[1] : 'Unknown'

    const organizationMatch = header.match(
      /organization\s*\>\s*\(\s*'(.+?)'\s*\)/i
    )
    const organization =
      organizationMatch && organizationMatch[1]
        ? organizationMatch[1]
        : 'Unknown'

    // Counting entities more reliably
    // These are simplified estimates based on file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const partMatches = fileContent.match(/MANIFOLD_SOLID_BREP/g) || []
    const parts = partMatches.length > 0 ? partMatches.length : 5

    const assemblyMatches =
      fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE/g) || []
    const assemblies = assemblyMatches.length > 0 ? assemblyMatches.length : 2

    const surfaceMatches = fileContent.match(/B_SPLINE_SURFACE/g) || []
    const surfaces = surfaceMatches.length > 0 ? surfaceMatches.length : 10

    const solidMatches =
      fileContent.match(/BREP_WITH_VOIDS|MANIFOLD_SOLID_BREP/g) || []
    const solids = solidMatches.length > 0 ? solidMatches.length : 5

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
        partNumber: 'STEP-' + nanoid(6).toUpperCase(),
        revision: 'A'
      }
    }
  } catch (error) {
    console.error('Error parsing STEP file:', error)
    return {
      format: 'Unknown STEP Format',
      sourceSystem: 'Unknown',
      parts: 1,
      assemblies: 1,
      surfaces: 1,
      solids: 1,
      properties: {
        author: 'Unknown',
        organization: 'Unknown',
        partNumber: 'STEP-' + nanoid(6).toUpperCase(),
        revision: 'A'
      }
    }
  }
}

// Konwertuj plik STEP do formatu STL przy użyciu skryptu FreeCAD
// Zastępca dla funkcji konwertującej STEP do STL
// Ponieważ nie mamy dostępu do FreeCAD, używamy silnika JavaScript do renderowania
async function convertStepToStl (stepFilePath: string): Promise<string | null> {
  return new Promise(resolve => {
    try {
      if (!fs.existsSync(stepFilePath)) {
        console.error('STEP file does not exist:', stepFilePath)
        return resolve(null)
      }

      // Tutaj w normalnych warunkach wykonalibyśmy faktyczną konwersję
      // Bez dostępu do FreeCAD, zwracamy null i zdajemy się na bezpośrednie parsowanie
      // pliku STEP przez silnik JavaScript w przeglądarce
      console.log(
        `Skip conversion: FreeCAD not available. Will use direct STEP parsing.`
      )

      // Symulujemy opóźnienie konwersji
      setTimeout(() => {
        resolve(null)
      }, 500)
    } catch (error) {
      console.error('Error in convertStepToStl:', error)
      resolve(null)
    }
  })
}

// Generate a model tree from STEP file
function generateModelTree (filename: string, filePath?: string): any {
  try {
    const modelId = nanoid(8)

    // If we have a file path, try to extract a more meaningful structure
    if (filePath && fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8')

      // Simplified extraction of assembly and part names
      // Look for product definitions in STEP file
      const assemblyMatches =
        fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/g) || []
      const assemblies = assemblyMatches.map(match => {
        const name = match.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/)
        return name ? name[1] : `Assembly_${nanoid(4)}`
      })

      // Look for solid breps that often represent parts
      const partMatches =
        fileContent.match(/MANIFOLD_SOLID_BREP\('([^']+)'/g) || []
      const parts = partMatches.map(match => {
        const name = match.match(/MANIFOLD_SOLID_BREP\('([^']+)'/)
        return name ? name[1] : `Part_${nanoid(4)}`
      })

      // If we found meaningful structures, build a tree
      if (assemblies.length > 0 || parts.length > 0) {
        const tree = {
          id: modelId,
          name: filename,
          type: 'model',
          children: [] as any[]
        }

        // Add assemblies first
        assemblies.forEach((assembly, index) => {
          const assemblyNode = {
            id: `${modelId}-assembly-${index + 1}`,
            name: assembly,
            type: 'assembly',
            children: [] as any[]
          }

          // Assign some parts to each assembly
          const partsPerAssembly = Math.max(
            1,
            Math.floor(parts.length / (assemblies.length || 1))
          )
          const startIdx = index * partsPerAssembly
          const endIdx = Math.min(startIdx + partsPerAssembly, parts.length)

          for (let i = startIdx; i < endIdx; i++) {
            assemblyNode.children.push({
              id: `${modelId}-part-${i + 1}`,
              name: parts[i],
              type: 'part'
            })
          }

          tree.children.push(assemblyNode)
        })

        // If there are no assemblies, add parts directly to the root
        if (assemblies.length === 0 && parts.length > 0) {
          parts.forEach((part, index) => {
            tree.children.push({
              id: `${modelId}-part-${index + 1}`,
              name: part,
              type: 'part'
            })
          })
        }

        return tree
      }
    }

    // Fallback to a default structure if parsing failed or no file path
    return {
      id: modelId,
      name: filename,
      type: 'model',
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: 'Main Assembly',
          type: 'assembly',
          children: [
            { id: `${modelId}-part-1`, name: 'Component_1', type: 'part' },
            { id: `${modelId}-part-2`, name: 'Component_2', type: 'part' },
            { id: `${modelId}-part-3`, name: 'Component_3', type: 'part' }
          ]
        }
      ]
    }
  } catch (error) {
    console.error('Error generating model tree:', error)

    // Return a minimal tree on error
    const modelId = nanoid(8)
    return {
      id: modelId,
      name: filename,
      type: 'model',
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: 'Assembly',
          type: 'assembly',
          children: [{ id: `${modelId}-part-1`, name: 'Part_1', type: 'part' }]
        }
      ]
    }
  }
}

// Helper function to detect language from Accept-Language header
function detectLanguageFromHeader (
  acceptLanguageHeader?: string
): string | null {
  if (!acceptLanguageHeader) return null

  // Parse Accept-Language header - format like 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7'
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, quality] = lang.trim().split(';')
      return {
        code: code.split('-')[0], // Get primary language code
        quality: quality ? parseFloat(quality.split('=')[1]) : 1.0 // Default quality is 1.0
      }
    })
    .sort((a, b) => b.quality - a.quality) // Sort by quality

  // Return highest quality language that we support
  const supportedLanguages = ['en', 'pl', 'cs', 'de', 'fr']
  for (const lang of languages) {
    if (supportedLanguages.includes(lang.code)) {
      return lang.code
    }
  }

  return null
}

export async function registerRoutes (app: Express): Promise<Server> {
  // Upewnij się, że katalogi do przechowywania plików istnieją
  try {
    fs.mkdirSync('./uploads', { recursive: true })
    fs.mkdirSync('./uploads/step-uploads', { recursive: true })
    fs.mkdirSync('./uploads/stl-uploads', { recursive: true })
    fs.mkdirSync('./uploads/cad-uploads', { recursive: true })
    console.log('Upload directories created successfully')
  } catch (error) {
    console.error('Error creating upload directories:', error)
  }

  // Konfiguracja autoryzacji i endpointów logowania/rejestracji
  setupAuth(app)

  // Obsługa statycznych plików z folderu public
  const staticMiddleware = express.static('public')
  app.use(staticMiddleware)

  // Inicjalizacja usług e-mail
  try {
    // Inicjalizujemy podstawowy serwis Nodemailer (Ethereal) - tylko do testów
    await initializeEmailService()

    // Sprawdzamy czy możemy zainicjalizować własny serwer SMTP
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    ) {
      const smtpInitialized = initializeCustomSmtpService({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM
      })

      if (smtpInitialized) {
        console.log('Custom SMTP email service initialized successfully')
      }
    } else {
      console.warn(
        'No custom SMTP credentials provided, email notifications will use test service only'
      )
    }
  } catch (error) {
    console.error(
      'Failed to initialize email services, sharing notifications will not work correctly:',
      error
    )
  }

  // Inicjalizacja serwisu S3 dla przechowywania plików
  try {
    const s3Initialized = initializeS3Service()
    if (s3Initialized) {
      console.log('S3 service initialized successfully')
    }
  } catch (error) {
    console.error('Failed to initialize S3 service:', error)
  }

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  // Get user's preferred language based on browser settings
  app.get('/api/language-preference', (req, res) => {
    // Get Accept-Language header
    const acceptLanguage = req.headers['accept-language']
    const detectedLanguage = detectLanguageFromHeader(acceptLanguage)

    // Get IP address
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

    res.json({
      detectedLanguage: detectedLanguage || 'en',
      acceptLanguage: acceptLanguage || '',
      ip: ip
    })
  })

  // Get all models
  app.get('/api/models', async (req: Request, res: Response) => {
    try {
      const models = await storage.getModels()

      // Zwróć tylko podstawowe informacje o modelach
      const modelsList = models.map(model => ({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        conversionStatus: (model.metadata as any)?.conversionStatus || 'unknown'
      }))

      res.json(modelsList)
    } catch (error) {
      console.error('Error getting models list:', error)
      res.status(500).json({ message: 'Failed to get models list' })
    }
  })

  // Upload STEP file
  app.post(
    '/api/models/upload',
    stepUpload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' })
        }

        const file = req.file
        const stats = fs.statSync(file.path)

        // Extract metadata from the STEP file
        const metadata = extractStepMetadata(file.path)

        // Sprawdź, czy przekazano e-mail i autoShare w parametrach URL
        const userEmail = (req.query.email as string) || null
        const autoShare = req.query.autoShare !== 'false' // Domyślnie true (udostępniaj automatycznie), chyba że przekazano false

        console.log(`[DEBUG STEP] Parametry żądania:`, {
          queryEmail: req.query.email,
          normalizedEmail: userEmail,
          autoShare: autoShare,
          authenticated: req.isAuthenticated(),
          userId: req.user?.id,
          userEmail: req.user?.email,
          file: file.originalname,
          size: stats.size
        })

        // Jeśli email jest podany i użytkownik nie jest zalogowany, sprawdź czy istnieje taki użytkownik
        if (userEmail && !req.isAuthenticated()) {
          console.log(
            `[DEBUG STEP] Sprawdzam email ${userEmail} dla niezalogowanego użytkownika`
          )

          // Spróbuj znaleźć użytkownika o podanym e-mailu
          const user = await storage.getUserByEmail(userEmail)

          console.log(`[DEBUG STEP] Wynik sprawdzenia:`, {
            emailExists: !!user,
            userId: user?.id,
            username: user?.username,
            isClient: user?.isClient,
            isAdmin: user?.isAdmin
          })

          // Jeśli użytkownik o podanym e-mailu istnieje, ale ktoś próbuje przesłać plik nie będąc zalogowanym
          // na to konto, blokujemy taką operację
          if (user) {
            console.log(
              `[DEBUG STEP] Blokuję dostęp dla emaila ${userEmail}, który należy do istniejącego użytkownika (ID: ${user.id})`
            )

            // Usuwamy plik tymczasowy, aby nie zaśmiecać serwera
            if (file && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path)
              console.log(`[DEBUG STEP] Usunięto plik tymczasowy: ${file.path}`)
            }

            return res.status(403).json({
              message:
                'Adres email jest już zarejestrowany w systemie. Zaloguj się, aby przesłać plik.',
              emailExists: true
            })
          }
        }

        // Pobierz klienta po e-mailu, jeśli podano
        let userId = 1 // Domyślny użytkownik, jeśli nie znaleziono klienta
        let shareEmail = null

        if (req.isAuthenticated()) {
          // Użyj zalogowanego użytkownika
          userId = req.user.id
          shareEmail = req.user.email
        } else if (userEmail) {
          // Przypisujemy email ze sprawdzonego wcześniej parametru URL
          shareEmail = userEmail
        }

        // Przesyłanie pliku do S3 (jeśli skonfigurowane)
        let filePath = file.path
        let s3Key = null

        if (s3Service.isInitialized()) {
          try {
            s3Key = s3Service.generateS3Key(userId, file.originalname, 'step')
            await s3Service.uploadFile(file.path, s3Key, 'application/step')
            console.log(`STEP file uploaded to S3: ${s3Key}`)
          } catch (s3Error) {
            console.error(
              'Failed to upload STEP file to S3, using local storage:',
              s3Error
            )
            // Kontynuujemy z lokalnym przechowywaniem w przypadku błędu S3
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
          // Ustawienie shareEnabled na podstawie parametru autoShare
          shareEnabled: autoShare && req.isAuthenticated(), // Tylko dla zalogowanych użytkowników włączamy autoShare
          metadata: {
            ...metadata,
            filePath: filePath, // Store the file path for later processing
            s3Key: s3Key, // Dodajemy klucz S3 do metadanych
            conversionStatus: 'pending',
            userEmail: userEmail, // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
            autoShare: autoShare // Zapisz informację o autoShare w metadanych
          }
        }

        const validatedData = insertModelSchema.parse(modelData)
        const model = await storage.createModel(validatedData)

        // Return model data immediately
        res.status(201).json({
          id: model.id,
          filename: model.filename,
          filesize: model.filesize,
          format: model.format,
          created: model.created
        })

        // Konwersja STEP do STL w tle, bez blokowania odpowiedzi
        ;(async () => {
          try {
            console.log(
              `Starting background conversion for model ID ${model.id}`
            )

            // Konwertuj plik STEP do STL
            const stlFilePath = await convertStepToStl(file.path)

            // Zaktualizuj rekord modelu o ścieżkę do pliku STL i status konwersji
            if (stlFilePath && fs.existsSync(stlFilePath)) {
              const updatedMetadata = {
                ...(model.metadata as object),
                stlFilePath,
                conversionStatus: 'completed',
                conversionTime: new Date().toISOString()
              }

              await storage.updateModel(model.id, {
                metadata: updatedMetadata
              })

              console.log(
                `Conversion completed successfully for model ID ${model.id}`
              )

              // Automatyczne generowanie miniatur wyłączone - użytkownicy mogą generować ręcznie w galerii
              console.log(
                `Model uploaded without automatic thumbnail generation. Model ID: ${model.id}`
              )
            } else {
              // Konwersja nie powiodła się
              const updatedMetadata = {
                ...(model.metadata as object),
                conversionStatus: 'failed',
                conversionError: 'STL file was not created'
              }

              await storage.updateModel(model.id, {
                metadata: updatedMetadata
              })

              console.error(`Conversion failed for model ID ${model.id}`)
            }
          } catch (error) {
            console.error(
              `Error in background conversion for model ID ${model.id}:`,
              error
            )

            // Oznacz konwersję jako nieudaną
            const updatedMetadata = {
              ...(model.metadata as object),
              conversionStatus: 'failed',
              conversionError:
                error instanceof Error ? error.message : 'Unknown error'
            }

            await storage.updateModel(model.id, {
              metadata: updatedMetadata
            })
          }
        })()
      } catch (error) {
        console.error('Error uploading model:', error)
        res.status(500).json({ message: 'Failed to upload model' })
      }
    }
  )

  // Get model basic data (by numeric ID for authenticated users)
  app.get('/api/models/by-id/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Użyj funkcji hasAccessToModel do sprawdzenia dostępu do modelu
      const hasAccess = await hasAccessToModel(req, id)

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      res.json(model)
    } catch (error) {
      console.error('Error getting model:', error)
      res.status(500).json({ message: 'Failed to get model' })
    }
  })

  // Get model info (for ModelViewer component)
  app.get('/api/models/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Użyj funkcji hasAccessToModel do sprawdzenia dostępu do modelu
      const hasAccess = await hasAccessToModel(req, id)

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      const metadata = model.metadata as any

      const modelInfo = {
        id: model.id,
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
        shareEnabled: model.shareEnabled || false,
        shareId: model.shareId,
        hasPassword: !!model.sharePassword,
        tags: model.tags || []
      }

      res.json(modelInfo)
    } catch (error) {
      console.error('Error getting model:', error)
      res.status(500).json({ message: 'Failed to get model' })
    }
  })

  // Get model detailed info
  app.get('/api/models/:id/info', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Użyj funkcji hasAccessToModel do sprawdzenia dostępu do modelu
      const hasAccess = await hasAccessToModel(req, id)

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      const metadata = model.metadata as any

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
        hasPassword: !!model.sharePassword,
        tags: model.tags || []
      }

      res.json(modelInfo)
    } catch (error) {
      console.error('Error getting model info:', error)
      res.status(500).json({ message: 'Failed to get model info' })
    }
  })

  // Get public model info from library (without authentication) - use different path
  app.get(
    '/api/public/models/:publicId',
    async (req: Request, res: Response) => {
      try {
        const publicId = req.params.publicId
        const model = await storage.getModelByPublicId(publicId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Sprawdź czy model jest publiczny w bibliotece
        if (!model.isPublic) {
          return res.status(403).json({
            message: 'This model is not available in the public library'
          })
        }

        const metadata = model.metadata as any

        const modelInfo = {
          id: model.id,
          filename: model.filename,
          filesize: model.filesize,
          format: model.format,
          created: model.created,
          sourceSystem: model.sourceSystem,
          categoryId: model.categoryId,
          parts: metadata?.parts,
          assemblies: metadata?.assemblies,
          surfaces: metadata?.surfaces,
          solids: metadata?.solids,
          properties: metadata?.properties,
          isPublic: model.isPublic,
          requiresPassword: false // Publiczne modele nie wymagają hasła
        }

        res.json(modelInfo)
      } catch (error) {
        console.error('Error getting public model info:', error)
        res.status(500).json({ message: 'Failed to get model info' })
      }
    }
  )

  // Get public model gallery by publicId
  app.get(
    '/api/public/models/:publicId/gallery',
    async (req: Request, res: Response) => {
      try {
        const publicId = req.params.publicId
        const model = await storage.getModelByPublicId(publicId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Sprawdź czy model jest publiczny
        if (!model.isPublic) {
          return res.status(403).json({
            message: 'This model is not available in the public library'
          })
        }

        // Pobierz galerię obrazów dla tego modelu
        const galleryImages = await storage.getModelGallery(model.id)
        res.json(galleryImages)
      } catch (error) {
        console.error('Error getting public model gallery:', error)
        res.status(500).json({ message: 'Failed to get model gallery' })
      }
    }
  )

  // Get public model description by publicId
  app.get(
    '/api/public/models/:publicId/description',
    async (req: Request, res: Response) => {
      try {
        const publicId = req.params.publicId
        const model = await storage.getModelByPublicId(publicId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Sprawdź czy model jest publiczny
        if (!model.isPublic) {
          return res.status(403).json({
            message: 'This model is not available in the public library'
          })
        }

        // Pobierz opis modelu
        const description = await storage.getModelDescription(model.id)
        res.json(description)
      } catch (error) {
        console.error('Error getting public model description:', error)
        res.status(500).json({ message: 'Failed to get model description' })
      }
    }
  )

  // Get public model file by publicId
  app.get(
    '/api/public/models/:publicId/file',
    async (req: Request, res: Response) => {
      try {
        const publicId = req.params.publicId
        const model = await storage.getModelByPublicId(publicId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Sprawdź czy model jest publiczny
        if (!model.isPublic) {
          return res.status(403).json({
            message: 'This model is not available in the public library'
          })
        }

        const metadata = model.metadata as any
        const filePath = metadata?.filePath
        const s3Key = metadata?.s3Key

        // Jeśli plik jest w S3, pobierz go i przekaż do przeglądarki
        if (s3Key && s3Service.isInitialized()) {
          try {
            const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600)

            // Pobierz plik z S3 i przekaż do przeglądarki
            const response = await fetch(signedUrl)
            if (response.ok) {
              res.setHeader('Content-Type', 'application/step')
              res.setHeader(
                'Content-Disposition',
                `attachment; filename="${model.filename}"`
              )

              // Przekonwertuj ReadableStream na Buffer i wyślij
              const arrayBuffer = await response.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              res.send(buffer)
              return
            }
          } catch (error) {
            console.error('Error downloading from S3:', error)
            // Kontynuuj z lokalnym plikiem jeśli S3 nie działa
          }
        }

        // Fallback do lokalnego pliku
        if (!filePath || !fs.existsSync(filePath)) {
          return res.status(404).json({ message: 'Model file not found' })
        }

        res.setHeader('Content-Type', 'application/step')
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${model.filename}"`
        )
        fs.createReadStream(filePath).pipe(res)
      } catch (error) {
        console.error('Error serving public model file:', error)
        res.status(500).json({ message: 'Failed to serve model file' })
      }
    }
  )

  // Check if model has thumbnail (HEAD request)
  app.head('/api/models/:id/thumbnail', async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id)
      const model = await storage.getModel(modelId)

      if (!model) {
        return res.status(404).end()
      }

      // Sprawdź czy model ma miniaturkę w metadata
      const metadata = model.metadata as any
      const thumbnailPath = metadata?.thumbnailPath

      if (thumbnailPath && s3Service.isInitialized()) {
        // Check if exists in S3
        try {
          await s3Service.getSignedDownloadUrl(thumbnailPath, 3600)
          res.status(200).end()
          return
        } catch (s3Error) {
          console.error('Failed to check thumbnail in S3:', s3Error)
        }
      }

      // Check local file
      const localThumbnailPath = getThumbnailPath(modelId)
      if (fs.existsSync(localThumbnailPath)) {
        res.status(200).end()
        return
      }

      return res.status(404).end()
    } catch (error) {
      console.error('Error checking thumbnail:', error)
      res.status(500).end()
    }
  })

  // Get model thumbnail
  app.get('/api/models/:id/thumbnail', async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id)
      const model = await storage.getModel(modelId)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Sprawdź czy model ma miniaturkę w metadata
      const metadata = model.metadata as any
      const thumbnailPath = metadata?.thumbnailPath

      if (thumbnailPath && s3Service.isInitialized()) {
        // Serve from S3
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(
            thumbnailPath,
            3600
          )
          res.redirect(signedUrl)
          return
        } catch (s3Error) {
          console.error('Failed to get thumbnail from S3:', s3Error)
        }
      }

      // Fallback do lokalnego pliku
      const localThumbnailPath = getThumbnailPath(modelId)
      if (fs.existsSync(localThumbnailPath)) {
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=86400')
        fs.createReadStream(localThumbnailPath).pipe(res)
        return
      }

      return res.status(404).json({ message: 'Thumbnail not found' })
    } catch (error) {
      console.error('Error serving thumbnail:', error)
      res.status(500).json({ message: 'Failed to serve thumbnail' })
    }
  })

  // Upload custom model thumbnail
  const thumbnailUpload = multer({
    dest: 'uploads/temp-thumbnails/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('Only image files are allowed'))
      }
    }
  })

  // Gallery upload configuration using memory storage
  const galleryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('Only image files are allowed'))
      }
    }
  })

  app.post(
    '/api/models/:id/thumbnail',
    thumbnailUpload.single('thumbnail'),
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.id)
        const file = req.file

        if (!file) {
          return res.status(400).json({ message: 'No thumbnail file provided' })
        }

        // Sprawdź czy użytkownik ma dostęp do modelu
        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' })
        }

        // Przenieś plik do odpowiedniego katalogu
        const thumbnailPath = getThumbnailPath(modelId)
        const thumbnailDir = path.dirname(thumbnailPath)

        // Upewnij się że katalog istnieje
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true })
        }

        // Przenieś plik i usuń stary jeśli istnieje
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath)
        }

        // Dodaj screenshot do galerii jeśli pochodz z przeglądarki 3D PRZED usunięciem pliku
        let galleryImageId = null
        try {
          // Sprawdź czy to jest screenshot z przeglądarki (na podstawie nazwy pliku)
          if (file.originalname === 'screenshot.png') {
            // Upload do S3 jeśli jest dostępne (używamy oryginalnego pliku przed jego usunięciem)
            let s3Key = null
            if (s3Service.isInitialized()) {
              try {
                const s3Path = `thumbnails/${modelId}/screenshot_${Date.now()}.png`
                s3Key = await s3Service.uploadFile(
                  file.path,
                  s3Path,
                  'image/png'
                )
                console.log(`Screenshot uploaded to S3: ${s3Key}`)
              } catch (s3Error) {
                console.error('Failed to upload screenshot to S3:', s3Error)
              }
            }

            // Dodaj screenshot do galerii modelu (bez automatycznego ustawiania jako miniaturka)
            const galleryImage = await storage.addGalleryImage({
              modelId: modelId,
              filename: `screenshot_${Date.now()}.png`,
              originalName: 'Screenshot',
              filesize: file.size,
              mimeType: 'image/png',
              displayOrder: 1,
              isThumbnail: false,
              s3Key: s3Key
            })

            galleryImageId = galleryImage.id
            console.log(
              `Screenshot added to gallery with ID: ${galleryImageId}`
            )
          }
        } catch (galleryError) {
          console.error('Failed to add screenshot to gallery:', galleryError)
          // Kontynuuj bez dodawania do galerii
        }

        fs.copyFileSync(file.path, thumbnailPath)
        fs.unlinkSync(file.path) // Usuń tymczasowy plik po przetworzeniu

        console.log(`Custom thumbnail uploaded for model ${modelId}`)

        res.json({
          success: true,
          message: 'Thumbnail uploaded successfully',
          thumbnailUrl: `/api/models/${modelId}/thumbnail`,
          galleryImageId: galleryImageId
        })
      } catch (error) {
        console.error('Error uploading thumbnail:', error)
        res.status(500).json({ message: 'Failed to upload thumbnail' })
      }
    }
  )

  // Get model tree structure
  app.get('/api/models/:id/tree', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Użyj funkcji hasAccessToModel do sprawdzenia dostępu do modelu
      const hasAccess = await hasAccessToModel(req, id)

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      // Generate a model tree from the STEP file
      const metadata = model.metadata as any
      const filePath = metadata?.filePath
      const modelTree = generateModelTree(model.filename, filePath)

      res.json(modelTreeSchema.parse(modelTree))
    } catch (error) {
      console.error('Error getting model tree:', error)
      res.status(500).json({ message: 'Failed to get model tree' })
    }
  })

  // Get STEP file for viewing
  app.get('/api/models/:id/file', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Użyj funkcji hasAccessToModel do sprawdzenia dostępu do modelu
      const hasAccess = await hasAccessToModel(req, id)

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      const metadata = model.metadata as any
      const filePath = metadata?.filePath
      const s3Key = metadata?.s3Key

      // Jeśli plik jest w S3, pobierz go i przekaż do przeglądarki
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600)

          // Pobierz plik z S3 i przekaż do przeglądarki
          const response = await fetch(signedUrl)
          if (response.ok) {
            res.setHeader('Content-Type', 'application/step')
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="${model.filename}"`
            )

            // Przekonwertuj ReadableStream na Buffer i wyślij
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            res.send(buffer)
            return
          }
        } catch (s3Error) {
          console.error('Failed to get file from S3:', s3Error)
          // Kontynuuj próbę lokalnego pliku
        }
      }

      // Fallback do lokalnego pliku
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' })
      }

      res.setHeader('Content-Type', 'application/step')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${model.filename}"`
      )
      fs.createReadStream(filePath).pipe(res)
    } catch (error) {
      console.error('Error serving model file:', error)
      res.status(500).json({ message: 'Failed to serve model file' })
    }
  })

  // Get STL file for 3D viewing (if converted)
  app.get('/api/models/:id/stl', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Użyj funkcji hasAccessToModel do sprawdzenia dostępu do modelu
      const hasAccess = await hasAccessToModel(req, id)

      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      const metadata = model.metadata as any
      const stlFilePath = metadata?.stlFilePath
      const s3Key = metadata?.s3Key

      // Jeśli plik jest w S3, pobierz go i przekaż do przeglądarki
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600)

          // Pobierz plik z S3 i przekaż do przeglądarki
          const response = await fetch(signedUrl)
          if (response.ok) {
            res.setHeader('Content-Type', 'application/octet-stream')
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="${path.basename(
                model.filename,
                path.extname(model.filename)
              )}.stl"`
            )

            // Przekonwertuj ReadableStream na Buffer i wyślij
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            res.send(buffer)
            return
          }
        } catch (s3Error) {
          console.error('Failed to get STL file from S3:', s3Error)
          // Kontynuuj próbę lokalnego pliku
        }
      }

      // Fallback do lokalnego pliku
      if (!stlFilePath || !fs.existsSync(stlFilePath)) {
        return res.status(404).json({ message: 'STL file not found' })
      }

      // Ustaw nagłówki dla pliku STL
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.basename(
          model.filename,
          path.extname(model.filename)
        )}.stl"`
      )

      // Wyślij plik jako strumień
      fs.createReadStream(stlFilePath).pipe(res)
    } catch (error) {
      console.error('Error serving STL file:', error)
      res.status(500).json({ message: 'Failed to serve STL file' })
    }
  })

  // Get STEP file for 3D viewing (if available)
  // Add this endpoint near your STL endpoint

  app.get('/api/models/:id/step', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Check access
      const hasAccess = await hasAccessToModel(req, id)
      if (!hasAccess) {
        return res.status(403).json({
          message:
            "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        })
      }

      const metadata = model.metadata as any
      const stepFilePath = metadata?.filePath
      const s3Key = metadata?.s3Key

      // Serve from S3 if available
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600)
          const response = await fetch(signedUrl)
          if (response.ok) {
            res.setHeader('Content-Type', 'application/step')
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="${model.filename}"`
            )
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            res.send(buffer)
            return
          }
        } catch (s3Error) {
          console.error('Failed to get STEP file from S3:', s3Error)
          // Fallback to local file
        }
      }

      // Fallback to local file
      if (!stepFilePath || !fs.existsSync(stepFilePath)) {
        return res.status(404).json({ message: 'STEP file not found' })
      }

      res.setHeader('Content-Type', 'application/step')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${model.filename}"`
      )
      fs.createReadStream(stepFilePath).pipe(res)
    } catch (error) {
      console.error('Error serving STEP file:', error)
      res.status(500).json({ message: 'Failed to serve STEP file' })
    }
  })
  // Konwertowanie pliku DXF do formatu SVG i zwracanie wyniku
app.get('/api/models/:id/svg', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const model = await storage.getModel(id);

    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    if (model.format !== 'DXF' && model.format !== 'DWG') {
      return res.status(400).json({
        message: 'SVG conversion is only available for DXF/DWG files',
        format: model.format,
      });
    }

    const metadata = model.metadata as any;
    let filePath = metadata?.filePath; // Neutral name for both DWG and DXF
    const s3Key = metadata?.s3Key;

    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
      console.log(`Created temp directory: ${tmpDir}`);
    }

    // If file is in S3, download it
    if (s3Key && s3Service.isInitialized()) {
      try {
        const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600);
        const response = await fetch(signedUrl);

        if (response.ok) {
          const tempFilePath = path.join(tmpDir, `dxf_temp_${Date.now()}.${model.format.toLowerCase()}`);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Write file with proper error handling
          try {
            fs.writeFileSync(tempFilePath, buffer);
            console.log(`File successfully written to: ${tempFilePath}`);
            filePath = tempFilePath;
          } catch (writeError) {
            console.error('File write failed:', {
              error: writeError,
              path: tempFilePath,
              bufferLength: buffer.length,
            });
            throw new Error('Failed to write downloaded file');
          }
        } else {
          throw new Error(`S3 download failed: ${response.status}`);
        }
      } catch (s3Error) {
        console.error('S3 download error:', s3Error);
        // Continue with local file if available
      }
    }

    // Verify file exists
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'DXF/DWG file not found',
        path: filePath,
      });
    }

    // Convert to SVG
    let svgContent: string | null = null;
    if (model.format === 'DXF') {
      console.log('convertiing....DXF');
      svgContent = await convertDxfToSvg(filePath);
    } else if (model.format === 'DWG') {
      console.log('convertiing....DWG');
      svgContent = await convertDwgToSvg(filePath);
      console.log('converted....DWG', svgContent);
    } else {
      return res.status(400).json({
        message: 'Unsupported file format for SVG conversion',
        format: model.format,
      });
    }

    // Cleanup temp file if from S3
    if (s3Key && filePath.startsWith(tmpDir)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      } catch (cleanupError) {
        console.warn('Temp file cleanup failed:', cleanupError);
      }
    }

    if (!svgContent) {
      return res.status(500).json({ message: 'Conversion to SVG failed' });
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svgContent);
  } catch (error: any) {
    console.error('Endpoint error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
});
  // Upload STL file directly (for testing)
  app.post(
    '/api/models/upload-stl',
    stlUpload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' })
        }

        const file = req.file
        const stats = fs.statSync(file.path)

        // Sprawdź, czy przekazano e-mail i autoShare w parametrach URL
        const userEmail = (req.query.email as string) || null
        const autoShare = req.query.autoShare === 'true' // Domyślnie false (nie udostępniaj automatycznie), chyba że przekazano true

        console.log(`[DEBUG STL] Parametry żądania:`, {
          queryEmail: req.query.email,
          normalizedEmail: userEmail,
          autoShare: autoShare,
          authenticated: req.isAuthenticated(),
          userId: req.user?.id,
          userEmail: req.user?.email,
          file: file.originalname,
          size: stats.size
        })

        // Jeśli email jest podany i użytkownik nie jest zalogowany, sprawdź czy istnieje taki użytkownik
        if (userEmail && !req.isAuthenticated()) {
          console.log(
            `[DEBUG STL] Sprawdzam email ${userEmail} dla niezalogowanego użytkownika`
          )

          // Spróbuj znaleźć użytkownika o podanym e-mailu
          const user = await storage.getUserByEmail(userEmail)

          console.log(`[DEBUG STL] Wynik sprawdzenia:`, {
            emailExists: !!user,
            userId: user?.id,
            username: user?.username,
            isClient: user?.isClient,
            isAdmin: user?.isAdmin
          })

          // Jeśli użytkownik o podanym e-mailu istnieje, ale ktoś próbuje przesłać plik nie będąc zalogowanym
          // na to konto, blokujemy taką operację
          if (user) {
            console.log(
              `[DEBUG STL] Blokuję dostęp dla emaila ${userEmail}, który należy do istniejącego użytkownika (ID: ${user.id})`
            )

            // Usuwamy plik tymczasowy, aby nie zaśmiecać serwera
            if (file && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path)
              console.log(`[DEBUG STL] Usunięto plik tymczasowy: ${file.path}`)
            }

            return res.status(403).json({
              message:
                'Adres email jest już zarejestrowany w systemie. Zaloguj się, aby przesłać plik.',
              emailExists: true
            })
          }
        }

        // Sprawdź, czy użytkownik jest zalogowany
        let userId = req.isAuthenticated() ? req.user.id : 1 // Jeśli zalogowany, użyj ID zalogowanego użytkownika
        let shareEmail = null

        if (req.isAuthenticated()) {
          // Użyj danych zalogowanego użytkownika
          shareEmail = req.user.email
        } else if (userEmail) {
          // Przypisujemy email ze sprawdzonego wcześniej parametru URL
          shareEmail = userEmail
        }

        // Sprawdź czy plik STL jest w formacie binarnym czy ASCII
        let isSTLBinary = false
        try {
          // Przeczytaj pierwsze 5 bajtów aby określić format
          const buffer = Buffer.alloc(5)
          const fd = fs.openSync(file.path, 'r')
          fs.readSync(fd, buffer, 0, 5, 0)
          fs.closeSync(fd)

          // Pliki binarne STL zwykle zaczynają się od "solid" dla ASCII lub innych bajtów dla binarnych
          const signature = buffer.toString('utf8', 0, 5)
          isSTLBinary = signature.toLowerCase() !== 'solid'

          console.log(
            `Detected STL format for ${file.originalname}: ${
              isSTLBinary ? 'Binary' : 'ASCII'
            }`
          )
        } catch (formatError) {
          console.error('Error detecting STL format:', formatError)
          // Domyślnie zakładamy format binarny w przypadku błędu
          isSTLBinary = true
        }

        // Ustawianie shareEnabled na podstawie parametru autoShare
        const isOwner = req.isAuthenticated()
        const shareId = nanoid(10) // Zawsze generujemy shareId, ale włączamy udostępnianie tylko jeśli autoShare = true

        // Przesyłanie pliku do S3 (jeśli skonfigurowane)
        let filePath = file.path
        let s3Key = null

        if (s3Service.isInitialized()) {
          try {
            s3Key = s3Service.generateS3Key(userId, file.originalname, 'stl')
            await s3Service.uploadFile(
              file.path,
              s3Key,
              'application/octet-stream'
            )
            filePath = s3Key // Używamy klucza S3 jako ścieżki
            console.log(`STL file uploaded to S3: ${s3Key}`)
          } catch (s3Error) {
            console.error(
              'Failed to upload to S3, using local storage:',
              s3Error
            )
            // Kontynuujemy z lokalnym przechowywaniem w przypadku błędu S3
          }
        }

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
          // Ustawienie shareEnabled na podstawie parametru autoShare
          shareEnabled: autoShare && req.isAuthenticated(), // Tylko dla zalogowanych użytkowników włączamy autoShare
          metadata: {
            filePath: filePath,
            stlFilePath: filePath, // For STL direct upload, the original file is also the STL file
            s3Key: s3Key, // Dodajemy klucz S3 do metadanych
            isDirectStl: true,
            stlFormat: isSTLBinary ? 'binary' : 'ascii', // Dodajemy informację o formacie STL
            parts: 1,
            assemblies: 1,
            surfaces: 10,
            solids: 1,
            userEmail: shareEmail, // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
            properties: {
              author: shareEmail || 'User',
              organization: req.isAuthenticated()
                ? req.user.company || 'Direct Upload'
                : 'Direct Upload',
              partNumber: 'STL-' + nanoid(6).toUpperCase(),
              revision: 'A'
            }
          }
        }

        // Dodajemy token dostępu do metadanych - dzięki temu niezalogowany użytkownik będzie mógł
        // zobaczyć swój model, ale nie będzie on widoczny w panelu admina jako udostępniony
        const viewToken = nanoid(32) // Generujemy token dostępu

        // Dodajemy token dostępu do metadanych
        const stlMetadata = modelData.metadata as StlModelMetadata
        stlMetadata.viewToken = viewToken
        stlMetadata.s3Key = s3Key // Dodajemy klucz S3
        modelData.metadata = stlMetadata

        // Walidacja i tworzenie modelu
        const validatedData = insertModelSchema.parse(modelData)

        // Tworzymy model przez API storage bez ustawiania shareEnabled na true
        const model = await storage.createModel(validatedData)

        // Zapisujemy token w sesji użytkownika, aby mógł zobaczyć swój model
        if (!req.session.viewTokens) {
          req.session.viewTokens = {}
        }
        req.session.viewTokens[model.id] = viewToken

        // Logujemy token dostępu dla celów diagnostycznych
        console.log(
          `Model ID: ${model.id} przypisany token dostępu: ${viewToken}`
        )
        console.log(
          `Token zapisany w sesji użytkownika: ${
            req.session.viewTokens[model.id]
          }`
        )

        // Pobieramy zaktualizowany model
        const updatedModel = await storage.getModel(model.id)

        if (!updatedModel) {
          throw new Error('Model not found after update')
        }

        // Log upload success
        console.log(
          `STL model uploaded by ${
            isOwner ? 'authenticated user' : 'anonymous user'
          }, ID: ${model.id}, shareEnabled was set to ${
            updatedModel.shareEnabled
          }`
        )

        // Automatyczne generowanie miniatur wyłączone - użytkownicy mogą generować ręcznie w galerii
        console.log(
          `STL model uploaded without automatic thumbnail generation. Model ID: ${model.id}`
        )

        res.status(201).json({
          id: model.id,
          filename: model.filename,
          filesize: model.filesize,
          format: model.format,
          created: model.created,
          isStl: true,
          stlFormat: isSTLBinary ? 'binary' : 'ascii',
          shareEnabled: updatedModel.shareEnabled
        })
      } catch (error) {
        console.error('Error uploading STL model:', error)
        res.status(500).json({ message: 'Failed to upload STL model' })
      }
    }
  )

  // Upload DXF/DWG file
  app.post(
    '/api/models/upload-cad',
    cadUpload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' })
        }

        const file = req.file
        const stats = fs.statSync(file.path)

        // Determine file format based on extension
        const fileExtension = path.extname(file.originalname).toLowerCase()
        const format = fileExtension === '.dxf' ? 'DXF' : 'DWG'

        // Sprawdź, czy przekazano e-mail i autoShare w parametrach URL
        const userEmail = (req.query.email as string) || null
        const autoShare = req.query.autoShare === 'true' // Domyślnie false (nie udostępniaj automatycznie), chyba że przekazano true

        console.log(`[DEBUG CAD] Parametry żądania:`, {
          queryEmail: req.query.email,
          normalizedEmail: userEmail,
          autoShare: autoShare,
          authenticated: req.isAuthenticated(),
          userId: req.user?.id,
          userEmail: req.user?.email,
          file: file.originalname,
          size: stats.size,
          format: format
        })

        // Jeśli email jest podany i użytkownik nie jest zalogowany, sprawdź czy istnieje taki użytkownik
        if (userEmail && !req.isAuthenticated()) {
          console.log(
            `[DEBUG CAD] Sprawdzam email ${userEmail} dla niezalogowanego użytkownika`
          )

          // Spróbuj znaleźć użytkownika o podanym e-mailu
          const user = await storage.getUserByEmail(userEmail)

          console.log(`[DEBUG CAD] Wynik sprawdzenia:`, {
            emailExists: !!user,
            userId: user?.id,
            username: user?.username,
            isClient: user?.isClient,
            isAdmin: user?.isAdmin
          })

          // Jeśli użytkownik o podanym e-mailu istnieje, ale ktoś próbuje przesłać plik nie będąc zalogowanym
          // na to konto, blokujemy taką operację
          if (user) {
            console.log(
              `[DEBUG CAD] Blokuję dostęp dla emaila ${userEmail}, który należy do istniejącego użytkownika (ID: ${user.id})`
            )

            // Usuwamy plik tymczasowy, aby nie zaśmiecać serwera
            if (file && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path)
              console.log(`[DEBUG CAD] Usunięto plik tymczasowy: ${file.path}`)
            }

            return res.status(403).json({
              message:
                'Adres email jest już zarejestrowany w systemie. Zaloguj się, aby przesłać plik.',
              emailExists: true
            })
          }
        }

        // Sprawdź, czy użytkownik jest zalogowany
        let userId = req.isAuthenticated() ? req.user.id : 1 // Jeśli zalogowany, użyj ID zalogowanego użytkownika
        let shareEmail = null

        if (req.isAuthenticated()) {
          // Użyj danych zalogowanego użytkownika
          shareEmail = req.user.email
        } else if (userEmail) {
          // Przypisujemy email ze sprawdzonego wcześniej parametru URL
          shareEmail = userEmail
        }

        // Przesyłanie pliku do S3 (jeśli skonfigurowane)
        let filePath = file.path
        let s3Key = null

        if (s3Service.isInitialized()) {
          try {
            s3Key = s3Service.generateS3Key(userId, file.originalname, 'dxf')
            const mimeType =
              format === 'DXF' ? 'application/dxf' : 'application/dwg'
            await s3Service.uploadFile(file.path, s3Key, mimeType)
            console.log(`${format} file uploaded to S3: ${s3Key}`)
          } catch (s3Error) {
            console.error(
              `Failed to upload ${format} file to S3, using local storage:`,
              s3Error
            )
            // Kontynuujemy z lokalnym przechowywaniem w przypadku błędu S3
          }
        }

        // Ustawianie shareEnabled na podstawie parametru autoShare
        const isOwner = req.isAuthenticated()
        const shareId = nanoid(10) // Zawsze generujemy shareId, ale włączamy udostępnianie tylko jeśli autoShare = true

        // Create model record for 2D CAD file
        const modelData = {
          userId: userId,
          filename: file.originalname,
          filesize: stats.size,
          format: format,
          created: new Date().toISOString(),
          sourceSystem: 'direct_upload',
          shareEmail: shareEmail, // Automatyczne przypisanie e-mail
          // Ustawienie shareEnabled na podstawie parametru autoShare
          shareEnabled: autoShare && req.isAuthenticated(), // Tylko dla zalogowanych użytkowników włączamy autoShare
          shareId: shareId,
          metadata: {
            filePath: filePath,
            s3Key: s3Key, // Dodajemy klucz S3 do metadanych
            fileType: '2d',
            cadFormat: format.toLowerCase(),
            entities: 0, // To be determined by the renderer
            layers: 0, // To be determined by the renderer
            userEmail: shareEmail, // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
            properties: {
              author: shareEmail || 'User',
              organization: req.isAuthenticated()
                ? req.user.company || 'Direct Upload'
                : 'Direct Upload',
              drawingNumber: format + '-' + nanoid(6).toUpperCase(),
              revision: 'A'
            }
          }
        }

        // Dodajemy token dostępu do metadanych - dzięki temu niezalogowany użytkownik będzie mógł
        // zobaczyć swój model, ale nie będzie on widoczny w panelu admina jako udostępniony
        const viewToken = nanoid(32) // Generujemy token dostępu

        // Dodajemy token dostępu do metadanych
        const cadMetadata = modelData.metadata as CadModelMetadata
        cadMetadata.viewToken = viewToken
        modelData.metadata = cadMetadata

        // Walidacja i tworzenie modelu
        const validatedData = insertModelSchema.parse(modelData)

        // Tworzymy model przez API storage bez ustawiania shareEnabled na true dla niezalogowanych użytkowników
        const model = await storage.createModel(validatedData)

        // Zapisujemy token w sesji użytkownika, aby mógł zobaczyć swój model
        if (!req.session.viewTokens) {
          req.session.viewTokens = {}
        }
        req.session.viewTokens[model.id] = viewToken

        // Logujemy token dostępu dla celów diagnostycznych
        console.log(
          `CAD model ID: ${model.id} przypisany token dostępu: ${viewToken}`
        )
        console.log(
          `Token zapisany w sesji użytkownika: ${
            req.session.viewTokens[model.id]
          }`
        )

        // Automatyczne generowanie miniatur wyłączone - użytkownicy mogą generować ręcznie w galerii
        console.log(
          `CAD model uploaded without automatic thumbnail generation. Model ID: ${model.id}`
        )

        res.status(201).json({
          id: model.id,
          filename: model.filename,
          filesize: model.filesize,
          format: model.format,
          created: model.created,
          is2D: true
        })
      } catch (error) {
        console.error('Error uploading CAD model:', error)
        res.status(500).json({ message: 'Failed to upload CAD model' })
      }
    }
  )

  // Delete model
  app.delete('/api/models/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const model = await storage.getModel(id)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Delete the STEP file
      const metadata = model.metadata as any
      const filePath = metadata?.filePath

      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`Deleted STEP file: ${filePath}`)
      }

      // Delete the STL file if it exists
      const stlFilePath = metadata?.stlFilePath
      if (stlFilePath && fs.existsSync(stlFilePath)) {
        fs.unlinkSync(stlFilePath)
        console.log(`Deleted STL file: ${stlFilePath}`)
      }

      // Delete any JSON info file that might have been created
      const jsonFilePath = stlFilePath
        ? path.join(
            path.dirname(stlFilePath),
            `${path.basename(stlFilePath, '.stl')}.json`
          )
        : null

      if (jsonFilePath && fs.existsSync(jsonFilePath)) {
        fs.unlinkSync(jsonFilePath)
        console.log(`Deleted JSON info file: ${jsonFilePath}`)
      }

      // Delete the model record
      await storage.deleteModel(id)

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting model:', error)
      res.status(500).json({ message: 'Failed to delete model' })
    }
  })

  // Endpoint do udostępniania modelu
  app.post('/api/models/:id/share', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid model ID' })
      }

      // Walidacja danych wejściowych
      const shareData = shareModelSchema.parse(req.body)

      // Pobierz model
      const model = await storage.getModel(id)
      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Zmienna do śledzenia, czy utworzono konto
      let accountCreated = false

      // Generowanie unikalnego ID udostępniania
      let shareId = model.shareId

      // Sprawdź czy potrzebujemy wysłać powiadomienie o wycofaniu udostępnienia
      const needsRevocationEmail =
        model.shareEnabled && !shareData.enableSharing && model.shareEmail

      // Jeśli włączamy udostępnianie i nie ma jeszcze shareId, generujemy nowy
      if (shareData.enableSharing && !shareId) {
        shareId = nanoid(10) // Generuj 10-znakowy identyfikator
      }

      // Generuj unikalny token do usuwania udostępnienia
      let deleteToken = model.shareDeleteToken
      if (shareData.enableSharing && !deleteToken) {
        deleteToken = nanoid(32) // 32-znakowy token dla bezpieczeństwa
      }

      // Hashowanie hasła, jeśli zostało podane
      let sharePassword = null
      if (shareData.password) {
        sharePassword = await bcrypt.hash(shareData.password, 10)
      }

      // Przygotuj aktualizację modelu
      const updateData: Partial<Model> = {
        shareId: shareId,
        shareEnabled: shareData.enableSharing,
        sharePassword: sharePassword,
        shareExpiryDate: shareData.expiryDate,
        shareDeleteToken: deleteToken
      }

      // Jeśli podano adres email, zapisz go
      if (shareData.email) {
        updateData.shareEmail = shareData.email
        updateData.shareNotificationSent = false // Reset statusu powiadomienia
      }

      // Jeśli użytkownik chce założyć konto
      if (shareData.createAccount && shareData.email) {
        try {
          // Sprawdź, czy użytkownik o podanym adresie email już istnieje
          const existingUser = await storage.getUserByEmail(shareData.email)

          if (!existingUser) {
            // Jeśli mamy dane użytkownika z formularza, użyj ich
            const userData = shareData.userData || {}

            // Ustal nazwę użytkownika - użyj podanej lub wygeneruj na podstawie emaila
            let username = userData.username || ''

            // Jeśli nie podano nazwy użytkownika, wygeneruj ją na podstawie adresu email
            if (!username) {
              const emailParts = shareData.email.split('@')
              const baseUsername = emailParts[0]
              username = baseUsername
              let suffix = 1

              // Sprawdź, czy nazwa użytkownika jest unikalna
              let userWithUsername = await storage.getUserByUsername(username)
              while (userWithUsername) {
                // Jeśli nazwa użytkownika jest zajęta, dodaj liczbę do nazwy
                username = `${baseUsername}${suffix}`
                suffix++
                userWithUsername = await storage.getUserByUsername(username)
              }
            }

            // Ustal hasło - użyj hasła z formularza, hasła udostępniania lub wygeneruj losowe
            const password =
              userData.password || shareData.password || nanoid(10)

            // Hashuj hasło
            const hashedPassword = await bcrypt.hash(password, 10)

            // Utwórz użytkownika
            const newUser = await storage.createUser({
              username,
              password: hashedPassword,
              email: shareData.email,
              fullName: userData.fullName || null,
              company: userData.company || null,
              isAdmin: false,
              isClient: true
            })

            // Zaloguj użytkownika
            req.login(
              {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.fullName,
                company: newUser.company,
                isAdmin: Boolean(newUser.isAdmin),
                isClient: Boolean(newUser.isClient)
              },
              err => {
                if (err) {
                  console.error('Error logging in new user:', err)
                }
              }
            )

            // Zaktualizuj flagę utworzenia konta
            accountCreated = true

            // Przypisz model do nowego użytkownika
            updateData.userId = newUser.id

            console.log(
              `Created new user account for ${shareData.email} with username ${username}`
            )
          } else {
            console.log(
              `User with email ${shareData.email} already exists, skipping account creation`
            )
          }
        } catch (accountError) {
          console.error('Error creating user account:', accountError)
          // Nie przerywamy procesu, jeśli tworzenie konta nie powiedzie się
        }
      }

      // Aktualizacja modelu
      const updatedModel = await storage.updateModel(id, updateData)

      // Jeśli włączono udostępnianie i podano adres email, wyślij powiadomienie
      if (shareData.enableSharing && shareData.email) {
        try {
          // Ustal baseUrl na podstawie żądania lub konfiguracji produkcyjnej
          const protocol = req.headers['x-forwarded-proto'] || 'http'
          const host = req.headers['host'] || 'localhost:3000'

          // Sprawdź, czy jesteśmy w środowisku produkcyjnym
          let baseUrl
          if (host === 'viewer.fastcnc.eu') {
            // W środowisku produkcyjnym zawsze używaj HTTPS
            baseUrl = 'https://viewer.fastcnc.eu'
            console.log('Using production baseUrl:', baseUrl)
          } else {
            // W innych środowiskach używaj wykrytego protokołu i hosta
            baseUrl = `${protocol}://${host}`
            console.log('Using detected baseUrl:', baseUrl)
          }

          // Użyj języka przekazanego z frontendu lub wykryj na podstawie nagłówka Accept-Language
          const userLanguage =
            (shareData.language as Language) ||
            detectLanguage(req.headers['accept-language'])
          console.log(
            `Using language for email: ${userLanguage} (${
              shareData.language ? 'from frontend' : 'from browser header'
            })`
          )

          // Wyślij e-mail z powiadomieniem
          let emailSent = false

          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          // Używamy zmiennej NODE_ENV lub sprawdzamy domenę
          const productionDomain =
            process.env.PRODUCTION_DOMAIN || 'viewer.fastcnc.eu'
          const isProduction =
            process.env.NODE_ENV === 'production' || host === productionDomain

          console.log(
            `Environment: ${
              isProduction ? 'Production' : 'Development'
            }, Host: ${host}`
          )

          // Jeśli jest skonfigurowany serwer SMTP
          if (
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD
          ) {
            emailSent = await sendShareNotificationSmtp(
              updatedModel!,
              shareData.email,
              baseUrl,
              shareData.password, // Przekazujemy niezahashowane hasło
              userLanguage // Przekazujemy wykryty język użytkownika
            )

            if (emailSent) {
              console.log(
                `Share notification email sent via custom SMTP to ${shareData.email} in ${userLanguage}`
              )

              // Zaktualizuj status wysłania powiadomienia
              await storage.updateModel(id, { shareNotificationSent: true })
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn(
                'Custom SMTP email failed, trying Nodemailer fallback (dev environment only)'
              )

              emailSent = await sendNodemailerNotification(
                updatedModel!,
                shareData.email,
                baseUrl,
                shareData.password
              )

              if (emailSent) {
                console.log(
                  `Share notification email sent via Nodemailer to ${shareData.email}`
                )

                // Zaktualizuj status wysłania powiadomienia
                await storage.updateModel(id, { shareNotificationSent: true })
              } else {
                console.error(
                  `Failed to send share notification email to ${shareData.email}`
                )
              }
            } else {
              console.error(
                `Failed to send share notification email via SMTP to ${shareData.email} in production environment`
              )
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            emailSent = await sendNodemailerNotification(
              updatedModel!,
              shareData.email,
              baseUrl,
              shareData.password
            )

            if (emailSent) {
              console.log(
                `Share notification email sent via Nodemailer to ${shareData.email}`
              )

              // Zaktualizuj status wysłania powiadomienia
              await storage.updateModel(id, { shareNotificationSent: true })
            } else {
              console.error(
                `Failed to send share notification email to ${shareData.email}`
              )
            }
          } else {
            console.error(
              `SMTP not configured in production environment, unable to send email to ${shareData.email}`
            )
          }
        } catch (emailError) {
          console.error('Error sending share notification email:', emailError)
          // Nie przerywamy procesu, jeśli e-mail nie został wysłany
        }
      } else if (needsRevocationEmail) {
        // Wyślij powiadomienie o wycofaniu udostępnienia
        try {
          // Wysyłanie powiadomienia o wycofaniu udostępnienia
          let revocationSent = false

          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language'])
          console.log(
            `Using browser language for revocation email: ${userLanguage}`
          )

          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          const host = req.headers['host'] || 'localhost:3000'
          const isProduction = host === 'viewer.fastcnc.eu'

          // Jeśli jest skonfigurowany serwer SMTP
          if (
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD
          ) {
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model,
              model.shareEmail!,
              userLanguage // Przekazujemy wykryty język użytkownika
            )

            if (revocationSent) {
              console.log(
                `Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`
              )
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn(
                'Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)'
              )

              revocationSent = await sendNodemailerRevokedNotification(
                model,
                model.shareEmail!
              )
              if (revocationSent) {
                console.log(
                  `Share revocation notification sent via Nodemailer to ${model.shareEmail}`
                )
              } else {
                console.error(
                  `Failed to send share revocation email to ${model.shareEmail}`
                )
              }
            } else {
              console.error(
                `Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`
              )
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            revocationSent = await sendNodemailerRevokedNotification(
              model,
              model.shareEmail!
            )
            if (revocationSent) {
              console.log(
                `Share revocation notification sent via Nodemailer to ${model.shareEmail}`
              )
            } else {
              console.error(
                `Failed to send share revocation email to ${model.shareEmail}`
              )
            }
          } else {
            console.error(
              `SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`
            )
          }
        } catch (emailError) {
          console.error('Error sending share revocation email:', emailError)
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
      })
    } catch (error) {
      console.error('Error sharing model:', error)
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: 'Invalid sharing data', errors: error.errors })
      }
      res.status(500).json({ message: 'Failed to share model' })
    }
  })

  // Endpoint do sprawdzania i dostępu do udostępnionych modeli
  app.post(
    '/api/shared/:shareId/access',
    async (req: Request, res: Response) => {
      try {
        const { shareId } = req.params

        // Walidacja danych wejściowych (opcjonalne hasło)
        const accessData = accessSharedModelSchema.parse({
          ...req.body,
          shareId
        })

        // Znajdź model po ID udostępnienia
        const model = await storage.getModelByShareId(shareId)

        // Jeśli nie znaleziono modelu lub udostępnianie jest wyłączone
        if (!model || !model.shareEnabled) {
          return res.status(404).json({ message: 'Shared model not found' })
        }

        // Sprawdź czy link wygasł
        if (model.shareExpiryDate) {
          const expiryDate = new Date(model.shareExpiryDate)
          const now = new Date()
          if (now > expiryDate) {
            return res
              .status(403)
              .json({ message: 'This shared link has expired' })
          }
        }

        // Sprawdź hasło (jeśli jest wymagane)
        if (model.sharePassword) {
          if (!accessData.password) {
            return res
              .status(401)
              .json({ message: 'Password required', requiresPassword: true })
          }

          const passwordIsValid = await bcrypt.compare(
            accessData.password,
            model.sharePassword
          )
          if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid password' })
          }
        }

        // Rejestruj dostęp do modelu (faktyczne wyświetlenie po weryfikacji hasła)
        // Robimy to tylko jeśli model wymaga hasła, w przeciwnym razie
        // statystyki zostały już zapisane w poprzednim żądaniu
        if (model.sharePassword) {
          // Obsługa adresu IP - weź tylko pierwszy adres IP z nagłówka X-Forwarded-For (rzeczywisty adres klienta)
          let ipAddress = 'unknown'
          if (req.headers['x-forwarded-for']) {
            // Pobierz pierwszy adres IP z listy (adres rzeczywistego klienta)
            const forwarded = String(req.headers['x-forwarded-for'])
              .split(',')[0]
              .trim()
            if (forwarded) {
              ipAddress = forwarded
            }
          } else if (req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress
          }
          const userAgent = req.headers['user-agent'] || 'unknown'

          try {
            await storage.recordModelView({
              modelId: model.id,
              shareId,
              ipAddress,
              userAgent,
              viewedAt: new Date(),
              authenticated: true // To oznacza, że dostęp został uwierzytelniony (jeśli było hasło)
            })
          } catch (viewError) {
            console.error('Error accessing shared model:', viewError)
            // Ignorujemy błąd - aplikacja dalej działa
          }
        }

        // Aktualizuj datę ostatniego dostępu
        await storage.updateModel(model.id, {
          shareLastAccessed: new Date().toISOString()
        })

        // Zwróć podstawowe dane modelu po weryfikacji
        res.json({
          id: model.id,
          filename: model.filename,
          filesize: model.filesize,
          format: model.format,
          created: model.created,
          sourceSystem: model.sourceSystem
        })
      } catch (error) {
        console.error('Error accessing shared model:', error)
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: 'Invalid access data', errors: error.errors })
        }
        res.status(500).json({ message: 'Failed to access shared model' })
      }
    }
  )

  // Endpoint do pobierania udostępnionego modelu
  app.get('/api/shared/:shareId', async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params

      // Znajdź model po ID udostępnienia
      const model = await storage.getModelByShareId(shareId)

      // Jeśli nie znaleziono modelu lub udostępnianie jest wyłączone
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: 'Shared model not found' })
      }

      // Sprawdź czy link wygasł
      if (model.shareExpiryDate) {
        const expiryDate = new Date(model.shareExpiryDate)
        const now = new Date()
        if (now > expiryDate) {
          return res
            .status(403)
            .json({ message: 'This shared link has expired' })
        }
      }

      // Rejestruj wyświetlenie modelu, ale tylko jeśli jest to pierwszy dostęp (bez hasła)
      if (!model.sharePassword) {
        try {
          // Obsługa adresu IP - weź tylko pierwszy adres IP z nagłówka X-Forwarded-For (rzeczywisty adres klienta)
          let ipAddress = 'unknown'
          if (req.headers['x-forwarded-for']) {
            // Pobierz pierwszy adres IP z listy (adres rzeczywistego klienta)
            const forwarded = String(req.headers['x-forwarded-for'])
              .split(',')[0]
              .trim()
            if (forwarded) {
              ipAddress = forwarded
            }
          } else if (req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress
          }
          const userAgent = req.headers['user-agent'] || 'unknown'

          await storage.recordModelView({
            modelId: model.id,
            shareId,
            ipAddress,
            userAgent,
            viewedAt: new Date()
          })
        } catch (viewError) {
          console.error('Failed to record model view:', viewError)
          // Nie zwracamy błędu, kontynuujemy działanie
        }
      }

      // Aktualizuj datę ostatniego dostępu
      await storage.updateModel(model.id, {
        shareLastAccessed: new Date().toISOString()
      })

      // Sprawdź czy model jest chroniony hasłem
      const requiresPassword = !!model.sharePassword

      // Zwróć podstawowe informacje o modelu (bez pełnych danych, które będą dostępne po weryfikacji hasła)
      res.json({
        filename: model.filename,
        format: model.format,
        created: model.created,
        requiresPassword
      })
    } catch (error) {
      console.error('Error getting shared model info:', error)
      res.status(500).json({ message: 'Failed to get shared model info' })
    }
  })

  // Endpoint HTML dla usuwania udostępnienia poprzez kliknięcie w link z maila (metoda GET)
  app.get(
    '/revoke-share/:shareId/:token',
    async (req: Request, res: Response) => {
      try {
        const { shareId, token } = req.params

        // Pobierz model aby sprawdzić token bezpieczeństwa
        const model = await storage.getModelByShareId(shareId)
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
        `)
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
        `)
        }

        // Dezaktywuj udostępnianie
        await storage.updateModel(model.id, {
          shareEnabled: false,
          shareId: null,
          sharePassword: null,
          shareEmail: null,
          shareExpiryDate: null,
          shareDeleteToken: null
        })

        // Wyślij powiadomienie o usunięciu udostępnienia, jeśli jest adres email
        if (model.shareEmail) {
          try {
            // Ustal bazowy URL na podstawie źródła żądania
            const host = req.headers['host'] || 'localhost:5000'
            const protocol = host.includes('localhost') ? 'http' : 'https'
            const baseUrl = `${protocol}://${host}`

            await sendSharingRevokedNotificationSmtp(
              model,
              model.shareEmail,
              undefined,
              baseUrl
            )
            console.log(
              `Wysłano powiadomienie o usunięciu udostępnienia do ${model.shareEmail}`
            )
          } catch (emailError) {
            console.error(
              'Błąd podczas wysyłania powiadomienia o usunięciu udostępnienia:',
              emailError
            )
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
      `)
      } catch (error) {
        console.error('Error revoking share with token:', error)
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
      `)
      }
    }
  )

  // Endpoint do usuwania udostępnienia modelu za pomocą tokenu bezpieczeństwa (metoda API DELETE)
  app.delete(
    '/api/shared/:shareId/:token',
    async (req: Request, res: Response) => {
      try {
        const { shareId, token } = req.params

        // Znajdź model po ID udostępnienia
        const model = await storage.getModelByShareId(shareId)

        // Jeśli nie znaleziono modelu lub udostępnianie jest już wyłączone
        if (!model || !model.shareEnabled) {
          return res.status(404).json({ message: 'Shared model not found' })
        }

        // Weryfikacja tokenu bezpieczeństwa
        if (!model.shareDeleteToken || model.shareDeleteToken !== token) {
          return res.status(403).json({ message: 'Invalid security token' })
        }

        // Wysyłka powiadomienia email o usunięciu udostępnienia, jeśli adres email istnieje
        if (model.shareEmail) {
          try {
            // Używamy domyślnego języka z nagłówka przeglądarki
            const userLanguage = detectLanguage(req.headers['accept-language'])
            console.log(
              `Using browser language for revocation email: ${userLanguage}`
            )

            // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
            const host = req.headers['host'] || 'localhost:3000'
            const isProduction = host === 'viewer.fastcnc.eu'

            // Jeśli jest skonfigurowany serwer SMTP
            if (
              process.env.SMTP_HOST &&
              process.env.SMTP_USER &&
              process.env.SMTP_PASSWORD
            ) {
              // Ustal bazowy URL na podstawie źródła żądania
              const baseUrl = `${req.protocol}://${req.headers['host']}`

              const revocationSent = await sendSharingRevokedNotificationSmtp(
                model,
                model.shareEmail,
                userLanguage, // Przekazujemy wykryty język użytkownika
                baseUrl
              )

              if (revocationSent) {
                console.log(
                  `Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`
                )
              } else if (!isProduction) {
                // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
                console.warn(
                  'Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)'
                )

                const nodemailerSent = await sendNodemailerRevokedNotification(
                  model,
                  model.shareEmail
                )
                if (nodemailerSent) {
                  console.log(
                    `Share revocation notification sent via Nodemailer to ${model.shareEmail}`
                  )
                } else {
                  console.error(
                    `Failed to send share revocation email to ${model.shareEmail}`
                  )
                }
              } else {
                console.error(
                  `Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`
                )
              }
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
              const nodemailerSent = await sendNodemailerRevokedNotification(
                model,
                model.shareEmail
              )
              if (nodemailerSent) {
                console.log(
                  `Share revocation notification sent via Nodemailer to ${model.shareEmail}`
                )
              } else {
                console.error(
                  `Failed to send share revocation email to ${model.shareEmail}`
                )
              }
            } else {
              console.error(
                `SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`
              )
            }
          } catch (emailError) {
            console.error('Error sending share revocation email:', emailError)
            // Kontynuuj usuwanie udostępnienia nawet jeśli email nie mógł zostać wysłany
          }
        }

        // Wyłącz udostępnianie modelu
        await storage.updateModel(model.id, {
          shareEnabled: false
        })

        res.status(200).json({
          message: 'Sharing has been revoked',
          modelId: model.id
        })
      } catch (error) {
        console.error('Error revoking shared model:', error)
        res.status(500).json({ message: 'Failed to revoke shared model' })
      }
    }
  )

  // Endpoint do usuwania udostępnienia modelu (tylko dla administratorów)
  app.delete('/api/shared/:shareId', async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params

      // Znajdź model po ID udostępnienia
      const model = await storage.getModelByShareId(shareId)

      // Jeśli nie znaleziono modelu lub udostępnianie jest już wyłączone
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: 'Shared model not found' })
      }

      // Wysyłka powiadomienia email o usunięciu udostępnienia, jeśli adres email istnieje
      if (model.shareEmail) {
        try {
          // Wysyłanie powiadomienia o wycofaniu udostępnienia
          let revocationSent = false

          // Używamy domyślnego języka z nagłówka przeglądarki
          const userLanguage = detectLanguage(req.headers['accept-language'])
          console.log(
            `Using browser language for revocation email: ${userLanguage}`
          )

          // Sprawdź, czy jesteśmy w środowisku produkcyjnym - używamy tylko SMTP bez fallbacku
          const host = req.headers['host'] || 'localhost:3000'
          const isProduction = host === 'viewer.fastcnc.eu'

          // Jeśli jest skonfigurowany serwer SMTP
          if (
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD
          ) {
            // Ustal bazowy URL na podstawie źródła żądania
            const baseUrl = `${req.protocol}://${req.headers['host']}`

            revocationSent = await sendSharingRevokedNotificationSmtp(
              model,
              model.shareEmail,
              userLanguage, // Przekazujemy wykryty język użytkownika
              baseUrl
            )

            if (revocationSent) {
              console.log(
                `Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`
              )
            } else if (!isProduction) {
              // Tylko w środowisku deweloperskim próbujemy użyć Nodemailer jako fallback
              console.warn(
                'Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)'
              )

              revocationSent = await sendNodemailerRevokedNotification(
                model,
                model.shareEmail
              )
              if (revocationSent) {
                console.log(
                  `Share revocation notification sent via Nodemailer to ${model.shareEmail}`
                )
              } else {
                console.error(
                  `Failed to send share revocation email to ${model.shareEmail}`
                )
              }
            } else {
              console.error(
                `Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`
              )
            }
          } else if (!isProduction) {
            // Tylko w środowisku deweloperskim użyj Nodemailer, jeśli SMTP nie jest skonfigurowany
            revocationSent = await sendNodemailerRevokedNotification(
              model,
              model.shareEmail
            )
            if (revocationSent) {
              console.log(
                `Share revocation notification sent via Nodemailer to ${model.shareEmail}`
              )
            } else {
              console.error(
                `Failed to send share revocation email to ${model.shareEmail}`
              )
            }
          } else {
            console.error(
              `SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`
            )
          }
        } catch (emailError) {
          console.error('Error sending share revocation email:', emailError)
          // Kontynuuj usuwanie udostępnienia nawet jeśli email nie mógł zostać wysłany
        }
      }

      // Wyłącz udostępnianie modelu
      const updatedModel = await storage.updateModel(model.id, {
        shareEnabled: false
      })

      res.status(200).json({
        message: 'Sharing has been revoked',
        modelId: model.id
      })
    } catch (error) {
      console.error('Error revoking shared model:', error)
      res.status(500).json({ message: 'Failed to revoke shared model' })
    }
  })

  // Admin endpoints

  // Logowanie administratora
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const loginData = adminLoginSchema.parse(req.body)

      // Pobierz użytkownika po nazwie użytkownika
      const user = await storage.getUserByUsername(loginData.username)

      // Sprawdź czy użytkownik istnieje i czy jest administratorem
      if (!user || !user.isAdmin) {
        return res.status(401).json({
          message:
            'Nieprawidłowe dane logowania lub brak uprawnień administratora'
        })
      }

      // Sprawdź hasło
      const passwordValid = await comparePassword(
        loginData.password,
        user.password
      )
      if (!passwordValid) {
        return res.status(401).json({ message: 'Nieprawidłowe dane logowania' })
      }

      // Usuń hasło z obiektu użytkownika przed zwróceniem
      const { password, ...userWithoutPassword } = user

      // Zwróć dane użytkownika (bez hasła)
      res.status(200).json({
        ...userWithoutPassword,
        token: nanoid(32) // Bardzo prosty token, w produkcji użyłbyś JWT lub podobnego
      })
    } catch (error) {
      console.error('Error during admin login:', error)
      res.status(500).json({ message: 'Wystąpił błąd podczas logowania' })
    }
  })

  // Pobierz wszystkie modele użytkowników (tylko dla administratorów)
  app.get('/api/admin/shared-models', async (req: Request, res: Response) => {
    try {
      // W prawdziwej aplikacji powinieneś sprawdzić token administratora
      // Dla prostoty w prototypie pomijamy uwierzytelnianie

      // Pobierz wszystkie modele przypisane do użytkowników
      const userModels = await storage.getSharedModels()

      // Przygotuj dane do wysłania, zawierające tylko potrzebne informacje
      const modelsList = userModels.map(model => ({
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
      }))

      res.json(modelsList)
    } catch (error) {
      console.error('Error getting user models list:', error)
      res.status(500).json({ message: 'Failed to get user models list' })
    }
  })

  // Pobierz wszystkie modele tymczasowe (tylko dla administratorów)
  app.get(
    '/api/admin/temporary-models',
    async (req: Request, res: Response) => {
      try {
        // Pobierz wszystkie modele
        const allModels = await storage.getModels()

        // Filtruj modele tymczasowe - te, które mają token viewToken w metadanych
        const temporaryModels = allModels.filter(model => {
          // Sprawdź typ modelu i pobierz metadane
          const metadata = model.metadata as any
          return metadata && metadata.viewToken && !model.shareEnabled
        })

        // Przygotuj dane do wysłania z dodatkowymi informacjami
        const modelsList = temporaryModels.map(model => {
          // Pobierz metadane modelu
          const metadata = model.metadata as any

          // Określ typ modelu na podstawie metadanych
          let modelType = 'unknown'
          let userEmail = null

          if (metadata) {
            if (metadata.stlFilePath) {
              modelType = 'STL'
            } else if (metadata.fileType === '2d') {
              modelType = metadata.cadFormat
                ? metadata.cadFormat.toUpperCase()
                : 'CAD'
            }

            // Pobierz email użytkownika z metadanych, jeśli istnieje
            userEmail = metadata.userEmail || null
          }

          return {
            id: model.id,
            filename: model.filename,
            filesize: model.filesize,
            format: model.format,
            created: model.created,
            modelType: modelType,
            userEmail: userEmail,
            // Dołącz tylko pierwszy fragment tokenu do identyfikacji
            viewTokenFragment:
              metadata && metadata.viewToken
                ? metadata.viewToken.substring(0, 8) + '...'
                : null
          }
        })

        res.json(modelsList)
      } catch (error) {
        console.error('Error getting temporary models list:', error)
        res.status(500).json({ message: 'Failed to get temporary models list' })
      }
    }
  )

  // Przypisz model tymczasowy do konkretnego użytkownika (przez administratora)
  app.post(
    '/api/admin/temporary-models/:id/assign',
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.id)
        const { email } = req.body

        if (isNaN(modelId)) {
          return res.status(400).json({ message: 'Invalid model ID' })
        }

        if (!email || !email.includes('@')) {
          return res.status(400).json({ message: 'Valid email is required' })
        }

        // Pobierz model
        const model = await storage.getModel(modelId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Sprawdź czy to faktycznie model tymczasowy
        const metadata = model.metadata as any
        if (!metadata || !metadata.viewToken || model.shareEnabled) {
          return res
            .status(400)
            .json({ message: 'This is not a temporary model' })
        }

        // Sprawdź czy istnieje użytkownik z podanym emailem
        const user = await storage.getUserByEmail(email)

        if (!user) {
          return res
            .status(404)
            .json({ message: 'User with this email not found' })
        }

        // Aktualizuj model, przypisując go do użytkownika
        const updatedModel = await storage.updateModel(modelId, {
          userId: user.id,
          shareEmail: email
        })

        if (!updatedModel) {
          return res.status(500).json({ message: 'Failed to update model' })
        }

        res.status(200).json({
          success: true,
          message: 'Model assigned to user successfully',
          modelId,
          userId: user.id,
          email
        })
      } catch (error) {
        console.error('Error assigning temporary model to user:', error)
        res.status(500).json({ message: 'Failed to assign model to user' })
      }
    }
  )

  // Odwołaj udostępnianie modelu (tylko dla administratorów)
  app.delete(
    '/api/admin/shared-models/:id',
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const modelId = parseInt(id)

        if (isNaN(modelId)) {
          return res.status(400).json({ message: 'Invalid model ID' })
        }

        // W prawdziwej aplikacji powinieneś sprawdzić token administratora
        // Dla prostoty w prototypie pomijamy uwierzytelnianie

        // Pobierz model
        const model = await storage.getModel(modelId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        if (!model.shareEnabled || !model.shareId) {
          return res.status(400).json({ message: 'Model is not shared' })
        }

        // Usuń udostępnianie
        const update = {
          shareEnabled: false,
          shareId: null,
          sharePassword: null,
          shareExpiryDate: null,
          shareEmail: null
        }

        const updatedModel = await storage.updateModel(modelId, update)

        // Powiadom użytkownika o usunięciu udostępnienia, jeśli podał adres e-mail
        if (updatedModel && model.shareEmail) {
          try {
            const language = 'en' // Domyślny język dla powiadomień administracyjnych

            // Próbuj użyć niestandardowego SMTP, a jeśli nie zadziała, użyj Nodemailer
            try {
              // Ustal bazowy URL na podstawie źródła żądania
              const host = req.headers['host'] || 'localhost:5000'
              const protocol = host.includes('localhost') ? 'http' : 'https'
              const baseUrl = `${protocol}://${host}`

              await sendSharingRevokedNotificationSmtp(
                model,
                model.shareEmail,
                language,
                baseUrl
              )
            } catch (emailError) {
              console.warn(
                'Custom SMTP notification failed, trying Nodemailer:',
                emailError
              )
              await sendNodemailerRevokedNotification(model, language)
            }
          } catch (notificationError) {
            console.error(
              'Failed to send sharing revocation notification:',
              notificationError
            )
            // Nie przerywamy procesu, jeśli powiadomienie się nie powiedzie
          }
        }

        res.status(200).json({ message: 'Sharing successfully disabled' })
      } catch (error) {
        console.error('Error disabling sharing:', error)
        res.status(500).json({ message: 'Failed to disable sharing' })
      }
    }
  )

  // Całkowicie usuń model z serwera (tylko dla administratorów)
  app.delete('/api/admin/models/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const modelId = parseInt(id)

      if (isNaN(modelId)) {
        return res.status(400).json({ message: 'Invalid model ID' })
      }

      // W prawdziwej aplikacji powinieneś sprawdzić token administratora
      // Dla prostoty w prototypie pomijamy uwierzytelnianie

      // Pobierz model przed usunięciem, aby znać ścieżkę pliku
      const model = await storage.getModel(modelId)

      if (!model) {
        return res.status(404).json({ message: 'Model not found' })
      }

      // Usuń model z bazy danych
      const deleteResult = await storage.deleteModel(modelId)

      if (!deleteResult) {
        return res
          .status(500)
          .json({ message: 'Failed to delete model from database' })
      }

      // Próba usunięcia pliku fizycznego (opcjonalnie)
      try {
        // Jeśli metadane zawierają ścieżkę pliku, spróbuj go usunąć
        if (model.metadata) {
          const metadata =
            typeof model.metadata === 'string'
              ? JSON.parse(model.metadata)
              : model.metadata

          // Usuń plik STL, jeśli istnieje
          if (metadata.stlFilePath && fs.existsSync(metadata.stlFilePath)) {
            fs.unlinkSync(metadata.stlFilePath)
          }

          // Usuń plik STEP, jeśli istnieje
          if (metadata.filePath && fs.existsSync(metadata.filePath)) {
            fs.unlinkSync(metadata.filePath)
          }

          // Usuń plik DXF, jeśli istnieje
          if (metadata.dxfFilePath && fs.existsSync(metadata.dxfFilePath)) {
            fs.unlinkSync(metadata.dxfFilePath)
          }
        }
      } catch (fileError) {
        console.error('Error deleting physical files:', fileError)
        // Nie przerywamy procesu, jeśli usunięcie pliku się nie powiedzie
      }

      res.status(200).json({ message: 'Model completely deleted' })
    } catch (error) {
      console.error('Error deleting model:', error)
      res.status(500).json({ message: 'Failed to delete model' })
    }
  })

  // Get model view statistics
  app.get(
    '/api/admin/shared-models/:id/stats',
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id)

        // Check if model exists
        const model = await storage.getModel(id)
        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        try {
          // Get view statistics for the model
          const stats = await storage.getModelViewStats(id)

          // Validate with schema
          const validatedStats = modelViewStatsSchema.parse(stats)

          res.json(validatedStats)
        } catch (statsError) {
          console.error(
            'Error getting model view stats (table may not exist):',
            statsError
          )
          // Jeśli tabela nie istnieje, zwróć puste statystyki
          res.json({
            totalViews: 0,
            uniqueIPs: 0,
            viewDetails: [],
            ipAddresses: [],
            browserStats: []
          })
        }
      } catch (error) {
        console.error('Error getting model view statistics:', error)
        res.status(500).json({ message: 'Failed to get model view statistics' })
      }
    }
  )

  // Ustaw nowe hasło dla udostępnionego modelu (tylko dla administratorów)
  // Endpoint do obsługi formularzy kontaktowych
  app.post('/api/contact-form', async (req: Request, res: Response) => {
    try {
      const formData: ContactFormData = req.body
      const language = (req.query.lang as Language) || 'en'
      let modelInfo

      // Walidacja pól formularza - dla zgłoszeń nadużyć wystarczy tylko wiadomość
      const isAbuseReport =
        formData.subject && formData.subject.toLowerCase().includes('abuse')

      if (!formData.message) {
        return res
          .status(400)
          .json({ success: false, message: 'Message is required' })
      }

      // Dla innych typów zapytań wymagamy imienia i emaila
      if (!isAbuseReport && (!formData.name || !formData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required for non-abuse reports'
        })
      }

      // Jeśli podano ID modelu, pobierz informacje o nim
      if (formData.modelId) {
        try {
          modelInfo = await storage.getModel(Number(formData.modelId))
        } catch (error) {
          console.warn(
            `Failed to fetch model info for contact form, modelId: ${formData.modelId}`,
            error
          )
          // Nie przerywamy przetwarzania formularza, jeśli nie udało się pobrać modelu
        }
      }

      // Importujemy funkcję sendContactFormEmail z custom-smtp.ts
      const { sendContactFormEmail } = await import('./custom-smtp')

      // Wysyłamy email
      const success = await sendContactFormEmail(formData, language, modelInfo)

      if (success) {
        res
          .status(200)
          .json({ success: true, message: 'Message sent successfully' })
      } else {
        res
          .status(500)
          .json({ success: false, message: 'Failed to send message' })
      }
    } catch (error) {
      console.error('Error processing contact form submission:', error)
      res.status(500).json({ success: false, message: 'Server error' })
    }
  })

  app.post(
    '/api/admin/shared-models/:id/reset-password',
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const modelId = parseInt(id)
        const { newPassword } = req.body

        if (isNaN(modelId)) {
          return res.status(400).json({ message: 'Invalid model ID' })
        }

        if (!newPassword) {
          return res.status(400).json({ message: 'New password is required' })
        }

        // W prawdziwej aplikacji powinieneś sprawdzić token administratora

        // Pobierz model
        const model = await storage.getModel(modelId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Jeśli podano nowe hasło, zahashuj je
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Aktualizuj model z nowym hasłem
        const updatedModel = await storage.updateModel(modelId, {
          sharePassword: hashedPassword
        })

        res.json({
          success: true,
          message: 'Password has been updated',
          modelId,
          hasPassword: true
        })
      } catch (error) {
        console.error('Error resetting model password:', error)
        res.status(500).json({ message: 'Failed to reset model password' })
      }
    }
  )

  // Endpoint do sprawdzenia czy model ma hasło (tylko dla administratorów)
  app.get(
    '/api/admin/shared-models/:id/password',
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params
        const modelId = parseInt(id)

        if (isNaN(modelId)) {
          return res.status(400).json({ message: 'Invalid model ID' })
        }

        // W prawdziwej aplikacji powinieneś sprawdzić token administratora

        // Pobierz model
        const model = await storage.getModel(modelId)

        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        // Zwracamy tylko informację czy model ma hasło
        res.json({
          modelId,
          hasPassword: !!model.sharePassword,
          message:
            'For security reasons, plaintext passwords are not stored or displayed.'
        })
      } catch (error) {
        console.error('Error getting model password status:', error)
        res.status(500).json({ message: 'Failed to get model password status' })
      }
    }
  )

  // Endpoint do sprawdzania, czy email istnieje w systemie
  app.get('/api/check-email/:email', async (req: Request, res: Response) => {
    try {
      const { email } = req.params

      console.log(`[DEBUG CHECK-EMAIL] Parametry żądania:`, {
        rawEmail: req.params.email,
        normalizedEmail: email,
        authenticated: req.isAuthenticated(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      })

      if (!email || !email.includes('@')) {
        console.log(`[DEBUG CHECK-EMAIL] Nieprawidłowy format emaila: ${email}`)
        return res.status(400).json({ message: 'Invalid email format' })
      }

      // Sprawdź czy użytkownik z podanym emailem istnieje
      const user = await storage.getUserByEmail(email)

      console.log(`[DEBUG CHECK-EMAIL] Wynik sprawdzenia:`, {
        emailExists: !!user,
        userId: user?.id,
        username: user?.username,
        isClient: user?.isClient,
        isAdmin: user?.isAdmin
      })

      // Zwróć tylko informację czy email istnieje, bez szczegółów użytkownika
      res.json({
        exists: !!user,
        email
      })
    } catch (error) {
      console.error(
        '[DEBUG CHECK-EMAIL] Błąd podczas sprawdzania email:',
        error
      )
      res.status(500).json({ message: 'Failed to check email' })
    }
  })

  // Endpoint do pobierania modeli przypisanych do zalogowanego użytkownika
  app.get('/api/client/models', async (req: Request, res: Response) => {
    try {
      console.log('=== DEBUG: /api/client/models endpoint called ===')
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Niezalogowany' })
      }

      // Pobierz zalogowanego użytkownika
      const user = req.user as User
      console.log(`User: ${user.email}, isAdmin: ${user.isAdmin}`)

      // Jeśli użytkownik jest adminem, zwróć wszystkie modele
      if (user.isAdmin) {
        const allModels = await storage.getModels()
        return res.json(allModels)
      }

      // Dla zwykłego użytkownika, pobierz modele powiązane z jego adresem email
      if (user.email) {
        const userModels = await storage.getModelsByEmail(user.email)
        console.log(
          `Retrieved ${userModels.length} models for user ${user.email}`
        )

        // Dodaj obliczone pole hasPassword do każdego modelu
        const modelsWithPassword = userModels.map(model => {
          const hasPassword = !!(
            model.sharePassword || (model as any).share_password
          )
          console.log(
            `Model ${model.id} (${model.filename}): sharePassword="${
              model.sharePassword
            }", share_password="${
              (model as any).share_password
            }", hasPassword=${hasPassword}`
          )
          return {
            ...model,
            hasPassword
          }
        })

        console.log(
          `Final result:`,
          JSON.stringify(
            modelsWithPassword.map(m => ({
              id: m.id,
              filename: m.filename,
              hasPassword: m.hasPassword
            })),
            null,
            2
          )
        )
        return res.json(modelsWithPassword)
      }

      // Zwróć pustą tablicę, jeśli użytkownik nie ma emaila
      return res.json([])
    } catch (error) {
      console.error('Error retrieving client models:', error)
      res.status(500).json({ error: 'Błąd podczas pobierania modeli klienta' })
    }
  })

  // Endpoint do usuwania modelu przez klienta
  app.delete('/api/client/models/:id', async (req: Request, res: Response) => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Niezalogowany' })
      }

      const modelId = parseInt(req.params.id)
      if (isNaN(modelId)) {
        return res.status(400).json({ error: 'Nieprawidłowe ID modelu' })
      }

      // Pobierz model
      const model = await storage.getModel(modelId)
      if (!model) {
        return res.status(404).json({ error: 'Model nie istnieje' })
      }

      // Sprawdź czy model należy do zalogowanego użytkownika
      const user = req.user as User
      if (!user.isAdmin && user.email !== model.shareEmail) {
        return res
          .status(403)
          .json({ error: 'Brak uprawnień do usunięcia tego modelu' })
      }

      // Usuń model
      await storage.deleteModel(modelId)

      return res.json({ success: true })
    } catch (error) {
      console.error('Error deleting client model:', error)
      res.status(500).json({ error: 'Błąd podczas usuwania modelu' })
    }
  })

  // Endpoint do zmiany hasła modelu przez klienta
  app.post(
    '/api/client/shared-models/:id/password',
    async (req: Request, res: Response) => {
      try {
        // Sprawdź czy użytkownik jest zalogowany
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Niezalogowany' })
        }

        const modelId = parseInt(req.params.id)
        if (isNaN(modelId)) {
          return res.status(400).json({ error: 'Nieprawidłowe ID modelu' })
        }

        // Pobierz model
        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ error: 'Model nie istnieje' })
        }

        // Sprawdź czy model należy do zalogowanego użytkownika
        const user = req.user as User
        if (!user.isAdmin && user.email !== model.shareEmail) {
          return res
            .status(403)
            .json({ error: 'Brak uprawnień do zmiany hasła tego modelu' })
        }

        // Zweryfikuj dane żądania
        const { password } = req.body

        // Aktualizuj model z nowym hasłem lub usuń hasło, jeśli przekazano puste
        let hashedPassword = null
        if (password) {
          hashedPassword = await hashPassword(password)
        }

        // Zaktualizuj model z nowym hasłem
        await storage.updateModel(modelId, {
          sharePassword: hashedPassword
        })

        return res.json({ success: true })
      } catch (error) {
        console.error('Error updating model password:', error)
        res
          .status(500)
          .json({ error: 'Błąd podczas aktualizacji hasła modelu' })
      }
    }
  )

  // Endpoint do zarządzania statusem publicznej biblioteki CAD
  app.post(
    '/api/client/models/:id/public-library',
    async (req: Request, res: Response) => {
      try {
        // Sprawdź czy użytkownik jest zalogowany
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Niezalogowany' })
        }

        const modelId = parseInt(req.params.id)
        if (isNaN(modelId)) {
          return res.status(400).json({ error: 'Nieprawidłowe ID modelu' })
        }

        const { isPublic } = req.body
        if (typeof isPublic !== 'boolean') {
          return res
            .status(400)
            .json({ error: 'Nieprawidłowa wartość isPublic' })
        }

        // Pobierz model
        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ error: 'Model nie istnieje' })
        }

        // Sprawdź czy model należy do zalogowanego użytkownika
        const user = req.user as User
        if (!user.isAdmin && user.email !== model.shareEmail) {
          return res
            .status(403)
            .json({ error: 'Brak uprawnień do modyfikacji tego modelu' })
        }

        // Walidacje przy dodawaniu do publicznej biblioteki
        if (isPublic) {
          const validationErrors = []

          // 1. Sprawdź czy model jest udostępniony z hasłem
          if (
            model.shareEnabled &&
            model.sharePassword &&
            model.sharePassword.trim() !== ''
          ) {
            return res.status(400).json({
              error:
                'Nie można dodać do publicznej biblioteki modelu chronionego hasłem. Najpierw usuń udostępnianie prywatne lub usuń hasło.',
              requiresPasswordRemoval: true
            })
          }

          // 2. Sprawdź czy model ma miniaturkę
          const metadata = model.metadata as any
          const hasThumbnail =
            metadata?.thumbnailPath ||
            (fs.existsSync && fs.existsSync(getThumbnailPath(modelId)))
          if (!hasThumbnail) {
            validationErrors.push('Model musi mieć miniaturkę')
          }

          // 3. Sprawdź czy model ma opis
          try {
            const description = await storage.getModelDescription(modelId)
            if (
              !description ||
              (!description.descriptionEn && !description.descriptionPl)
            ) {
              validationErrors.push(
                'Model musi mieć opis w co najmniej jednym języku'
              )
            }
          } catch (descError) {
            validationErrors.push('Model musi mieć opis')
          }

          // 4. Sprawdź czy model ma tagi
          try {
            const modelTags = await storage.getModelTags(modelId)
            if (!modelTags || modelTags.length === 0) {
              validationErrors.push('Model musi mieć co najmniej jeden tag')
            }
          } catch (tagsError) {
            validationErrors.push('Model musi mieć tagi')
          }

          // Jeśli są błędy walidacji, zwróć je
          if (validationErrors.length > 0) {
            return res.status(400).json({
              error: 'Model nie spełnia wymagań publicznej biblioteki',
              validationErrors: validationErrors
            })
          }
        }

        // Aktualizuj status publicznej biblioteki
        await storage.updateModel(modelId, {
          isPublic: isPublic
        })

        return res.json({
          success: true,
          isPublic: isPublic,
          message: isPublic
            ? 'Model dodany do publicznej biblioteki CAD'
            : 'Model usunięty z publicznej biblioteki CAD'
        })
      } catch (error) {
        console.error('Error updating public library status:', error)
        res.status(500).json({
          error: 'Błąd podczas aktualizacji statusu publicznej biblioteki'
        })
      }
    }
  )

  // Endpoint do wyszukiwania/pobierania modeli z otwartej biblioteki
  app.get('/api/library', async (req: Request, res: Response) => {
    try {
      // Pobierz parametry wyszukiwania
      const query = req.query.query as string | undefined
      const tags = req.query.tags
        ? (req.query.tags as string).split(',')
        : undefined
      const page = parseInt((req.query.page as string) || '1')
      const limit = parseInt((req.query.limit as string) || '20')

      // Pobierz modele z biblioteki (nie chronione hasłem i udostępnione)
      const libraryModels = await storage.getLibraryModels({
        query,
        tags,
        page,
        limit
      })

      res.json(libraryModels)
    } catch (error) {
      console.error('Error fetching library models:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Endpoint do aktualizacji tagów modeli (tylko dla właściciela modelu)
  app.post('/api/models/:id/tags', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const modelId = parseInt(id)

      // Sprawdź czy model istnieje i czy użytkownik ma do niego dostęp
      const model = await storage.getModel(modelId)
      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }

      // Sprawdź uprawnienia - tylko właściciel lub admin mogą edytować tagi
      if (
        !req.isAuthenticated() ||
        (req.user.id !== model.userId && !req.user.isAdmin)
      ) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Przeprowadź walidację danych wejściowych
      const updateTagsData = updateModelTagsSchema.parse({
        modelId,
        tags: req.body.tags || []
      })

      // Aktualizuj tagi modelu
      const updatedModel = await storage.updateModelTags(
        modelId,
        updateTagsData.tags
      )

      res.json({
        success: true,
        model: updatedModel,
        message: 'Model tags updated successfully'
      })
    } catch (error) {
      console.error('Error updating model tags:', error)

      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid request data', details: error.errors })
      }

      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Gallery endpoints for persistent storage
  app.get('/api/models/:id/gallery', async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id)

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const model = await storage.getModel(modelId)
      if (!model) {
        return res.status(404).json({ error: 'Model not found' })
      }

      if (model.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const galleryImages = await storage.getModelGallery(modelId)
      res.json(galleryImages)
    } catch (error) {
      console.error('Error getting model gallery:', error)
      res.status(500).json({ error: 'Failed to get gallery' })
    }
  })

  app.post(
    '/api/models/:id/gallery',
    galleryUpload.array('images', 6),
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.id)
        const files = req.files as Express.Multer.File[]

        console.log('Gallery upload request received:', {
          modelId,
          filesCount: files ? files.length : 0,
          files: files
            ? files.map(f => ({ name: f.originalname, size: f.size }))
            : 'No files',
          body: req.body
        })

        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        if (!files || files.length === 0) {
          console.log('No files received in gallery upload')
          return res.status(400).json({ error: 'No files uploaded' })
        }

        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ error: 'Model not found' })
        }

        if (model.userId !== req.user?.id) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const uploadedImages = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          console.log(`Processing file ${i}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            bufferLength: file.buffer ? file.buffer.length : 'no buffer'
          })

          if (!file.buffer || file.buffer.length === 0) {
            console.error(`File ${i} has no buffer or empty buffer`)
            continue
          }

          const filename = `gallery_${modelId}_${Date.now()}_${i}.${file.originalname
            .split('.')
            .pop()}`

          // Upload to S3 if available
          let s3Key = null
          if (s3Service.isInitialized()) {
            s3Key = `gallery/${req.user!.id}/${filename}`
            console.log(
              `Uploading to S3 with key: ${s3Key}, buffer size: ${file.buffer.length}`
            )
            await s3Service.uploadBuffer(s3Key, file.buffer, file.mimetype)
          } else {
            // Save locally
            const uploadPath = path.join('./uploads', 'gallery', filename)
            await fs.promises.mkdir(path.dirname(uploadPath), {
              recursive: true
            })
            await fs.promises.writeFile(uploadPath, file.buffer)
          }

          const galleryImage = await storage.addGalleryImage({
            modelId,
            filename,
            originalName: file.originalname,
            filesize: file.size,
            mimeType: file.mimetype,
            s3Key,
            isThumbnail: i === 0
          })

          uploadedImages.push(galleryImage)
        }

        res.json({
          success: true,
          message: 'Gallery images uploaded successfully',
          images: uploadedImages
        })
      } catch (error) {
        console.error('Error uploading gallery images:', error)
        res.status(500).json({ error: 'Failed to upload gallery images' })
      }
    }
  )

  app.get(
    '/api/models/:modelId/gallery/:imageId',
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.modelId)
        const imageId = parseInt(req.params.imageId)

        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ error: 'Model not found' })
        }

        const galleryImages = await storage.getModelGallery(modelId)
        const image = galleryImages.find(img => img.id === imageId)

        if (!image) {
          return res.status(404).json({ error: 'Gallery image not found' })
        }

        // Serve image from S3 or local storage
        if (image.s3Key && s3Service.isInitialized()) {
          const signedUrl = await s3Service.getSignedDownloadUrl(image.s3Key)
          res.redirect(signedUrl)
        } else {
          const imagePath = path.join('./uploads', 'gallery', image.filename)
          if (
            await fs.promises
              .access(imagePath)
              .then(() => true)
              .catch(() => false)
          ) {
            res.sendFile(path.resolve(imagePath))
          } else {
            res.status(404).json({ error: 'Image file not found' })
          }
        }
      } catch (error) {
        console.error('Error serving gallery image:', error)
        res.status(500).json({ error: 'Failed to serve image' })
      }
    }
  )

  // Delete gallery image
  app.delete(
    '/api/models/:modelId/gallery/:imageId',
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.modelId)
        const imageId = parseInt(req.params.imageId)

        // Sprawdź czy użytkownik ma dostęp do modelu
        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ error: 'Model not found' })
        }

        const galleryImages = await storage.getModelGallery(modelId)
        const image = galleryImages.find(img => img.id === imageId)

        if (!image) {
          return res.status(404).json({ error: 'Gallery image not found' })
        }

        // Usuń plik z S3 jeśli istnieje
        if (image.s3Key && s3Service.isInitialized()) {
          try {
            await s3Service.deleteFile(image.s3Key)
            console.log(`Deleted gallery image from S3: ${image.s3Key}`)
          } catch (s3Error) {
            console.error('Failed to delete image from S3:', s3Error)
            // Kontynuuj usuwanie z bazy danych nawet jeśli S3 nie działa
          }
        }

        // Usuń z bazy danych
        const deleted = await storage.deleteGalleryImage(imageId)
        if (!deleted) {
          return res
            .status(500)
            .json({ error: 'Failed to delete image from database' })
        }

        console.log(`Gallery image ${imageId} deleted successfully`)
        res.json({ success: true, message: 'Image deleted successfully' })
      } catch (error) {
        console.error('Error deleting gallery image:', error)
        res.status(500).json({ error: 'Failed to delete image' })
      }
    }
  )

  // Generate thumbnail from model file
  app.post(
    '/api/models/:id/generate-thumbnail',
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.id)

        // Sprawdź czy użytkownik ma dostęp do modelu
        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' })
        }

        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ message: 'Model not found' })
        }

        const metadata = model.metadata as any
        let filePath = metadata?.filePath
        let tempFile = null

        // Sprawdź czy plik jest w S3
        if (metadata?.s3Key && s3Service.isInitialized()) {
          try {
            // Pobierz plik z S3 do tymczasowego pliku
            const tempDir = path.join(process.cwd(), 'uploads/temp-thumbnails')
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true })
            }

            tempFile = path.join(
              tempDir,
              `temp_${modelId}_${Date.now()}_${model.filename}`
            )
            const signedUrl = await s3Service.getSignedDownloadUrl(
              metadata.s3Key,
              3600
            )

            // Pobierz plik z S3
            const response = await fetch(signedUrl)
            if (!response.ok) {
              throw new Error('Failed to download file from S3')
            }

            const buffer = Buffer.from(await response.arrayBuffer())
            fs.writeFileSync(tempFile, buffer)
            filePath = tempFile

            console.log(
              `Downloaded file from S3 for thumbnail generation: ${metadata.s3Key}`
            )
          } catch (s3Error) {
            console.error('Failed to download file from S3:', s3Error)
            return res
              .status(400)
              .json({ message: 'Failed to access model file in storage' })
          }
        }

        if (!filePath || !fs.existsSync(filePath)) {
          return res.status(400).json({ message: 'Model file not found' })
        }

        // Generuj miniaturkę
        const thumbnailPath = getThumbnailPath(modelId)
        const thumbnailGenerated = await generateThumbnail(
          filePath,
          thumbnailPath,
          {},
          model.filename
        )

        // Usuń tymczasowy plik jeśli został utworzony
        if (tempFile && fs.existsSync(tempFile)) {
          try {
            fs.unlinkSync(tempFile)
          } catch (cleanupError) {
            console.error('Failed to cleanup temp file:', cleanupError)
          }
        }

        if (!thumbnailGenerated) {
          return res
            .status(500)
            .json({ message: 'Failed to generate thumbnail' })
        }

        // Sprawdź czy miniaturka została wygenerowana lokalnie
        if (!fs.existsSync(thumbnailPath)) {
          return res
            .status(500)
            .json({ message: 'Thumbnail file was not created' })
        }

        // Jeśli S3 jest włączone, prześlij miniaturkę używając buffer zamiast stream
        let s3UploadSuccess = false
        let galleryImageId = null

        if (s3Service.isInitialized()) {
          try {
            const thumbnailKey = `thumbnails/${
              req.user!.id
            }/model_${modelId}_thumbnail.png`
            const thumbnailBuffer = fs.readFileSync(thumbnailPath)
            await s3Service.uploadBuffer(
              thumbnailKey,
              thumbnailBuffer,
              'image/png'
            )
            await storage.updateModelThumbnail(modelId, thumbnailKey)
            s3UploadSuccess = true
            console.log(`Thumbnail uploaded to S3 for model ${modelId}`)

            // Dodaj wygenerowaną miniaturkę do galerii modelu
            try {
              const galleryImage = await storage.addGalleryImage({
                modelId: modelId,
                filename: `generated_thumbnail_${modelId}_${Date.now()}.png`,
                originalName: 'Generated Thumbnail',
                filesize: thumbnailBuffer.length,
                mimeType: 'image/png',
                displayOrder: 0,
                isThumbnail: true,
                s3Key: thumbnailKey
              })
              galleryImageId = galleryImage.id
              console.log(
                `Generated thumbnail added to gallery with ID: ${galleryImageId}`
              )
            } catch (galleryError) {
              console.error(
                'Failed to add generated thumbnail to gallery:',
                galleryError
              )
            }
          } catch (s3Error) {
            console.error('Failed to upload thumbnail to S3:', s3Error)
            console.log('Thumbnail will remain stored locally')
          }
        } else {
          // Dla lokalnego storage, również dodaj do galerii
          try {
            const thumbnailBuffer = fs.readFileSync(thumbnailPath)
            const galleryImage = await storage.addGalleryImage({
              modelId: modelId,
              filename: `generated_thumbnail_${modelId}_${Date.now()}.png`,
              originalName: 'Generated Thumbnail',
              filesize: thumbnailBuffer.length,
              mimeType: 'image/png',
              displayOrder: 0,
              isThumbnail: true,
              s3Key: null
            })
            galleryImageId = galleryImage.id
            console.log(
              `Generated thumbnail added to local gallery with ID: ${galleryImageId}`
            )
          } catch (galleryError) {
            console.error(
              'Failed to add generated thumbnail to local gallery:',
              galleryError
            )
          }
        }

        res.json({
          success: true,
          message: s3UploadSuccess
            ? 'Thumbnail generated and uploaded to cloud storage'
            : 'Thumbnail generated locally',
          thumbnailUrl: `/api/models/${modelId}/thumbnail?t=${Date.now()}`,
          galleryImageId: galleryImageId
        })
      } catch (error) {
        console.error('Error generating thumbnail:', error)
        res.status(500).json({ message: 'Failed to generate thumbnail' })
      }
    }
  )

  app.put(
    '/api/models/:modelId/gallery/:imageId/thumbnail',
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.modelId)
        const imageId = parseInt(req.params.imageId)

        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const model = await storage.getModel(modelId)
        if (!model) {
          return res.status(404).json({ error: 'Model not found' })
        }

        if (model.userId !== req.user?.id) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const galleryImages = await storage.getModelGallery(modelId)
        const targetImage = galleryImages.find(img => img.id === imageId)

        if (!targetImage) {
          return res.status(404).json({ error: 'Gallery image not found' })
        }

        console.log(`Setting thumbnail for model ${modelId}, image ${imageId}`)
        console.log(`Target image:`, JSON.stringify(targetImage, null, 2))

        // Najpierw usuń flagę thumbnail z innych obrazów galerii
        await storage.clearGalleryThumbnails(modelId)
        console.log(`Cleared existing gallery thumbnails for model ${modelId}`)

        // Ustaw nowy obraz jako thumbnail w galerii
        const updatedImage = await storage.setGalleryThumbnail(imageId)
        console.log(
          `Set gallery thumbnail:`,
          JSON.stringify(updatedImage, null, 2)
        )

        // Skopiuj obraz z galerii jako główną miniaturkę modelu
        if (s3Service.isInitialized() && targetImage.s3Key) {
          try {
            console.log(
              `Copying gallery image to model thumbnail: ${targetImage.s3Key}`
            )

            // Pobierz obraz z S3
            const downloadUrl = await s3Service.getSignedDownloadUrl(
              targetImage.s3Key,
              3600
            )
            console.log(`Downloaded signed URL: ${downloadUrl}`)

            const response = await fetch(downloadUrl)
            if (!response.ok) {
              throw new Error(
                `Failed to fetch image from S3: ${response.status}`
              )
            }

            const buffer = Buffer.from(await response.arrayBuffer())
            console.log(`Image buffer size: ${buffer.length}`)

            // Utwórz klucz dla miniaturki modelu
            const thumbnailKey = `thumbnails/${
              req.user!.id
            }/model_${modelId}_thumbnail.${targetImage.filename
              .split('.')
              .pop()}`
            console.log(`Uploading thumbnail to S3 with key: ${thumbnailKey}`)

            // Przesłij jako miniaturkę modelu
            await s3Service.uploadBuffer(
              thumbnailKey,
              buffer,
              targetImage.mimeType
            )
            console.log(`Thumbnail uploaded successfully to S3`)

            // Zaktualizuj model z nowym S3 key dla miniaturki
            await storage.updateModelThumbnail(modelId, thumbnailKey)
            console.log(`Model thumbnail metadata updated`)
          } catch (s3Error) {
            console.error(
              'Error copying gallery image to model thumbnail:',
              s3Error
            )
            throw s3Error
          }
        } else if (!s3Service.isInitialized()) {
          // Dla lokalnego przechowywania - skopiuj plik
          const sourcePath = path.join(
            './uploads',
            'gallery',
            targetImage.filename
          )
          const thumbnailPath = path.join(
            './uploads',
            'thumbnails',
            `model_${modelId}_thumbnail.${targetImage.filename
              .split('.')
              .pop()}`
          )

          await fs.promises.mkdir(path.dirname(thumbnailPath), {
            recursive: true
          })
          await fs.promises.copyFile(sourcePath, thumbnailPath)

          await storage.updateModelThumbnail(
            modelId,
            `model_${modelId}_thumbnail.${targetImage.filename
              .split('.')
              .pop()}`
          )
        }

        res.json({
          success: true,
          message: 'Thumbnail updated successfully',
          image: updatedImage
        })
      } catch (error) {
        console.error('Error setting thumbnail:', error)
        res.status(500).json({ error: 'Failed to set thumbnail' })
      }
    }
  )

  // Categories and tags endpoints
  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories()
      res.json(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      res.status(500).json({ error: 'Failed to fetch categories' })
    }
  })

  app.get('/api/tags', async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId
        ? parseInt(req.query.categoryId as string)
        : undefined
      const tags = await storage.getTags(categoryId)
      res.json(tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
      res.status(500).json({ error: 'Failed to fetch tags' })
    }
  })

  app.post('/api/tags', async (req: Request, res: Response) => {
    try {
      if (
        !req.isAuthenticated() ||
        (!req.user?.isClient && !req.user?.isAdmin)
      ) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const {
        nameEn,
        namePl,
        nameDe,
        nameFr,
        nameCs,
        nameEs,
        slug,
        categoryId
      } = req.body

      if (!nameEn || !slug) {
        return res
          .status(400)
          .json({ error: 'Name (English) and slug are required' })
      }

      const newTag = await storage.createTag({
        nameEn,
        namePl: namePl || nameEn,
        nameDe: nameDe || nameEn,
        nameFr: nameFr || nameEn,
        nameCs: nameCs || nameEn,
        nameEs: nameEs || nameEn,
        slug,
        categoryId
      })

      res.status(201).json(newTag)
    } catch (error) {
      console.error('Error creating tag:', error)
      res.status(500).json({ error: 'Failed to create tag' })
    }
  })

  app.put('/api/models/:id/category', async (req: Request, res: Response) => {
    try {
      if (
        !req.isAuthenticated() ||
        (!req.user?.isClient && !req.user?.isAdmin)
      ) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const modelId = parseInt(req.params.id)
      const { categoryId } = req.body

      if (isNaN(modelId)) {
        return res.status(400).json({ error: 'Invalid model ID' })
      }

      // Check if user has access to the model
      const hasAccess = await hasAccessToModel(req, modelId)
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const updatedModel = await storage.updateModelCategory(
        modelId,
        categoryId || null
      )

      if (!updatedModel) {
        return res.status(404).json({ error: 'Model not found' })
      }

      res.json(updatedModel)
    } catch (error) {
      console.error('Error updating model category:', error)
      res.status(500).json({ error: 'Failed to update model category' })
    }
  })

  app.put('/api/models/:id/tags', async (req: Request, res: Response) => {
    try {
      if (
        !req.isAuthenticated() ||
        (!req.user?.isClient && !req.user?.isAdmin)
      ) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const modelId = parseInt(req.params.id)
      const { tagIds } = req.body

      if (isNaN(modelId)) {
        return res.status(400).json({ error: 'Invalid model ID' })
      }

      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ error: 'tagIds must be an array' })
      }

      // Check if user has access to the model
      const hasAccess = await hasAccessToModel(req, modelId)
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Get current tags and calculate differences
      const currentTags = await storage.getModelTags(modelId)
      const currentTagIds = currentTags.map(tag => tag.id)

      const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id))
      const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id))

      // Update tags
      if (tagsToRemove.length > 0) {
        await storage.removeModelTags(modelId, tagsToRemove)
      }
      if (tagsToAdd.length > 0) {
        await storage.addModelTags(modelId, tagsToAdd)
      }

      // Return updated tags
      const updatedTags = await storage.getModelTags(modelId)
      res.json(updatedTags)
    } catch (error) {
      console.error('Error updating model tags:', error)
      res.status(500).json({ error: 'Failed to update model tags' })
    }
  })

  app.get('/api/models/:id/tags', async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.id)

      if (isNaN(modelId)) {
        return res.status(400).json({ error: 'Invalid model ID' })
      }

      // Check if user has access to the model
      const hasAccess = await hasAccessToModel(req, modelId)
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const tags = await storage.getModelTags(modelId)
      res.json(tags)
    } catch (error) {
      console.error('Error fetching model tags:', error)
      res.status(500).json({ error: 'Failed to fetch model tags' })
    }
  })

  // Model description endpoints with automatic translation
  app.get(
    '/api/models/:id/description',
    async (req: Request, res: Response) => {
      try {
        const modelId = parseInt(req.params.id)
        if (isNaN(modelId)) {
          return res.status(400).json({ error: 'Invalid model ID' })
        }

        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const description = await storage.getModelDescription(modelId)
        res.json(description || null)
      } catch (error) {
        console.error('Error fetching model description:', error)
        res.status(500).json({ error: 'Failed to fetch model description' })
      }
    }
  )

  app.post(
    '/api/models/:id/description',
    async (req: Request, res: Response) => {
      try {
        if (
          !req.isAuthenticated() ||
          (!req.user?.isClient && !req.user?.isAdmin)
        ) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const modelId = parseInt(req.params.id)
        if (isNaN(modelId)) {
          return res.status(400).json({ error: 'Invalid model ID' })
        }

        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const { description, language } = req.body

        if (!description || !language) {
          return res
            .status(400)
            .json({ error: 'Description and language are required' })
        }

        // Validate language
        const supportedLanguages = ['en', 'pl', 'cs', 'de', 'fr', 'es']
        if (!supportedLanguages.includes(language)) {
          return res.status(400).json({ error: 'Unsupported language' })
        }

        try {
          // Translate description to all supported languages
          console.log(
            `Translating description from ${language}: "${description}"`
          )
          const translations = await translateDescription(
            description,
            language as SupportedLanguage
          )

          // Check if description already exists
          const existingDescription = await storage.getModelDescription(modelId)

          if (existingDescription) {
            // Update existing description
            const updatedDescription = await storage.updateModelDescription(
              modelId,
              {
                ...translations,
                originalLanguage: language,
                originalDescription: description
              }
            )

            res.json({
              success: true,
              description: updatedDescription,
              message: 'Description updated and translated successfully'
            })
          } else {
            // Create new description
            const newDescription = await storage.createModelDescription({
              modelId,
              ...translations,
              originalLanguage: language,
              originalDescription: description
            })

            res.json({
              success: true,
              description: newDescription,
              message: 'Description created and translated successfully'
            })
          }
        } catch (translationError) {
          console.error('Translation error:', translationError)

          // If translation fails, create/update with only the original language
          const fallbackDescription = {
            [`description${
              language.charAt(0).toUpperCase() + language.slice(1)
            }`]: description,
            originalLanguage: language,
            originalDescription: description
          }

          const existingDescription = await storage.getModelDescription(modelId)

          if (existingDescription) {
            const updatedDescription = await storage.updateModelDescription(
              modelId,
              fallbackDescription
            )
            res.json({
              success: true,
              description: updatedDescription,
              message: 'Description updated (translation service unavailable)',
              warning:
                'Automatic translation failed - only original language saved'
            })
          } else {
            const newDescription = await storage.createModelDescription({
              modelId,
              ...fallbackDescription
            })
            res.json({
              success: true,
              description: newDescription,
              message: 'Description created (translation service unavailable)',
              warning:
                'Automatic translation failed - only original language saved'
            })
          }
        }
      } catch (error) {
        console.error('Error creating/updating model description:', error)
        res.status(500).json({ error: 'Failed to save model description' })
      }
    }
  )

  app.delete(
    '/api/models/:id/description',
    async (req: Request, res: Response) => {
      try {
        if (
          !req.isAuthenticated() ||
          (!req.user?.isClient && !req.user?.isAdmin)
        ) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const modelId = parseInt(req.params.id)
        if (isNaN(modelId)) {
          return res.status(400).json({ error: 'Invalid model ID' })
        }

        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }

        const deleted = await storage.deleteModelDescription(modelId)

        if (!deleted) {
          return res.status(404).json({ error: 'Description not found' })
        }

        res.json({ success: true, message: 'Description deleted successfully' })
      } catch (error) {
        console.error('Error deleting model description:', error)
        res.status(500).json({ error: 'Failed to delete model description' })
      }
    }
  )

  // Model tags endpoint with automatic translation
  app.post(
    '/api/models/:id/tags-translate',
    async (req: Request, res: Response) => {
      try {
        if (
          !req.isAuthenticated() ||
          (!req.user?.isClient && !req.user?.isAdmin)
        ) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const modelId = parseInt(req.params.id)
        if (isNaN(modelId)) {
          return res.status(400).json({ error: 'Invalid model ID' })
        }

        const { tags, language } = req.body
        if (!tags || !language) {
          return res
            .status(400)
            .json({ error: 'Tags and language are required' })
        }

        const hasAccess = await hasAccessToModel(req, modelId)
        if (!hasAccess) {
          return res.status(403).json({ error: 'Access denied' })
        }

        // Parse comma-separated tags
        const tagList = tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0)

        if (tagList.length === 0) {
          return res.status(400).json({ error: 'At least one tag is required' })
        }

        // Check if Google Translate is available
        const { translateDescription } = await import('./google-translate')

        // Process each tag with automatic translation
        const processedTags = []

        for (const tagName of tagList) {
          try {
            console.log(`Translating tag from ${language}: "${tagName}"`)

            // Use translateDescription function to get all language versions
            const translations = await translateDescription(
              tagName,
              language as any
            )

            // Create or update tag with all translations
            const tagData = {
              nameEn: translations.descriptionEn || tagName,
              namePl: translations.descriptionPl || tagName,
              nameCs: translations.descriptionCs || tagName,
              nameDe: translations.descriptionDe || tagName,
              nameFr: translations.descriptionFr || tagName,
              nameEs: translations.descriptionEs || tagName,
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              color: '#6B7280', // Default color
              isActive: true
            }

            console.log('Tag translations:', tagData)

            // Check if tag already exists by slug
            let existingTag = await storage.getTagBySlug(tagData.slug)

            if (existingTag) {
              // Update existing tag with new translations
              const updatedTag = await storage.updateTag(
                existingTag.id,
                tagData
              )
              processedTags.push(updatedTag)
            } else {
              // Create new tag
              const newTag = await storage.createTag(tagData)
              processedTags.push(newTag)
            }
          } catch (translationError) {
            console.error(
              `Translation failed for tag "${tagName}":`,
              translationError
            )
            // Fallback: create tag with original language only
            const fallbackTag = {
              nameEn: language === 'en' ? tagName : '',
              namePl: language === 'pl' ? tagName : '',
              nameCs: language === 'cs' ? tagName : '',
              nameDe: language === 'de' ? tagName : '',
              nameFr: language === 'fr' ? tagName : '',
              nameEs: language === 'es' ? tagName : '',
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              color: '#6B7280',
              isActive: true
            }

            let existingTag = await storage.getTagBySlug(fallbackTag.slug)

            if (existingTag) {
              processedTags.push(existingTag)
            } else {
              const newTag = await storage.createTag(fallbackTag)
              processedTags.push(newTag)
            }
          }
        }

        // Associate tags with model
        await storage.setModelTags(
          modelId,
          processedTags.map(tag => tag.id)
        )

        res.json({
          success: true,
          tags: processedTags,
          message: 'Tags saved and translated successfully'
        })
      } catch (error) {
        console.error('Error creating/updating model tags:', error)
        res.status(500).json({ error: 'Failed to save model tags' })
      }
    }
  )

  const httpServer = createServer(app)
  return httpServer
}
