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
  edge: new THREE.LineBasicMaterial({
    color: 0x94a3b8,   // Gray
    linewidth: 1
  })
});

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