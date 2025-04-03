import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function Test3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>("Inicjalizacja...");
  const [renderCount, setRenderCount] = useState<number>(0);
  
  // Simple Three.js scene setup for testing rendering capabilities
  useEffect(() => {
    if (!containerRef.current) {
      setDebugInfo("Kontener niedostępny");
      return;
    }
    
    // Force container to have explicit dimensions
    if (containerRef.current) {
      containerRef.current.style.width = "100%";
      containerRef.current.style.height = "400px";
      containerRef.current.style.minHeight = "400px";
      containerRef.current.style.backgroundColor = "#f0f0f0";
      containerRef.current.style.position = "relative";
    }
    
    // Clean up any previous renders
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    setDebugInfo("Tworzenie sceny Three.js...");
    
    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x2a3746);
      
      // Get container dimensions
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      console.log("Container dimensions:", { width, height });
      
      if (width === 0 || height === 0) {
        setDebugInfo("Błąd: Kontener ma zerowe wymiary!");
        return;
      }
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75, // FOV
        width / height, // Aspect ratio
        0.1, // Near
        1000 // Far
      );
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      containerRef.current.appendChild(renderer.domElement);
      
      // Make the canvas style explicit
      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      
      // Add a simple cube
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      // Add wireframe to the cube
      const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      cube.add(wireframe);
      
      // Add grid for reference
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);
      
      // Add axes helper
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
      
      // Add orbit controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      // Track an animation frame ID for cleanup
      let animationFrameId: number;
      
      // Render function with rotation animation
      const renderScene = () => {
        // Rotate the cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        // Update controls (for damping)
        controls.update();
        
        // Render scene
        renderer.render(scene, camera);
        
        // Track render count
        setRenderCount(prev => prev + 1);
        
        // Continue animation
        animationFrameId = requestAnimationFrame(renderScene);
      };
      
      // Start animation
      renderScene();
      
      // Report success
      setDebugInfo("Render działa poprawnie");
      
      // Resize handler
      const handleResize = () => {
        if (!containerRef.current) return;
        
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        
        // Update camera
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(newWidth, newHeight);
      };
      
      // Register resize handler
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        setDebugInfo("Czyszczenie zasobów...");
        
        // Cancel animation frame
        cancelAnimationFrame(animationFrameId);
        
        // Remove event listener
        window.removeEventListener('resize', handleResize);
        
        // Dispose of Three.js resources
        geometry.dispose();
        material.dispose();
        
        // Dispose of renderer
        renderer.dispose();
        
        // Remove the canvas element
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        
        setDebugInfo("Zasoby wyczyszczone");
      };
    } catch (error) {
      console.error("Error initializing Three.js:", error);
      setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    }
  }, []);
  
  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-800 text-white font-medium">
          Test renderowania Three.js
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Ten komponent testuje podstawowe renderowanie Three.js. Poniżej powinna być widoczna czerwona kostka obracająca się w przestrzeni 3D.
            </p>
            <p className="text-gray-500 text-sm">
              Status: {debugInfo} | Liczba klatek: {renderCount}
            </p>
          </div>
          
          {/* The Three.js container */}
          <div 
            ref={containerRef} 
            className="w-full h-[400px] bg-gray-100 border border-gray-300 rounded-lg"
          />
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Jeśli renderowanie działa prawidłowo, powinieneś widzieć czerwoną kostkę obracającą się w środku sceny, wraz z siatką pomocniczą.</p>
          </div>
        </div>
      </div>
    </div>
  );
}