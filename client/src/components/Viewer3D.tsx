import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene, setupLights, createGridHelper, fitCameraToObject } from '@/lib/three-utils';
import { createModelFromSTEP } from '@/lib/step-parser';
import ViewerControls from '@/components/ViewerControls';
import { Skeleton } from '@/components/ui/skeleton';

interface Viewer3DProps {
  modelId: number | null;
}

export default function Viewer3D({ modelId }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeState, setThreeState] = useState<{
    scene: THREE.Scene | null,
    camera: THREE.PerspectiveCamera | null,
    renderer: THREE.WebGLRenderer | null,
    controls: OrbitControls | null,
    model: THREE.Object3D | null,
    isInitialized: boolean
  }>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    model: null,
    isInitialized: false
  });
  
  // Initialize Three.js scene first
  useEffect(() => {
    // Reference to animation frame for cleanup
    let animationFrameId: number;
    
    // Skip if container doesn't exist or scene is already initialized
    if (!containerRef.current || threeState.isInitialized) return;
    
    try {
      console.log('Initializing Three.js scene');
      
      // Create scene, camera, renderer, controls
      const { scene, camera, renderer } = initScene(containerRef.current);
      
      // Add lights and grid
      setupLights(scene);
      const grid = createGridHelper();
      scene.add(grid);
      
      // Setup orbit controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Save all state at once
      setThreeState({
        scene,
        camera,
        renderer,
        controls,
        model: null,
        isInitialized: true
      });
      
      console.log('Three.js scene initialized successfully');
      
      // Animation loop with proper reference for cleanup
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
      
      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function runs when component unmounts
      return () => {
        console.log('Cleaning up Three.js resources');
        
        // Cancel animation loop
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', handleResize);
        
        // Dispose resources
        if (controls) controls.dispose();
        
        // Remove canvas from DOM if it exists
        if (renderer && renderer.domElement && containerRef.current) {
          try {
            if (containerRef.current.contains(renderer.domElement)) {
              containerRef.current.removeChild(renderer.domElement);
            }
          } catch (error) {
            console.error('Error removing renderer from DOM:', error);
          }
        }
        
        // Dispose renderer
        if (renderer) renderer.dispose();
        
        console.log('Three.js resources cleaned up successfully');
      };
    } catch (error) {
      console.error('Error initializing Three.js:', error);
    }
  }, [threeState.isInitialized]);
  
  // State for debug info display
  const [debugInfo, setDebugInfo] = useState<string>("Initializing...");
  
  // Track animation frames for cleanup
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Fetch the model file only when scene is initialized and modelId is available
  const { data: modelFile, isLoading, error } = useQuery({
    queryKey: [`/api/models/${modelId}/file`],
    enabled: !!modelId && threeState.isInitialized,
    queryFn: async ({ queryKey }) => {
      console.log('Fetching model file:', queryKey[0]);
      const url = queryKey[0] as string;
      setDebugInfo(`Fetching: ${url}`);
      
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'application/step'
          }
        });
        
        if (!response.ok) {
          const errorMsg = `Error fetching model: ${response.status} ${response.statusText}`;
          setDebugInfo(errorMsg);
          throw new Error(errorMsg);
        }
        
        const blob = await response.blob();
        console.log('Model file fetched successfully:', {
          size: blob.size,
          type: blob.type
        });
        setDebugInfo(`File loaded: ${blob.size} bytes`);
        return blob;
      } catch (error) {
        console.error('Error fetching model file:', error);
        setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }
  });
  
  // Track when model is loaded to prevent duplicate loading
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const modelFileRef = useRef<Blob | null>(null);
  
  // Load model when modelFile changes and scene is available
  useEffect(() => {
    // Skip if we've already processed this file or don't have necessary components
    if (!threeState.scene || !modelFile || modelLoaded) {
      return;
    }
    
    // Check if this is the same file we already processed
    if (modelFileRef.current === modelFile) {
      return;
    }
    
    // Save reference to current file being processed
    modelFileRef.current = modelFile;
    
    console.log('Starting to load model into scene');
    
    // Cache references to avoid closure issues
    const { scene, camera, controls } = threeState;
    
    // Clear previous model if it exists
    if (threeState.model) {
      console.log('Removing previous model from scene');
      scene.remove(threeState.model);
      setThreeState(prev => ({ ...prev, model: null }));
    }
    
    // Flag that we're starting to load a model
    setModelLoaded(true);
    
    // Create a function to load the model
    const loadModel = () => {
      try {
        // Create a reader to parse the STEP file content
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (!event.target || !event.target.result) {
            console.error('FileReader event target or result is null');
            setModelLoaded(false);
            return;
          }
          
          // Parse the STEP file content
          const stepContent = event.target.result as string;
          console.log('STEP file content loaded, length:', stepContent.length);
          
          try {
            if (!scene) {
              console.error('Scene not available when trying to add model');
              setModelLoaded(false);
              return;
            }
            
            // Create a 3D model from the STEP file using our parser
            console.log('Creating 3D model from STEP file content');
            const stepModel = createModelFromSTEP(stepContent);
            
            // Add model to scene
            scene.add(stepModel);
            setThreeState(prev => ({ ...prev, model: stepModel }));
            console.log('Model successfully added to scene');
            
            // Reset camera and fit view to model
            if (camera && controls) {
              // Try to fit camera to model bounds
              fitCameraToObject(camera, stepModel, 1.5, controls);
              console.log('Camera position adjusted to fit model');
            }
          } catch (error) {
            console.error('Error creating model from STEP content:', error);
            createFallbackModel();
          }
        };
        
        reader.onerror = () => {
          console.error('FileReader error:', reader.error);
          createFallbackModel();
          setModelLoaded(false);
        };
        
        // Start reading the file as text
        console.log('Reading STEP file as text');
        reader.readAsText(modelFile);
      } catch (error) {
        console.error("Error in model loading process:", error);
        createFallbackModel();
        setModelLoaded(false);
      }
    };
    
    // Helper function to create a fallback model if something goes wrong
    const createFallbackModel = () => {
      if (!scene) {
        console.error('Scene not available for fallback model');
        return;
      }
      
      console.log('Creating fallback model');
      // Fallback to simple box model if loading fails
      const geometry = new THREE.BoxGeometry(10, 10, 10);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6,
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      scene.add(mesh);
      setThreeState(prev => ({ ...prev, model: mesh }));
      console.log('Fallback cube model added to scene');
      
      // Reset camera view
      if (camera && controls) {
        camera.position.set(20, 20, 20);
        controls.target.set(0, 0, 0);
        controls.update();
      }
    };
    
    // Execute the model loading
    loadModel();
  }, [modelFile, threeState, modelLoaded]);
  
  // Reset modelLoaded when modelId changes (new model selected)
  useEffect(() => {
    setModelLoaded(false);
    modelFileRef.current = null;
  }, [modelId]);
  
  // Viewer controls functions
  const handleRotate = () => {
    if (!threeState.camera || !threeState.controls) {
      console.log('Cannot rotate, camera or controls not initialized');
      return;
    }
    
    // Rotate around the model
    const currentPos = new THREE.Vector3().copy(threeState.camera.position);
    threeState.camera.position.set(currentPos.z, currentPos.y, -currentPos.x);
    threeState.controls.update();
  };
  
  const handleZoomIn = () => {
    if (!threeState.camera || !threeState.controls) {
      console.log('Cannot zoom in, camera or controls not initialized');
      return;
    }
    
    // Zoom in by moving camera closer
    const direction = new THREE.Vector3()
      .subVectors(threeState.controls.target, threeState.camera.position)
      .normalize();
    threeState.camera.position.addScaledVector(direction, 5);
    threeState.controls.update();
  };
  
  const handleZoomOut = () => {
    if (!threeState.camera || !threeState.controls) {
      console.log('Cannot zoom out, camera or controls not initialized');
      return;
    }
    
    // Zoom out by moving camera away
    const direction = new THREE.Vector3()
      .subVectors(threeState.controls.target, threeState.camera.position)
      .normalize();
    threeState.camera.position.addScaledVector(direction, -5);
    threeState.controls.update();
  };
  
  const handlePan = () => {
    if (!threeState.controls) {
      console.log('Cannot pan, controls not initialized');
      return;
    }
    
    // Toggle pan mode
    threeState.controls.enablePan = !threeState.controls.enablePan;
  };
  
  const handleFitToView = () => {
    if (!threeState.camera || !threeState.controls || !threeState.model) {
      console.log('Cannot fit to view, camera, controls or model not initialized');
      return;
    }
    
    // Fit camera to model bounds
    fitCameraToObject(threeState.camera, threeState.model, 1.5, threeState.controls);
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <Skeleton className="w-64 h-64 rounded-lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-700">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">Nie można wczytać modelu</h3>
        <p className="text-gray-500 text-center max-w-md mb-4">
          Wystąpił błąd podczas próby wczytania modelu. Spróbuj ponownie lub wczytaj inny plik.
        </p>
        <div className="bg-gray-100 rounded p-3 text-xs text-gray-500 max-w-md overflow-auto">
          {error instanceof Error ? error.message : 'Nieznany błąd'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: "500px" }}>
      {/* Debug info panel */}
      <div className="absolute top-0 left-0 z-50 bg-black/70 text-white text-xs p-1 m-1 rounded">
        {debugInfo}
      </div>
      
      {/* 3D viewer container */}
      <div 
        className="relative w-full h-full bg-gray-100" 
        ref={containerRef}
        style={{ minHeight: "400px", flex: 1 }}
      />
      
      {/* Controls */}
      <ViewerControls 
        onRotate={handleRotate}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPan={handlePan}
        onFitToView={handleFitToView}
      />
    </div>
  );
}
