import * as THREE from 'three';
import { Viewer } from 'three-cad-viewer';

const createDefaultOptions = () => ({
  ambientLight: {
    intensity: 0.8,
    color: 0xffffff
  },
  directLight: {
    intensity: 0.8,
    color: 0xffffff,
    position: [1, 1, 1]
  },
  renderer: {
    antialias: true,
    alpha: true
  },
  loading: {
    showProgress: true
  },
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [5, 5, 5]
  },
  controls: {
    enableDamping: true,
    dampingFactor: 0.1
  }
});

export async function loadSTEPModel(
  content: string,
  onProgress?: (event: ProgressEvent) => void
) {
  // Validate input
  if (!content) {
    throw new Error('STEP content is empty or undefined');
  }

  // Initialize options
  const options = createDefaultOptions();
  if (!options) {
    throw new Error('Failed to create default options');
  }

  // Log options for debugging
  console.log('Options passed to Viewer:', JSON.stringify(options, null, 2));

  // Initialize Viewer
  let viewer: any;
  try {
    // Try full options, minimal options, and empty options
    try {
      console.log('Attempting Viewer with full options');
      viewer = new Viewer(options);
    } catch (error) {
      console.warn('Failed with full options:', error);
      try {
        console.log('Attempting Viewer with minimal options');
        const fallbackOptions = {
          renderer: { antialias: true, alpha: true },
          loading: { showProgress: true }
        };
        viewer = new Viewer(fallbackOptions);
      } catch (error) {
        console.warn('Failed with minimal options:', error);
        console.log('Attempting Viewer with empty options');
        viewer = new Viewer({}); // Try empty options as a last resort
      }
    }
    if (!viewer) {
      throw new Error('Failed to initialize Viewer after all attempts');
    }
    console.log('Viewer initialized:', viewer);
  } catch (error) {
    console.error('Viewer initialization failed:', error);
    // Fallback to a placeholder model
    console.warn('Using placeholder model due to Viewer failure');
    const modelGroup = new THREE.Group();
    const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
    const placeholderMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholderMesh.castShadow = true;
    placeholderMesh.receiveShadow = true;
    modelGroup.add(placeholderMesh);
    const maxDim = 1;
    const scale = 10 / maxDim;

    return {
      model: modelGroup,
      scale,
      material: placeholderMaterial,
      originalDimensions: {
        width: maxDim,
        height: maxDim,
        depth: maxDim
      }
    };
  }

  // Prepare the STEP file data
  const blob = new Blob([content], { type: 'application/step' });

  try {
    // Load the model with progress handling (with defensive check)
    if (onProgress && typeof viewer.on === 'function') {
      viewer.on('progress', onProgress);
    } else if (onProgress) {
      console.warn('Progress event not supported by Viewer');
    }

    const result = await viewer.load(blob);
    if (!result || !result.scene) {
      throw new Error('Failed to load STEP model: No scene returned');
    }

    // Log result for debugging
    console.log('Viewer load result:', result);

    // Process the loaded model
    const modelGroup = new THREE.Group();
    let maxDim = 1;

    result.scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child.clone() as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          metalness: 0.3,
          roughness: 0.6,
          side: THREE.DoubleSide
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        modelGroup.add(mesh);

        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = bbox.getSize(new THREE.Vector3());
        maxDim = Math.max(maxDim, size.x, size.y, size.z);
      }
    });

    // Scale the model appropriately
    const targetSize = 10;
    const scale = maxDim > 0 ? targetSize / maxDim : 1; // Prevent division by zero
    modelGroup.scale.set(scale, scale, scale);

    // Return result
    return {
      model: modelGroup,
      scale,
      material: (modelGroup.children[0] instanceof THREE.Mesh
        ? modelGroup.children[0].material
        : new THREE.MeshStandardMaterial({ color: 0x3b82f6 })),
      originalDimensions: {
        width: maxDim,
        height: maxDim,
        depth: maxDim
      }
    };
  } catch (error: any) {
    console.error('STEP loading failed:', error);
    throw new Error(`STEP loading failed: ${error.message}`);
  }
}