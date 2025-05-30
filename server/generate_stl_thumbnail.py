#!/usr/bin/env python3
"""
Generator miniaturek dla plików STL
Używa matplotlib i numpy do renderowania 3D modeli STL jako obrazy PNG
"""

import argparse
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import matplotlib.patches as patches
import sys
import os

def parse_stl_binary(file_path):
    """Parsuje binarny plik STL"""
    try:
        with open(file_path, 'rb') as f:
            # Pomiń nagłówek (80 bajtów)
            f.seek(80)
            
            # Odczytaj liczbę trójkątów
            triangle_count = int.from_bytes(f.read(4), byteorder='little')
            
            vertices = []
            faces = []
            
            for i in range(triangle_count):
                # Pomiń wektor normalny (12 bajtów)
                f.read(12)
                
                # Odczytaj 3 wierzchołki (po 12 bajtów każdy)
                triangle_vertices = []
                for j in range(3):
                    x = np.frombuffer(f.read(4), dtype=np.float32)[0]
                    y = np.frombuffer(f.read(4), dtype=np.float32)[0]
                    z = np.frombuffer(f.read(4), dtype=np.float32)[0]
                    triangle_vertices.append([x, y, z])
                
                # Dodaj wierzchołki do listy
                start_idx = len(vertices)
                vertices.extend(triangle_vertices)
                faces.append([start_idx, start_idx + 1, start_idx + 2])
                
                # Pomiń atrybuty (2 bajty)
                f.read(2)
            
            return np.array(vertices), np.array(faces)
            
    except Exception as e:
        print(f"Error parsing STL file: {e}", file=sys.stderr)
        return None, None

def parse_stl_ascii(file_path):
    """Parsuje ASCII plik STL"""
    try:
        vertices = []
        faces = []
        
        with open(file_path, 'r') as f:
            lines = f.readlines()
            
        i = 0
        triangle_vertices = []
        
        while i < len(lines):
            line = lines[i].strip().lower()
            
            if line.startswith('vertex'):
                parts = line.split()
                if len(parts) >= 4:
                    x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                    triangle_vertices.append([x, y, z])
            
            elif line.startswith('endfacet'):
                if len(triangle_vertices) == 3:
                    start_idx = len(vertices)
                    vertices.extend(triangle_vertices)
                    faces.append([start_idx, start_idx + 1, start_idx + 2])
                triangle_vertices = []
            
            i += 1
        
        return np.array(vertices), np.array(faces)
        
    except Exception as e:
        print(f"Error parsing ASCII STL file: {e}", file=sys.stderr)
        return None, None

def is_ascii_stl(file_path):
    """Sprawdza czy plik STL jest w formacie ASCII"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip().lower()
            return first_line.startswith('solid')
    except:
        return False

def generate_stl_thumbnail(input_path, output_path, width=300, height=300, quality=85, background='#f8f9fa'):
    """Generuje miniaturkę dla pliku STL"""
    
    # Sprawdź czy plik istnieje
    if not os.path.exists(input_path):
        print(f"Input file does not exist: {input_path}", file=sys.stderr)
        return False
    
    # Parsuj plik STL
    if is_ascii_stl(input_path):
        vertices, faces = parse_stl_ascii(input_path)
    else:
        vertices, faces = parse_stl_binary(input_path)
    
    if vertices is None or faces is None:
        print("Failed to parse STL file", file=sys.stderr)
        return False
    
    if len(vertices) == 0 or len(faces) == 0:
        print("STL file contains no geometry", file=sys.stderr)
        return False
    
    try:
        # Utwórz figurę matplotlib
        fig = plt.figure(figsize=(width/100, height/100), dpi=100)
        ax = fig.add_subplot(111, projection='3d')
        
        # Przygotuj kolekcję trójkątów
        triangles = []
        for face in faces:
            if len(face) >= 3:
                triangle = vertices[face[:3]]
                triangles.append(triangle)
        
        if not triangles:
            print("No valid triangles found", file=sys.stderr)
            return False
        
        # Utwórz kolekcję 3D
        poly3d = Poly3DCollection(triangles, alpha=0.8, facecolor='lightblue', edgecolor='darkblue', linewidth=0.1)
        ax.add_collection3d(poly3d)
        
        # Oblicz granice modelu
        all_vertices = np.array(triangles).reshape(-1, 3)
        min_vals = np.min(all_vertices, axis=0)
        max_vals = np.max(all_vertices, axis=0)
        
        # Ustaw granice osi
        ax.set_xlim(min_vals[0], max_vals[0])
        ax.set_ylim(min_vals[1], max_vals[1])
        ax.set_zlim(min_vals[2], max_vals[2])
        
        # Ukryj osie i etykiety
        ax.set_axis_off()
        
        # Ustaw kąt widzenia dla lepszej prezentacji
        ax.view_init(elev=20, azim=45)
        
        # Ustaw tło
        fig.patch.set_facecolor(background)
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        
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
        print(f"Error generating thumbnail: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Generate STL thumbnail')
    parser.add_argument('input', help='Input STL file path')
    parser.add_argument('output', help='Output PNG file path')
    parser.add_argument('--width', type=int, default=300, help='Thumbnail width')
    parser.add_argument('--height', type=int, default=300, help='Thumbnail height')
    parser.add_argument('--quality', type=int, default=85, help='Image quality')
    parser.add_argument('--background', default='#f8f9fa', help='Background color')
    
    args = parser.parse_args()
    
    success = generate_stl_thumbnail(
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