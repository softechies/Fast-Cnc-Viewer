import * as THREE from 'three';

export function initScene(container: HTMLElement) {
  // Set up scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f9fa);
  
  // Set up camera
  const camera = new THREE.PerspectiveCamera(
    45, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(20, 20, 20);
  camera.lookAt(0, 0, 0);
  
  // Set up renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Bezpiecznie dodaj renderer do kontenera, bez usuwania istniejących elementów
  container.appendChild(renderer.domElement);
  
  return { scene, camera, renderer };
}

export function setupLights(scene: THREE.Scene) {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  // Add directional lights
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(5, 10, 7.5);
  scene.add(dirLight1);
  
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight2.position.set(-5, -10, -7.5);
  scene.add(dirLight2);
  
  return { ambientLight, dirLight1, dirLight2 };
}

export function createGridHelper() {
  const gridHelper = new THREE.GridHelper(50, 50, 0xaaaaaa, 0xe0e0e0);
  return gridHelper;
}

export function createBoundingBox(object: THREE.Object3D) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true,
    opacity: 0.1
  });
  
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  const boundingBoxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  boundingBoxMesh.position.copy(center);
  
  return boundingBoxMesh;
}

export function fitCameraToObject(
  camera: THREE.PerspectiveCamera, 
  object: THREE.Object3D, 
  offset: number = 1.5, 
  controls?: any
) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  // Get the diagonal of the bounding box
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs(maxDim / Math.sin(fov / 2) * offset);
  
  // Move the camera
  const direction = new THREE.Vector3(1, 1, 1).normalize();
  camera.position.copy(center.clone().add(direction.multiplyScalar(cameraZ)));
  camera.lookAt(center);
  
  // Update controls if provided
  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
}
