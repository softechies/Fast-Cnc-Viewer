import * as THREE from 'three';

export function initScene(container: HTMLElement) {
  // Force container to have explicit dimensions & styling to ensure it's visible
  container.style.width = "100%";
  container.style.height = "400px";
  container.style.minHeight = "400px";
  container.style.position = "relative";
  container.style.backgroundColor = "#f0f0f0";
  container.style.display = "block";
  
  // Print container dimensions to debug
  console.log("Container dimensions:", {
    width: container.clientWidth,
    height: container.clientHeight,
    offsetWidth: container.offsetWidth,
    offsetHeight: container.offsetHeight,
    style: {
      width: container.style.width,
      height: container.style.height
    }
  });
  
  // Ensure container is empty before adding renderer
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  // Set up scene with lighter background
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Use fixed sensible dimensions rather than relying on container
  // This prevents bugs with zero dimensions
  const width = Math.max(container.clientWidth, 400);
  const height = Math.max(container.clientHeight, 400);
  
  // Set up camera with fixed aspect ratio
  const camera = new THREE.PerspectiveCamera(
    65, // Increased FOV for better visibility
    width / height, 
    0.1, 
    2000
  );
  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);
  
  // Set up renderer with the most compatible settings
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  
  // Use explicit dimensions
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1); // Better for HiDPI but limit for performance
  
  // Enable shadows with better quality
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Set better rendering quality
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  // Make the canvas element explicitly visible with styling
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.background = "#f0f0f0";
  canvas.style.borderRadius = "4px";
  
  // Add renderer to container
  container.appendChild(canvas);
  
  // Create test object - a simple red box - to verify rendering works
  const testGeometry = new THREE.BoxGeometry(5, 5, 5);
  const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const testCube = new THREE.Mesh(testGeometry, testMaterial);
  testCube.position.set(0, 2.5, 0);
  testCube.name = "ReferenceBox";
  scene.add(testCube);
  
  // Add wireframe to the test cube
  const wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(testGeometry),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  testCube.add(wireframe);
  
  // Add grid and axes
  const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
  gridHelper.position.y = -0.01; // Slight offset to avoid z-fighting
  scene.add(gridHelper);
  
  const axesHelper = new THREE.AxesHelper(10);
  scene.add(axesHelper);
  
  // Debug output about the created canvas
  console.log("Renderer canvas:", {
    width: renderer.domElement.width,
    height: renderer.domElement.height,
    style: {
      width: renderer.domElement.style.width,
      height: renderer.domElement.style.height
    }
  });
  
  return { scene, camera, renderer };
}

export function setupLights(scene: THREE.Scene) {
  // Add ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  // Key light (main directional light)
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(5, 10, 7.5);
  keyLight.castShadow = true;
  
  // Improve shadow quality
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.bias = -0.0001;
  
  // Set shadow camera frustum to cover scene better
  const shadowSize = 15;
  keyLight.shadow.camera.left = -shadowSize;
  keyLight.shadow.camera.right = shadowSize;
  keyLight.shadow.camera.top = shadowSize;
  keyLight.shadow.camera.bottom = -shadowSize;
  
  scene.add(keyLight);
  
  // Fill light (softer, from another direction)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-10, 5, -5);
  fillLight.castShadow = false; // Only use shadows from key light for performance
  scene.add(fillLight);
  
  // Back light to highlight edges
  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(0, 8, -12);
  scene.add(backLight);
  
  // Small point light near center for highlighting
  const centerLight = new THREE.PointLight(0xffffff, 0.3, 10);
  centerLight.position.set(0, 5, 0);
  scene.add(centerLight);
  
  // Create a helper to visualize light direction
  // const helper = new THREE.DirectionalLightHelper(keyLight, 5);
  // scene.add(helper);
  
  return { ambientLight, keyLight, fillLight, backLight, centerLight };
}

export function createGridHelper() {
  const gridHelper = new THREE.GridHelper(50, 50, 0xaaaaaa, 0xe0e0e0);
  gridHelper.position.y = -0.01; // Slight offset to prevent z-fighting
  return gridHelper;
}

export function createBoundingBox(object: THREE.Object3D) {
  try {
    const boundingBox = new THREE.Box3().setFromObject(object);
    
    // Check if bounding box is valid
    if (boundingBox.isEmpty()) {
      console.warn("Cannot create bounding box - object has no geometry or is empty");
      return null;
    }
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const boundingBoxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boundingBoxMesh.position.copy(center);
    boundingBoxMesh.name = "BoundingBox";
    
    return boundingBoxMesh;
  } catch (error) {
    console.error("Error creating bounding box:", error);
    return null;
  }
}

export function fitCameraToObject(
  camera: THREE.PerspectiveCamera, 
  object: THREE.Object3D, 
  offset: number = 1.5, 
  controls?: any
) {
  try {
    // Create bounding box
    const boundingBox = new THREE.Box3().setFromObject(object);
    
    // Handle empty bounding box
    if (boundingBox.isEmpty()) {
      console.warn("Object has empty bounding box, using default camera position");
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
      
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }
      
      return;
    }
    
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    console.log("Object bounds:", {
      center: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z]
    });
    
    // Get the max dimension of the bounding box
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    
    // Calculate camera distance using tangent (better for perspective)
    let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
    cameraZ *= offset; // Apply offset for better view
    
    // Move the camera to view the object
    const direction = new THREE.Vector3(1, 0.7, 1).normalize();
    camera.position.copy(center.clone().add(direction.multiplyScalar(cameraZ)));
    camera.lookAt(center);
    
    // Update near and far planes based on object size
    camera.near = cameraZ / 100;
    camera.far = cameraZ * 100;
    camera.updateProjectionMatrix();
    
    // Update controls if provided
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
    
    console.log("Camera position after fit:", {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: controls ? [controls.target.x, controls.target.y, controls.target.z] : [center.x, center.y, center.z],
      distance: cameraZ
    });
  } catch (error) {
    console.error("Error fitting camera to object:", error);
    // Use default position as fallback
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }
}
