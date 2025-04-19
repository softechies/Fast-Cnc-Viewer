import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Types imported from the shared schema
import { ModelTree, ModelInfo } from '@shared/schema';

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
 * Zawiera ulepszoną obsługę błędów i adaptacyjne skalowanie dostosowane do modelu
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
    
    // Load STL file z lepszą obsługą błędów
    loader.load(
      url,
      (geometry) => {
        try {
          console.log("STL loaded successfully");
          
          // Walidacja geometrii
          if (!geometry || geometry.attributes.position.count === 0) {
            throw new Error("STL geometry is empty or invalid");
          }
          
          // Upewnij się, że normalne są poprawnie obliczone
          if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
          }
          
          // Center the geometry
          geometry.center();
          
          // Create a mesh from the STL geometry
          const mesh = new THREE.Mesh(geometry, materials.main);
          
          // Add some rotation to orient the model properly
          mesh.rotation.x = -Math.PI / 2;
          
          // Auto scale based on bounding box z lepszą obsługą skrajnych przypadków
          const box = new THREE.Box3().setFromObject(mesh);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // Bardziej adaptacyjne skalowanie z zabezpieczeniem przed dzieleniem przez zero
          let scale = 1.0;
          
          if (maxDim < 0.001) {
            // Bardzo mały model - zastosuj większą skalę
            scale = 1000;
            console.log("Bardzo mały model, stosowanie dużej skali:", scale);
          } else if (maxDim > 1000) {
            // Bardzo duży model - zastosuj mniejszą skalę
            scale = 5 / maxDim;
            console.log("Bardzo duży model, stosowanie mniejszej skali:", scale);
          } else if (maxDim > 100) {
            // Duży model - zastosuj średnią skalę
            scale = 8 / maxDim;
            console.log("Duży model, stosowanie średniej skali:", scale);
          } else {
            // Normalny model - standardowa skala
            scale = 10 / maxDim;
            console.log("Normalny model, stosowanie standardowej skali:", scale);
          }
          
          mesh.scale.set(scale, scale, scale);
          
          // Enable shadows
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // Add to the group
          group.add(mesh);
          
          // Add wireframe dla lepszej widoczności - ale tylko dla modeli o mniejszej złożoności
          // Próg zwiększony dla lepszej wydajności
          if (geometry.attributes.position.count < 100000) {
            try {
              // Zastosuj parametr thresholdAngle dla lepszego wykrywania krawędzi
              const wireframe = new THREE.LineSegments(
                new THREE.EdgesGeometry(geometry, 15), // 15 stopni jako próg kąta
                materials.edge
              );
              wireframe.rotation.x = -Math.PI / 2;
              wireframe.scale.set(scale, scale, scale);
              group.add(wireframe);
            } catch (wireframeError) {
              console.warn("Nie można utworzyć wireframe - zbyt złożona geometria:", wireframeError);
            }
          } else {
            console.log("Pominięto generowanie wireframe - zbyt złożona geometria");
          }
          
          resolve(group);
        } catch (processingError: any) {
          console.error("Error processing STL geometry:", processingError);
          // W przypadku błędu podczas przetwarzania, przekieruj do obsługi błędów
          createErrorModel(processingError instanceof Error ? processingError.message : "Unknown error", resolve);
        }
      },
      onProgress,
      (err: any) => {
        console.error("Error loading STL model:", err);
        createErrorModel(err instanceof Error ? err.message : "Failed to load STL model", resolve);
      }
    );
  });
}

// Wydzielona funkcja do tworzenia modelu błędu
function createErrorModel(errorMessage: string, resolve: (value: THREE.Group) => void): void {
  // Tworzymy minimalny fallback model - bez kostek!
  const fallbackGroup = new THREE.Group();
  
  // Dodaj tylko informację o błędzie w postaci krzyżyka
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
  
  // Dodaj okrąg otaczający krzyżyk
  const circleGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 64 }).map((_, i) => {
      const angle = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
    })
  );
  const circle = new THREE.Line(circleGeometry, lineMaterial);
  errorIndicator.add(circle);
  
  fallbackGroup.add(errorIndicator);
  
  // Zapisz informację o błędzie jako właściwość grupy
  (fallbackGroup as any).errorMessage = errorMessage;
  
  resolve(fallbackGroup);
}