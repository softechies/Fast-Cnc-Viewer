import * as THREE from 'three';

export function initScene(container: HTMLElement) {
  // Print container dimensions to debug
  console.log("Container dimensions:", {
    width: container.clientWidth,
    height: container.clientHeight,
    offsetWidth: container.offsetWidth,
    offsetHeight: container.offsetHeight
  });
  
  // Check for zero dimensions
  if (container.clientWidth <= 0 || container.clientHeight <= 0) {
    console.error("Container has zero dimensions, using default values");
  }
  
  // Set up scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f9fa);
  
  // Set up camera
  const camera = new THREE.PerspectiveCamera(
    45, 
    // Use sensible defaults if container dimensions are zero
    (container.clientWidth || 800) / (container.clientHeight || 600), 
    0.1, 
    2000
  );
  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);
  
  // Ensure container is ready to receive a canvas
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  // Set up renderer with optimal settings
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  
  // Use default reasonable dimensions if container sizes are invalid
  renderer.setSize(
    container.clientWidth > 0 ? container.clientWidth : 800,
    container.clientHeight > 0 ? container.clientHeight : 600
  );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  
  // Make the canvas visible with a background color
  renderer.domElement.style.background = "#f0f0f0";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  
  // Add renderer to container
  container.appendChild(renderer.domElement);
  
  // Create reference cube to verify scene is working
  const testCube = new THREE.Mesh(
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  testCube.position.set(0, 2.5, 0);
  testCube.name = "ReferenceBox";
  scene.add(testCube);
  
  // Axes helper for orientation
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
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Add directional lights with shadows
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(5, 10, 7.5);
  dirLight1.castShadow = true;
  dirLight1.shadow.mapSize.width = 1024;
  dirLight1.shadow.mapSize.height = 1024;
  scene.add(dirLight1);
  
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight2.position.set(-5, -10, -7.5);
  scene.add(dirLight2);
  
  // Add a point light near the origin for more illumination
  const pointLight = new THREE.PointLight(0xffffff, 0.3);
  pointLight.position.set(0, 5, 0);
  scene.add(pointLight);
  
  return { ambientLight, dirLight1, dirLight2, pointLight };
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
