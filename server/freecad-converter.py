#!/usr/bin/env python
import sys
import os
import json

# Spróbujmy zaimportować moduły FreeCAD
try:
    import FreeCAD
    import Part
    import Mesh
    from FreeCAD import Gui, App
except ImportError:
    print("Error: Cannot import FreeCAD modules. Make sure FreeCAD is installed correctly.")
    sys.exit(1)

def convert_step_to_stl(input_file, output_file):
    """Konwertuje plik STEP do formatu STL."""
    try:
        # Otwórz plik STEP
        print(f"Opening STEP file: {input_file}")
        shape = Part.Shape()
        shape.read(input_file)
        
        # Utwórz dokument FreeCAD
        doc = FreeCAD.newDocument("Conversion")
        
        # Utwórz obiekt Part
        part = doc.addObject("Part::Feature", "Part")
        part.Shape = shape
        
        # Eksportuj do STL
        print(f"Exporting to STL: {output_file}")
        Mesh.export([part], output_file)
        
        # Zapisz metadane o modelu
        create_model_info(shape, os.path.splitext(output_file)[0] + ".json")
        
        print("Conversion completed successfully")
        return True
    except Exception as e:
        print(f"Error converting file: {str(e)}")
        return False
def convert_dwg_to_svg(input_file, output_file):
    """Konwertuje plik DWG do formatu SVG."""
    try:
        # Otwórz plik DWG
        print(f"Opening DWG file: {input_file}")
        doc = App.openDocument(input_file)
        if not doc:
            raise Exception("Failed to open DWG file")

        # Aktywuj Drawing Workbench
        Gui.activateWorkbench("DrawingWorkbench")
        
        # Utwórz stronę rysunku
        page = doc.addObject("Drawing::FeaturePage", "Page")
        page.ViewResult = "SVG"
        
        # Eksportuj do SVG
        print(f"Exporting to SVG: {output_file}")
        doc.saveAs(output_file)
        App.closeDocument(doc.Name)
        
        print("Conversion completed successfully")
        return True
    except Exception as e:
        print(f"Error converting DWG to SVG: {str(e)}")
        return False

def create_model_info(shape, output_file):
    """Tworzy plik JSON z informacjami o modelu."""
    try:
        # Pobierz podstawowe informacje o kształcie
        bbox = shape.BoundBox
        volume = shape.Volume
        area = shape.Area
        
        # Zlicz elementy w modelu
        faces_count = len(shape.Faces)
        edges_count = len(shape.Edges)
        vertices_count = len(shape.Vertexes)
        
        # Stwórz słownik z informacjami
        model_info = {
            "dimensions": {
                "width": bbox.XLength,
                "height": bbox.YLength,
                "depth": bbox.ZLength
            },
            "center": {
                "x": bbox.XMin + (bbox.XLength / 2),
                "y": bbox.YMin + (bbox.YLength / 2),
                "z": bbox.ZMin + (bbox.ZLength / 2)
            },
            "volume": volume,
            "area": area,
            "elements": {
                "faces": faces_count,
                "edges": edges_count,
                "vertices": vertices_count
            }
        }
        
        # Zapisz informacje do pliku JSON
        with open(output_file, 'w') as f:
            json.dump(model_info, f, indent=2)
        
        print(f"Model information saved to {output_file}")
    except Exception as e:
        print(f"Error creating model information: {str(e)}")

if __name__ == "__main__":
    # Sprawdź argumenty
    if len(sys.argv) < 3:
        print("Usage: python freecad-converter.py input.step output.stl")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Sprawdź, czy pliki istnieją
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} does not exist")
        sys.exit(1)
    
    # Uruchom konwersję
    success = convert_step_to_stl(input_file, output_file)
    sys.exit(0 if success else 1)