import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { initScene, setupLights, createGridHelper } from '@/lib/three-utils';
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
  
  const { data: modelFile, isLoading } = useQuery({
    queryKey: ['/api/models', modelId, 'file'],
    enabled: !!modelId,
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
    if (!scene || !modelFile) return;
    
    // Clear previous model
    if (model) {
      scene.remove(model);
      setModel(null);
    }
    
    // In a real app, we would parse the STEP file here
    // Since we can't directly render STEP in Three.js, we'd normally:
    // 1. Convert STEP to an intermediate format (like STL) on the server
    // 2. Load the converted file with appropriate loader
    
    // For this demo, let's create a simple geometric shape
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    scene.add(mesh);
    setModel(mesh);
    
    // Reset camera view
    if (camera && controls) {
      camera.position.set(20, 20, 20);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [scene, modelFile, camera, controls]);
  
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
    
    // Reset view to fit model
    camera.position.set(20, 20, 20);
    controls.target.set(0, 0, 0);
    controls.update();
  };
  
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <Skeleton className="w-64 h-64 rounded-lg" />
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
