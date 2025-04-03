import * as THREE from 'three';
import { useCallback, useEffect, useState } from 'react';

// OpenCascade.js - realizacja parsera STEP
interface OpenCascadeInstance {
  BRep_Builder: any;
  TopoDS_Compound: any;
  StlAPI_Writer: any;
  STEPControl_Reader: any;
  IFSelect_ReturnStatus: any;
  TopExp_Explorer: any;
  TopAbs_SOLID: any;
  TopAbs_SHELL: any;
  TopAbs_FACE: any;
  TopAbs_EDGE: any;
  TopAbs_VERTEX: any;
  Handle_StepData_StepModel: any;
  opencascade: any;
}

// Globalna zmienna dla załadowanej instancji
let openCascadeInstance: OpenCascadeInstance | null = null;
let isLoadingInstance = false;
let loadingPromise: Promise<OpenCascadeInstance> | null = null;

// Inicjalizacja OpenCascade.js
export const initOpenCascade = async (): Promise<OpenCascadeInstance> => {
  if (openCascadeInstance) {
    return openCascadeInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  isLoadingInstance = true;
  
  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Inicjalizacja OpenCascade.js z lokalnego pakietu...');
      
      // Dynamiczny import lokalnego pakietu OpenCascade.js
      try {
        const OC = await import('opencascade.js');
        console.log('Moduł OpenCascade.js zaimportowany, inicjalizacja...');
        
        // Inicjalizacja modułu
        const openCascade = await OC.default();
        
        console.log('OpenCascade.js załadowany pomyślnie!');
        
        openCascadeInstance = {
          BRep_Builder: openCascade.BRep_Builder,
          TopoDS_Compound: openCascade.TopoDS_Compound,
          StlAPI_Writer: openCascade.StlAPI_Writer,
          STEPControl_Reader: openCascade.STEPControl_Reader,
          IFSelect_ReturnStatus: openCascade.IFSelect_ReturnStatus,
          TopExp_Explorer: openCascade.TopExp_Explorer,
          TopAbs_SOLID: openCascade.TopAbs_SOLID,
          TopAbs_SHELL: openCascade.TopAbs_SHELL,
          TopAbs_FACE: openCascade.TopAbs_FACE,
          TopAbs_EDGE: openCascade.TopAbs_EDGE,
          TopAbs_VERTEX: openCascade.TopAbs_VERTEX,
          Handle_StepData_StepModel: openCascade.Handle_StepData_StepModel,
          opencascade: openCascade
        };
        
        console.log('OpenCascade.js zainicjalizowany!');
        isLoadingInstance = false;
        resolve(openCascadeInstance);
      } catch (importError) {
        console.error('Błąd podczas importu lokalnego pakietu OpenCascade.js:', importError);
        
        // Fallback - spróbujmy załadować z CDN jako alternatywę
        console.log('Próba załadowania z CDN jako alternatywa...');
        const script = document.createElement('script');
        script.src = '/node_modules/opencascade.js/dist/opencascade.js';
        
        // Utwórz obiekt OpenCascade z globalnej przestrzeni nazw
        const openCascade = await new Promise<any>((resolve, reject) => {
          script.onload = async () => {
            try {
              console.log('Skrypt OpenCascade.js załadowany, inicjalizacja WASM...');
              
              // @ts-ignore - OpenCASCADE powinno być teraz dostępne globalnie
              const oc = await globalThis.OpenCascade({
                locateFile: (filename: string) => {
                  console.log(`Lokalizowanie pliku WASM: ${filename}`);
                  return `/node_modules/opencascade.js/dist/${filename}`;
                },
                onRuntimeInitialized: () => {
                  console.log('Runtime OpenCascade.js zainicjalizowany');
                }
              });
              
              console.log('OpenCascade.js pomyślnie załadowany przez alternatywny skrypt');
              resolve(oc);
            } catch (error) {
              console.error('Błąd inicjalizacji OpenCascade.js przez alternatywny skrypt:', error);
              reject(error);
            }
          };
          
          script.onerror = (event) => {
            console.error('Błąd ładowania alternatywnego skryptu OpenCascade.js:', event);
            reject(new Error('Nie udało się załadować skryptu OpenCascade.js'));
          };
          
          // Dodaj skrypt do dokumentu
          document.head.appendChild(script);
        });
        
        console.log('OpenCascade.js załadowany pomyślnie przez alternatywną metodę!');
        
        openCascadeInstance = {
          BRep_Builder: openCascade.BRep_Builder,
          TopoDS_Compound: openCascade.TopoDS_Compound,
          StlAPI_Writer: openCascade.StlAPI_Writer,
          STEPControl_Reader: openCascade.STEPControl_Reader,
          IFSelect_ReturnStatus: openCascade.IFSelect_ReturnStatus,
          TopExp_Explorer: openCascade.TopExp_Explorer,
          TopAbs_SOLID: openCascade.TopAbs_SOLID,
          TopAbs_SHELL: openCascade.TopAbs_SHELL,
          TopAbs_FACE: openCascade.TopAbs_FACE,
          TopAbs_EDGE: openCascade.TopAbs_EDGE,
          TopAbs_VERTEX: openCascade.TopAbs_VERTEX,
          Handle_StepData_StepModel: openCascade.Handle_StepData_StepModel,
          opencascade: openCascade
        };
        
        console.log('OpenCascade.js zainicjalizowany przez alternatywną metodę!');
        isLoadingInstance = false;
        resolve(openCascadeInstance);
      }
    } catch (error) {
      console.error('Błąd inicjalizacji OpenCascade.js:', error);
      isLoadingInstance = false;
      loadingPromise = null;
      reject(error);
    }
  });

  return loadingPromise;
};

/**
 * Parsuje plik STEP i tworzy model 3D
 * @param stepContent Zawartość pliku STEP
 * @returns Promise z obiektem Three.js Group zawierającym model
 */
export const parseSTEPFile = async (stepContent: string): Promise<THREE.Group> => {
  console.log('Parsowanie pliku STEP z OpenCascade.js...');
  
  try {
    const oc = await initOpenCascade();
    
    // Utworzenie czytnika STEP
    const reader = new oc.STEPControl_Reader();
    
    // Konwersja tekstu STEP do bufora danych
    const uint8Array = new TextEncoder().encode(stepContent);
    const dataPtr = oc.opencascade._malloc(uint8Array.length);
    oc.opencascade.HEAPU8.set(uint8Array, dataPtr);
    
    // Wczytanie pliku STEP
    const loadStatus = reader.ReadData(dataPtr, uint8Array.length);
    oc.opencascade._free(dataPtr);
    
    if (loadStatus !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
      throw new Error('Błąd wczytywania pliku STEP');
    }
    
    // Transfer root
    const transferStatus = reader.TransferRoots();
    if (transferStatus <= 0) {
      throw new Error('Błąd transferu korzeni STEP');
    }
    
    // Pobieranie liczby wczytanych modeli
    const numShapes = reader.NbShapes();
    console.log(`Wczytano ${numShapes} kształtów z pliku STEP`);
    
    if (numShapes <= 0) {
      throw new Error('Brak kształtów w pliku STEP');
    }
    
    // Utworzenie grupy do przechowywania modelu
    const group = new THREE.Group();
    
    // Materiały dla modelu
    const materials = {
      main: new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6,
        metalness: 0.5,
        roughness: 0.3,
        flatShading: false
      }),
      edge: new THREE.LineBasicMaterial({
        color: 0x94a3b8,
        linewidth: 1
      })
    };
    
    // Dla każdego kształtu, wygeneruj siatkę
    for (let i = 1; i <= numShapes; i++) {
      const shape = reader.Shape(i);
      
      // Konwersja STEP do siatki triangulacyjnej
      const mesh = processShape(oc, shape);
      
      if (mesh) {
        mesh.material = materials.main;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        
        // Dodaj wireframe dla lepszej widoczności
        const wireframe = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          materials.edge
        );
        mesh.add(wireframe);
      }
    }
    
    // Dodaj osie pomocnicze
    const axesHelper = new THREE.AxesHelper(2);
    group.add(axesHelper);
    
    return group;
  } catch (error) {
    console.error('Błąd parsowania STEP:', error);
    throw error;
  }
};

/**
 * Przetwarzanie kształtu OpenCascade do siatki Three.js
 */
const processShape = (oc: OpenCascadeInstance, shape: any): THREE.Mesh | null => {
  try {
    // Konwersja kształtu do formatu trójkątów
    const writer = new oc.StlAPI_Writer();
    writer.setASCIIMode(true);
    
    // Tworzenie tymczasowego bufora na dane STL
    const tempFileName = 'temp.stl';
    writer.write(shape, tempFileName);
    
    // Pobieranie zawartości STL z wirtualnego systemu plików
    const stlContent = oc.opencascade.FS.readFile(tempFileName, { encoding: 'utf8' });
    oc.opencascade.FS.unlink(tempFileName);
    
    // Parsowanie STL do geometrii Three.js
    const geometry = parseSTLContent(stlContent);
    
    if (geometry) {
      const mesh = new THREE.Mesh(geometry);
      return mesh;
    }
    
    return null;
  } catch (error) {
    console.error('Błąd przetwarzania kształtu:', error);
    return null;
  }
};

/**
 * Parsowanie zawartości STL do geometrii Three.js
 */
const parseSTLContent = (stlContent: string): THREE.BufferGeometry | null => {
  try {
    // Analiza formatu ASCII STL
    const lines = stlContent.split('\n');
    const vertices = [];
    const normals = [];
    
    let triangleVertexCount = 0;
    let normal = new THREE.Vector3();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('facet normal ')) {
        const parts = line.split(' ');
        normal = new THREE.Vector3(
          parseFloat(parts[2]),
          parseFloat(parts[3]),
          parseFloat(parts[4])
        );
      } else if (line.startsWith('vertex ')) {
        const parts = line.split(' ');
        vertices.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
        normals.push(normal.x, normal.y, normal.z);
        triangleVertexCount++;
      }
    }
    
    if (vertices.length === 0) {
      throw new Error('Brak wierzchołków w danych STL');
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  } catch (error) {
    console.error('Błąd parsowania STL:', error);
    return null;
  }
};

/**
 * Hook do ładowania i parsowania plików STEP
 */
export const useOpenCascadeParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const parseStepFile = useCallback(async (stepContent: string): Promise<THREE.Group | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const model = await parseSTEPFile(stepContent);
      return model;
    } catch (err) {
      console.error('Błąd parsowania STEP:', err);
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { parseStepFile, isLoading, error };
};