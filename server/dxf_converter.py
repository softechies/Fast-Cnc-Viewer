#!/usr/bin/env python3
"""
Zmodyfikowany konwerter plików DXF do SVG i JSON
Używa biblioteki własnej oraz ezdxf jako fallback

Ta wersja konwertera obsługuje zarówno standardową bibliotekę ezdxf,
jak i specjalną bibliotekę do obsługi plików DXF, która lepiej radzi sobie
z plikami DXF utworzonymi w różnych programach CAD.
"""

import os
import sys
import json
import traceback
import numpy as np
import math
import ezdxf
from typing import Dict, Any, List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for SVG generation
SVG_PRECISION = 6  # Decimal places for SVG coordinates
DEFAULT_MARGIN_PERCENT = 0.1  # 10% margin
MIN_DIMENSION = 200  # Minimum dimension in SVG units
MAX_DIMENSION = 1000  # Maximum dimension in SVG units

# Importuj bibliotekę ezdxf jako fallback
try:
    from ezdxf.addons import r12writer
    HAVE_EZDXF = True
except ImportError:
    HAVE_EZDXF = False
    print("Warning: ezdxf library is not available (fallback won't work)")

# Flaga określająca czy używamy własnej biblioteki czy ezdxf jako fallback
USE_CUSTOM_LIBRARY = False

# Próba importu własnej biblioteki DXF
try:
    # TODO: Zmień 'custom_dxf_library' na nazwę Twojej biblioteki
    # import custom_dxf_library as custom_dxf
    # HAVE_CUSTOM_LIBRARY = True
    
    # Tymczasowo wyłączamy własną bibliotekę, dopóki nie zostanie określona
    HAVE_CUSTOM_LIBRARY = False
    if USE_CUSTOM_LIBRARY:
        print("Warning: Custom DXF library not specified yet")
except ImportError:
    HAVE_CUSTOM_LIBRARY = False
    print("Warning: Custom DXF library is not available")
    
# Jeśli brak obu bibliotek, wyświetl ostrzeżenie
if not HAVE_EZDXF and not HAVE_CUSTOM_LIBRARY:
    print("Error: Neither custom DXF library nor ezdxf are available")

# Funkcje pomocnicze dla własnej biblioteki
def parse_dxf_with_custom_library(dxf_path):
    """Parsuje plik DXF przy użyciu własnej biblioteki"""
    # TODO: Zaimplementuj parsowanie przy użyciu własnej biblioteki
    # Przykład:
    # dxf = custom_dxf.parse(dxf_path)
    # return dxf
    raise NotImplementedError("Custom DXF library integration not implemented yet")
    
def convert_dxf_to_svg_with_custom_library(dxf_path, svg_path=None):
    """Konwertuje plik DXF do SVG przy użyciu własnej biblioteki"""
    # TODO: Zaimplementuj konwersję przy użyciu własnej biblioteki
    # Przykład:
    # dxf = custom_dxf.parse(dxf_path)
    # svg = custom_dxf.to_svg(dxf)
    # if svg_path:
    #     with open(svg_path, 'w') as f:
    #         f.write(svg)
    # return svg
    raise NotImplementedError("Custom DXF library integration not implemented yet")


def parse_dxf_file(dxf_path):
    """Parsowanie pliku DXF i zwrócenie podstawowych informacji o nim"""
    try:
        # Zapisz informację debugowania
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"Parsing DXF file: {dxf_path}\n")
            f.write(f"USE_CUSTOM_LIBRARY: {USE_CUSTOM_LIBRARY}\n")
            f.write(f"HAVE_CUSTOM_LIBRARY: {HAVE_CUSTOM_LIBRARY}\n")
            f.write(f"HAVE_EZDXF: {HAVE_EZDXF}\n")
            
        # Sprawdź czy plik istnieje
        if not os.path.exists(dxf_path):
            raise FileNotFoundError(f"DXF file not found: {dxf_path}")
            
        # Sprawdź rozmiar pliku
        file_size = os.path.getsize(dxf_path)
        if file_size == 0:
            raise ValueError("DXF file is empty")
            
        # Próbuj użyć własnej biblioteki, jeśli jest dostępna i włączona
        if USE_CUSTOM_LIBRARY and HAVE_CUSTOM_LIBRARY:
            try:
                with open("/tmp/dxf_debug.log", "a") as f:
                    f.write("Trying to use custom DXF library\n")
                return parse_dxf_with_custom_library(dxf_path)
            except Exception as e:
                with open("/tmp/dxf_debug.log", "a") as f:
                    f.write(f"Custom library failed: {str(e)}, falling back to ezdxf\n")
                # Jeśli własna biblioteka zawiedzie, używamy ezdxf jako fallback
                if not HAVE_EZDXF:
                    raise ValueError("Custom library failed and ezdxf is not available")
        
        # Używamy ezdxf jako głównej biblioteki lub jako fallback
        if HAVE_EZDXF:
            try:
                with open("/tmp/dxf_debug.log", "a") as f:
                    f.write("Using ezdxf library\n")
                doc = ezdxf.readfile(dxf_path)
            except Exception as e:
                with open("/tmp/dxf_debug.log", "a") as f:
                    f.write(f"Standard readfile failed: {str(e)}\n")
                # Spróbuj otworzyć jako strumień z różnymi kodowaniami
                for encoding in ['utf-8', 'latin1', 'ascii', 'cp1250', 'cp1252']:
                    try:
                        with open("/tmp/dxf_debug.log", "a") as f:
                            f.write(f"Trying encoding: {encoding}\n")
                        with open(dxf_path, encoding=encoding, errors='ignore') as fp:
                            doc = ezdxf.read(fp)
                        with open("/tmp/dxf_debug.log", "a") as f:
                            f.write(f"Success with encoding: {encoding}\n")
                        break
                    except Exception:
                        continue
                else:
                    # Jeśli żadne kodowanie nie zadziałało, zgłoś błąd
                    raise ValueError(f"Could not read DXF file with any encoding: {str(e)}")
        else:
            raise ValueError("No DXF library available")
        
        modelspace = doc.modelspace()
        
        # Zbieranie informacji o warstwach
        layers = {layer.dxf.name: {
            'name': layer.dxf.name,
            'color': layer.dxf.color,
            'linetype': layer.dxf.linetype
        } for layer in doc.layers}
        
        # Liczenie encji w modelspace
        entity_counts = {}
        total_entities = 0
        
        for entity in modelspace:
            entity_type = entity.dxftype()
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1
            total_entities += 1
        
        # Określenie wymiarów dokumentu
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')
        
        for entity in modelspace:
            if hasattr(entity, 'get_points'):
                try:
                    points = entity.get_points()
                    for point in points:
                        min_x = min(min_x, point[0])
                        min_y = min(min_y, point[1])
                        max_x = max(max_x, point[0])
                        max_y = max(max_y, point[1])
                except Exception:
                    pass
        
        # Jeśli nie znaleziono encji, ustaw domyślne wymiary
        if min_x == float('inf'):
            min_x, min_y = 0, 0
            max_x, max_y = 100, 100
        
        # Zwróć informacje o dokumencie
        result = {
            'filename': os.path.basename(dxf_path),
            'layers': list(layers.values()),
            'entity_counts': entity_counts,
            'total_entities': total_entities,
            'bounds': {
                'min_x': min_x,
                'min_y': min_y,
                'max_x': max_x,
                'max_y': max_y,
                'width': max_x - min_x,
                'height': max_y - min_y,
                'center_x': (min_x + max_x) / 2,
                'center_y': (min_y + max_y) / 2
            }
        }
        
        return result
    except Exception as e:
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }


def normalize_scale(width: float, height: float) -> Tuple[float, float]:
    """
    Normalize drawing scale to fit within reasonable SVG dimensions while preserving aspect ratio.
    """
    aspect_ratio = width / height if height != 0 else 1
    
    if width > height:
        if width > MAX_DIMENSION:
            width = MAX_DIMENSION
            height = width / aspect_ratio
        elif width < MIN_DIMENSION:
            width = MIN_DIMENSION
            height = width / aspect_ratio
    else:
        if height > MAX_DIMENSION:
            height = MAX_DIMENSION
            width = height * aspect_ratio
        elif height < MIN_DIMENSION:
            height = MIN_DIMENSION
            width = height * aspect_ratio
            
    return width, height

def detect_units(doc: ezdxf.document.Drawing) -> Tuple[str, float]:
    """
    Detect the units used in the DXF file and return the appropriate scale factor.
    """
    try:
        # Get units from DXF header
        dxf_units = doc.header.get('$INSUNITS', 4)  # Default to mm (4)
        
        # Map DXF unit codes to unit names and scale factors (relative to mm)
        unit_map = {
            1: ("in", 25.4),      # inches
            2: ("ft", 304.8),     # feet
            3: ("mi", 1609344.0), # miles
            4: ("mm", 1.0),       # millimeters
            5: ("cm", 10.0),      # centimeters
            6: ("m", 1000.0),     # meters
            7: ("km", 1000000.0), # kilometers
            8: ("µm", 0.001),     # micrometers
            9: ("dm", 100.0),     # decimeters
        }
        
        unit_info = unit_map.get(dxf_units, ("mm", 1.0))
        return unit_info[0], unit_info[1]
    except Exception as e:
        logger.warning(f"Error detecting units: {e}")
        return "mm", 1.0

def get_entity_bounds(entity) -> Tuple[float, float, float, float]:
    """
    Get the bounding box of a DXF entity.
    Returns (min_x, min_y, max_x, max_y)
    """
    try:
        points = []
        if hasattr(entity, 'get_points'):
            points.extend(entity.get_points())
        elif entity.dxftype() == 'LINE':
            points.extend([entity.dxf.start, entity.dxf.end])
        elif entity.dxftype() == 'CIRCLE':
            center = entity.dxf.center
            radius = entity.dxf.radius
            points.extend([
                (center[0] - radius, center[1] - radius),
                (center[0] + radius, center[1] + radius)
            ])
        elif entity.dxftype() == 'ARC':
            center = entity.dxf.center
            radius = entity.dxf.radius
            start_angle = math.radians(entity.dxf.start_angle)
            end_angle = math.radians(entity.dxf.end_angle)
            
            # Add center and points at 90-degree intervals within the arc
            points.append(center)
            current_angle = start_angle
            while current_angle <= end_angle:
                points.append((
                    center[0] + radius * math.cos(current_angle),
                    center[1] + radius * math.sin(current_angle)
                ))
                current_angle += math.pi/2
            
            # Add end point
            points.append((
                center[0] + radius * math.cos(end_angle),
                center[1] + radius * math.sin(end_angle)
            ))
            
        if not points:
            return (0, 0, 0, 0)
            
        x_coords = [p[0] for p in points]
        y_coords = [p[1] for p in points]
        return (
            min(x_coords),
            min(y_coords),
            max(x_coords),
            max(y_coords)
        )
    except Exception as e:
        logger.warning(f"Error getting entity bounds: {e}")
        return (0, 0, 0, 0)

def convert_dxf_to_svg(dxf_path: str, svg_path: Optional[str] = None) -> str:
    """
    Convert DXF file to SVG with improved scale preservation and centering.
    """
    try:
        # Load DXF file
        doc = ezdxf.readfile(dxf_path)
        modelspace = doc.modelspace()
        
        # Detect units and get scale factor
        unit_name, scale_factor = detect_units(doc)
        logger.info(f"Detected units: {unit_name} (scale factor: {scale_factor})")
        
        # Calculate bounds
        min_x = min_y = float('inf')
        max_x = max_y = float('-inf')
        
        for entity in modelspace:
            entity_min_x, entity_min_y, entity_max_x, entity_max_y = get_entity_bounds(entity)
            min_x = min(min_x, entity_min_x)
            min_y = min(min_y, entity_min_y)
            max_x = max(max_x, entity_max_x)
            max_y = max(max_y, entity_max_y)
        
        if min_x == float('inf'):
            min_x = min_y = 0
            max_x = max_y = 100
        
        # Calculate dimensions
        width = (max_x - min_x) * scale_factor
        height = (max_y - min_y) * scale_factor
        
        # Add margin
        margin = max(width, height) * DEFAULT_MARGIN_PERCENT
        min_x -= margin / scale_factor
        min_y -= margin / scale_factor
        max_x += margin / scale_factor
        max_y += margin / scale_factor
        
        # Normalize scale for SVG
        svg_width, svg_height = normalize_scale(width, height)
        scale = min(svg_width / width, svg_height / height)
        
        # Calculate translation to center the drawing
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Start SVG
        lines = []
        lines.append('<?xml version="1.0" encoding="UTF-8"?>')
        lines.append('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">')
        lines.append(f'<svg version="1.1" width="{svg_width:.{SVG_PRECISION}f}" height="{svg_height:.{SVG_PRECISION}f}" ' +
                    f'viewBox="{min_x:.{SVG_PRECISION}f} {min_y:.{SVG_PRECISION}f} {(max_x-min_x):.{SVG_PRECISION}f} {(max_y-min_y):.{SVG_PRECISION}f}" ' +
                    'xmlns="http://www.w3.org/2000/svg">')
        
        # Add metadata
        lines.append('<metadata>')
        lines.append(f'<units>{unit_name}</units>')
        lines.append(f'<scale>{scale:.{SVG_PRECISION}f}</scale>')
        lines.append('</metadata>')
        
        # Transform group for proper orientation
        lines.append(f'<g transform="scale(1,-1) translate({-center_x:.{SVG_PRECISION}f},{-center_y:.{SVG_PRECISION}f})">')
        
        # Convert entities
        for entity in modelspace:
            if entity.dxftype() == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                lines.append(f'<line x1="{start[0]:.{SVG_PRECISION}f}" y1="{start[1]:.{SVG_PRECISION}f}" ' +
                           f'x2="{end[0]:.{SVG_PRECISION}f}" y2="{end[1]:.{SVG_PRECISION}f}" ' +
                           'stroke="black" stroke-width="0.5"/>')
            
            elif entity.dxftype() == 'CIRCLE':
                center = entity.dxf.center
                radius = entity.dxf.radius
                lines.append(f'<circle cx="{center[0]:.{SVG_PRECISION}f}" cy="{center[1]:.{SVG_PRECISION}f}" ' +
                           f'r="{radius:.{SVG_PRECISION}f}" stroke="black" fill="none" stroke-width="0.5"/>')
            
            elif entity.dxftype() == 'ARC':
                center = entity.dxf.center
                radius = entity.dxf.radius
                start_angle = entity.dxf.start_angle
                end_angle = entity.dxf.end_angle
                
                # Ensure angles are properly ordered
                if end_angle < start_angle:
                    end_angle += 360
                
                # Calculate start and end points
                start_x = center[0] + radius * math.cos(math.radians(start_angle))
                start_y = center[1] + radius * math.sin(math.radians(start_angle))
                end_x = center[0] + radius * math.cos(math.radians(end_angle))
                end_y = center[1] + radius * math.sin(math.radians(end_angle))
                
                # Determine if arc is larger than 180 degrees
                large_arc = 1 if (end_angle - start_angle) > 180 else 0
                
                lines.append(f'<path d="M {start_x:.{SVG_PRECISION}f},{start_y:.{SVG_PRECISION}f} ' +
                           f'A {radius:.{SVG_PRECISION}f},{radius:.{SVG_PRECISION}f} 0 {large_arc} 1 {end_x:.{SVG_PRECISION}f},{end_y:.{SVG_PRECISION}f}" ' +
                           'stroke="black" fill="none" stroke-width="0.5"/>')
            
            elif entity.dxftype() in ('LWPOLYLINE', 'POLYLINE'):
                points = entity.get_points() if hasattr(entity, 'get_points') else []
                if points:
                    points_str = " ".join([f"{p[0]:.{SVG_PRECISION}f},{p[1]:.{SVG_PRECISION}f}" for p in points])
                    if getattr(entity, 'closed', False):
                        lines.append(f'<polygon points="{points_str}" stroke="black" fill="none" stroke-width="0.5"/>')
                    else:
                        lines.append(f'<polyline points="{points_str}" stroke="black" fill="none" stroke-width="0.5"/>')
        
        # Close groups and SVG
        lines.append('</g>')
        lines.append('</svg>')
        
        svg_content = '\n'.join(lines)
        
        # Save to file if path provided
        if svg_path:
            with open(svg_path, 'w') as f:
                f.write(svg_content)
        
        return svg_content
        
    except Exception as e:
        logger.error(f"Error converting DXF to SVG: {str(e)}")
        logger.error(traceback.format_exc())
        raise


def export_to_json(dxf_path, json_path):
    """Eksport informacji o pliku DXF do pliku JSON"""
    result = parse_dxf_file(dxf_path)
    
    with open(json_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    return result


if __name__ == '__main__':
    """Uruchomienie skryptu z linii poleceń"""
    if len(sys.argv) < 3:
        print("Usage: python dxf_converter.py dxf_file output_format [output_file]")
        print("  output_format: svg, json or info")
        sys.exit(1)
    
    dxf_file = sys.argv[1]
    output_format = sys.argv[2].lower()
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    if not os.path.exists(dxf_file):
        print(f"Error: File {dxf_file} does not exist")
        sys.exit(1)
    
    if output_format == 'svg':
        result = convert_dxf_to_svg(dxf_file, output_file)
        if not output_file:
            print(result)
    
    elif output_format == 'json':
        if not output_file:
            output_file = dxf_file.replace('.dxf', '.json')
        result = export_to_json(dxf_file, output_file)
        print(f"Exported to {output_file}")
    
    elif output_format == 'info':
        result = parse_dxf_file(dxf_file)
        print(json.dumps(result, indent=2))
    
    else:
        print(f"Unknown output format: {output_format}")
        sys.exit(1)