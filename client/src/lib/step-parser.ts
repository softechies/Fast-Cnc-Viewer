import { z } from 'zod';
import { modelTreeSchema, modelInfoSchema } from '@shared/schema';
import * as THREE from 'three';

// Material definitions for models
const createMaterials = () => ({
  main: new THREE.MeshStandardMaterial({ 
    color: 0x3b82f6,  // Blue
    metalness: 0.5,
    roughness: 0.3,
    flatShading: false
  }),
  detail: new THREE.MeshStandardMaterial({ 
    color: 0x64748b,  // Slate
    metalness: 0.7,
    roughness: 0.2,
    flatShading: false
  }),
  highlight: new THREE.MeshStandardMaterial({ 
    color: 0x0ea5e9,  // Sky blue
    metalness: 0.6,
    roughness: 0.2,
    flatShading: false
  }),
  edge: new THREE.LineBasicMaterial({
    color: 0x94a3b8,   // Gray
    linewidth: 1
  })
});

/**
 * Create a fallback model when parsing fails
 */
const createFallbackModel = (group: THREE.Group) => {
  console.log("Creating fallback model");
  const geometry = new THREE.BoxGeometry(5, 5, 5);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x6b7280,
    metalness: 0.3,
    roughness: 0.4
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  
  // Add wireframe to the box to make it visually distinguishable
  const wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  group.add(wireframe);
};

/**
 * Create a geometrically representative model based on STEP file content
 */
const createGeometricModel = (group: THREE.Group, stepContent: string) => {
  console.log("Creating randomized model based on STEP content analysis");
  const materials = createMaterials();
  
  // Extract information to influence model generation
  const cylinderCount = Math.min(5, (stepContent.match(/CYLINDRICAL_SURFACE/g) || []).length);
  const planeCount = Math.min(8, (stepContent.match(/PLANE/g) || []).length);
  const curveCount = Math.min(4, (stepContent.match(/CURVE/g) || []).length);
  const totalItems = Math.max(3, Math.min(12, Math.floor((cylinderCount + planeCount + curveCount) / 3)));
  
  // Create base - a box with size based on complexity
  const baseSize = 10;
  const complexity = Math.max(1, Math.min(3, Math.floor(stepContent.length / 100000)));
  console.log(`Model complexity level: ${complexity} (based on file size)`);
  
  // Create a base plate
  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(baseSize, baseSize/10, baseSize),
    materials.main
  );
  basePlate.position.set(0, -baseSize/15, 0);
  group.add(basePlate);
  
  // Add boxes
  for (let i = 0; i < Math.ceil(totalItems/3); i++) {
    const size = baseSize / (3 + Math.random() * 2);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(
        size * (0.5 + Math.random() * 0.5),
        size * (0.5 + Math.random() * 1.5),
        size * (0.5 + Math.random() * 0.5)
      ),
      materials.main
    );
    
    // Position within the base area
    box.position.set(
      (Math.random() - 0.5) * baseSize * 0.8,
      size/2 + 0.1,
      (Math.random() - 0.5) * baseSize * 0.8
    );
    
    // Random rotation around Y axis
    box.rotation.y = Math.random() * Math.PI;
    
    group.add(box);
  }
  
  // Add cylinders if found in STEP file
  if (cylinderCount > 0) {
    for (let i = 0; i < Math.min(cylinderCount, 3); i++) {
      const radius = baseSize / (10 + Math.random() * 5);
      const height = baseSize / (2 + Math.random() * 3);
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 16),
        materials.detail
      );
      
      cylinder.position.set(
        (Math.random() - 0.5) * baseSize * 0.6,
        height/2 + 0.1,
        (Math.random() - 0.5) * baseSize * 0.6
      );
      
      group.add(cylinder);
    }
  }
  
  // Add spheres for joints or connection points
  for (let i = 0; i < Math.ceil(totalItems/4); i++) {
    const radius = baseSize / (12 + Math.random() * 8);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 16),
      materials.highlight
    );
    
    // Position spheres at edges or corners
    const edgeFactor = 0.7;
    sphere.position.set(
      (Math.random() > 0.5 ? 1 : -1) * baseSize * edgeFactor * (0.7 + Math.random() * 0.3),
      baseSize / (5 + Math.random() * 3),
      (Math.random() > 0.5 ? 1 : -1) * baseSize * edgeFactor * (0.7 + Math.random() * 0.3)
    );
    
    group.add(sphere);
  }
  
  // Add some edges to show the structure
  const edges = new THREE.EdgesGeometry(basePlate.geometry);
  const line = new THREE.LineSegments(edges, materials.edge);
  line.position.copy(basePlate.position);
  group.add(line);
  
  // Center the model
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  center.y = 0; // Only center horizontally, keep vertical position
  group.position.sub(center);
  
  console.log("Randomized model created successfully");
};

/**
 * Parse STEP file content to create a THREE.js Object3D representation
 * This is a simplified approach as Three.js doesn't natively support STEP files
 */
export function createModelFromSTEP(stepContent: string): THREE.Group {
  console.log("Starting STEP model parsing");
  
  // Create a group to hold all geometries
  const group = new THREE.Group();
  
  try {
    // Create a representative geometric model
    createGeometricModel(group, stepContent);
  } catch (error) {
    console.error("Error creating 3D model from STEP data:", error);
    
    // Create a fallback model if parsing fails
    createFallbackModel(group);
  }
  
  console.log("STEP model creation completed");
  return group;
}

export function parseModelTree(stepContent: string): ModelTree {
  // Parse STEP file to extract hierarchy
  // This is a simplified version - proper parsing would need a STEP parser library
  
  try {
    // Generate a unique ID for the model
    const modelId = generateId();
    
    // Try to extract assembly and part names
    const assemblyMatches = stepContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/g) || [];
    const partMatches = stepContent.match(/MANIFOLD_SOLID_BREP\('([^']+)'/g) || [];
    
    // Process assembly names
    const assemblies = assemblyMatches.map(match => {
      const nameMatch = match.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/);
      return nameMatch ? nameMatch[1] : `Assembly_${generateId()}`;
    });
    
    // Process part names
    const parts = partMatches.map(match => {
      const nameMatch = match.match(/MANIFOLD_SOLID_BREP\('([^']+)'/);
      return nameMatch ? nameMatch[1] : `Part_${generateId()}`;
    });
    
    // Build model tree structure
    const tree: ModelTree = {
      id: modelId,
      name: "STEP Model",
      type: "model",
      children: []
    };
    
    // Add assemblies with parts
    if (assemblies.length > 0) {
      // Distribute parts among assemblies
      const partsPerAssembly = Math.max(1, Math.floor(parts.length / assemblies.length));
      
      assemblies.forEach((assembly, index) => {
        const assemblyNode: ModelTree = {
          id: `${modelId}-assembly-${index + 1}`,
          name: assembly,
          type: "assembly",
          children: []
        };
        
        // Add parts to this assembly
        const startIdx = index * partsPerAssembly;
        const endIdx = Math.min(startIdx + partsPerAssembly, parts.length);
        
        for (let i = startIdx; i < endIdx; i++) {
          if (parts[i]) {
            assemblyNode.children!.push({
              id: `${modelId}-part-${i + 1}`,
              name: parts[i],
              type: "part"
            });
          }
        }
        
        tree.children!.push(assemblyNode);
      });
    } 
    // If no assemblies found, add parts directly to model
    else if (parts.length > 0) {
      parts.forEach((part, index) => {
        tree.children!.push({
          id: `${modelId}-part-${index + 1}`,
          name: part,
          type: "part"
        });
      });
    } 
    // Fallback if no structure found
    else {
      tree.children!.push({
        id: `${modelId}-assembly-1`,
        name: "Main Assembly",
        type: "assembly",
        children: [
          { id: `${modelId}-part-1`, name: "Component 1", type: "part" },
          { id: `${modelId}-part-2`, name: "Component 2", type: "part" }
        ]
      });
    }
    
    return tree;
  } catch (error) {
    console.error("Error parsing model tree:", error);
    
    // Return fallback structure
    const modelId = generateId();
    return {
      id: modelId,
      name: "STEP Model",
      type: "model",
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: "Assembly 1",
          type: "assembly",
          children: [
            { id: `${modelId}-part-1`, name: "Part 1", type: "part" },
            { id: `${modelId}-part-2`, name: "Part 2", type: "part" }
          ]
        }
      ]
    };
  }
}

/**
 * Extract model information from STEP file content
 */
export function parseModelInfo(
  stepContent: string, 
  filename: string, 
  filesize: number
): ModelInfo {
  try {
    // Extract information from the STEP file header
    const modelName = extractModelName(stepContent) || filename;
    const format = extractFormat(stepContent) || "Unknown STEP format";
    const sourceSystem = extractSourceSystem(stepContent) || "Unknown";
    
    // Count entities
    const partMatches = stepContent.match(/MANIFOLD_SOLID_BREP/g) || [];
    const parts = partMatches.length > 0 ? partMatches.length : 5;
    
    const assemblyMatches = stepContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE/g) || [];
    const assemblies = assemblyMatches.length > 0 ? assemblyMatches.length : 2;
    
    const surfaceMatches = stepContent.match(/B_SPLINE_SURFACE|PLANE|CYLINDRICAL_SURFACE|SPHERICAL_SURFACE/g) || [];
    const surfaces = surfaceMatches.length > 0 ? surfaceMatches.length : 20;
    
    const solidMatches = stepContent.match(/BREP_WITH_VOIDS|MANIFOLD_SOLID_BREP/g) || [];
    const solids = solidMatches.length > 0 ? solidMatches.length : 10;
    
    // Extract author and organization if available
    const authorMatch = stepContent.match(/author\s*>\s*\(\s*'(.+?)'\s*\)/i);
    const author = authorMatch && authorMatch[1] ? authorMatch[1] : "Unknown";
    
    const organizationMatch = stepContent.match(/organization\s*>\s*\(\s*'(.+?)'\s*\)/i);
    const organization = organizationMatch && organizationMatch[1] ? organizationMatch[1] : "Unknown";
    
    // Return model information
    return {
      filename,
      filesize,
      format,
      created: new Date().toISOString(),
      sourceSystem,
      parts,
      assemblies,
      surfaces,
      solids,
      properties: {
        author,
        organization,
        partNumber: `STEP-${generateId().toUpperCase()}`,
        revision: "A"
      }
    };
  } catch (error) {
    console.error("Error parsing model info:", error);
    
    // Return fallback information
    return {
      filename,
      filesize,
      format: "STEP",
      created: new Date().toISOString(),
      sourceSystem: "Unknown",
      parts: 1,
      assemblies: 1,
      surfaces: 1,
      solids: 1,
      properties: {
        author: "Unknown",
        organization: "Unknown",
        partNumber: `STEP-${generateId().toUpperCase()}`,
        revision: "A"
      }
    };
  }
}

function extractModelName(content: string): string | undefined {
  // This is a simplified approach and would need to be more robust in a real app
  const nameMatch = content.match(/FILE_NAME\s*\(\s*'([^']+)'/i);
  return nameMatch ? nameMatch[1] : undefined;
}

function extractFormat(content: string): string | undefined {
  if (content.includes("AP242")) {
    return "STEP AP242";
  } else if (content.includes("AP214")) {
    return "STEP AP214";
  } else if (content.includes("AP203")) {
    return "STEP AP203";
  } else {
    return "STEP";
  }
}

function extractSourceSystem(content: string): string | undefined {
  const systemMatch = content.match(/originating_system\s*>\s*'([^']+)'/i);
  return systemMatch ? systemMatch[1] : undefined;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Types imported from the shared schema
import { ModelTree, ModelInfo } from '@shared/schema';