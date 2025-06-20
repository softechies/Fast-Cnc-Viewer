import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  background?: string;
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  width: 300,
  height: 300,
  quality: 85,
  background: '#f8f9fa'
};

/**
 * Generuje miniaturkę dla pliku STL używając Python i matplotlib
 */
export async function generateSTLThumbnail(
  stlFilePath: string, 
  outputPath: string, 
  options: ThumbnailOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    // Spróbuj najpierw zaawansowanego renderera
    const advancedScript = path.join(__dirname, 'advanced_stl_renderer.py');
    
    const args = [
      advancedScript,
      stlFilePath,
      outputPath,
      '--width', opts.width.toString(),
      '--height', opts.height.toString()
    ];

    const python = spawn('python3', args);
    
    let stderr = '';
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log('STL thumbnail generated with advanced renderer');
        resolve(true);
      } else {
        console.log('Advanced renderer failed, trying fallback:', stderr);
        
        // Fallback do poprzedniego generatora
        const fallbackScript = path.join(__dirname, 'generate_stl_thumbnail.py');
        const fallbackArgs = [
          fallbackScript,
          stlFilePath,
          outputPath,
          '--width', opts.width.toString(),
          '--height', opts.height.toString(),
          '--quality', opts.quality.toString(),
          '--background', opts.background
        ];

        const fallbackPython = spawn('python3', fallbackArgs);
        
        let fallbackStderr = '';
        
        fallbackPython.stderr.on('data', (data) => {
          fallbackStderr += data.toString();
        });
        
        fallbackPython.on('close', (fallbackCode) => {
          if (fallbackCode === 0 && fs.existsSync(outputPath)) {
            console.log('STL thumbnail generated with fallback renderer');
            resolve(true);
          } else {
            console.error('Both STL renderers failed:', fallbackStderr);
            resolve(false);
          }
        });
        
        fallbackPython.on('error', (error) => {
          console.error('Fallback Python process error:', error);
          resolve(false);
        });
      }
    });
    
    python.on('error', (error) => {
      console.error('Advanced Python process error:', error);
      resolve(false);
    });
  });
}

/**
 * Generuje miniaturkę dla pliku DXF używając istniejącego konwertera SVG
 */
export async function generateDXFThumbnail(
  dxfFilePath: string, 
  outputPath: string, 
  options: ThumbnailOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'dxf_matplotlib_converter.py');
    const tempSvgPath = outputPath.replace('.png', '.svg');
    
    // Najpierw wygeneruj SVG
    const svgArgs = [pythonScript, dxfFilePath, tempSvgPath];
    const svgProcess = spawn('python3', svgArgs);
    
    let svgStderr = '';
    
    svgProcess.stderr.on('data', (data) => {
      svgStderr += data.toString();
    });
    
    svgProcess.on('close', (svgCode) => {
      if (svgCode === 0 && fs.existsSync(tempSvgPath)) {
        // Konwertuj SVG do PNG używając ImageMagick
        const convertArgs = [
          tempSvgPath,
          '-resize', `${opts.width}x${opts.height}`,
          '-background', opts.background,
          '-quality', opts.quality.toString(),
          outputPath
        ];
        
        const convertProcess = spawn('convert', convertArgs);
        
        let convertStderr = '';
        
        convertProcess.stderr.on('data', (data) => {
          convertStderr += data.toString();
        });
        
        convertProcess.on('close', (convertCode) => {
          // Usuń tymczasowy plik SVG
          if (fs.existsSync(tempSvgPath)) {
            fs.unlinkSync(tempSvgPath);
          }
          
          if (convertCode === 0 && fs.existsSync(outputPath)) {
            resolve(true);
          } else {
            console.error('DXF thumbnail conversion failed:', convertStderr);
            resolve(false);
          }
        });
        
        convertProcess.on('error', (error) => {
          console.error('Convert process error:', error);
          // Usuń tymczasowy plik SVG w przypadku błędu
          if (fs.existsSync(tempSvgPath)) {
            fs.unlinkSync(tempSvgPath);
          }
          resolve(false);
        });
      } else {
        console.error('SVG generation failed:', svgStderr);
        resolve(false);
      }
    });
    
    svgProcess.on('error', (error) => {
      console.error('Python SVG process error:', error);
      resolve(false);
    });
  });
}

/**
 * Generuje miniaturkę dla pliku STEP używając FreeCAD
 */
export async function generateSTEPThumbnail(
  stepFilePath: string, 
  outputPath: string, 
  options: ThumbnailOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'generate_step_thumbnail.py');
    
    const args = [
      pythonScript,
      stepFilePath,
      outputPath,
      '--width', opts.width.toString(),
      '--height', opts.height.toString(),
      '--quality', opts.quality.toString(),
      '--background', opts.background
    ];

    const python = spawn('python3', args);
    
    let stderr = '';
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(true);
      } else {
        console.error('STEP thumbnail generation failed:', stderr);
        resolve(false);
      }
    });
    
    python.on('error', (error) => {
      console.error('Python process error:', error);
      resolve(false);
    });
  });
}

/**
 * Uniwersalna funkcja do generowania miniaturek na podstawie rozszerzenia pliku
 */
export async function generateThumbnail(
  filePath: string, 
  outputPath: string, 
  options: ThumbnailOptions = {},
  originalFilename?: string
): Promise<boolean> {
  // Użyj oryginalnej nazwy pliku jeśli jest dostępna, w przeciwnym razie użyj ścieżki
  const filenameForExtension = originalFilename || filePath;
  const ext = path.extname(filenameForExtension).toLowerCase();
  
  console.log(`[THUMBNAIL] Generating thumbnail for file: ${filePath}, original: ${originalFilename}, extension: ${ext}, output: ${outputPath}`);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    switch (ext) {
      case '.stl':
        return await generateSTLThumbnail(filePath, outputPath, options);
      case '.dxf':
      case '.dwg':
        return await generateDXFThumbnail(filePath, outputPath, options);
      case '.step':
      case '.stp':
        return await generateSTEPThumbnail(filePath, outputPath, options);
      default:
        console.error(`Unsupported file format for thumbnail: ${ext}`);
        return false;
    }
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return false;
  }
}

/**
 * Generuje nazwę pliku miniaturki na podstawie ID modelu
 */
export function getThumbnailPath(modelId: number, extension: string = '.png'): string {
  return path.join(process.cwd(), 'uploads/thumbnails', `model_${modelId}${extension}`);
}

/**
 * Sprawdza czy miniaturka istnieje dla danego modelu
 */
export function thumbnailExists(modelId: number): boolean {
  const thumbnailPath = getThumbnailPath(modelId);
  return fs.existsSync(thumbnailPath);
}