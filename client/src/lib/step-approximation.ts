import * as THREE from 'three';

// Interfejs dla wierzchołka
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Interfejs dla elementu geometrycznego
interface GeometricElement {
  type: string;
  id: string;
  points?: Point3D[];
  radius?: number;
  height?: number;
  center?: Point3D;
  axis?: Point3D;
  normal?: Point3D;
}

/**
 * Zaawansowana przybliżona reprezentacja modelu STEP
 * Używana jako fallback gdy nie udaje się załadować OpenCascade.js
 */
export function createApproximatedStepModel(stepContent: string): THREE.Group {
  // Grupa do przechowywania modelu
  const group = new THREE.Group();
  
  try {
    // Analiza zawartości pliku STEP
    console.log("Tworzenie przybliżonego modelu STEP...");
    
    // Przeanalizuj plik STEP i wyodrębnij elementy geometryczne
    const geometricElements = parseStepFile(stepContent);
    console.log(`Znaleziono ${geometricElements.length} elementów geometrycznych w analizie STEP`);
    
    // Dodaj domyślne elementy, jeśli nie znaleziono żadnych
    if (geometricElements.length === 0) {
      console.log("Dodawanie domyślnych elementów geometrycznych");
      // Dodaj przynajmniej jeden element (pudełko)
      geometricElements.push({
        type: 'box',
        id: 'default-box',
        points: [
          { x: -2, y: -2, z: -2 },
          { x: 2, y: 2, z: 2 }
        ]
      });
      
      // Dodaj cylinder w środku
      geometricElements.push({
        type: 'cylinder',
        id: 'default-cylinder',
        radius: 1.0,
        height: 3.0,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 1, z: 0 }
      });
    }
    
    // Stwórz materiały
    const materials = {
      standard: new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.5,
        roughness: 0.3,
        flatShading: false,
      }),
      highlightedMetal: new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        metalness: 0.8,
        roughness: 0.2,
        flatShading: false,
      }),
      wire: new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 1,
      }),
    };
    
    // Funkcja dodająca wireframe do mesh
    const addWireframe = (mesh: THREE.Mesh) => {
      try {
        const wireframe = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          materials.wire
        );
        mesh.add(wireframe);
      } catch (e) {
        console.warn("Nie można dodać wireframe:", e);
      }
    };
    
    console.log(`Znaleziono ${geometricElements.length} elementów geometrycznych`);

    // Dodaj elementy geometryczne do sceny
    geometricElements.forEach((element, index) => {
      let mesh: THREE.Mesh | null = null;
      
      // Stwórz odpowiednią geometrię zależnie od typu
      switch (element.type) {
        case 'cylinder':
          if (element.radius) {
            const geometry = new THREE.CylinderGeometry(
              element.radius, 
              element.radius, 
              element.height || 5.0, 
              32
            );
            mesh = new THREE.Mesh(geometry, materials.standard);
            
            // Ustaw pozycję i orientację
            if (element.center) {
              mesh.position.set(element.center.x, element.center.y, element.center.z);
            }
            
            // Obróć zgodnie z osią
            if (element.axis) {
              // Domyślna oś cylindra to [0,1,0]
              const cylinderAxis = new THREE.Vector3(0, 1, 0);
              const targetAxis = new THREE.Vector3(element.axis.x, element.axis.y, element.axis.z).normalize();
              
              // Obrót na podstawie kwaternionów
              mesh.quaternion.setFromUnitVectors(cylinderAxis, targetAxis);
            }
          }
          break;
          
        case 'sphere':
          if (element.radius) {
            const geometry = new THREE.SphereGeometry(element.radius, 32, 32);
            mesh = new THREE.Mesh(geometry, materials.standard);
            if (element.center) {
              mesh.position.set(element.center.x, element.center.y, element.center.z);
            }
          }
          break;
          
        case 'plane':
          // Obsługa płaszczyzny nawet bez punktów
          const planeSize = 5.0; // domyślny rozmiar płaszczyzny
          const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
          mesh = new THREE.Mesh(geometry, materials.standard);
          
          // Ustaw pozycję jeśli jest dostępna
          if (element.center) {
            mesh.position.set(element.center.x, element.center.y, element.center.z);
          }
          
          // Orientacja płaszczyzny zgodnie z wektorem normalnym
          if (element.normal) {
            const planeNormal = new THREE.Vector3(0, 0, 1); // domyślna normalna dla PlaneGeometry
            const targetNormal = new THREE.Vector3(element.normal.x, element.normal.y, element.normal.z).normalize();
            mesh.quaternion.setFromUnitVectors(planeNormal, targetNormal);
          }
          break;
          
        case 'torus':
          if (element.radius && element.center) {
            // Dla torusa potrzebujemy promienia głównego i promienia rurki
            const outerRadius = element.radius;
            const tubeRadius = outerRadius / 5; // Oszacowanie
            
            const geometry = new THREE.TorusGeometry(outerRadius, tubeRadius, 16, 48);
            mesh = new THREE.Mesh(geometry, materials.highlightedMetal);
            mesh.position.set(element.center.x, element.center.y, element.center.z);
            
            // Obróć zgodnie z osią
            if (element.axis) {
              // Domyślna oś torusa to [0,0,1]
              const torusAxis = new THREE.Vector3(0, 0, 1);
              const targetAxis = new THREE.Vector3(element.axis.x, element.axis.y, element.axis.z).normalize();
              mesh.quaternion.setFromUnitVectors(torusAxis, targetAxis);
            }
          }
          break;
          
        case 'cone':
          if (element.radius && element.height && element.center && element.axis) {
            const geometry = new THREE.ConeGeometry(element.radius, element.height, 32);
            mesh = new THREE.Mesh(geometry, materials.standard);
            
            // Ustaw pozycję i orientację
            mesh.position.set(element.center.x, element.center.y, element.center.z);
            
            // Obróć zgodnie z osią
            if (element.axis) {
              // Domyślna oś stożka to [0,1,0]
              const coneAxis = new THREE.Vector3(0, 1, 0);
              const targetAxis = new THREE.Vector3(element.axis.x, element.axis.y, element.axis.z).normalize();
              mesh.quaternion.setFromUnitVectors(coneAxis, targetAxis);
            }
          }
          break;
          
        case 'box':
          if (element.points && element.points.length >= 2) {
            // Oblicz rozmiar pudełka na podstawie punktów
            const minX = Math.min(...element.points.map(p => p.x));
            const maxX = Math.max(...element.points.map(p => p.x));
            const minY = Math.min(...element.points.map(p => p.y));
            const maxY = Math.max(...element.points.map(p => p.y));
            const minZ = Math.min(...element.points.map(p => p.z));
            const maxZ = Math.max(...element.points.map(p => p.z));
            
            const width = Math.max(0.1, maxX - minX);
            const height = Math.max(0.1, maxY - minY);
            const depth = Math.max(0.1, maxZ - minZ);
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            mesh = new THREE.Mesh(geometry, materials.standard);
            
            // Centroid punktów jako pozycja
            const center = {
              x: (minX + maxX) / 2,
              y: (minY + maxY) / 2,
              z: (minZ + maxZ) / 2
            };
            mesh.position.set(center.x, center.y, center.z);
          }
          break;
          
        case 'complex':
          if (element.points && element.points.length >= 8) {
            // Dla złożonych kształtów spróbujemy stworzyć geometrię z trójkątów
            try {
              const vertices = [];
              const indices = [];
              
              // Dodaj wierzchołki
              for (let i = 0; i < element.points.length; i++) {
                const p = element.points[i];
                vertices.push(p.x, p.y, p.z);
              }
              
              // Stwórz proste indeksy trójkątów (zakładając, że punkty są już uporządkowane)
              for (let i = 0; i < element.points.length - 2; i++) {
                indices.push(0, i + 1, i + 2);
              }
              
              const geometry = new THREE.BufferGeometry();
              geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
              geometry.setIndex(indices);
              geometry.computeVertexNormals();
              
              mesh = new THREE.Mesh(geometry, materials.standard);
            } catch (e) {
              console.warn("Nie można utworzyć złożonej geometrii:", e);
            }
          }
          break;
      }
      
      // Dodaj mesh do grupy jeśli został utworzony
      if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        addWireframe(mesh);
        group.add(mesh);
      }
    });
    
    // Dodaj osie pomocnicze
    const axesHelper = new THREE.AxesHelper(5);
    group.add(axesHelper);
    
    // Dodaj siatkę podłoża
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.position.y = -0.01; // Lekko poniżej, aby uniknąć z-fighting
    group.add(gridHelper);
    
    // Jeśli nic nie dodaliśmy, dodaj domyślną geometrię
    if (group.children.length <= 2) { // axesHelper + gridHelper
      console.warn("Nie udało się stworzyć modelu z analizy pliku STEP, używanie domyślnej geometrii");
      const defaultGeometry = new THREE.BoxGeometry(2, 2, 2);
      const defaultMesh = new THREE.Mesh(defaultGeometry, materials.standard);
      addWireframe(defaultMesh);
      group.add(defaultMesh);
    }
    
    console.log(`Przybliżony model utworzony (elementy: ${geometricElements.length})`);
    return group;
    
  } catch (error) {
    console.error("Błąd tworzenia przybliżonego modelu:", error);
    
    // Jeśli coś pójdzie nie tak, zwróć prosty model zastępczy
    const fallbackGeometry = new THREE.BoxGeometry(2, 2, 2);
    const fallbackMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.3,
      roughness: 0.7
    });
    const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    
    // Dodaj wireframe
    const fallbackWireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(fallbackGeometry),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    fallbackMesh.add(fallbackWireframe);
    
    group.add(fallbackMesh);
    
    // Dodaj wskaźnik, że to model zastępczy
    const axesHelper = new THREE.AxesHelper(3);
    group.add(axesHelper);
    
    return group;
  }
}

/**
 * Analizuje plik STEP i zwraca listę elementów geometrycznych
 */
function parseStepFile(content: string): GeometricElement[] {
  const elements: GeometricElement[] = [];
  
  try {
    // Znajdź wszystkie punkty kartezjańskie
    const cartesianPoints: Record<string, Point3D> = {};
    const pointRegex = /CARTESIAN_POINT\s*\(\s*'([^']+)'\s*,\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)/g;
    let pointMatch;
    
    while ((pointMatch = pointRegex.exec(content)) !== null) {
      const id = pointMatch[1];
      const x = parseFloat(pointMatch[2]);
      const y = parseFloat(pointMatch[3]);
      const z = parseFloat(pointMatch[4]);
      
      cartesianPoints[id] = { x, y, z };
    }
    
    // Znajdź wszystkie wektory kierunkowe
    const directionVectors: Record<string, Point3D> = {};
    const directionRegex = /DIRECTION\s*\(\s*'([^']+)'\s*,\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)/g;
    let directionMatch;
    
    while ((directionMatch = directionRegex.exec(content)) !== null) {
      const id = directionMatch[1];
      const x = parseFloat(directionMatch[2]);
      const y = parseFloat(directionMatch[3]);
      const z = parseFloat(directionMatch[4]);
      
      directionVectors[id] = { x, y, z };
    }
    
    // Znajdź wszystkie okręgi
    const circleRegex = /CIRCLE\s*\(\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let circleMatch;
    
    while ((circleMatch = circleRegex.exec(content)) !== null) {
      const id = circleMatch[1];
      const radius = parseFloat(circleMatch[3]);
      
      elements.push({
        type: 'sphere',
        id,
        radius,
        center: { x: 0, y: 0, z: 0 } // domyślne centrum, będzie aktualizowane jeśli znajdziemy axis placement
      });
    }
    
    // Znajdź wszystkie cylindry
    const cylinderRegex = /CYLINDRICAL_SURFACE\s*\(\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let cylinderMatch;
    
    while ((cylinderMatch = cylinderRegex.exec(content)) !== null) {
      const id = cylinderMatch[1];
      const axisPlacementRef = cylinderMatch[2];
      const radius = parseFloat(cylinderMatch[3]);
      
      elements.push({
        type: 'cylinder',
        id,
        radius,
        height: 5.0, // domyślna wysokość
        center: { x: 0, y: 0, z: 0 }, // domyślne centrum, będzie aktualizowane jeśli znajdziemy axis placement
        axis: { x: 0, y: 1, z: 0 } // domyślna oś, będzie aktualizowana
      });
    }
    
    // Znajdź wszystkie torusy
    const torusRegex = /TOROIDAL_SURFACE\s*\(\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let torusMatch;
    
    while ((torusMatch = torusRegex.exec(content)) !== null) {
      const id = torusMatch[1];
      const majorRadius = parseFloat(torusMatch[3]);
      const minorRadius = parseFloat(torusMatch[4]);
      
      elements.push({
        type: 'torus',
        id,
        radius: majorRadius,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 0, z: 1 }
      });
    }
    
    // Znajdź wszystkie płaszczyzny
    const planeRegex = /PLANE\s*\(\s*'([^']+)'\s*,\s*([^)]+)\s*\)/g;
    let planeMatch;
    
    while ((planeMatch = planeRegex.exec(content)) !== null) {
      const id = planeMatch[1];
      const axisPlacementRef = planeMatch[2];
      
      elements.push({
        type: 'plane',
        id,
        center: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
        points: [] // punkty będą dodane jeśli znajdziemy je w pliku
      });
    }
    
    // Znajdź wszystkie stożki
    const coneRegex = /CONICAL_SURFACE\s*\(\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let coneMatch;
    
    while ((coneMatch = coneRegex.exec(content)) !== null) {
      const id = coneMatch[1];
      const radius = parseFloat(coneMatch[3]);
      const semiAngle = parseFloat(coneMatch[4]); // Kąt stożka
      
      elements.push({
        type: 'cone',
        id,
        radius,
        height: 5.0, // domyślna wysokość
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 1, z: 0 }
      });
    }
    
    // Znajdź linie proste do tworzenia krawędzi
    const lineRegex = /LINE\s*\(\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let lineMatch;
    
    while ((lineMatch = lineRegex.exec(content)) !== null) {
      const id = lineMatch[1];
      const pointRef = lineMatch[2]; // Punkt początkowy
      const directionRef = lineMatch[3]; // Kierunek
      
      // Znajdź punkt początkowy i kierunek
      let startPoint = cartesianPoints[pointRef];
      let direction = directionVectors[directionRef];
      
      // Dodaj linię jako element (dla wizualizacji krawędzi)
      if (startPoint && direction) {
        const endPoint = {
          x: startPoint.x + direction.x * 5, // arbitrary length
          y: startPoint.y + direction.y * 5,
          z: startPoint.z + direction.z * 5
        };
        
        elements.push({
          type: 'box', // użyjemy pudełka do reprezentacji linii
          id,
          points: [startPoint, endPoint]
        });
      }
    }
    
    // Analizuj położenia osi (AXIS2_PLACEMENT_3D) do ustawiania pozycji i orientacji
    const axisPlacementRegex = /AXIS2_PLACEMENT_3D\s*\(\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let axisMatch;
    
    while ((axisMatch = axisPlacementRegex.exec(content)) !== null) {
      const id = axisMatch[1];
      const locationRef = axisMatch[2]; // referencja do punktu
      const axisRef = axisMatch[3]; // referencja do osi (kierunku)
      const refDirRef = axisMatch[4]; // referencja do kierunku odniesienia
      
      // Znajdź odpowiednie elementy, które używają tego placement
      elements.forEach(element => {
        // Aktualizuj centrum i oś dla elementów, które mogą odwoływać się do tego placement
        if (cartesianPoints[locationRef]) {
          element.center = cartesianPoints[locationRef];
        }
        
        if (directionVectors[axisRef]) {
          element.axis = directionVectors[axisRef];
        }
        
        if (element.type === 'plane' && directionVectors[axisRef]) {
          element.normal = directionVectors[axisRef];
        }
      });
    }
    
    // Analizuj warstwy (SHELL_BASED_SURFACE_MODEL, OPEN_SHELL, itp.)
    // Możemy w ten sposób znaleźć zaawansowane informacje o strukturze modelu
    
    // Jeśli nie znaleziono żadnych elementów, dodaj domyślne elementy geometryczne
    if (elements.length === 0) {
      console.log("Dodawanie domyślnego modelu z analizy STEP...");
      
      // Dodaj domyślny box
      elements.push({
        type: 'box',
        id: 'default-box-1',
        points: [
          { x: -2, y: -2, z: -2 },
          { x: 2, y: 2, z: 2 }
        ]
      });
      
      // Dodaj domyślną kulę
      elements.push({
        type: 'sphere',
        id: 'default-sphere-1',
        radius: 1.0,
        center: { x: 0, y: 0, z: 0 }
      });
      
      // Dodaj domyślne cylindry w różnych orientacjach
      elements.push({
        type: 'cylinder',
        id: 'default-cylinder-1',
        radius: 0.5,
        height: 4.0,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 1, y: 0, z: 0 }
      });
      
      elements.push({
        type: 'cylinder',
        id: 'default-cylinder-2',
        radius: 0.5,
        height: 4.0,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 1, z: 0 }
      });
      
      elements.push({
        type: 'cylinder',
        id: 'default-cylinder-3',
        radius: 0.5,
        height: 4.0,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 0, z: 1 }
      });
      
      // Dodaj płaszczyznę
      elements.push({
        type: 'plane',
        id: 'default-plane-1',
        center: { x: 0, y: -2, z: 0 },
        normal: { x: 0, y: 1, z: 0 }
      });
    }
    
    return elements;
  } catch (error) {
    console.error("Błąd podczas analizy pliku STEP:", error);
    
    // Nawet w przypadku błędu, zwróć domyślne elementy zamiast pustej tablicy
    const defaultElements: GeometricElement[] = [
      {
        type: 'box',
        id: 'error-box',
        points: [
          { x: -1.5, y: -1.5, z: -1.5 },
          { x: 1.5, y: 1.5, z: 1.5 }
        ]
      },
      {
        type: 'cylinder',
        id: 'error-cylinder',
        radius: 0.75,
        height: 3.0,
        center: { x: 0, y: 0, z: 0 },
        axis: { x: 0, y: 1, z: 0 }
      }
    ];
    
    return defaultElements;
  }
}