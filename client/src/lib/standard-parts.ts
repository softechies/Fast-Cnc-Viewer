import * as THREE from 'three';

/**
 * Moduł do tworzenia modeli standardowych części
 * To rozwiązanie tworzy realistyczne modele typowych części mechanicznych
 * bez konieczności parsowania plików STEP
 */

/**
 * Generuje model śruby/wkrętu
 * @param options Opcjonalne parametry dostosowujące wymiary śruby
 * @returns Obiekt THREE.Group zawierający model śruby
 */
export function createScrewModel(options: {
  headDiameter?: number;
  headHeight?: number;
  shaftDiameter?: number;
  shaftLength?: number;
  isMetric?: boolean;
  threadPitch?: number;
  quality?: 'low' | 'medium' | 'high';
} = {}): THREE.Group {
  // Domyślne wartości dla śruby M8
  const headDiameter = options.headDiameter || 13;
  const headHeight = options.headHeight || 5;
  const shaftDiameter = options.shaftDiameter || 8;
  const shaftLength = options.shaftLength || 40;
  const threadPitch = options.threadPitch || 1.25;
  const quality = options.quality || 'medium';
  
  // Współczynnik jakości (wpływa na liczbę segmentów)
  let segmentFactor = 1;
  switch (quality) {
    case 'low': segmentFactor = 0.5; break;
    case 'medium': segmentFactor = 1; break;
    case 'high': segmentFactor = 2; break;
  }
  
  // Liczba segmentów dla różnych części
  const headSegments = Math.max(6, Math.floor(16 * segmentFactor));
  const shaftSegments = Math.max(8, Math.floor(32 * segmentFactor));
  const threadCount = Math.max(10, Math.floor(shaftLength / threadPitch));
  
  // Grupa do przechowywania całego modelu
  const screwGroup = new THREE.Group();
  
  // Material dla śruby - metalowy niebieski
  const material = new THREE.MeshStandardMaterial({
    color: 0x3366cc,
    metalness: 0.8,
    roughness: 0.2,
  });
  
  // Material dla gwintu - jaśniejszy
  const threadMaterial = new THREE.MeshStandardMaterial({
    color: 0x5588ee,
    metalness: 0.7,
    roughness: 0.3,
  });
  
  // Material dla krawędzi
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });
  
  // 1. Tworzymy główkę śruby (hexagonalną)
  const headGeometry = new THREE.CylinderGeometry(
    headDiameter / 2,
    headDiameter / 2,
    headHeight,
    6,
    1
  );
  const head = new THREE.Mesh(headGeometry, material);
  head.position.y = shaftLength + headHeight / 2;
  head.castShadow = true;
  head.receiveShadow = true;
  
  // Dodaj krawędzie do główki
  const headEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(headGeometry),
    edgeMaterial
  );
  head.add(headEdges);
  
  screwGroup.add(head);
  
  // 2. Tworzymy trzpień śruby
  const shaftGeometry = new THREE.CylinderGeometry(
    shaftDiameter / 2,
    shaftDiameter / 2,
    shaftLength,
    shaftSegments,
    1
  );
  const shaft = new THREE.Mesh(shaftGeometry, material);
  shaft.position.y = shaftLength / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  
  // Dodaj krawędzie do trzpienia
  const shaftEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(shaftGeometry),
    edgeMaterial
  );
  shaft.add(shaftEdges);
  
  screwGroup.add(shaft);
  
  // 3. Dodaj gwint na trzpieniu
  const threadHeight = threadPitch * 0.8;
  const threadRadius = shaftDiameter / 2 + threadPitch * 0.2;
  
  for (let i = 0; i < threadCount; i++) {
    // Oblicz pozycję Y dla gwintu
    const y = i * threadPitch;
    
    // Pomiń gwint, który wchodzi w główkę
    if (y >= shaftLength - threadPitch) continue;
    
    // Stwórz geometrię torusową dla gwintu
    const threadGeometry = new THREE.TorusGeometry(
      shaftDiameter / 2,
      threadPitch * 0.3,
      6 * segmentFactor,
      shaftSegments * 1.5,
      Math.PI * 2
    );
    
    const thread = new THREE.Mesh(threadGeometry, threadMaterial);
    thread.rotation.x = Math.PI / 2;
    thread.position.y = y;
    thread.castShadow = true;
    
    screwGroup.add(thread);
  }
  
  // 4. Dodaj fazę na końcu śruby (stożek)
  const tipHeight = shaftDiameter / 2;
  const tipGeometry = new THREE.ConeGeometry(
    shaftDiameter / 2,
    tipHeight,
    shaftSegments,
    1
  );
  const tip = new THREE.Mesh(tipGeometry, material);
  tip.position.y = tipHeight / 2;
  tip.castShadow = true;
  tip.receiveShadow = true;
  
  screwGroup.add(tip);
  
  // Obróć model tak, aby główka była na górze a trzpień na dole
  screwGroup.rotation.x = Math.PI;
  
  return screwGroup;
}

/**
 * Generuje model nakrętki
 * @param options Opcjonalne parametry dostosowujące wymiary nakrętki
 * @returns Obiekt THREE.Group zawierający model nakrętki
 */
export function createNutModel(options: {
  diameter?: number;
  height?: number;
  threadDiameter?: number;
  quality?: 'low' | 'medium' | 'high';
} = {}): THREE.Group {
  // Domyślne wartości dla nakrętki M8
  const diameter = options.diameter || 13;
  const height = options.height || 6.5;
  const threadDiameter = options.threadDiameter || 8;
  const quality = options.quality || 'medium';
  
  // Współczynnik jakości (wpływa na liczbę segmentów)
  let segmentFactor = 1;
  switch (quality) {
    case 'low': segmentFactor = 0.5; break;
    case 'medium': segmentFactor = 1; break;
    case 'high': segmentFactor = 2; break;
  }
  
  // Liczba segmentów
  const segments = Math.max(6, Math.floor(16 * segmentFactor));
  
  // Grupa do przechowywania całego modelu
  const nutGroup = new THREE.Group();
  
  // Material dla nakrętki - metalowy stalowy
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.2,
  });
  
  // Material dla krawędzi
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });
  
  // Tworzymy bryłę nakrętki (hexagonalną)
  const nutGeometry = new THREE.CylinderGeometry(
    diameter / 2,
    diameter / 2,
    height,
    6,
    1
  );
  const nut = new THREE.Mesh(nutGeometry, material);
  nut.castShadow = true;
  nut.receiveShadow = true;
  
  // Dodaj krawędzie
  const nutEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(nutGeometry),
    edgeMaterial
  );
  nut.add(nutEdges);
  
  nutGroup.add(nut);
  
  // Tworzymy otwór wewnętrzny
  const holeGeometry = new THREE.CylinderGeometry(
    threadDiameter / 2,
    threadDiameter / 2,
    height * 1.1,
    segments,
    1
  );
  const hole = new THREE.Mesh(
    holeGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  
  // Wykorzystując CSG (Constructive Solid Geometry) do wycięcia otworu
  // Tutaj symulujemy to poprzez dodanie czarnego cylindra
  nutGroup.add(hole);
  
  return nutGroup;
}

/**
 * Generuje model podkładki
 * @param options Opcjonalne parametry dostosowujące wymiary podkładki
 * @returns Obiekt THREE.Group zawierający model podkładki
 */
export function createWasherModel(options: {
  outerDiameter?: number;
  innerDiameter?: number;
  thickness?: number;
  quality?: 'low' | 'medium' | 'high';
} = {}): THREE.Group {
  // Domyślne wartości dla podkładki M8
  const outerDiameter = options.outerDiameter || 16;
  const innerDiameter = options.innerDiameter || 8.4;
  const thickness = options.thickness || 1.6;
  const quality = options.quality || 'medium';
  
  // Współczynnik jakości (wpływa na liczbę segmentów)
  let segmentFactor = 1;
  switch (quality) {
    case 'low': segmentFactor = 0.5; break;
    case 'medium': segmentFactor = 1; break;
    case 'high': segmentFactor = 2; break;
  }
  
  // Liczba segmentów
  const segments = Math.max(16, Math.floor(32 * segmentFactor));
  
  // Grupa do przechowywania całego modelu
  const washerGroup = new THREE.Group();
  
  // Material dla podkładki - metalowy srebrny
  const material = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.7,
    roughness: 0.3,
  });
  
  // Material dla krawędzi
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });
  
  // Tworzymy geometrię podkładki jako torus
  const washerGeometry = new THREE.TorusGeometry(
    (outerDiameter + innerDiameter) / 4,
    (outerDiameter - innerDiameter) / 4,
    segments / 4,
    segments
  );
  
  // Obróć tak, aby leżała płasko
  const washer = new THREE.Mesh(washerGeometry, material);
  washer.rotation.x = Math.PI / 2;
  washer.castShadow = true;
  washer.receiveShadow = true;
  
  // Dodaj krawędzie
  const washerEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(washerGeometry),
    edgeMaterial
  );
  washer.add(washerEdges);
  
  washerGroup.add(washer);
  
  return washerGroup;
}

/**
 * Sprawdza, czy nazwa pliku wskazuje na standardową część
 * @param filename Nazwa pliku do sprawdzenia
 * @returns Czy nazwa pliku wskazuje na standardową część
 */
export function isStandardPart(filename: string): boolean {
  const name = filename.toLowerCase();
  return (
    name.includes('sruba') || 
    name.includes('śruba') ||
    name.includes('screw') || 
    name.includes('bolt') ||
    name.includes('nakrętka') ||
    name.includes('nakretka') ||
    name.includes('nut') ||
    name.includes('podkładka') ||
    name.includes('podkladka') ||
    name.includes('washer')
  );
}

/**
 * Tworzy model standardowej części na podstawie nazwy pliku
 * @param filename Nazwa pliku
 * @returns Obiekt THREE.Group zawierający model standardowej części
 */
export function createStandardPartFromFileName(filename: string): THREE.Group {
  const name = filename.toLowerCase();
  
  if (name.includes('sruba') || name.includes('śruba') || name.includes('screw') || name.includes('bolt')) {
    return createScrewModel({ quality: 'high' });
  } else if (name.includes('nakrętka') || name.includes('nakretka') || name.includes('nut')) {
    return createNutModel({ quality: 'high' });
  } else if (name.includes('podkładka') || name.includes('podkladka') || name.includes('washer')) {
    return createWasherModel({ quality: 'high' });
  } else {
    // Domyślnie zwróć model śruby
    return createScrewModel({ quality: 'medium' });
  }
}