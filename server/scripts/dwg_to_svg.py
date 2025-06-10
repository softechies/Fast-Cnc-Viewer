#!/usr/bin/env python3
import sys
import os

# --- IMPORTANT ---
# You MUST add the path to your FreeCAD library.
# This path may vary based on your system.
# For many Debian/Ubuntu systems, it is:
sys.path.append('/usr/lib/freecad-python3/lib')

try:
    import FreeCAD
    import Import
    # Import the modern TechDraw module instead of the legacy Drawing module
    import TechDraw
except ImportError as e:
    print("Error: Failed to import FreeCAD modules.")
    print("Please ensure the sys.path.append() line points to your FreeCAD library directory.")
    print(f"Details: {e}")
    sys.exit(1)

def check_freecad_setup():
    """Verify FreeCAD is installed and can be imported."""
    try:
        version = FreeCAD.getVersion()
        print(f"FreeCAD version: {version}")
        return True
    except Exception as e:
        print(f"Error: FreeCAD not properly installed or configured: {str(e)}")
        return False

def find_techdraw_template():
    """Locate the A4 Landscape TechDraw SVG template."""
    try:
        # TechDraw templates are typically in the Mod/TechDraw/Templates directory
        resource_dir = FreeCAD.getResourceDir()
        template_path = os.path.join(resource_dir, "Mod", "TechDraw", "Templates", "A4_LandscapeTD.svg")
        print(f"Checking for TechDraw template at: {template_path}")
        if os.path.exists(template_path):
            return template_path
        else:
            print(f"Error: TechDraw template not found at {template_path}")
            return None
    except Exception as e:
        print(f"Error finding template: {str(e)}")
        return None

def convert_to_svg(input_path, output_path):
    """Convert a DWG file to SVG using the TechDraw workbench."""
    print(f"Converting {input_path} to {output_path} using TechDraw...")
    
    doc = None # Initialize doc to None for the finally block
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input file {input_path} does not exist")
            return None
        
        # Create a new document
        doc = FreeCAD.newDocument("DWG_Import_TechDraw")
        print("Created new document")
        
        # Import the DWG file. This requires an external converter (e.g., ODA)
        # to be configured in FreeCAD's preferences.
        Import.insert(input_path, doc.Name)
        
        # Filter for only the imported Part objects
        imported_objects = [obj for obj in doc.Objects if 'Part' in obj.TypeId]
        if not imported_objects:
            print("Error: No valid Part objects were imported from the DWG file.")
            print("This can happen if the DWG is empty or the converter failed.")
            return None
        print(f"Successfully imported {len(imported_objects)} objects.")
        
        # Create a TechDraw page
        page = doc.addObject("TechDraw::DrawPage", "Page")
        template_path = find_techdraw_template()
        if not template_path:
            return None
        template = doc.addObject('TechDraw::DrawSVGTemplate', 'Template')
        template.Template = template_path
        page.Template = template
        print(f"Using TechDraw template: {template_path}")
        
        # Create a TechDraw view of all imported objects
        view = doc.addObject('TechDraw::DrawViewPart', 'View')
        page.addView(view)
        view.Source = imported_objects # Add all objects to the same view
        
        # Recalculate the document to update the view
        doc.recompute()
        print("Added view and recomputed document.")

        # Export the page to SVG
        TechDraw.exportPageAsSvg(page, output_path)
        
        if not os.path.exists(output_path):
            print(f"Error: SVG file {output_path} was not created during export.")
            return None
        
        # Read the SVG content to return it
        with open(output_path, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        print(f"Successfully exported SVG to {output_path}")
        return svg_content
    
    except Exception as e:
        print(f"An unexpected error occurred during conversion: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        # Clean up by closing the document if it was created
        if doc:
            FreeCAD.closeDocument(doc.Name)
            print("Closed document.")

if __name__ == "__main__":
    if not check_freecad_setup():
        sys.exit(1)
    
    if len(sys.argv) != 3:
        print("Usage: ./your_script_name.py /path/to/input.dwg /path/to/output.svg")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Ensure input file exists before proceeding
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    
    # Create the output directory if it doesn't exist
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")
    
    # Perform the conversion
    svg_content = convert_to_svg(input_file, output_file)
    
    if svg_content:
        # The final SVG content is printed to standard output.
        # This allows another script or application to capture it.
        print("--- SVG CONTENT START ---")
        print(svg_content)
        print("--- SVG CONTENT END ---")
        print("Conversion successful.")
        sys.exit(0)
    else:
        print("Conversion failed.")
        sys.exit(1)
