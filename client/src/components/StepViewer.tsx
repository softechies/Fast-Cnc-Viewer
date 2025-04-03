import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createModelFromSTEP, loadSTLModel } from '@/lib/step-parser';

// Interface for STL File Information
interface StlFileInfo {
  url: string;
  isDirectStl?: boolean;
}

// Props for the StepViewer component
interface StepViewerProps {
  modelId: number | null;
}

// Component for viewing STEP and STL models
export default function StepViewer({ modelId }: StepViewerProps) {
  // Refs for Three.js elements
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stepContentRef = useRef<string | null>(null);
  
  // State for file data and loading status
  const [fileData, setFileData] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [stlFileInfo, setStlFileInfo] = useState<StlFileInfo | null>(null);
  const [isLoadingStlFile, setIsLoadingStlFile] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Inicjalizacja...");
  
  // Z powodu ograniczeń WASM w aktualnej konfiguracji używamy uproszczonego renderowania
  const renderMode = 'simple' as const; // 'simple' używa uproszczonego renderowania bez WebAssembly
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);
    
    // Create animation loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    console.log("Inicjalizacja sceny Three.js");
    setDebugInfo("Scena gotowa");
    
    // Add a reference box to visualize scale
    const refBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.2 })
    );
    refBox.name = "ReferenceBox";
    refBox.visible = false;
    scene.add(refBox);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Update camera
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
      rendererRef.current?.dispose();
    };
  }, []);
  
  // Load model file when modelId changes
  useEffect(() => {
    if (!modelId) {
      setFileData(null);
      setStlFileInfo(null);
      setDebugInfo("Brak wybranego modelu");
      return;
    }
    
    const loadFile = async () => {
      try {
        setIsLoadingFile(true);
        setDebugInfo("Ładowanie pliku STEP...");
        
        // Get STEP file
        const response = await fetch(`/api/models/${modelId}/file`);
        if (!response.ok) {
          throw new Error(`Nie można pobrać pliku (${response.status})`);
        }
        
        // Get model information
        const modelResponse = await fetch(`/api/models/${modelId}`);
        if (!modelResponse.ok) {
          throw new Error(`Nie można pobrać informacji o modelu (${modelResponse.status})`);
        }
        
        const modelInfo = await modelResponse.json();
        
        const blob = await response.blob();
        const filename = modelInfo.filename || `model-${modelId}.step`;
        const file = new File([blob], filename, { type: 'application/step' });
        
        setFileData(file);
        
        // Try to get STL file if available
        try {
          setIsLoadingStlFile(true);
          setDebugInfo("Sprawdzanie dostępności pliku STL...");
          
          const stlResponse = await fetch(`/api/models/${modelId}/stl`);
          if (stlResponse.ok) {
            // STL available
            const isDirectStl = modelInfo.format?.toLowerCase() === 'stl';
            setStlFileInfo({ url: `/api/models/${modelId}/stl`, isDirectStl });
            setDebugInfo("Plik STL dostępny");
          } else {
            // No STL available
            setStlFileInfo(null);
            console.error("STL file not available:", await stlResponse.json());
          }
        } catch (stlError) {
          setStlFileInfo(null);
          console.error("Error checking STL availability:", stlError);
        } finally {
          setIsLoadingStlFile(false);
        }
      } catch (error) {
        console.error("Error loading STEP file:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        setFileData(null);
      } finally {
        setIsLoadingFile(false);
      }
    };
    
    loadFile();
  }, [modelId]);
  
  // Render model using Three.js
  async function renderModel(stepContent: string) {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    try {
      // Remove any existing model
      const existingModel = sceneRef.current.getObjectByName("StepModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }
      
      // Remove reference cube
      const refCube = sceneRef.current.getObjectByName("ReferenceBox");
      if (refCube) {
        sceneRef.current.remove(refCube);
      }
      
      // Tablica parserów, które będą próbowane w kolejności
      const parsers = [];
      
      // Funkcja pomocnicza do postępu ładowania
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setDebugInfo(`Ładowanie: ${percent}%`);
        }
      };
      
      // Ustawmy flagę, czy mamy próbować najpierw załadować model STL (jeśli dostępny)
      const useTryStlFirst = Boolean(stlFileInfo?.url);
      
      // W trybie simple nie używamy OpenCascade.js
      const useTryOpenCascade = false; // W przyszłości możemy to włączyć, gdy rozwiążemy problemy z WASM
      
      // Ustawmy flagę, czy zawsze używać przybliżonego modelu (dla testów)
      const useAlwaysApproximate = false; // Testowa flaga - ustaw na true, aby zawsze używać przybliżenie
      
      // Ustalenie kolejności parsowania w zależności od warunków
      
      // 1. STL jest zawsze naszym pierwszym wyborem, jeśli jest dostępny
      if (useTryStlFirst && stlFileInfo?.url) {
        // Jeśli dostępny jest plik STL, to zaczynamy od niego
        parsers.push(async () => {
          setDebugInfo(`Ładowanie modelu STL... ${stlFileInfo.isDirectStl ? '(bezpośredni upload)' : '(konwertowany)'}`);
          // Zamieniamy na Mesh dla pewności typu
          const stlModel = await loadSTLModel(stlFileInfo.url, onProgress) as unknown as THREE.Mesh;
          
          // Zawsze uproszczona wersja - bez wireframe
          try {
            stlModel.material = new THREE.MeshBasicMaterial({
              color: 0x3b82f6,
              wireframe: false,
            });
          } catch (materialError) {
            console.warn("Nie można ustawić materiału:", materialError);
          }
          
          // Create a group to hold the model
          const modelGroup = new THREE.Group();
          modelGroup.add(stlModel);
          
          console.log("STL loaded successfully");
          setDebugInfo("Model STL wczytany pomyślnie");
          return modelGroup;
        });
      }
      
      // Zmiana: Zawsze używamy przybliżonego parsera zamiast OpenCascade.js
      // z powodu ograniczeń WebAssembly w obecnej konfiguracji
      
      // Dodaj parser przybliżony zaawansowany jako główne rozwiązanie
      parsers.push(async () => {
        try {
          setDebugInfo("Używanie zaawansowanego przybliżonego parsera STEP...");
          const { createApproximatedStepModel } = await import('../lib/step-approximation');
          console.log("Zawartość STEP (pierwsze 100 znaków):", stepContent.substring(0, 100));
          console.log("Długość STEP:", stepContent.length);
          const approxModel = createApproximatedStepModel(stepContent);
          console.log("Model przybliżony utworzony pomyślnie");
          setDebugInfo("Model STEP wczytany (zaawansowane przybliżenie)");
          return approxModel;
        } catch (error) {
          console.error("Błąd w przybliżonym parserze:", error);
          throw error;
        }
      });
      
      // Dodaj najprostszy parser jako ostateczny fallback
      parsers.push(async () => {
        setDebugInfo("Używanie podstawowego parsera STEP...");
        // Zawsze używamy uproszczonego modelu
        const complexity = Math.min(5, Math.max(1, Math.floor(stepContent.length / 10000)));
        const simpleModel = createSimpleModelRepresentation(complexity);
        setDebugInfo("Model STEP wczytany (prosty model)");
        return simpleModel;
      });
      
      // Próbuj kolejne parsery, aż któryś zadziała
      let model: THREE.Object3D | null = null;
      let error = null;
      
      for (const parser of parsers) {
        try {
          model = await parser();
          error = null;
          break;
        } catch (parseError) {
          error = parseError;
          console.error("Błąd parsera, próba następnego:", parseError);
          setDebugInfo(`Błąd parsera: ${parseError instanceof Error ? parseError.message : 'Nieznany błąd'}`);
          continue;
        }
      }
      
      // Jeśli wszystkie parsery zawiodły
      if (error) {
        throw error;
      }
      
      // Jeśli w jakiś sposób model jest nadal undefined (nie powinno się to zdarzyć)
      if (!model) {
        console.error("Wszystkie parsery zawiodły, ale nie zgłoszono błędu");
        const fallbackModel = new THREE.Group();
        
        // Dodaj prosty wskaźnik błędu
        const errorGeometry = new THREE.SphereGeometry(2, 8, 8);
        const errorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        fallbackModel.add(new THREE.Mesh(errorGeometry, errorMaterial));
        
        model = fallbackModel;
      }
      
      // Ustaw nazwę modelu i dodaj do sceny
      model.name = "StepModel";
      sceneRef.current.add(model);
      
      // Dopasuj kamerę do modelu
      if (cameraRef.current && controlsRef.current) {
        fitCameraToObject(model, cameraRef.current, controlsRef.current);
      }
      
      // Ustal format modelu dla informacji debugowej
      let modelFormat = 'STEP (uproszczony)';
      if (stlFileInfo) {
        modelFormat = 'STL';
      }
      
      setDebugInfo(`Model wczytany (format: ${modelFormat})`);
    } catch (error) {
      console.error("Błąd renderowania modelu:", error);
      setDebugInfo(`Błąd renderowania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      
      // W przypadku całkowitego błędu, spróbuj wyświetlić cokolwiek
      try {
        if (!sceneRef.current) return;
        
        const errorModel = new THREE.Group();
        errorModel.name = "StepModel";
        
        // Dodaj marker błędu
        const errorGeometry = new THREE.BoxGeometry(3, 3, 3);
        const errorMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xff3333,
          wireframe: true
        });
        errorModel.add(new THREE.Mesh(errorGeometry, errorMaterial));
        
        // Dodaj tekst błędu (markery)
        const axesHelper = new THREE.AxesHelper(5);
        errorModel.add(axesHelper);
        
        // Dodaj model do sceny
        sceneRef.current.add(errorModel);
        
        // Dopasuj kamerę
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      } catch (fallbackError) {
        console.error("Nawet wyświetlenie modelu błędu nie powiodło się:", fallbackError);
      }
    }
  }
  
  // Process model file when it's available
  useEffect(() => {
    if (!fileData || !sceneRef.current) return;
    
    // Load model from file
    const loadModel = async () => {
      try {
        setDebugInfo("Przetwarzanie modelu...");
        
        // Read file as text
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (!event.target || !event.target.result || !sceneRef.current) {
            setDebugInfo("Błąd odczytu pliku");
            return;
          }
          
          try {
            // Store STEP content for later use
            const stepContent = event.target.result as string;
            stepContentRef.current = stepContent;
            
            // Render the model using current render mode
            renderModel(stepContent);
            
          } catch (error) {
            console.error("Błąd przetwarzania modelu:", error);
            setDebugInfo(`Błąd przetwarzania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
          }
        };
        
        reader.onerror = () => {
          setDebugInfo("Błąd odczytu pliku");
        };
        
        // Start reading
        reader.readAsText(fileData);
        
      } catch (error) {
        console.error("Błąd ładowania modelu:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      }
    };
    
    loadModel();
    
    // Cleanup previous model when modelId changes
    return () => {
      if (sceneRef.current) {
        const model = sceneRef.current.getObjectByName("StepModel");
        if (model) {
          sceneRef.current.remove(model);
        }
      }
      // Clear stored content
      stepContentRef.current = null;
    };
  }, [fileData, renderMode, stlFileInfo]);
  
  // Helper function to create a simple model representation
  function createSimpleModelRepresentation(complexity: number) {
    const group = new THREE.Group();
    
    // Stwórz bardziej złożony model
    const size = 3; // Stała wielkość dla lepszej widoczności
    
    // Dodaj główne pudełko
    const mainBoxGeometry = new THREE.BoxGeometry(size, size, size);
    const mainBoxMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4488ee,
      metalness: 0.3,
      roughness: 0.7,
      flatShading: true 
    });
    const mainBox = new THREE.Mesh(mainBoxGeometry, mainBoxMaterial);
    
    // Dodaj wireframe do pudełka
    const wireframeGeometry = new THREE.EdgesGeometry(mainBoxGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    mainBox.add(wireframe);
    
    group.add(mainBox);
    
    // Dodaj cylindry na narożnikach
    const cylinderPositions = [
      [-size/2, -size/2, -size/2],
      [size/2, -size/2, -size/2],
      [-size/2, size/2, -size/2],
      [size/2, size/2, -size/2],
      [-size/2, -size/2, size/2],
      [size/2, -size/2, size/2],
      [-size/2, size/2, size/2],
      [size/2, size/2, size/2],
    ];
    
    // Dodaj cylindry na narożnikach
    cylinderPositions.forEach(position => {
      const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
      const cylinderMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x66aaff,
        metalness: 0.5,
        roughness: 0.5 
      });
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinder.position.set(position[0], position[1], position[2]);
      group.add(cylinder);
    });
    
    // Dodaj kulę w środku
    const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x88ccff, 
      metalness: 0.7,
      roughness: 0.2,
      envMapIntensity: 1.0
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);
    
    // Dodaj osie pomocnicze
    const axesHelper = new THREE.AxesHelper(size);
    group.add(axesHelper);
    
    // Dodaj siatkę podłoża
    const gridHelper = new THREE.GridHelper(size * 2, 10);
    gridHelper.position.y = -size/2 - 0.1; // Przesuń siatkę pod model
    group.add(gridHelper);
    
    return group;
  }
  
  // Helper function to fit camera to object
  function fitCameraToObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    const boundingBox = new THREE.Box3().setFromObject(object);
    
    // Get bounding box center
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Move camera to look at center
    camera.position.set(
      center.x + 10,
      center.y + 10,
      center.z + 10
    );
    camera.lookAt(center);
    
    // Update orbit controls target
    controls.target.copy(center);
    controls.update();
  }
  
  return (
    <div className="relative w-full h-full">
      {/* Debug info */}
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs p-1 rounded">
        {debugInfo}
      </div>
      
      {/* Controls overlay */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        {/* Przyciski usunięte */}
      </div>
      
      {/* Loading overlay */}
      {(isLoadingFile || isLoadingStlFile) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <div className="bg-white p-4 rounded shadow-md">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
            <div className="text-sm mt-2">Wczytywanie modelu...</div>
          </div>
        </div>
      )}
      
      {/* Three.js container */}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] bg-gray-100"
        style={{ minHeight: '500px' }}
      />
      
      {/* Mode info */}
      <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded flex flex-col gap-1">
        {stlFileInfo ? (
          <div className="flex items-center gap-2 mt-1">
            Format: 
            <Badge variant="outline" className="bg-green-900/50">
              STL (wysokiej jakości)
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-gray-300 text-xs">
              <Badge variant="outline" className="bg-amber-700/50">
                STEP (Symulowany)
              </Badge>
            </div>
            <div className="text-gray-300 text-xs italic">
              Widoczny jest model zastępczy
            </div>
          </div>
        )}
      </div>
    </div>
  );
}