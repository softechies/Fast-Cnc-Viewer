import { z } from 'zod';
import { modelTreeSchema, modelInfoSchema } from '@shared/schema';
import * as THREE from 'three';

/**
 * Parse STEP file content to create a THREE.js Object3D representation
 * This is a simplified approach as Three.js doesn't natively support STEP files
 */
export function createModelFromSTEP(stepContent: string): THREE.Group {
  // Create a group to hold all geometries
  const group = new THREE.Group();
  
  try {
    // Attempt to extract basic geometric information from STEP
    // This is a very simplified approach that creates representative geometries
    
    // Count elements to determine model complexity
    const cylinderCount = (stepContent.match(/CYLINDRICAL_SURFACE/g) || []).length;
    const planeCount = (stepContent.match(/PLANE/g) || []).length;
    const sphereCount = (stepContent.match(/SPHERICAL_SURFACE/g) || []).length;
    const torusCount = (stepContent.match(/TOROIDAL_SURFACE/g) || []).length;
    const bSplineSurfaceCount = (stepContent.match(/B_SPLINE_SURFACE/g) || []).length;
    
    // Create representative geometry for the STEP file
    const baseSize = 5; // Base size for geometries
    
    // Create a base box for the model
    const boxGeometry = new THREE.BoxGeometry(baseSize, baseSize/2, baseSize);
    const boxMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.4
    });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.position.set(0, -baseSize/4, 0);
    group.add(boxMesh);
    
    // Add cylinders if present in STEP file
    if (cylinderCount > 0) {
      const cylinderGeometry = new THREE.CylinderGeometry(baseSize/6, baseSize/6, baseSize, 16);
      const cylinderMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x60a5fa,
        metalness: 0.4,
        roughness: 0.3
      });
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinder.position.set(-baseSize/2, baseSize/2, -baseSize/2);
      cylinder.rotation.set(0, 0, Math.PI/2);
      group.add(cylinder);
    }
    
    // Add spheres if present in STEP file
    if (sphereCount > 0) {
      const sphereGeometry = new THREE.SphereGeometry(baseSize/6, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        metalness: 0.5,
        roughness: 0.2
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(baseSize/2, baseSize/2, baseSize/2);
      group.add(sphere);
    }
    
    // Add more complex geometry if B-spline surfaces present
    if (bSplineSurfaceCount > 0) {
      // Create a torus knot as a representative complex geometry
      const torusKnotGeometry = new THREE.TorusKnotGeometry(baseSize/10, baseSize/30, 64, 8);
      const torusKnotMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e40af,
        metalness: 0.6,
        roughness: 0.2
      });
      const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
      torusKnot.position.set(0, baseSize/2, 0);
      group.add(torusKnot);
    }
    
    // Center the group and return it
    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    group.position.sub(center); // Center the group at origin
    
  } catch (error) {
    console.error("Error creating 3D model from STEP data:", error);
    
    // Fallback to a simple cube if parsing fails
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.4
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  }
  
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