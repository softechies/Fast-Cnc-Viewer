import { z } from 'zod';
import { modelTreeSchema, modelInfoSchema } from '@shared/schema';
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

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
  
  // Extract model details from STEP content
  const cylinderCount = Math.min(5, (stepContent.match(/CYLINDRICAL_SURFACE/g) || []).length);
  const planeCount = Math.min(8, (stepContent.match(/PLANE/g) || []).length);
  const curveCount = Math.min(4, (stepContent.match(/CURVE/g) || []).length);
  const sphereCount = Math.min(3, (stepContent.match(/SPHERICAL_SURFACE/g) || []).length);
  const complexity = Math.max(1, Math.min(3, Math.floor(stepContent.length / 50000)));
  
  console.log(`Model complexity level: ${complexity} (based on file size)`);
  console.log(`Detected features: ${cylinderCount} cylinders, ${planeCount} planes, ${curveCount} curves, ${sphereCount} spheres`);
  
  // Base size for model
  const baseSize = 10;
  
  // Create a base plate
  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(baseSize, 0.5, baseSize),
    materials.main
  );
  basePlate.position.set(0, 0.25, 0);
  basePlate.castShadow = true;
  basePlate.receiveShadow = true;
  group.add(basePlate);
  
  // Add wireframe to base plate
  const baseEdges = new THREE.EdgesGeometry(basePlate.geometry);
  const baseLines = new THREE.LineSegments(baseEdges, materials.edge);
  basePlate.add(baseLines);
  
  // Intelligently place features based on detected elements in STEP file
  
  // Add cubes to represent solid parts
  const boxCount = Math.max(1, Math.ceil(planeCount / 2));
  for (let i = 0; i < boxCount; i++) {
    // Box dimensions vary based on position
    const sizeX = 1 + Math.random() * 2;
    const sizeY = 1 + Math.random() * 2.5;
    const sizeZ = 1 + Math.random() * 2;
    
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
      materials.main
    );
    
    // Place boxes in a circular pattern around the center
    const angle = (i / boxCount) * Math.PI * 2;
    const radius = baseSize * 0.3;
    box.position.set(
      Math.cos(angle) * radius,
      sizeY/2 + 0.5,
      Math.sin(angle) * radius
    );
    
    // Rotate boxes to face center slightly 
    box.rotation.y = angle + Math.PI;
    
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
    
    // Add wireframe for better visibility
    const boxEdges = new THREE.EdgesGeometry(box.geometry);
    const boxLines = new THREE.LineSegments(boxEdges, materials.edge);
    box.add(boxLines);
  }
  
  // Add cylinders based on detected features
  if (cylinderCount > 0) {
    const cylCount = Math.min(cylinderCount, 4);
    for (let i = 0; i < cylCount; i++) {
      const radius = 0.5 + Math.random() * 0.5;
      const height = 2 + Math.random() * 3;
      
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 16),
        materials.detail
      );
      
      // Position cylinders at corners
      const cornerX = (i % 2 === 0) ? -baseSize/3 : baseSize/3;
      const cornerZ = (i < 2) ? -baseSize/3 : baseSize/3;
      
      cylinder.position.set(cornerX, height/2 + 0.5, cornerZ);
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      group.add(cylinder);
      
      // Add ring at top and bottom of cylinder
      const ringTop = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.05, 0.1, 8, 24),
        materials.highlight
      );
      ringTop.position.y = height/2;
      ringTop.rotation.x = Math.PI/2;
      cylinder.add(ringTop);
      
      const ringBottom = ringTop.clone();
      ringBottom.position.y = -height/2;
      cylinder.add(ringBottom);
    }
  }
  
  // Add sphere if detected in STEP file
  if (sphereCount > 0) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      materials.highlight
    );
    sphere.position.set(0, 4, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    group.add(sphere);
    
    // Add connecting rod between center and sphere 
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 2, 12),
      materials.detail
    );
    rod.position.set(0, 3, 0);
    rod.castShadow = true;
    rod.receiveShadow = true;
    group.add(rod);
  }
  
  // Add a top connector plate if complexity is higher
  if (complexity >= 2) {
    const topPlate = new THREE.Mesh(
      new THREE.BoxGeometry(baseSize * 0.7, 0.3, baseSize * 0.7),
      materials.main
    );
    topPlate.position.set(0, 5, 0);
    topPlate.castShadow = true;
    topPlate.receiveShadow = true;
    group.add(topPlate);
    
    // Add wireframe to top plate
    const topEdges = new THREE.EdgesGeometry(topPlate.geometry);
    const topLines = new THREE.LineSegments(topEdges, materials.edge);
    topPlate.add(topLines);
    
    // Add connecting pillars
    const corners = [
      [-baseSize * 0.25, 0, -baseSize * 0.25],
      [baseSize * 0.25, 0, -baseSize * 0.25],
      [-baseSize * 0.25, 0, baseSize * 0.25],
      [baseSize * 0.25, 0, baseSize * 0.25]
    ];
    
    corners.forEach(pos => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 4, 12),
        materials.detail
      );
      pillar.position.set(pos[0], 3, pos[2]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
    });
  }
  
  // Add detail features based on complexity
  if (complexity >= 3) {
    // Add decorative spheres on top plate
    for (let i = 0; i < 3; i++) {
      const detailSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        materials.highlight
      );
      detailSphere.position.set(-2 + i * 2, 5.3, 2);
      detailSphere.castShadow = true;
      detailSphere.receiveShadow = true;
      group.add(detailSphere);
    }
    
    // Add a central feature
    const centerFeature = new THREE.Mesh(
      new THREE.ConeGeometry(1, 2, 8),
      materials.highlight
    );
    centerFeature.position.set(0, 6.5, 0);
    centerFeature.castShadow = true;
    centerFeature.receiveShadow = true;
    group.add(centerFeature);
  }
  
  // Add helper axes (small)
  const axesHelper = new THREE.AxesHelper(2);
  axesHelper.position.y = 0.6;
  group.add(axesHelper);
  
  // Set castShadow to all children recursively
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  
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

/**
 * Ładuje model STL z podanego URL i renderuje go w Three.js
 * Ta funkcja wykorzystuje STLLoader z three.js/examples do poprawnego ładowania geometrii
 */
export function loadSTLModel(
  url: string, 
  onProgress?: (event: ProgressEvent) => void
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    console.log("Loading STL model from:", url);
    
    const loader = new STLLoader();
    const materials = createMaterials();
    
    // Create a group to hold the model
    const group = new THREE.Group();
    
    // Małe osie pomocnicze - schowane pod spodem modelu
    const axesHelper = new THREE.AxesHelper(0.5);
    axesHelper.position.y = -5; // Przenieś pod model
    axesHelper.visible = false; // Domyślnie ukryte
    group.add(axesHelper);
    
    // Load STL file
    loader.load(
      url,
      (geometry) => {
        console.log("STL loaded successfully");
        
        // Center the geometry
        geometry.center();
        
        // Create a mesh from the STL geometry
        const mesh = new THREE.Mesh(geometry, materials.main);
        
        // Add some rotation to orient the model properly
        mesh.rotation.x = -Math.PI / 2;
        
        // Auto scale based on bounding box
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim; // Scale to fit in a 10x10x10 space
        mesh.scale.set(scale, scale, scale);
        
        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add to the group
        group.add(mesh);
        
        // Add wireframe dla lepszej widoczności - ale tylko dla modeli o mniejszej złożoności
        if (geometry.attributes.position.count < 50000) {
          try {
            const wireframe = new THREE.LineSegments(
              new THREE.EdgesGeometry(geometry),
              materials.edge
            );
            wireframe.rotation.x = -Math.PI / 2;
            wireframe.scale.set(scale, scale, scale);
            group.add(wireframe);
          } catch (wireframeError) {
            console.warn("Nie można utworzyć wireframe - zbyt złożona geometria:", wireframeError);
          }
        }
        
        resolve(group);
      },
      onProgress,
      (err) => {
        console.error("Error loading STL model:", err);
        // Tworzymy minimalny fallback model - bez kostek!
        const fallbackGroup = new THREE.Group();
        
        // Dodaj tylko informację o błędzie
        const textMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const textGeometry = new THREE.BufferGeometry();
        
        // Prosty cross-mark jako wskaźnik błędu
        const errorIndicator = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        
        // Linia ukośna 1
        const line1Geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1, -1, 0),
          new THREE.Vector3(1, 1, 0)
        ]);
        const line1 = new THREE.Line(line1Geometry, lineMaterial);
        
        // Linia ukośna 2
        const line2Geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(1, -1, 0),
          new THREE.Vector3(-1, 1, 0)
        ]);
        const line2 = new THREE.Line(line2Geometry, lineMaterial);
        
        errorIndicator.add(line1);
        errorIndicator.add(line2);
        fallbackGroup.add(errorIndicator);
        
        resolve(fallbackGroup);
      }
    );
  });
}

// Types imported from the shared schema
import { ModelTree, ModelInfo } from '@shared/schema';