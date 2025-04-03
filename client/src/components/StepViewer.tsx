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
  
  // State for rendering mode
  const [renderMode, setRenderMode] = useState<'simple' | 'advanced'>('simple');
  
  // Toggle between simple and advanced rendering modes
  function toggleRenderMode() {
    const newMode = renderMode === 'simple' ? 'advanced' : 'simple';
    setRenderMode(newMode);
    
    // Re-render the model if content is available
    if (stepContentRef.current) {
      renderModel(stepContentRef.current);
    }
  }
  
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
      
      // Create model based on available format and render mode
      let model: THREE.Object3D;
      
      // Pierwsza próba: Wczytaj model STL, jeśli dostępny
      if (stlFileInfo?.url && renderMode === 'advanced') {
        try {
          setDebugInfo(`Ładowanie modelu STL... ${stlFileInfo.isDirectStl ? '(bezpośredni upload)' : '(konwertowany)'}`);
          model = await loadSTLModel(stlFileInfo.url, (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setDebugInfo(`Ładowanie STL: ${percent}%`);
            }
          });
          setDebugInfo("Model STL wczytany");
        } catch (stlError) {
          console.error("Błąd wczytywania STL, przełączenie na parser STEP:", stlError);
          setDebugInfo("Problem z modelem STL, użycie parsera OpenCascade...");
          
          // Próba użycia OpenCascade
          try {
            setDebugInfo("Inicjalizacja OpenCascade.js...");
            // Dynamiczny import modułu OpenCascade
            const { parseSTEPFile } = await import('../lib/opencascade-parser');
            setDebugInfo("Parsowanie STEP z OpenCascade.js...");
            model = await parseSTEPFile(stepContent);
            setDebugInfo("Model STEP wczytany za pomocą OpenCascade.js");
          } catch (ocError) {
            console.error("Błąd parsera OpenCascade, przełączenie na alternatywny parser:", ocError);
            setDebugInfo("Problem z OpenCascade, użycie alternatywnego parsera...");
            
            // Fallback do prostego parsera STEP
            if (renderMode === 'advanced') {
              model = createModelFromSTEP(stepContent);
            } else {
              const complexity = Math.min(5, Math.max(1, Math.floor(stepContent.length / 10000)));
              model = createSimpleModelRepresentation(complexity);
            }
          }
        }
      } 
      // Jeśli nie ma STL lub jest w trybie prostym
      else {
        if (renderMode === 'advanced') {
          // First try OpenCascade parser for STEP 
          try {
            setDebugInfo("Inicjalizacja zaawansowanego parsera OpenCascade.js...");
            // Dynamiczny import modułu OpenCascade
            const { parseSTEPFile } = await import('../lib/opencascade-parser');
            setDebugInfo("Parsowanie STEP z OpenCascade.js...");
            model = await parseSTEPFile(stepContent);
            setDebugInfo("Model STEP wczytany za pomocą OpenCascade.js");
          } catch (ocError) {
            console.error("Błąd parsera OpenCascade, przełączenie na alternatywny parser:", ocError);
            setDebugInfo("Problem z OpenCascade, użycie alternatywnego parsera...");
            
            // Fallback to original simple parser
            model = createModelFromSTEP(stepContent);
          }
        } else {
          // Use simple visualization
          setDebugInfo("Użycie uproszczonej reprezentacji...");
          const complexity = Math.min(5, Math.max(1, Math.floor(stepContent.length / 10000)));
          model = createSimpleModelRepresentation(complexity);
        }
      }
      
      model.name = "StepModel";
      sceneRef.current.add(model);
      
      // Fit camera to model
      if (cameraRef.current && controlsRef.current) {
        fitCameraToObject(model, cameraRef.current, controlsRef.current);
      }
      
      const modelFormat = stlFileInfo ? 'STL' : (renderMode === 'advanced' ? 'STEP (OpenCascade)' : 'STEP (uproszczony)');
      setDebugInfo(`Model wczytany (tryb: ${renderMode}, format: ${modelFormat})`);
    } catch (error) {
      console.error("Błąd renderowania modelu:", error);
      setDebugInfo(`Błąd renderowania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
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
    
    // Create base cube
    const baseGeometry = new THREE.BoxGeometry(complexity, 0.5, complexity);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x3366cc });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);
    
    // Add some detail based on complexity
    for (let i = 0; i < complexity * 2; i++) {
      // Random position
      const x = (Math.random() - 0.5) * complexity;
      const y = Math.random() * complexity + 0.5;
      const z = (Math.random() - 0.5) * complexity;
      
      // Random size
      const size = 0.3 + Math.random() * 0.7;
      
      // Alternate between cubes and cylinders
      let detail;
      if (i % 2 === 0) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({ color: 0x6699cc });
        detail = new THREE.Mesh(geometry, material);
      } else {
        const geometry = new THREE.CylinderGeometry(size/2, size/2, size, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x99ccff });
        detail = new THREE.Mesh(geometry, material);
      }
      
      detail.position.set(x, y, z);
      group.add(detail);
    }
    
    // Add wireframe to make it more visible
    const wireframe = new THREE.WireframeGeometry(baseGeometry);
    const line = new THREE.LineSegments(
      wireframe,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    base.add(line);
    
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
        <Button 
          onClick={toggleRenderMode}
          variant="outline"
          size="sm"
          className="bg-white/80 hover:bg-white text-xs"
        >
          {renderMode === 'simple' ? 'Tryb zaawansowany' : 'Tryb prosty'}
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
        <div className="flex items-center gap-2">
          Tryb renderowania: 
          <Badge variant={renderMode === 'simple' ? 'default' : 'secondary'}>
            {renderMode === 'simple' ? 'Uproszczony (stabilny)' : 'Zaawansowany (pełna geometria)'}
          </Badge>
        </div>
        {stlFileInfo ? (
          <div className="flex items-center gap-2 mt-1">
            Format: 
            <Badge variant="outline" className="bg-green-900/50">
              STL (wysokiej jakości)
            </Badge>
          </div>
        ) : (
          <div className="text-gray-300 text-xs italic">
            Uwaga: Używany jest przybliżony model (STL niedostępny).
          </div>
        )}
      </div>
    </div>
  );
}