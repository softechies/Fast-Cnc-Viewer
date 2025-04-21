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

# Importuj bibliotekę ezdxf jako fallback
try:
    import ezdxf
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


def convert_dxf_to_svg(dxf_path, svg_path=None):
    """Konwersja pliku DXF do SVG"""
    try:
        # Zapisz informację debugowania
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"Converting DXF: {dxf_path}\n")

        # Sprawdź czy plik istnieje
        if not os.path.exists(dxf_path):
            with open("/tmp/dxf_debug.log", "a") as f:
                f.write(f"File does not exist: {dxf_path}\n")
            raise FileNotFoundError(f"DXF file not found: {dxf_path}")
            
        # Sprawdź rozmiar pliku
        file_size = os.path.getsize(dxf_path)
        if file_size == 0:
            with open("/tmp/dxf_debug.log", "a") as f:
                f.write(f"File is empty: {dxf_path}\n")
            raise ValueError("DXF file is empty")
            
        # Zapisz zawartość pliku do debugowania
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"File size: {file_size} bytes\n")
            with open(dxf_path, 'r', errors='ignore') as dxf_file:
                head = dxf_file.read(100)  # Pierwsze 100 bajtów
                f.write(f"File start: {repr(head)}\n")
        
        # Wczytaj plik DXF z obsługą różnych formatów i kodowań
        try:
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
                except Exception as e2:
                    with open("/tmp/dxf_debug.log", "a") as f:
                        f.write(f"Failed with encoding {encoding}: {str(e2)}\n")
            else:
                # Jeśli żadne kodowanie nie zadziałało, zwróć ogólny SVG z informacją o błędzie
                with open("/tmp/dxf_debug.log", "a") as f:
                    f.write("All encoding attempts failed\n")
                raise ValueError(f"Could not read DXF file with any encoding: {str(e)}")
        
        # Pobierz modelspace
        modelspace = doc.modelspace()
        
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
                except Exception as e:
                    with open("/tmp/dxf_debug.log", "a") as f:
                        f.write(f"Error getting points: {str(e)}\n")
        
        # Jeśli nie znaleziono encji, ustaw domyślne wymiary
        if min_x == float('inf'):
            min_x, min_y = 0, 0
            max_x, max_y = 100, 100
        
        width = max_x - min_x
        height = max_y - min_y
        
        # Dodaj margines
        margin = max(width, height) * 0.1
        min_x -= margin
        min_y -= margin
        max_x += margin
        max_y += margin
        width = max_x - min_x
        height = max_y - min_y
        
        # Flip Y coordinates for SVG (w SVG oś Y rośnie w dół, w CAD oś Y rośnie w górę)
        # Zamieniamy współrzędne Y i obliczamy nowe granice
        min_y_flipped = -max_y
        max_y_flipped = -min_y
        height_flipped = max_y_flipped - min_y_flipped
        
        # Stwórz SVG
        lines = []
        
        # Używamy stałego rozmiaru SVG 100% i zmieniamy zakres viewBox
        svg_width = "100%"
        svg_height = "100%"
        
        # Zaawansowane podejście - używamy faktycznych wymiarów,
        # skalujemy i środkujemy rysunek dla lepszego dopasowania do kontenera
        
        # Znajdujemy punkt środkowy rysunku
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Dodajemy 10% marginesu do lepszej wizualizacji
        padding = max(width, height) * 0.1
        adjusted_width = width + 2 * padding
        adjusted_height = height + 2 * padding
        
        # Zapewniamy minimalne wymiary, by uniknąć zbyt małych rysunków
        min_dimension = 100
        if adjusted_width < min_dimension:
            adjusted_width = min_dimension
        if adjusted_height < min_dimension:
            adjusted_height = min_dimension
            
        # Obliczamy skorygowane współrzędne viewBox
        view_min_x = center_x - (adjusted_width / 2)
        view_max_x = center_x + (adjusted_width / 2)
        view_min_y = center_y - (adjusted_height / 2)
        view_max_y = center_y + (adjusted_height / 2)
        
        # Odwracamy współrzędne Y
        view_min_y_flipped = -view_max_y
        view_height_flipped = adjusted_height
        
        # Zapisujemy informacje o skalowaniu do debugowania
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"Drawing bounds: min_x={min_x}, min_y={min_y}, max_x={max_x}, max_y={max_y}\n")
            f.write(f"Width: {width}, Height: {height}, Center: ({center_x}, {center_y})\n")
            f.write(f"ViewBox: {view_min_x} {view_min_y_flipped} {adjusted_width} {view_height_flipped}\n")
        
        # Używamy prostego viewBox obejmującego cały rysunek z marginesem
        lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" 
          viewBox="{view_min_x} {view_min_y_flipped} {adjusted_width} {view_height_flipped}"
          width="{svg_width}" height="{svg_height}"
          preserveAspectRatio="xMidYMid slice">''')
        
        # Dodajemy tło do lepszej wizualizacji
        lines.append(f'<rect x="{view_min_x}" y="{view_min_y_flipped}" width="{adjusted_width}" height="{view_height_flipped}" fill="#ffffff" />')
        
        # Dodajemy grupę dla wszystkich elementów
        lines.append('<g>')
        
        # Używamy siatki bazującej na faktycznych wymiarach rysunku
        grid_step = adjusted_width / 20  # 20 podziałek na szerokość
        lines.append(f'<g id="grid" stroke="#d0d0d0" stroke-width="0.1" opacity="0.5">')
        
        # Obsługa zakresu wartości
        try:
            # Rysujemy siatkę pionową - linie równoległe do osi Y
            for x in np.arange(view_min_x, view_max_x, grid_step):
                lines.append(f'<line x1="{x}" y1="{view_min_y_flipped}" x2="{x}" y2="{view_min_y_flipped + view_height_flipped}" stroke-width="0.1" />')
            
            # Rysujemy siatkę poziomą - linie równoległe do osi X
            for y in np.arange(view_min_y, view_max_y, grid_step):
                # Odwracamy współrzędne Y
                y_flipped = -y
                lines.append(f'<line x1="{view_min_x}" y1="{y_flipped}" x2="{view_max_x}" y2="{y_flipped}" stroke-width="0.1" />')
                
        except Exception as e:
            with open("/tmp/dxf_debug.log", "a") as f:
                f.write(f"Error generating grid: {str(e)}\n")
        
        lines.append('</g>')
        
        # Dodaj osie dla nowego viewBox
        # Używamy środka obszaru viewBox jako punktu przecięcia osi
        mid_x = view_min_x + adjusted_width / 2
        mid_y_flipped = view_min_y_flipped + view_height_flipped / 2
        
        lines.append(f'<g id="axes">')
        lines.append(f'<line x1="{view_min_x}" y1="{mid_y_flipped}" x2="{view_min_x + adjusted_width}" y2="{mid_y_flipped}" stroke="red" stroke-width="0.2" />')
        lines.append(f'<line x1="{mid_x}" y1="{view_min_y_flipped}" x2="{mid_x}" y2="{view_min_y_flipped + view_height_flipped}" stroke="blue" stroke-width="0.2" />')
        lines.append('</g>')
        
        # Dodaj encje
        lines.append('<g id="entities">')
        
        for entity in modelspace:
            if entity.dxftype() == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                # Odwracamy współrzędne Y
                lines.append(f'<line x1="{start[0]}" y1="{-start[1]}" x2="{end[0]}" y2="{-end[1]}" stroke="black" stroke-width="0.5" />')
            
            elif entity.dxftype() == 'CIRCLE':
                center = entity.dxf.center
                radius = entity.dxf.radius
                # Odwracamy współrzędne Y
                lines.append(f'<circle cx="{center[0]}" cy="{-center[1]}" r="{radius}" stroke="black" fill="none" stroke-width="0.5" />')
            
            elif entity.dxftype() == 'ARC':
                center = entity.dxf.center
                radius = entity.dxf.radius
                # W systemie SVG kąty idą w odwrotnym kierunku niż w DXF gdy Y jest odwrócone
                start_angle = 360 - entity.dxf.start_angle
                end_angle = 360 - entity.dxf.end_angle
                # Zamiana miejscami dla poprawnego kierunku łuku
                start_angle, end_angle = end_angle, start_angle
                
                # Konwersja kątów na współrzędne punktów
                import math
                start_x = center[0] + radius * math.cos(math.radians(start_angle))
                # Odwracamy współrzędne Y
                start_y = -center[1] + radius * math.sin(math.radians(start_angle))
                end_x = center[0] + radius * math.cos(math.radians(end_angle))
                # Odwracamy współrzędne Y
                end_y = -center[1] + radius * math.sin(math.radians(end_angle))
                
                large_arc = 1 if (end_angle - start_angle) % 360 > 180 else 0
                sweep = 1  # Kierunek rysowania w SVG
                
                lines.append(f'<path d="M {start_x} {start_y} A {radius} {radius} 0 {large_arc} {sweep} {end_x} {end_y}" stroke="black" fill="none" stroke-width="0.5" />')
            
            elif entity.dxftype() == 'POLYLINE':
                if entity.is_closed:
                    # Odwracamy współrzędne Y
                    points = [f"{p[0]},{-p[1]}" for p in entity.points()]
                    lines.append(f'<polygon points="{" ".join(points)}" stroke="black" fill="none" stroke-width="0.5" />')
                else:
                    # Odwracamy współrzędne Y
                    points = [f"{p[0]},{-p[1]}" for p in entity.points()]
                    lines.append(f'<polyline points="{" ".join(points)}" stroke="black" fill="none" stroke-width="0.5" />')
            
            elif entity.dxftype() == 'LWPOLYLINE':
                points = entity.get_points()
                if entity.closed:
                    # Odwracamy współrzędne Y
                    points_str = " ".join([f"{p[0]},{-p[1]}" for p in points])
                    lines.append(f'<polygon points="{points_str}" stroke="black" fill="none" stroke-width="0.5" />')
                else:
                    # Odwracamy współrzędne Y
                    points_str = " ".join([f"{p[0]},{-p[1]}" for p in points])
                    lines.append(f'<polyline points="{points_str}" stroke="black" fill="none" stroke-width="0.5" />')
            
            elif entity.dxftype() == 'TEXT':
                try:
                    insert = entity.dxf.insert
                    text = entity.dxf.text
                    height = entity.dxf.height
                    # Odwracamy współrzędne Y
                    lines.append(f'<text x="{insert[0]}" y="{-insert[1]}" font-size="{height}">{text}</text>')
                except Exception:
                    pass
        
        lines.append('</g>')
        # Zamykamy grupę transformacji
        lines.append('</g>')
        lines.append('</svg>')
        
        svg_content = '\n'.join(lines)
        
        # Zapisz SVG do pliku, jeśli podano ścieżkę
        if svg_path:
            with open(svg_path, 'w') as f:
                f.write(svg_content)
        
        return svg_content
    
    except Exception as e:
        # Zapisz pełny traceback do pliku debugowania
        with open("/tmp/dxf_debug.log", "a") as f:
            f.write(f"Error in convert_dxf_to_svg: {str(e)}\n")
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