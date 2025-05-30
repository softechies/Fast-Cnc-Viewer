#!/usr/bin/env python3
"""
Zaawansowany renderer STL używający Open3D do tworzenia prawdziwych screenshotów modeli 3D
"""

import argparse
import sys
import os
import numpy as np

def render_stl_with_open3d(input_path, output_path, width=300, height=300):
    """Renderuje plik STL używając Open3D"""
    try:
        import open3d as o3d
        
        # Wczytaj mesh STL
        mesh = o3d.io.read_triangle_mesh(input_path)
        
        if len(mesh.vertices) == 0:
            print("No vertices found in STL file", file=sys.stderr)
            return False
        
        # Oblicz normalne dla lepszego oświetlenia
        mesh.compute_vertex_normals()
        
        # Ustaw kolor mesh na ładny niebieski
        mesh.paint_uniform_color([0.7, 0.8, 1.0])
        
        # Utwórz visualizer
        vis = o3d.visualization.Visualizer()
        vis.create_window(width=width, height=height, visible=False)
        
        # Dodaj mesh do sceny
        vis.add_geometry(mesh)
        
        # Ustaw kamerę dla izometrycznego widoku
        ctr = vis.get_view_control()
        
        # Wyśrodkuj widok na modelu
        vis.get_view_control().set_front([0.4, -0.4, -0.8])
        vis.get_view_control().set_up([0, 1, 0])
        vis.get_view_control().set_lookat(mesh.get_center())
        vis.get_view_control().set_zoom(0.8)
        
        # Ustaw parametry renderowania
        opt = vis.get_render_option()
        opt.background_color = np.asarray([0.95, 0.95, 0.95])  # Jasno szare tło
        opt.mesh_show_back_face = True
        opt.light_on = True
        
        # Renderuj i zapisz obraz
        vis.poll_events()
        vis.update_renderer()
        
        # Zrób screenshot
        vis.capture_screen_image(output_path)
        vis.destroy_window()
        
        return True
        
    except ImportError:
        print("Open3D not available, trying alternative method", file=sys.stderr)
        return render_stl_with_vtk(input_path, output_path, width, height)
    except Exception as e:
        print(f"Error rendering with Open3D: {e}", file=sys.stderr)
        return render_stl_with_vtk(input_path, output_path, width, height)

def render_stl_with_vtk(input_path, output_path, width=300, height=300):
    """Renderuje plik STL używając VTK"""
    try:
        import vtk
        
        # Wczytaj plik STL
        reader = vtk.vtkSTLReader()
        reader.SetFileName(input_path)
        reader.Update()
        
        # Utwórz mapper
        mapper = vtk.vtkPolyDataMapper()
        mapper.SetInputConnection(reader.GetOutputPort())
        
        # Utwórz aktora
        actor = vtk.vtkActor()
        actor.SetMapper(mapper)
        actor.GetProperty().SetColor(0.7, 0.8, 1.0)  # Niebieski kolor
        actor.GetProperty().SetSpecular(0.3)
        actor.GetProperty().SetSpecularPower(20)
        
        # Utwórz renderer
        renderer = vtk.vtkRenderer()
        renderer.AddActor(actor)
        renderer.SetBackground(0.95, 0.95, 0.95)  # Jasno szare tło
        
        # Ustaw kamerę dla izometrycznego widoku
        camera = renderer.GetActiveCamera()
        camera.SetPosition(1, 1, 1)
        camera.SetFocalPoint(0, 0, 0)
        camera.SetViewUp(0, 0, 1)
        renderer.ResetCamera()
        
        # Utwórz okno renderowania
        render_window = vtk.vtkRenderWindow()
        render_window.AddRenderer(renderer)
        render_window.SetSize(width, height)
        render_window.SetOffScreenRendering(1)  # Renderowanie bez wyświetlania okna
        
        # Renderuj
        render_window.Render()
        
        # Zapisz obraz
        window_to_image = vtk.vtkWindowToImageFilter()
        window_to_image.SetInput(render_window)
        window_to_image.Update()
        
        writer = vtk.vtkPNGWriter()
        writer.SetFileName(output_path)
        writer.SetInputConnection(window_to_image.GetOutputPort())
        writer.Write()
        
        return True
        
    except ImportError:
        print("VTK not available, using fallback method", file=sys.stderr)
        return render_stl_fallback(input_path, output_path, width, height)
    except Exception as e:
        print(f"Error rendering with VTK: {e}", file=sys.stderr)
        return render_stl_fallback(input_path, output_path, width, height)

def render_stl_fallback(input_path, output_path, width=300, height=300):
    """Fallback renderer używający matplotlib z lepszą geometrią"""
    try:
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d.art3d import Poly3DCollection
        import struct
        
        # Proste parsowanie pliku STL
        vertices = []
        faces = []
        
        with open(input_path, 'rb') as f:
            # Sprawdź czy to binary STL
            header = f.read(80)
            triangle_count = struct.unpack('<I', f.read(4))[0]
            
            for i in range(triangle_count):
                # Pomiń normalną (12 bajtów)
                f.read(12)
                
                # Wczytaj 3 wierzchołki (9 float'ów * 4 bajty)
                triangle_vertices = []
                for j in range(3):
                    x, y, z = struct.unpack('<fff', f.read(12))
                    vertex_idx = len(vertices)
                    vertices.append([x, y, z])
                    triangle_vertices.append(vertex_idx)
                
                faces.append(triangle_vertices)
                f.read(2)  # Pomiń attribute byte count
        
        if not vertices:
            print("No vertices found in STL", file=sys.stderr)
            return False
        
        # Utwórz figurę
        fig = plt.figure(figsize=(width/100, height/100), dpi=100)
        ax = fig.add_subplot(111, projection='3d')
        
        # Przygotuj trójkąty
        triangles = []
        for face in faces:
            triangle = [vertices[i] for i in face]
            triangles.append(triangle)
        
        # Renderuj z lepszymi kolorami
        poly3d = Poly3DCollection(triangles, alpha=0.9, facecolor='lightsteelblue', 
                                 edgecolor='navy', linewidth=0.1)
        ax.add_collection3d(poly3d)
        
        # Ustaw granice
        all_vertices = np.array(vertices)
        ax.set_xlim(all_vertices[:, 0].min(), all_vertices[:, 0].max())
        ax.set_ylim(all_vertices[:, 1].min(), all_vertices[:, 1].max())
        ax.set_zlim(all_vertices[:, 2].min(), all_vertices[:, 2].max())
        
        # Izometryczny widok
        ax.view_init(elev=30, azim=45)
        ax.set_axis_off()
        
        # Zapisz
        plt.savefig(output_path, dpi=150, bbox_inches='tight', 
                   pad_inches=0, facecolor='white')
        plt.close()
        
        return True
        
    except Exception as e:
        print(f"Fallback rendering failed: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Advanced STL thumbnail renderer')
    parser.add_argument('input', help='Input STL file path')
    parser.add_argument('output', help='Output PNG file path')
    parser.add_argument('--width', type=int, default=300, help='Thumbnail width')
    parser.add_argument('--height', type=int, default=300, help='Thumbnail height')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Input file does not exist: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    # Spróbuj renderować używając najlepszej dostępnej metody
    success = render_stl_with_open3d(args.input, args.output, args.width, args.height)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()