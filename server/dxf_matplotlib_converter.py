#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Konwerter plików DXF do SVG używający matplotlib
Ten konwerter tworzy czyste SVG z plików DXF, zapewniając poprawne
wycentrowanie geometrii na wszystkich urządzeniach.
"""

import os
import sys
import json
import traceback
import io
import base64
from typing import Dict, List, Tuple, Optional, Any, Union
import math

try:
    import ezdxf
    from ezdxf.addons import r12writer
except ImportError:
    print("BŁĄD: Biblioteka ezdxf nie jest zainstalowana. Użyj 'pip install ezdxf'")
    sys.exit(1)

try:
    import matplotlib.pyplot as plt
    from matplotlib.path import Path
    import matplotlib.patches as patches
    from matplotlib.figure import Figure
    from matplotlib.backends.backend_svg import FigureCanvasSVG
except ImportError:
    print("BŁĄD: Biblioteka matplotlib nie jest zainstalowana. Użyj 'pip install matplotlib'")
    sys.exit(1)


def parse_dxf_file(dxf_path: str) -> Dict[str, Any]:
    """Parsowanie pliku DXF i zwrócenie podstawowych informacji o nim"""
    
    # Sprawdź, czy plik istnieje
    if not os.path.exists(dxf_path):
        raise FileNotFoundError(f"Plik {dxf_path} nie istnieje")
    
    # Sprawdź rozmiar pliku
    file_size = os.path.getsize(dxf_path)
    if file_size == 0:
        raise ValueError("Plik DXF jest pusty")
    
    try:
        # Wczytaj plik DXF
        doc = ezdxf.readfile(dxf_path)
        
        # Pobierz modelspace
        modelspace = doc.modelspace()
        
        # Określenie wymiarów dokumentu
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')
        
        for entity in modelspace:
            if hasattr(entity, 'get_points'):
                points = entity.get_points()
                for point in points:
                    min_x = min(min_x, point[0])
                    min_y = min(min_y, point[1])
                    max_x = max(max_x, point[0])
                    max_y = max(max_y, point[1])
            elif entity.dxftype() == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                min_x = min(min_x, start[0], end[0])
                min_y = min(min_y, start[1], end[1])
                max_x = max(max_x, start[0], end[0])
                max_y = max(max_y, start[1], end[1])
            elif entity.dxftype() == 'CIRCLE':
                center = entity.dxf.center
                radius = entity.dxf.radius
                min_x = min(min_x, center[0] - radius)
                min_y = min(min_y, center[1] - radius)
                max_x = max(max_x, center[0] + radius)
                max_y = max(max_y, center[1] + radius)
            elif entity.dxftype() == 'ARC':
                center = entity.dxf.center
                radius = entity.dxf.radius
                min_x = min(min_x, center[0] - radius)
                min_y = min(min_y, center[1] - radius)
                max_x = max(max_x, center[0] + radius)
                max_y = max(max_y, center[1] + radius)
        
        # Jeśli nie znaleziono encji, ustaw domyślne wymiary
        if min_x == float('inf'):
            min_x, min_y = 0, 0
            max_x, max_y = 100, 100
        
        width = max_x - min_x
        height = max_y - min_y
        
        # Zbierz informacje o pliku DXF
        info = {
            "filename": os.path.basename(dxf_path),
            "filesize": file_size,
            "width": width,
            "height": height,
            "units": "mm",  # Domyślnie milimetry
            "minX": min_x,
            "minY": min_y,
            "maxX": max_x,
            "maxY": max_y,
            "count": {
                "entities": len(list(modelspace)),
                "layers": len(doc.layers),
            }
        }
        
        return info
        
    except Exception as e:
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"Error in parse_dxf_file: {str(e)}\n")
            f.write(traceback.format_exc() + "\n")
        raise ValueError(f"Błąd podczas parsowania pliku DXF: {str(e)}")


def convert_dxf_to_svg_matplotlib(dxf_path: str, svg_path: Optional[str] = None) -> str:
    """Konwertuje plik DXF do SVG używając matplotlib"""
    try:
        # Wczytaj plik DXF
        doc = ezdxf.readfile(dxf_path)
        
        # Pobierz modelspace
        modelspace = doc.modelspace()
        
        # Określenie wymiarów dokumentu
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')
        
        for entity in modelspace:
            if hasattr(entity, 'get_points'):
                points = entity.get_points()
                for point in points:
                    min_x = min(min_x, point[0])
                    min_y = min(min_y, point[1])
                    max_x = max(max_x, point[0])
                    max_y = max(max_y, point[1])
            elif entity.dxftype() == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                min_x = min(min_x, start[0], end[0])
                min_y = min(min_y, start[1], end[1])
                max_x = max(max_x, start[0], end[0])
                max_y = max(max_y, start[1], end[1])
            elif entity.dxftype() == 'CIRCLE':
                center = entity.dxf.center
                radius = entity.dxf.radius
                min_x = min(min_x, center[0] - radius)
                min_y = min(min_y, center[1] - radius)
                max_x = max(max_x, center[0] + radius)
                max_y = max(max_y, center[1] + radius)
            elif entity.dxftype() == 'ARC':
                center = entity.dxf.center
                radius = entity.dxf.radius
                min_x = min(min_x, center[0] - radius)
                min_y = min(min_y, center[1] - radius)
                max_x = max(max_x, center[0] + radius)
                max_y = max(max_y, center[1] + radius)
        
        # Jeśli nie znaleziono encji, ustaw domyślne wymiary
        if min_x == float('inf'):
            min_x, min_y = 0, 0
            max_x, max_y = 100, 100
        
        # Oblicz szerokość i wysokość
        width = max_x - min_x
        height = max_y - min_y
        
        # Dodaj margines 10%
        margin = max(width, height) * 0.1
        min_x -= margin
        min_y -= margin
        max_x += margin
        max_y += margin
        
        # Zaktualizuj szerokość i wysokość
        width = max_x - min_x
        height = max_y - min_y
        
        # Znajdź punkt środkowy
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Utwórz rysunek, upewniając się, że zachowany jest stosunek boków
        fig = Figure(figsize=(8, 8 * height / width if width > height else 8))
        ax = fig.add_subplot(111, aspect='equal')
        
        # Odwróć oś Y, by zachować konwencję CAD (Y do góry)
        ax.invert_yaxis()
        
        # Ustaw limity osi
        ax.set_xlim(min_x, max_x)
        ax.set_ylim(max_y, min_y)  # Odwrócone limity Y
        
        # Dodaj siatkę
        ax.grid(True, linestyle='--', alpha=0.3)
        
        # Dodaj osie współrzędnych
        ax.axhline(y=0, color='r', linestyle='-', alpha=0.3)
        ax.axvline(x=0, color='b', linestyle='-', alpha=0.3)
        
        # Wyłącz tiki i etykiety osi
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_xticklabels([])
        ax.set_yticklabels([])
        
        # Wyłącz ramki
        for spine in ax.spines.values():
            spine.set_visible(False)
        
        # Narysuj wszystkie encje
        for entity in modelspace:
            if entity.dxftype() == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                ax.plot([start[0], end[0]], [start[1], end[1]], 'k-', linewidth=0.5)
            
            elif entity.dxftype() == 'CIRCLE':
                center = entity.dxf.center
                radius = entity.dxf.radius
                circle = plt.Circle((center[0], center[1]), radius, fill=False, color='k', linewidth=0.5)
                ax.add_patch(circle)
            
            elif entity.dxftype() == 'ARC':
                center = entity.dxf.center
                radius = entity.dxf.radius
                start_angle = entity.dxf.start_angle
                end_angle = entity.dxf.end_angle
                
                # Matplotlib używa kątów w radianach przeciwnie do ruchu wskazówek zegara
                start_angle_rad = math.radians(90 - start_angle)
                end_angle_rad = math.radians(90 - end_angle)
                
                # Poprawka dla parametrów kąta
                if end_angle < start_angle:
                    end_angle_rad = math.radians(90 - (end_angle + 360))
                
                arc = patches.Arc(
                    center, 
                    2 * radius,  # Szerokość
                    2 * radius,  # Wysokość
                    angle=0,     # Kąt obrotu
                    theta1=math.degrees(start_angle_rad),
                    theta2=math.degrees(end_angle_rad),
                    color='k',
                    linewidth=0.5
                )
                ax.add_patch(arc)
            
            elif entity.dxftype() == 'POLYLINE' or entity.dxftype() == 'LWPOLYLINE':
                points = entity.get_points()
                coords = [(p[0], p[1]) for p in points]
                
                if len(coords) > 1:
                    if hasattr(entity, 'closed') and entity.closed:
                        # Zamknięty wielokąt
                        poly = patches.Polygon(coords, closed=True, fill=False, color='k', linewidth=0.5)
                        ax.add_patch(poly)
                    else:
                        # Otwarta linia łamana
                        x_coords = [p[0] for p in coords]
                        y_coords = [p[1] for p in coords]
                        ax.plot(x_coords, y_coords, 'k-', linewidth=0.5)
        
        # Utwórz SVG jako ciąg znaków
        svg_io = io.StringIO()
        canvas = FigureCanvasSVG(fig)
        canvas.print_svg(svg_io)
        svg_content = svg_io.getvalue()
        
        # Zapisz SVG do pliku, jeśli podano ścieżkę
        if svg_path:
            with open(svg_path, 'w') as f:
                f.write(svg_content)
        
        # Dodaj do SVG informacje o wymiarach
        svg_content = svg_content.replace('</svg>', f'''
  <metadata>
    <dimensions>
      <width>{width}</width>
      <height>{height}</height>
      <minX>{min_x}</minX>
      <minY>{min_y}</minY>
      <maxX>{max_x}</maxX>
      <maxY>{max_y}</maxY>
      <units>mm</units>
    </dimensions>
  </metadata>
</svg>''')
        
        # Optymalizuj SVG dla mobilnych urządzeń
        svg_content = svg_content.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ')
        
        # Zapisz zmodyfikowane SVG
        if svg_path:
            with open(svg_path, 'w') as f:
                f.write(svg_content)
        
        return svg_content
        
    except Exception as e:
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"Error in convert_dxf_to_svg_matplotlib: {str(e)}\n")
            f.write(traceback.format_exc() + "\n")
        
        # Stwórz SVG z informacją o błędzie
        error_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <rect width="300" height="300" fill="#f8f8f8" />
            <text x="20" y="80" font-family="Arial" font-size="16" fill="red">Error converting DXF to SVG:</text>
            <text x="20" y="110" font-family="Arial" font-size="12">{str(e)[:50]}</text>
            <text x="20" y="130" font-family="Arial" font-size="12">{str(e)[50:100] if len(str(e)) > 50 else ""}</text>
        </svg>'''
        
        if svg_path:
            with open(svg_path, 'w') as f:
                f.write(error_svg)
        
        return error_svg


if __name__ == '__main__':
    """Uruchomienie skryptu z linii poleceń"""
    if len(sys.argv) < 3:
        print("Usage: python dxf_matplotlib_converter.py dxf_file output_format [output_file]")
        print("  output_format: svg, json or info")
        sys.exit(1)
    
    dxf_file = sys.argv[1]
    output_format = sys.argv[2].lower()
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    if not os.path.exists(dxf_file):
        print(f"Error: File {dxf_file} does not exist")
        sys.exit(1)
    
    if output_format == 'svg':
        result = convert_dxf_to_svg_matplotlib(dxf_file, output_file)
        if not output_file:
            print(result)
    
    elif output_format == 'json':
        if not output_file:
            output_file = dxf_file.replace('.dxf', '.json')
        result = parse_dxf_file(dxf_file)
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Exported to {output_file}")
    
    elif output_format == 'info':
        result = parse_dxf_file(dxf_file)
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown output format: {output_format}")
        sys.exit(1)