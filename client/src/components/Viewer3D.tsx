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
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  
  const { data: modelFile, isLoading, error } = useQuery({
    queryKey: [`/api/models/${modelId}/file`],
    enabled: !!modelId,
    queryFn: async ({ queryKey }) => {
      const url = queryKey[0] as string;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/step'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching model: ${response.status} ${response.statusText}`);
      }
      
      return response.blob();
    }
  });
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { scene, camera, renderer } = initScene(containerRef.current);
    
    // Add lights and grid
    setupLights(scene);
    const grid = createGridHelper();
    scene.add(grid);
    
    // Setup orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    setScene(scene);
    setCamera(camera);
    setRenderer(renderer);
    setControls(controls);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);
  
  // Load model when modelFile changes
  useEffect(() => {
    if (!scene || !modelFile) {
      console.log('No scene or model file available', { scene: !!scene, modelFile: !!modelFile });
      return;
    }
    
    console.log('Loading model file', { 
      type: modelFile.type, 
      size: modelFile.size
    });
    
    // Clear previous model
    if (model) {
      scene.remove(model);
      setModel(null);
    }
    
    try {
      // Create a reader to parse the STEP file content
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target || !event.target.result) {
          console.error('FileReader event target or result is null');
          return;
        }
        
        // Parse the STEP file content
        const stepContent = event.target.result as string;
        console.log('Model content loaded, length:', stepContent.length);
        
        try {
          // Create a 3D model from the STEP file using our parser
          console.log('Creating 3D model from STEP file');
          const stepModel = createModelFromSTEP(stepContent);
          
          // Add model to scene
          scene.add(stepModel);
          setModel(stepModel);
          console.log('Model added to scene');
          
          // Reset camera and fit view to model
          if (camera && controls) {
            // Try to fit camera to model bounds
            fitCameraToObject(camera, stepModel, 1.5, controls);
            console.log('Camera position adjusted to model');
          }
        } catch (error) {
          console.error('Error creating model from STEP content:', error);
          createFallbackModel();
        }
      };
      
      reader.onerror = (event) => {
        console.error('Error reading file:', reader.error);
        createFallbackModel();
      };
      
      // Read the model file as text
      reader.readAsText(modelFile as Blob);
    } catch (error) {
      console.error("Error in model loading process:", error);
      createFallbackModel();
    }
    
    // Helper function to create a fallback model if something goes wrong
    function createFallbackModel() {
      if (!scene) return;
      
      // Fallback to simple box model if loading fails
      const geometry = new THREE.BoxGeometry(10, 10, 10);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6,
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      scene.add(mesh);
      setModel(mesh);
      console.log('Fallback cube model added');
      
      // Reset camera view
      if (camera && controls) {
        camera.position.set(20, 20, 20);
        controls.target.set(0, 0, 0);
        controls.update();
      }
    }
  }, [scene, modelFile, camera, controls, model]);
  
  // Viewer controls functions
  const handleRotate = () => {
    if (!camera || !controls) return;
    
    // Rotate around the model
    const currentPos = new THREE.Vector3().copy(camera.position);
    camera.position.set(currentPos.z, currentPos.y, -currentPos.x);
    controls.update();
  };
  
  const handleZoomIn = () => {
    if (!camera || !controls) return;
    
    // Zoom in by moving camera closer
    const direction = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    camera.position.addScaledVector(direction, 5);
    controls.update();
  };
  
  const handleZoomOut = () => {
    if (!camera || !controls) return;
    
    // Zoom out by moving camera away
    const direction = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    camera.position.addScaledVector(direction, -5);
    controls.update();
  };
  
  const handlePan = () => {
    if (!controls) return;
    
    // Toggle pan mode
    controls.enablePan = !controls.enablePan;
  };
  
  const handleFitToView = () => {
    if (!camera || !controls || !model) return;
    
    // Fit camera to model bounds
    fitCameraToObject(camera, model, 1.5, controls);
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
    <div className="relative w-full h-full" ref={containerRef}>
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
