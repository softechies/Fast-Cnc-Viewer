import * as THREE from 'three';

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
    
    // Spróbujmy wyodrębnić więcej informacji z pliku STEP
    // najpierw szukamy nazwy produktu
    const productNameMatch = stepContent.match(/PRODUCT\([^,]+,\s*'([^']+)'/);
    const productName = productNameMatch ? productNameMatch[1] : "Unknown Model";
    
    // Liczenie elementów geometrycznych
    const cylinderMatches = stepContent.match(/CYLINDRICAL_SURFACE/g) || [];
    const cylinderCount = cylinderMatches.length;
    
    const planeMatches = stepContent.match(/PLANE/g) || [];
    const planeCount = planeMatches.length;
    
    const circleMatches = stepContent.match(/CIRCLE/g) || [];
    const circleCount = circleMatches.length;
    
    const lineMatches = stepContent.match(/LINE/g) || [];
    const lineCount = lineMatches.length;
    
    const torusMatches = stepContent.match(/TOROIDAL_SURFACE/g) || [];
    const torusCount = torusMatches.length;
    
    const sphereMatches = stepContent.match(/SPHERICAL_SURFACE/g) || [];
    const sphereCount = sphereMatches.length;
    
    // Złożoność modelu - im więcej elementów, tym większy model
    const complexity = Math.max(
      1, 
      Math.min(10, Math.floor(
        (cylinderCount + planeCount + circleCount + torusCount + sphereCount) / 10
      ))
    );
    
    // Materiały
    const materials = {
      base: new THREE.MeshStandardMaterial({
        color: 0x3366cc,
        metalness: 0.3,
        roughness: 0.4
      }),
      cylinder: new THREE.MeshStandardMaterial({
        color: 0x6699cc,
        metalness: 0.5,
        roughness: 0.3
      }),
      plane: new THREE.MeshStandardMaterial({
        color: 0x4488bb,
        metalness: 0.4,
        roughness: 0.5
      }),
      detail: new THREE.MeshStandardMaterial({
        color: 0x22aadd,
        metalness: 0.6,
        roughness: 0.2
      }),
      wireframe: new THREE.LineBasicMaterial({
        color: 0x000000
      })
    };
    
    // Baza modelu
    const baseDimension = complexity * 2;
    const baseGeometry = new THREE.BoxGeometry(
      baseDimension, 
      0.5, 
      baseDimension
    );
    const base = new THREE.Mesh(baseGeometry, materials.base);
    base.position.y = -0.25;
    base.receiveShadow = true;
    base.castShadow = true;
    group.add(base);
    
    // Dodaj wireframe
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(baseGeometry),
      materials.wireframe
    );
    base.add(wireframe);
    
    // Średnia pozycja Y dla elementów
    let totalHeight = 0;
    
    // Funkcja rozmieszczająca elementy na bazie
    const placeElement = (element: THREE.Object3D, index: number, total: number, radius: number = baseDimension/3) => {
      if (total <= 1) {
        element.position.set(0, element.position.y, 0);
        return;
      }
      
      // Rozłóż elementy na okręgu
      const angle = (index / total) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      element.position.set(x, element.position.y, z);
      
      // Obróć element w kierunku środka
      element.rotation.y = -angle;
    };
    
    // Dodaj cylindry jeśli są obecne
    if (cylinderCount > 0) {
      const cylindersToAdd = Math.min(10, Math.max(1, cylinderCount / 5));
      
      for (let i = 0; i < cylindersToAdd; i++) {
        const height = 1 + Math.random() * complexity;
        const radius = 0.3 + Math.random() * 0.7;
        
        const cylinderGeometry = new THREE.CylinderGeometry(
          radius, radius, height, 16
        );
        const cylinder = new THREE.Mesh(cylinderGeometry, materials.cylinder);
        
        cylinder.position.y = height / 2;
        totalHeight += height;
        
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        
        // Dodaj wireframe
        const cylinderWireframe = new THREE.LineSegments(
          new THREE.EdgesGeometry(cylinderGeometry),
          materials.wireframe
        );
        cylinder.add(cylinderWireframe);
        
        // Rozmieść cylindry na bazie
        placeElement(cylinder, i, cylindersToAdd);
        
        group.add(cylinder);
      }
    }
    
    // Dodaj płaszczyzny jeśli są obecne
    if (planeCount > 0) {
      const planesToAdd = Math.min(5, Math.max(1, planeCount / 10));
      
      for (let i = 0; i < planesToAdd; i++) {
        const width = 1 + Math.random() * complexity;
        const depth = 1 + Math.random() * complexity;
        const height = 0.2;
        
        const planeGeometry = new THREE.BoxGeometry(width, height, depth);
        const plane = new THREE.Mesh(planeGeometry, materials.plane);
        
        const y = 1 + Math.random() * complexity;
        plane.position.y = y;
        totalHeight += y;
        
        plane.castShadow = true;
        plane.receiveShadow = true;
        
        // Dodaj wireframe
        const planeWireframe = new THREE.LineSegments(
          new THREE.EdgesGeometry(planeGeometry),
          materials.wireframe
        );
        plane.add(planeWireframe);
        
        // Rozmieść płaszczyzny na bazie
        placeElement(plane, i, planesToAdd);
        
        group.add(plane);
      }
    }
    
    // Dodaj sfery jeśli są obecne
    if (sphereCount > 0) {
      const spheresToAdd = Math.min(sphereCount, 3);
      
      for (let i = 0; i < spheresToAdd; i++) {
        const radius = 0.5 + Math.random() * 0.8;
        
        const sphereGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const sphere = new THREE.Mesh(sphereGeometry, materials.detail);
        
        const y = 1 + Math.random() * complexity;
        sphere.position.y = y;
        totalHeight += y;
        
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        
        // Dodaj wireframe
        const sphereWireframe = new THREE.LineSegments(
          new THREE.EdgesGeometry(sphereGeometry),
          materials.wireframe
        );
        sphere.add(sphereWireframe);
        
        // Rozmieść sfery na bazie
        placeElement(sphere, i, spheresToAdd, baseDimension/2.5);
        
        group.add(sphere);
      }
    }
    
    // Dodaj torusy jeśli są obecne
    if (torusCount > 0) {
      const torusesToAdd = Math.min(torusCount, 2);
      
      for (let i = 0; i < torusesToAdd; i++) {
        const radius = 0.8 + Math.random() * 0.7;
        const tubeRadius = 0.2 + Math.random() * 0.3;
        
        const torusGeometry = new THREE.TorusGeometry(
          radius, tubeRadius, 16, 24
        );
        const torus = new THREE.Mesh(torusGeometry, materials.detail);
        
        // Obróć torus tak, aby leżał na płaszczyźnie
        torus.rotation.x = Math.PI / 2;
        
        const y = 1 + Math.random() * complexity;
        torus.position.y = y;
        totalHeight += y;
        
        torus.castShadow = true;
        torus.receiveShadow = true;
        
        // Rozmieść torusy na bazie
        placeElement(torus, i, torusesToAdd, baseDimension/3);
        
        group.add(torus);
      }
    }
    
    // Dodaj połączenia między elementami
    if (lineCount > 0 && complexity > 2) {
      // Znajdź obiekty, które możemy połączyć
      const connectableObjects: THREE.Object3D[] = [];
      
      group.traverse((object) => {
        if (object !== base && object instanceof THREE.Mesh) {
          connectableObjects.push(object);
        }
      });
      
      // Połącz niektóre obiekty liniami
      if (connectableObjects.length >= 2) {
        const linesToAdd = Math.min(connectableObjects.length - 1, 5);
        
        for (let i = 0; i < linesToAdd; i++) {
          const obj1 = connectableObjects[i];
          const obj2 = connectableObjects[(i + 1) % connectableObjects.length];
          
          // Utwórz geometrię łącznika
          const start = new THREE.Vector3().copy(obj1.position);
          const end = new THREE.Vector3().copy(obj2.position);
          
          // Wylicz rozmiar i pozycję łącznika
          const distance = start.distanceTo(end);
          const midpoint = new THREE.Vector3().addVectors(start, end).divideScalar(2);
          
          const connectionGeometry = new THREE.CylinderGeometry(
            0.1, 0.1, distance, 8
          );
          const connection = new THREE.Mesh(connectionGeometry, materials.detail);
          
          // Obróć cylinder tak, aby łączył dwa punkty
          connection.position.copy(midpoint);
          connection.lookAt(end);
          connection.rotateX(Math.PI / 2);
          
          connection.castShadow = true;
          
          group.add(connection);
        }
      }
    }
    
    // Dodaj osie pomocnicze
    const axesHelper = new THREE.AxesHelper(Math.max(2, complexity));
    axesHelper.position.y = 0.1;
    group.add(axesHelper);
    
    // Oblicz średnią wysokość dla kamery
    const avgHeight = totalHeight / Math.max(1, cylinderCount + planeCount + sphereCount + torusCount);
    console.log(`Średnia wysokość modelu: ${avgHeight}`);
    
    console.log(`Przybliżony model utworzony (złożoność: ${complexity}, elementy: ${cylinderCount + planeCount + sphereCount + torusCount})`);
    
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