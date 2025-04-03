import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createModelFromSTEP, loadSTLModel } from '@/lib/step-parser';

interface StepViewerProps {
  modelId: number | null;
}

type RenderMode = 'simple' | 'advanced';

export default function StepViewer({ modelId }: StepViewerProps) {
  // Container reference for Three.js scene
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs to maintain Three.js objects references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stepContentRef = useRef<string | null>(null);
  
  // State for UI updates
  const [debugInfo, setDebugInfo] = useState<string>("Inicjalizacja...");
  const [renderMode, setRenderMode] = useState<RenderMode>('advanced');
  
  // Initialize Three.js scene only once
  useEffect(() => {
    // Skip if container doesn't exist
    if (!containerRef.current) return;
    
    try {
      // Log initialization
      console.log("Inicjalizacja sceny Three.js");
      setDebugInfo("Inicjalizacja sceny...");
      
      // Clear container
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Get dimensions
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 500; // Fallback height
      
      // Create basic scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf7f7f7);
      sceneRef.current = scene;
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
      
      // Create renderer (basic)
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Create controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controlsRef.current = controls;
      
      // Basic lighting (simpler)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);
      
      // Add grid and axes for reference
      const grid = new THREE.GridHelper(20, 20);
      scene.add(grid);
      
      const axes = new THREE.AxesHelper(5);
      scene.add(axes);
      
      // Add simple reference cube
      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cubeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        wireframe: true
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.name = "ReferenceBox";
      scene.add(cube);
      
      // Simple animation loop
      const animate = () => {
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Rotate reference cube (if it exists)
        const refCube = sceneRef.current?.getObjectByName("ReferenceBox");
        if (refCube) {
          refCube.rotation.y += 0.01;
        }
        
        // Render
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // Start animation
      animate();
      
      // Handle resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight || 500;
        
        // Update camera aspect ratio
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        
        // Update renderer size
        rendererRef.current.setSize(newWidth, newHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Update debug info
      setDebugInfo("Scena gotowa");
      
      // Cleanup function
      return () => {
        console.log("Sprzątanie zasobów Three.js");
        
        // Stop animation
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', handleResize);
        
        // Dispose controls
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        
        // Remove renderer from DOM
        if (rendererRef.current && containerRef.current) {
          try {
            if (containerRef.current.contains(rendererRef.current.domElement)) {
              containerRef.current.removeChild(rendererRef.current.domElement);
            }
          } catch (error) {
            console.error("Error removing renderer from DOM:", error);
          }
        }
        
        // Dispose renderer
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        // Clear references
        sceneRef.current = null;
        cameraRef.current = null;
        rendererRef.current = null;
        controlsRef.current = null;
      };
    } catch (error) {
      console.error("Błąd inicjalizacji Three.js:", error);
      setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    }
  }, []);
  
  // Fetch STEP model file when modelId changes
  const { data: fileData, isLoading: isLoadingFile } = useQuery({
    queryKey: [`/api/models/${modelId}/file`],
    enabled: !!modelId,
    queryFn: async ({ queryKey }) => {
      const url = queryKey[0] as string;
      setDebugInfo(`Pobieranie pliku STEP: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const blob = await response.blob();
      setDebugInfo(`Plik STEP pobrany: ${blob.size} bajtów`);
      return blob;
    }
  });
  
  // Fetch STL model file (converted) when modelId changes
  const { data: stlFileInfo, isLoading: isLoadingStlFile } = useQuery({
    queryKey: [`/api/models/${modelId}/stl`],
    enabled: !!modelId,
    queryFn: async ({ queryKey }) => {
      const url = queryKey[0] as string;
      setDebugInfo(`Sprawdzanie dostępności pliku STL...`);
      
      try {
        // Najpierw sprawdź, czy to jest bezpośrednio załadowany plik STL
        const infoResponse = await fetch(`/api/models/${modelId}`);
        let isDirectStl = false;
        
        if (infoResponse.ok) {
          const modelData = await infoResponse.json();
          isDirectStl = modelData.format === 'STL' || !!modelData.metadata?.isDirectStl;
          if (isDirectStl) {
            setDebugInfo(`Wykryto bezpośredni model STL`);
          }
        }
        
        // Pobierz plik STL
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        // Jeśli plik STL istnieje, zwróć jego URL i informację czy to bezpośredni STL
        setDebugInfo(`Plik STL dostępny ${isDirectStl ? '(bezpośredni upload)' : ''}`);
        return { url, isDirectStl };
      } catch (error) {
        console.error("STL file not available:", error);
        setDebugInfo(`Plik STL niedostępny - użycie generowanego modelu`);
        return null;
      }
    }
  });
  
  // Handle render mode change
  function toggleRenderMode() {
    // Toggle between simple and advanced
    const newMode = renderMode === 'simple' ? 'advanced' : 'simple';
    setRenderMode(newMode);
    
    // Re-render current model if we have content
    if (stepContentRef.current && sceneRef.current) {
      renderModel(stepContentRef.current);
    }
  }
  
  // Function to render model based on current render mode
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
          setDebugInfo("Problem z modelem STL, użycie alternatywnego parsera...");
          
          // Fallback do parsera STEP
          if (renderMode === 'advanced') {
            model = createModelFromSTEP(stepContent);
          } else {
            const complexity = Math.min(5, Math.max(1, Math.floor(stepContent.length / 10000)));
            model = createSimpleModelRepresentation(complexity);
          }
        }
      } 
      // Jeśli nie ma STL lub jest w trybie prostym
      else {
        if (renderMode === 'advanced') {
          // Use advanced STEP parser
          setDebugInfo("Użycie zaawansowanego parsera STEP...");
          model = createModelFromSTEP(stepContent);
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
      
      setDebugInfo(`Model wczytany (tryb: ${renderMode}${stlFileInfo ? ', format: STL' : ''})`);
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