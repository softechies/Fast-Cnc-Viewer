import { db } from './server/db';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanDatabase() {
  try {
    console.log('Rozpoczynam czyszczenie bazy danych...');
    
    // Zachowujemy użytkowników - usuwamy tylko modele i statystyki wyświetleń
    await db.delete(schema.modelViews);
    console.log('Usunięto statystyki wyświetleń modeli');
    
    await db.delete(schema.models);
    console.log('Usunięto informacje o modelach');
    
    console.log('Baza danych została wyczyszczona');
    
    // Czyszczenie katalogów z plikami
    const uploadsDir = path.join(__dirname, 'uploads');
    const directories = [
      path.join(uploadsDir, 'cad-uploads'),
      path.join(uploadsDir, 'dxf-uploads'),
      path.join(uploadsDir, 'step-uploads'),
      path.join(uploadsDir, 'stl-uploads')
    ];
    
    // Usuwanie plików SVG z katalogu uploads (wizualizacje DXF)
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file.endsWith('.svg')) {
        fs.unlinkSync(path.join(uploadsDir, file));
        console.log(`Usunięto plik: ${file}`);
      }
    }
    
    // Czyszczenie katalogów z plikami modeli
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          fs.unlinkSync(path.join(dir, file));
          console.log(`Usunięto plik: ${path.join(dir, file)}`);
        }
        console.log(`Wyczyszczono katalog: ${dir}`);
      }
    }
    
    console.log('Zakończono czyszczenie plików');
    
  } catch (error) {
    console.error('Wystąpił błąd podczas czyszczenia bazy danych:', error);
  } finally {
    process.exit(0);
  }
}

cleanDatabase();
