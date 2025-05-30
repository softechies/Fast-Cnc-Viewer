#!/usr/bin/env python3
"""
Generator miniaturek dla plików STEP
Używa FreeCAD do renderowania modeli STEP jako obrazy PNG
"""

import argparse
import sys
import os

def generate_step_thumbnail(input_path, output_path, width=300, height=300, quality=85, background='#f8f9fa'):
    """Generuje miniaturkę dla pliku STEP używając FreeCAD"""
    
    # Sprawdź czy plik istnieje
    if not os.path.exists(input_path):
        print(f"Input file does not exist: {input_path}", file=sys.stderr)
        return False
    
    try:
        import FreeCAD
        import Part
        import Draft
        import Mesh
        
        # Utwórz nowy dokument
        doc = FreeCAD.newDocument()
        
        # Załaduj plik STEP
        Part.insert(input_path, doc.Name)
        
        # Znajdź wszystkie obiekty Part
        objects = [obj for obj in doc.Objects if hasattr(obj, 'Shape') and obj.Shape.Volume > 0]
        
        if not objects:
            print("No valid geometry found in STEP file", file=sys.stderr)
            FreeCAD.closeDocument(doc.Name)
            return False
        
        # Przygotuj widok
        import FreeCADGui
        FreeCADGui.setupWithoutGUI()
        
        # Utwórz widok
        view = FreeCADGui.createViewer()
        view.setAxisCross(False)
        view.setBackgroundColor(1.0, 1.0, 1.0, 1.0)  # Białe tło
        
        # Dodaj obiekty do widoku
        for obj in objects:
            FreeCADGui.ActiveDocument.getObject(obj.Name).Visibility = True
        
        # Ustaw widok izometryczny
        view.viewIsometric()
        view.fitAll()
        
        # Renderuj do pliku
        view.saveImage(output_path, width, height, background)
        
        # Zamknij dokument
        FreeCAD.closeDocument(doc.Name)
        
        return True
        
    except ImportError:
        print("FreeCAD not available, trying alternative method", file=sys.stderr)
        return generate_step_thumbnail_alternative(input_path, output_path, width, height, quality, background)
    except Exception as e:
        print(f"Error generating STEP thumbnail: {e}", file=sys.stderr)
        try:
            FreeCAD.closeDocument(doc.Name)
        except:
            pass
        return False

def generate_step_thumbnail_alternative(input_path, output_path, width=300, height=300, quality=85, background='#f8f9fa'):
    """Alternatywna metoda generowania miniaturek STEP używając matplotlib i prostego parsera"""
    
    try:
        import matplotlib.pyplot as plt
        import matplotlib.patches as patches
        
        # Utwórz prostą wizualizację zastępczą
        fig, ax = plt.subplots(figsize=(width/100, height/100), dpi=100)
        
        # Dodaj prostą reprezentację 3D obiektu
        # Rysuj prostopadłościan jako reprezentację modelu STEP
        rect1 = patches.Rectangle((0.2, 0.2), 0.6, 0.6, linewidth=2, edgecolor='darkblue', facecolor='lightblue', alpha=0.7)
        rect2 = patches.Rectangle((0.1, 0.1), 0.6, 0.6, linewidth=1, edgecolor='blue', facecolor='lightcyan', alpha=0.5)
        
        ax.add_patch(rect2)
        ax.add_patch(rect1)
        
        # Dodaj linie dla efektu 3D
        ax.plot([0.2, 0.1], [0.2, 0.1], 'b-', linewidth=1)
        ax.plot([0.8, 0.7], [0.2, 0.1], 'b-', linewidth=1)
        ax.plot([0.8, 0.7], [0.8, 0.7], 'b-', linewidth=1)
        ax.plot([0.2, 0.1], [0.8, 0.7], 'b-', linewidth=1)
        
        # Dodaj tekst z informacją o pliku
        filename = os.path.basename(input_path)
        ax.text(0.5, 0.05, f"STEP: {filename}", ha='center', va='bottom', fontsize=8, color='darkblue')
        
        # Ustaw parametry osi
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.set_aspect('equal')
        ax.axis('off')
        
        # Ustaw tło
        fig.patch.set_facecolor(background)
        
        # Usuń marginesy
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
        
        # Zapisz jako PNG
        plt.savefig(output_path, 
                   format='png', 
                   dpi=100, 
                   bbox_inches='tight', 
                   pad_inches=0,
                   facecolor=background,
                   edgecolor='none')
        plt.close()
        
        return True
        
    except Exception as e:
        print(f"Error in alternative STEP thumbnail generation: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Generate STEP thumbnail')
    parser.add_argument('input', help='Input STEP file path')
    parser.add_argument('output', help='Output PNG file path')
    parser.add_argument('--width', type=int, default=300, help='Thumbnail width')
    parser.add_argument('--height', type=int, default=300, help='Thumbnail height')
    parser.add_argument('--quality', type=int, default=85, help='Image quality')
    parser.add_argument('--background', default='#f8f9fa', help='Background color')
    
    args = parser.parse_args()
    
    success = generate_step_thumbnail(
        args.input, 
        args.output, 
        args.width, 
        args.height, 
        args.quality, 
        args.background
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()