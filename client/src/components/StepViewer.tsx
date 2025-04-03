import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useQuery } from '@tanstack/react-query';
import { createModelFromSTEP } from '@/lib/step-parser';
import { Skeleton } from '@/components/ui/skeleton';

interface StepViewerProps {
  modelId: number | null;
}

export default function StepViewer({ modelId }: StepViewerProps) {
  // Container reference for Three.js scene
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scene state
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  
  // Debug and animation state
  const [debugInfo, setDebugInfo] = useState<string>("Inicjalizacja...");
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    // Skip if container doesn't exist
    if (!containerRef.current) return;
    
    try {
      console.log("Initializing Three.js for StepViewer");
      
      // Clear container
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Make container have explicit dimensions
      containerRef.current.style.width = "100%";
      containerRef.current.style.height = "100%";
      containerRef.current.style.minHeight = "500px";
      containerRef.current.style.backgroundColor = "#f0f0f0";
      
      // Get dimensions
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      console.log("Container dimensions:", { width, height });
      
      // Create scene
      const newScene = new THREE.Scene();
      newScene.background = new THREE.Color(0xf0f0f0);
      
      // Create camera
      const newCamera = new THREE.PerspectiveCamera(
        60, 
        width / height, 
        0.1, 
        1000
      );
      newCamera.position.set(15, 15, 15);
      newCamera.lookAt(0, 0, 0);
      
      // Create renderer
      const newRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      newRenderer.setSize(width, height);
      newRenderer.shadowMap.enabled = true;
      newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Add renderer to container
      containerRef.current.appendChild(newRenderer.domElement);
      
      // Create controls
      const newControls = new OrbitControls(newCamera, newRenderer.domElement);
      newControls.enableDamping = true;
      newControls.dampingFactor = 0.25;
      
      // Set up lighting
      addLighting(newScene);
      
      // Add grid and axes
      const grid = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
      grid.position.y = -0.01;
      newScene.add(grid);
      
      const axes = new THREE.AxesHelper(5);
      newScene.add(axes);
      
      // Store references
      setScene(newScene);
      setCamera(newCamera);
      setRenderer(newRenderer);
      setControls(newControls);
      
      // Create reference cube
      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 1, 0);
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.name = "ReferenceBox";
      newScene.add(cube);
      
      // Add wireframe to cube for better visibility
      const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(cubeGeometry),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      cube.add(wireframe);
      
      setDebugInfo("Scena zainicjalizowana");
      
      // Animation loop
      const animate = () => {
        if (!newScene || !newCamera || !newRenderer || !newControls) return;
        
        // Rotate reference cube
        const refCube = newScene.getObjectByName("ReferenceBox");
        if (refCube) {
          refCube.rotation.y += 0.01;
        }
        
        // Update controls
        newControls.update();
        
        // Render
        newRenderer.render(newScene, newCamera);
        
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // Start animation
      animate();
      
      // Handle resize
      const handleResize = () => {
        if (!containerRef.current || !newCamera || !newRenderer) return;
        
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        
        // Skip invalid dimensions
        if (newWidth === 0 || newHeight === 0) return;
        
        // Update camera and renderer
        newCamera.aspect = newWidth / newHeight;
        newCamera.updateProjectionMatrix();
        newRenderer.setSize(newWidth, newHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        console.log("Cleaning up Three.js resources in StepViewer");
        
        // Cancel animation
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', handleResize);
        
        // Dispose controls
        if (newControls) {
          newControls.dispose();
        }
        
        // Remove scene objects 
        if (newScene) {
          newScene.traverse((object) => {
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
          newScene.clear();
        }
        
        // Remove renderer from DOM
        if (newRenderer && newRenderer.domElement && containerRef.current) {
          try {
            if (containerRef.current.contains(newRenderer.domElement)) {
              containerRef.current.removeChild(newRenderer.domElement);
            }
          } catch (error) {
            console.error("Error removing renderer:", error);
          }
        }
        
        // Dispose renderer
        if (newRenderer) {
          newRenderer.dispose();
        }
        
        // Reset state
        setScene(null);
        setCamera(null);
        setRenderer(null);
        setControls(null);
        setModel(null);
      };
    } catch (error) {
      console.error("Error initializing Three.js:", error);
      setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    }
  }, []);
  
  // Fetch STEP file when model ID changes
  const { data: fileData, isLoading: isLoadingFile } = useQuery({
    queryKey: [`/api/models/${modelId}/file`],
    enabled: !!modelId && !!scene,
    queryFn: async ({ queryKey }) => {
      const url = queryKey[0] as string;
      setDebugInfo(`Pobieranie pliku: ${url}`);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log(`File fetched: ${blob.size} bytes`);
        setDebugInfo(`Plik pobrany: ${blob.size} bajtów`);
        return blob;
      } catch (error) {
        console.error("Error fetching file:", error);
        setDebugInfo(`Błąd pobierania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        throw error;
      }
    }
  });
  
  // Process STEP file when it's loaded
  useEffect(() => {
    if (!fileData || !scene || !camera || !controls) return;
    
    // Load model from STEP file
    const loadModel = async () => {
      try {
        setDebugInfo("Wczytywanie modelu STEP...");
        
        // Read STEP file as text
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (!event.target || !event.target.result || !scene) {
            setDebugInfo("Błąd odczytu pliku");
            return;
          }
          
          try {
            // Get STEP content
            const stepContent = event.target.result as string;
            console.log(`STEP content loaded: ${stepContent.length} bytes`);
            
            // Remove previous model and reference cube
            if (model) {
              scene.remove(model);
            }
            
            const refCube = scene.getObjectByName("ReferenceBox");
            if (refCube) {
              scene.remove(refCube);
              console.log("Removed reference cube");
            }
            
            // Create new model from STEP content
            const newModel = createModelFromSTEP(stepContent);
            
            // Ensure all objects have shadows enabled
            newModel.traverse((object) => {
              if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            });
            
            // Add to scene
            scene.add(newModel);
            setModel(newModel);
            
            setDebugInfo("Model STEP wczytany");
            console.log("STEP model loaded successfully");
            
            // Fit camera to model
            fitCameraToModel(newModel, camera, controls);
            
          } catch (error) {
            console.error("Error loading STEP content:", error);
            setDebugInfo(`Błąd przetwarzania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
          }
        };
        
        reader.onerror = () => {
          console.error("FileReader error");
          setDebugInfo("Błąd odczytu pliku");
        };
        
        // Start reading
        reader.readAsText(fileData);
        
      } catch (error) {
        console.error("Error loading model:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      }
    };
    
    loadModel();
  }, [fileData, scene, camera, controls, model]);
  
  // Helper functions
  function addLighting(scene: THREE.Scene) {
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    
    // Main directional light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    
    // Improve shadow quality
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    
    // Set shadow camera frustum
    const shadowSize = 15;
    mainLight.shadow.camera.left = -shadowSize;
    mainLight.shadow.camera.right = shadowSize;
    mainLight.shadow.camera.top = shadowSize;
    mainLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(mainLight);
    
    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);
    
    // Add a ground plane to catch shadows
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf0f0f0,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
  }
  
  function fitCameraToModel(model: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(model);
    
    // Skip if invalid
    if (boundingBox.isEmpty()) {
      console.warn("Empty bounding box, can't fit camera");
      return;
    }
    
    // Get center and size
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Calculate suitable distance
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
    cameraZ *= 1.5; // Add some margin
    
    // Move camera to position
    const direction = new THREE.Vector3(1, 0.7, 1).normalize();
    camera.position.copy(center.clone().add(direction.multiplyScalar(cameraZ)));
    camera.lookAt(center);
    
    // Update controls
    controls.target.copy(center);
    controls.update();
    
    // Log debug info
    console.log("Model bounds:", {
      center: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z],
      maxDim,
      cameraDistance: cameraZ
    });
  }
  
  return (
    <div className="relative w-full h-full">
      {/* Debug info overlay */}
      <div className="absolute top-2 left-2 z-50 bg-black/70 text-white text-xs p-1 rounded">
        {debugInfo}
      </div>
      
      {/* Loading overlay */}
      {isLoadingFile && (
        <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      )}
      
      {/* 3D container */}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] bg-gray-100 border border-gray-200"
      />
    </div>
  );
}