declare module 'three-cad-viewer' {
  import * as THREE from 'three';

  export class Viewer {
    constructor(options?: any);
    load(data: Blob | ArrayBuffer): Promise<{
      scene: THREE.Group;
      parts: Array<{
        geometry: THREE.BufferGeometry;
        material?: THREE.Material;
      }>;
    }>;
    // Add other methods you use
  }

  // Export other types you need
  export interface CadLoader {
    new (): any;
    load(blob: Blob): Promise<any>;
  }
}