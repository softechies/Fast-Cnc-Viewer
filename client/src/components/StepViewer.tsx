import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { loadSTLModel } from '@/lib/step-parser';

// Interface for STL File Information
interface StlFileInfo {
  url: string;
  isDirectStl?: boolean;
}

// Props for the StepViewer component
interface StepViewerProps {
  modelId: number | null;
}

// Component for viewing STL models
export default function StepViewer({ modelId }: StepViewerProps) {
  // Refs for Three.js elements
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileContentRef = useRef<string | null>(null);
  
  // State for file data and loading status
  const [fileData, setFileData] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [stlFileInfo, setStlFileInfo] = useState<StlFileInfo | null>(null);
  const [isLoadingStlFile, setIsLoadingStlFile] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Inicjalizacja...");
  
  // Używamy tylko renderowania STL (bez STEP)
  const renderMode = 'stl_only' as const;
  
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
    
    // Dodaj osie pomocnicze - ukryte domyślnie
    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.y = -0.1; // Przesuń lekko w dół aby nie zasłaniały modelu
    axesHelper.visible = false; // Ukrywamy domyślnie
    axesHelper.name = "AxesHelper";
    scene.add(axesHelper);
    
    // Siatka pomocnicza została usunięta, ponieważ przeszkadzała w oglądaniu modelu
    
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
        setDebugInfo("Ładowanie pliku modelu...");
        
        // Get model file
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
        console.error("Error loading model file:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        setFileData(null);
      } finally {
        setIsLoadingFile(false);
      }
    };
    
    loadFile();
  }, [modelId]);
  
  // Render model using Three.js - tylko obsługa STL
  async function renderModel(content: string) {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    try {
      // Remove any existing model
      const existingModel = sceneRef.current.getObjectByName("StepModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }
      
      // Funkcja pomocnicza do postępu ładowania
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setDebugInfo(`Ładowanie: ${percent}%`);
        }
      };
      
      // Sprawdź czy dostępny jest plik STL
      if (stlFileInfo?.url) {
        try {
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
          
          // Ustaw nazwę modelu i dodaj do sceny
          modelGroup.name = "StepModel";
          sceneRef.current.add(modelGroup);
          
          // Dopasuj kamerę do modelu
          if (cameraRef.current && controlsRef.current) {
            fitCameraToObject(modelGroup, cameraRef.current, controlsRef.current);
          }
          
          setDebugInfo(`Model wczytany (format: STL)`);
          return;
        } catch (error) {
          console.error("Błąd ładowania modelu STL:", error);
          setDebugInfo(`Błąd ładowania STL: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        }
      } else {
        // Jeśli nie ma STL, wyświetl informację
        setDebugInfo("Ten format pliku nie jest obsługiwany. Tylko pliki STL są obsługiwane.");
        
        // Dodaj prosty placeholder informacyjny
        const infoGroup = new THREE.Group();
        infoGroup.name = "StepModel";
        
        // Dodaj prosty wskaźnik informacyjny
        const infoGeometry = new THREE.PlaneGeometry(10, 5);
        const infoMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xe0e0e0, 
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const infoPlane = new THREE.Mesh(infoGeometry, infoMaterial);
        infoPlane.rotation.x = Math.PI / 2;
        infoPlane.position.y = 0.5;
        infoGroup.add(infoPlane);
        
        // Dodaj osie pomocnicze
        const axesHelper = new THREE.AxesHelper(5);
        infoGroup.add(axesHelper);
        
        // Dodaj do sceny
        sceneRef.current.add(infoGroup);
        
        // Ustaw kamerę
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
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
            // Store content for later use
            const fileContent = event.target.result as string;
            fileContentRef.current = fileContent;
            
            // Render the model
            renderModel(fileContent);
            
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
      fileContentRef.current = null;
    };
  }, [fileData, renderMode, stlFileInfo]);
  
  // Helper function to create a simple model representation (bez zbędnych kostek)
  function createSimpleModelRepresentation(complexity: number) {
    const group = new THREE.Group();
    
    // Dodaj tylko informacyjne elementy, bez niepotrzebnych kostek
    
    // Dodaj płaszczyznę informacyjną
    const infoPlaneGeometry = new THREE.PlaneGeometry(8, 4);
    const infoPlaneMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf0f0f0, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const infoPlane = new THREE.Mesh(infoPlaneGeometry, infoPlaneMaterial);
    infoPlane.rotation.x = Math.PI / 2;
    infoPlane.position.y = 0.5;
    group.add(infoPlane);
    
    // Dodaj osie pomocnicze
    const axesHelper = new THREE.AxesHelper(5);
    group.add(axesHelper);
    
    return group;
  }
  
  // Funkcja odświeżania modelu - ponowne renderowanie
  const refreshModel = () => {
    if (!fileContentRef.current || !sceneRef.current) {
      setDebugInfo("Brak danych do ponownego renderowania");
      return;
    }
    
    setDebugInfo("Odświeżanie modelu...");
    
    // Wywołaj renderModel z zapisaną wcześniej zawartością pliku
    renderModel(fileContentRef.current);
  };

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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshModel}
          className="bg-black/50 text-white hover:bg-black/70 border-none p-2"
          title="Odśwież model"
        >
          <RefreshCw className="h-6 w-6" />
        </Button>
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
              STL
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-gray-300 text-xs">
              <Badge variant="outline" className="bg-red-700/50">
                Format nieobsługiwany
              </Badge>
            </div>
            <div className="text-gray-300 text-xs italic">
              Obsługiwane są tylko pliki STL
            </div>
          </div>
        )}
      </div>
    </div>
  );
}