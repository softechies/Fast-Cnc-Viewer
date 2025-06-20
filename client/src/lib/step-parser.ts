import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// Types imported from the shared schema
import { ModelTree, ModelInfo } from '@shared/schema';

// Material definitions for models
const createMaterials = (color: number = 0x3b82f6) => ({
  main: new THREE.MeshStandardMaterial({ 
    color: color,
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
// Interfejs dla wyniku ładowania modelu STL
export interface STLLoadResult {
  model: THREE.Group;
  scale: number;  // Zastosowany współczynnik skalowania
  material: THREE.MeshStandardMaterial;  // Referencja do materiału do zmiany koloru
  originalDimensions?: {  // Oryginalne wymiary przed skalowaniem
    width: number;
    height: number;
    depth: number;
  }
}

export function loadSTLModel(
  url: string, 
  onProgress?: (event: ProgressEvent) => void
): Promise<STLLoadResult> {
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
          
          // Zachowaj oryginalne wymiary przed skalowaniem
          // W standardzie CAD wysokość (najmniejszy wymiar) to oś Z
          // Wykryjmy, który z wymiarów jest najmniejszy i przypisujemy go do wysokości (Z)
          const dimensions = [size.x, size.y, size.z];
          const minDimIndex = dimensions.indexOf(Math.min(...dimensions));
          
          let originalDimensions;
          
          // Automatycznie przypisz najmniejszy wymiar do osi Z (wysokość)
          if (minDimIndex === 0) {
            // Najmniejszy wymiar to X
            originalDimensions = {
              width: size.z,   // Szerokość to oryginalnie Z
              depth: size.y,   // Głębokość to Y
              height: size.x    // Wysokość (najmniejsza) to X
            };
          } else if (minDimIndex === 1) {
            // Najmniejszy wymiar to Y
            originalDimensions = {
              width: size.x,   // Szerokość to X
              depth: size.z,   // Głębokość to oryginalnie Z
              height: size.y   // Wysokość (najmniejsza) to Y
            };
          } else {
            // Najmniejszy wymiar to Z (domyślne przypisanie)
            originalDimensions = {
              width: size.x,   // Szerokość to X
              depth: size.y,   // Głębokość to Y
              height: size.z   // Wysokość (najmniejsza) to Z
            };
          }
          
          console.log("Wymiary oryginalne:", {x: size.x, y: size.y, z: size.z});
          console.log("Przypisane wymiary:", originalDimensions);
          
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
          
          // Zwróć obiekt zawierający model, skalę, materiał i oryginalne wymiary
          resolve({
            model: group,
            scale: scale,
            material: materials.main,
            originalDimensions: originalDimensions
          });
        } catch (processingError: any) {
          console.error("Error processing STL geometry:", processingError);
          // W przypadku błędu podczas przetwarzania, przekieruj do obsługi błędów
          createErrorModel(processingError instanceof Error ? processingError.message : "Unknown error", resolve as (value: STLLoadResult) => void);
        }
      },
      onProgress,
      (err: any) => {
        console.error("Error loading STL model:", err);
        createErrorModel(err instanceof Error ? err.message : "Failed to load STL model", resolve as (value: STLLoadResult) => void);
      }
    );
  });
}

// Wydzielona funkcja do tworzenia modelu błędu
function createErrorModel(errorMessage: string, resolve: (value: STLLoadResult) => void): void {
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
  
  // Stwórz podstawowy materiał dla modelu błędu
  const errorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,  // Czerwony dla błędu
    metalness: 0.5,
    roughness: 0.3,
    flatShading: false
  });

  // Zwróć obiekt zgodny z interfejsem STLLoadResult
  resolve({
    model: fallbackGroup,
    scale: 1.0,
    material: errorMaterial,
    originalDimensions: {
      width: 0,   // X (szerokość)
      depth: 0,   // Y (głębokość) 
      height: 0   // Z (wysokość)
    }
  });
}