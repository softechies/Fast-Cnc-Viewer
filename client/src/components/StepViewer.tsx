import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Ruler, Camera } from 'lucide-react';
import { loadSTLModel } from '@/lib/step-parser';
import { Toggle } from '@/components/ui/toggle';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Interface for STL File Information
interface StlFileInfo {
  url: string;
  isDirectStl?: boolean;
}

// Props for the StepViewer component
interface StepViewerProps {
  modelId: number | null;
  isPublic?: boolean;
  publicId?: string;
}

// Component for viewing STL models
export default function StepViewer({ modelId, isPublic, publicId }: StepViewerProps) {
  // Get translation function
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Refs for Three.js elements
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileContentRef = useRef<string | null>(null);
  
  // State for file data and loading status
  const [fileData, setFileData] = useState<File | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [stlFileInfo, setStlFileInfo] = useState<StlFileInfo | null>(null);
  const [isLoadingStlFile, setIsLoadingStlFile] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Initializing...");
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  
  // We only use STL rendering (no STEP)
  const renderMode = 'stl_only' as const;
  
  // State for model dimension information
  type ModelDimensions = {
    width: number; // X
    height: number; // Z
    depth: number; // Y
    scale: number; // Scaling factor used for rendering
    size?: number; // Diagonal size (optional)
  };
  const [modelDimensions, setModelDimensions] = useState<ModelDimensions | null>(null);
  
  // State for measurement mode
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  
  // Funkcja do obsługi kliknięć w trybie pomiaru
  const handleMeasureClick = (event: MouseEvent) => {
    if (!measureMode || !containerRef.current || !sceneRef.current || !cameraRef.current) return;
    
    // Oblicz pozycję myszy w przestrzeni znormalizowanej (od -1 do 1)
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
    const y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
    
    // Utwórz raycaster
    const raycaster = new THREE.Raycaster();
    const mousePosition = new THREE.Vector2(x, y);
    raycaster.setFromCamera(mousePosition, cameraRef.current);
    
    // Pobierz model z sceny
    const model = sceneRef.current.getObjectByName("StepModel");
    if (!model) return;
    
    // Sprawdź przecięcie promienia z modelem
    const intersects = raycaster.intersectObjects(model.children, true);
    if (intersects.length > 0) {
      const intersectionPoint = intersects[0].point;
      
      // Dodaj punkt do listy punktów pomiaru
      setMeasurePoints(prev => {
        // Jeśli mamy już 2 punkty, zacznij od nowa
        if (prev.length === 2) {
          // Usuń linię pomiaru jeśli istnieje
          const measureLine = sceneRef.current?.getObjectByName("MeasureLine");
          if (measureLine) {
            sceneRef.current?.remove(measureLine);
          }
          
          // Dodaj punkt do pustej tablicy
          return [intersectionPoint];
        }
        
        // Dodaj punkt do tablicy (pierwszy lub drugi punkt)
        return [...prev, intersectionPoint];
      });
      
      // Stworz wizualną reprezentację punktu
      createMeasurePoint(intersectionPoint);
      
      // Jeśli to drugi punkt, narysuj linię między punktami i oblicz odległość
      if (measurePoints.length === 1) {
        const distance = measurePoints[0].distanceTo(intersectionPoint);
        setMeasureDistance(distance);
        createMeasureLine(measurePoints[0], intersectionPoint, distance);
      }
    }
  };
  
  // Funkcja do tworzenia wizualnej reprezentacji punktu pomiarowego
  const createMeasurePoint = (position: THREE.Vector3) => {
    if (!sceneRef.current) return;
    
    // Usuń istniejący punkt o tej samej nazwie, jeśli istnieje
    const pointId = `MeasurePoint_${measurePoints.length}`;
    const existingPoint = sceneRef.current.getObjectByName(pointId);
    if (existingPoint) {
      sceneRef.current.remove(existingPoint);
    }
    
    // Stwórz grupę dla punktu z wyróżnieniem
    const pointGroup = new THREE.Group();
    pointGroup.name = pointId;
    
    // Stwórz geometrię i materiał dla punktu - mniejszy dla lepszej precyzji
    const pointGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    
    // Stwórz "halo" wokół punktu dla lepszej widoczności
    const haloGeometry = new THREE.SphereGeometry(0.07, 16, 16);
    const haloMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5 
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    
    // Ustaw pozycję punktu i halo
    pointMesh.position.copy(position);
    haloMesh.position.copy(position);
    
    // Dodaj punkt i halo do grupy
    pointGroup.add(pointMesh);
    pointGroup.add(haloMesh);
    
    // Dodaj współrzędne jako tekst przy punkcie
    const coords = `(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;
    console.log(`Dodano punkt pomiarowy: ${coords}`);
    
    // Dodaj punkt do sceny
    sceneRef.current.add(pointGroup);
  };
  
  // Funkcja do tworzenia linii pomiarowej i etykiety z odległością
  const createMeasureLine = (start: THREE.Vector3, end: THREE.Vector3, distance: number) => {
    if (!sceneRef.current || !cameraRef.current) return;
    
    // Usuń istniejącą linię jeśli istnieje
    const existingLine = sceneRef.current.getObjectByName("MeasureLine");
    if (existingLine) {
      sceneRef.current.remove(existingLine);
    }
    
    // Stwórz grupę dla linii i etykiety
    const lineGroup = new THREE.Group();
    lineGroup.name = "MeasureLine";
    
    // Stwórz materiał dla linii - przerywana linia dla lepszej widoczności
    const lineMaterial = new THREE.LineDashedMaterial({ 
      color: 0xff0000,
      dashSize: 0.1,
      gapSize: 0.05,
      linewidth: 2
    });
    
    // Stwórz geometrię dla linii
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances(); // Wymagane dla LineDashedMaterial
    
    // Dodaj linię do grupy
    lineGroup.add(line);
    
    // Oblicz środek linii dla umieszczenia etykiety
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    // Stwórz stożki na końcach linii jako strzałki
    const coneLength = 0.1;
    const coneRadius = 0.04;
    const coneGeometry = new THREE.ConeGeometry(coneRadius, coneLength, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    // Stożek na początku linii
    const startCone = new THREE.Mesh(coneGeometry, coneMaterial);
    startCone.position.copy(start);
    // Ustaw orientację stożka w kierunku końca linii
    startCone.lookAt(end);
    startCone.rotateX(Math.PI / 2); // Obróć stożek aby wskazywał we właściwym kierunku
    
    // Stożek na końcu linii
    const endCone = new THREE.Mesh(coneGeometry, coneMaterial);
    endCone.position.copy(end);
    // Ustaw orientację stożka w kierunku początku linii
    endCone.lookAt(start);
    endCone.rotateX(Math.PI / 2); // Obróć stożek aby wskazywał we właściwym kierunku
    
    // Dodaj stożki do grupy
    lineGroup.add(startCone);
    lineGroup.add(endCone);
    
    // Stwórz etykietę z odległością która zawsze patrzy na kamerę
    // Zaokrąglij odległość do 2 miejsc po przecinku dla dużych wartości
    // i do 3 miejsc po przecinku dla małych wartości
    const distanceText = distance >= 1 
      ? `${distance.toFixed(2)} ${t('measurement.units')}` 
      : `${distance.toFixed(3)} ${t('measurement.units')}`;
    
    // Użyj canvas do stworzenia tekstury z etykietą
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.strokeStyle = 'white';
      context.lineWidth = 2;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      
      context.font = 'bold 36px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = 'white';
      context.fillText(distanceText, canvas.width / 2, canvas.height / 2);
      
      // Stwórz teksturę z canvas
      const texture = new THREE.CanvasTexture(canvas);
      
      // Stwórz materiał z teksturą
      const labelMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      
      // Stwórz sprite z materiałem
      const label = new THREE.Sprite(labelMaterial);
      label.position.copy(midPoint);
      
      // Dostosuj rozmiar etykiety
      label.scale.set(1, 0.5, 1);
      
      // Dodaj etykietę do grupy
      lineGroup.add(label);
    }
    
    // Dodaj grupę do sceny
    sceneRef.current.add(lineGroup);
    
    console.log(`Narysowano linię pomiarową o długości: ${distance.toFixed(3)} jednostek`);
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Create animation loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    console.log("Initializing Three.js scene");
    setDebugInfo("Scene ready");
    
    // Dodaj osie pomocnicze - ukryte domyślnie
    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.y = -0.1; // Move slightly down so it doesn't cover the model
    axesHelper.visible = false; // Hidden by default
    axesHelper.name = "AxesHelper";
    scene.add(axesHelper);
    
    // Helper grid was removed as it interfered with model viewing
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Update camera
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
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
      }
      
      rendererRef.current?.dispose();
    };
  }, []);
  
  // Load model file when modelId changes
  useEffect(() => {
    if (!modelId) {
      setFileData(null);
      setStlFileInfo(null);
      setDebugInfo("No model selected");
      return;
    }
    
    const loadFile = async () => {
      try {
        setIsLoadingFile(true);
        setDebugInfo("Loading model information...");
        
        // Najpierw pobierz informacje o modelu - użyj odpowiedniego endpointu
        const modelEndpoint = isPublic && publicId 
          ? `/api/public/models/${publicId}` 
          : `/api/models/${modelId}`;
        
        const modelResponse = await fetch(modelEndpoint);
        if (!modelResponse.ok) {
          const errorData = await modelResponse.json();
          console.error("Model info error:", errorData);
          throw new Error(`Cannot retrieve model information (${modelResponse.status}): ${errorData.message || ''}`);
        }
        
        const modelInfo = await modelResponse.json();
        console.log("Model info loaded:", modelInfo);
        
        setDebugInfo("Loading model file...");
        
        // Następnie spróbuj pobrać plik - użyj odpowiedniego endpointu
        const fileEndpoint = isPublic && publicId 
          ? `/api/public/models/${publicId}/file` 
          : `/api/models/${modelId}/file`;
        const response = await fetch(fileEndpoint);
        if (!response.ok) {
          throw new Error(`Cannot download file (${response.status})`);
        }
        
        const blob = await response.blob();
        const filename = modelInfo.filename || `model-${modelId}.step`;
        const file = new File([blob], filename, { type: 'application/step' });
        
        setFileData(file);
        
        // Sprawdź, czy model jest bezpośrednio w formacie STL
        const isDirectStl = modelInfo.format?.toLowerCase() === 'stl';
        
        if (isDirectStl) {
          setDebugInfo("Direct STL file...");
          setStlFileInfo({ 
            url: fileEndpoint, // Użyj tego samego endpointu co dla pliku
            isDirectStl: true 
          });
        } else {
          // Try to get STL file if available (only for converted models)
          try {
            setIsLoadingStlFile(true);
            setDebugInfo("Checking STL file availability...");
            
            // Dla publicznych modeli nie mamy endpointu /stl, więc pomiń to
            if (isPublic) {
              setDebugInfo("Public model - using original file...");
              setStlFileInfo({ 
                url: fileEndpoint,
                isDirectStl: false 
              });
              return;
            }
            
            const stlResponse = await fetch(`/api/models/${modelId}/stl`);
            if (stlResponse.ok) {
              // STL available
              setStlFileInfo({ 
                url: `/api/models/${modelId}/stl`, 
                isDirectStl: false 
              });
              setDebugInfo("STL file available");
            } else {
              // No STL available
              setStlFileInfo(null);
              console.error("STL file not available:", await stlResponse.json());
              setDebugInfo("No STL file for this model");
            }
          } catch (stlError) {
            setStlFileInfo(null);
            console.error("Error checking STL availability:", stlError);
            setDebugInfo("Error checking STL file");
          } finally {
            setIsLoadingStlFile(false);
          }
        }
      } catch (error) {
        console.error("Error loading model file:", error);
        setDebugInfo(`Model loading error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setFileData(null);
      } finally {
        setIsLoadingFile(false);
      }
    };
    
    loadFile();
  }, [modelId]);
  
  // Render model using Three.js - tylko obsługa STL
  async function renderModel(content: string) {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    try {
      // Remove any existing model
      const existingModel = sceneRef.current.getObjectByName("StepModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }
      
      // Funkcja pomocnicza do postępu ładowania
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setDebugInfo(`Loading: ${percent}%`);
        }
      };
      
      // Sprawdź czy dostępny jest plik STL
      if (stlFileInfo?.url) {
        try {
          setDebugInfo(`Loading STL model... ${stlFileInfo.isDirectStl ? '(direct upload)' : '(converted)'}`);
          
          // Użyj nowego interfejsu STLLoadResult, który zwraca model, skalę i oryginalne wymiary
          const stlLoadResult = await loadSTLModel(stlFileInfo.url, onProgress);
          const modelGroup = stlLoadResult.model;
          const scale = stlLoadResult.scale;
          
          console.log("STL loaded successfully");
          
          if (stlLoadResult.originalDimensions) {
            console.log("Original model dimensions:", stlLoadResult.originalDimensions);
            
            // Ustawiamy wymiary modelu używając oryginalnych wymiarów z wyniku ładowania
            setModelDimensions({
              width: stlLoadResult.originalDimensions.width,
              height: stlLoadResult.originalDimensions.height,
              depth: stlLoadResult.originalDimensions.depth,
              size: Math.sqrt(
                Math.pow(stlLoadResult.originalDimensions.width, 2) + 
                Math.pow(stlLoadResult.originalDimensions.height, 2) + 
                Math.pow(stlLoadResult.originalDimensions.depth, 2)
              ),
              scale: scale
            });
          }
          
          setDebugInfo("STL model loaded successfully");
          
          // Ustaw nazwę modelu i dodaj do sceny
          modelGroup.name = "StepModel";
          sceneRef.current.add(modelGroup);
          
          // Dopasuj kamerę do modelu, ale nie używaj funkcji fitCameraToObject, która nadpisuje wymiary
          if (cameraRef.current && controlsRef.current) {
            // Uzyskaj środek modelu dla kamery
            const boundingBox = new THREE.Box3().setFromObject(modelGroup);
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            
            // Ustaw kamerę w odpowiedniej odległości
            cameraRef.current.position.set(
              center.x + 20, 
              center.y + 20, 
              center.z + 20
            );
            cameraRef.current.lookAt(center);
            
            // Aktualizuj kontrolki orbity
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
            
            console.log("Kamera ustawiona bez nadpisywania wymiarów");
          }
          
          setDebugInfo(`Model loaded (format: STL)`);
          return;
        } catch (error) {
          console.error("Error loading STL model:", error);
          setDebugInfo(`STL loading error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Jeśli nie ma STL, wyświetl informację
        setDebugInfo("This file format is not supported. Only STL files are supported.");
        
        // Dodaj prosty placeholder informacyjny
        const infoGroup = new THREE.Group();
        infoGroup.name = "StepModel";
        
        // Dodaj prosty wskaźnik informacyjny
        const infoGeometry = new THREE.PlaneGeometry(10, 5);
        const infoMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xe0e0e0, 
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const infoPlane = new THREE.Mesh(infoGeometry, infoMaterial);
        infoPlane.rotation.x = Math.PI / 2;
        infoPlane.position.y = 0.5;
        infoGroup.add(infoPlane);
        
        // Dodaj osie pomocnicze
        const axesHelper = new THREE.AxesHelper(5);
        infoGroup.add(axesHelper);
        
        // Dodaj do sceny
        sceneRef.current.add(infoGroup);
        
        // Ustaw kamerę
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    } catch (error) {
      console.error("Model rendering error:", error);
      setDebugInfo(`Rendering error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // W przypadku całkowitego błędu, spróbuj wyświetlić cokolwiek
      try {
        if (!sceneRef.current) return;
        
        const errorModel = new THREE.Group();
        errorModel.name = "StepModel";
        
        // Dodaj marker błędu
        const errorGeometry = new THREE.BoxGeometry(3, 3, 3);
        const errorMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xff3333,
          wireframe: true
        });
        errorModel.add(new THREE.Mesh(errorGeometry, errorMaterial));
        
        // Dodaj tekst błędu (markery)
        const axesHelper = new THREE.AxesHelper(5);
        errorModel.add(axesHelper);
        
        // Dodaj model do sceny
        sceneRef.current.add(errorModel);
        
        // Dopasuj kamerę
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          cameraRef.current.lookAt(0, 0, 0);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      } catch (fallbackError) {
        console.error("Even displaying the error model failed:", fallbackError);
      }
    }
  }
  
  // Effect to handle clicks in measurement mode
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleClick = (event: MouseEvent) => {
      handleMeasureClick(event);
    };
    
    // Add or remove click handling depending on measurement mode
    if (measureMode) {
      containerRef.current.addEventListener('click', handleClick);
    }
    
    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [measureMode, measurePoints]);
  
  // Effect to clear measurement points when disabling measurement mode
  useEffect(() => {
    if (!measureMode && sceneRef.current) {
      // Remove measurement points
      for (let i = 0; i < 2; i++) {
        const point = sceneRef.current.getObjectByName(`MeasurePoint_${i}`);
        if (point) {
          sceneRef.current.remove(point);
        }
      }
      
      // Remove measurement line
      const measureLine = sceneRef.current.getObjectByName("MeasureLine");
      if (measureLine) {
        sceneRef.current.remove(measureLine);
      }
      
      // Reset state
      setMeasurePoints([]);
      setMeasureDistance(null);
    }
  }, [measureMode]);

  // Process model file when it's available
  useEffect(() => {
    if (!fileData || !sceneRef.current) return;
    
    // Load model from file
    const loadModel = async () => {
      try {
        setDebugInfo("Processing model...");
        
        // Read file as text
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (!event.target || !event.target.result || !sceneRef.current) {
            setDebugInfo("File reading error");
            return;
          }
          
          try {
            // Store content for later use
            const fileContent = event.target.result as string;
            fileContentRef.current = fileContent;
            
            // Render the model
            renderModel(fileContent);
            
          } catch (error) {
            console.error("Error processing model:", error);
            setDebugInfo(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        };
        
        reader.onerror = () => {
          setDebugInfo("File reading error");
        };
        
        // Start reading
        reader.readAsText(fileData);
        
      } catch (error) {
        console.error("Error loading model:", error);
        setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    loadModel();
    
    // Cleanup previous model when modelId changes
    return () => {
      if (sceneRef.current) {
        const model = sceneRef.current.getObjectByName("StepModel");
        if (model) {
          sceneRef.current.remove(model);
        }
      }
      // Clear stored content
      fileContentRef.current = null;
    };
  }, [fileData, renderMode, stlFileInfo]);
  
  // Helper function to create a simple model representation (without unnecessary cubes)
  function createSimpleModelRepresentation(complexity: number) {
    const group = new THREE.Group();
    
    // Add only informational elements, without unnecessary boxes
    
    // Add an information plane
    const infoPlaneGeometry = new THREE.PlaneGeometry(8, 4);
    const infoPlaneMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf0f0f0, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const infoPlane = new THREE.Mesh(infoPlaneGeometry, infoPlaneMaterial);
    infoPlane.rotation.x = Math.PI / 2;
    infoPlane.position.y = 0.5;
    group.add(infoPlane);
    
    // Add helper axes
    const axesHelper = new THREE.AxesHelper(5);
    group.add(axesHelper);
    
    return group;
  }
  
  // Model refresh function - re-rendering
  const refreshModel = () => {
    if (!fileContentRef.current || !sceneRef.current) {
      setDebugInfo("No data for re-rendering");
      return;
    }
    
    setDebugInfo("Refreshing model...");
    
    // Call renderModel with previously saved file content
    renderModel(fileContentRef.current);
  };

  // Helper function to fit camera to object
  // Function for calculating and setting model dimensions
  function calculateModelDimensions(object: THREE.Object3D, currentScaleFactor: number = 1.0) {
    // Create bounding box for the model
    const boundingBox = new THREE.Box3().setFromObject(object);
    const threeSize = new THREE.Vector3();
    boundingBox.getSize(threeSize);
    
    // Reverse scaling to get real model dimensions
    const realSize = {
      x: threeSize.x / currentScaleFactor,
      y: threeSize.y / currentScaleFactor,
      z: threeSize.z / currentScaleFactor
    };
    
    // Set model dimensions as real dimensions, not scaled
    // In CAD standard, height is Z axis, and depth is Y axis
    setModelDimensions({
      width: realSize.x,  // Real X dimension - width
      depth: realSize.y,  // Real Y dimension - depth
      height: realSize.z, // Real Z dimension - height
      scale: currentScaleFactor // Scaling factor used for rendering
    });
    
    // Return bounding box and threejs dimensions vector for camera calculations
    return { boundingBox, threeSize: threeSize };
  }

  // This function is no longer used, but we keep it for compatibility
  // Instead, we use a simpler version of camera setup in renderModel
  function fitCameraToObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    // Calculate model dimensions and get bounding box (without considering scaling)
    const boundingBox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    // Get bounding box center
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Get the max side of the bounding box
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    
    // Apply a factor for better fit
    cameraDistance *= 1.5;
    
    // Move camera to look at center
    camera.position.set(
      center.x + cameraDistance,
      center.y + cameraDistance,
      center.z + cameraDistance
    );
    camera.lookAt(center);
    
    // Update orbit controls target
    controls.target.copy(center);
    controls.update();
    
    // Apply scaling for small or large models
    let scaleFactor = 1.0;
    const maxSide = Math.max(size.x, size.y, size.z);
    
    if (maxSide > 50) {
      // Very large model, scale down
      scaleFactor = 10.0 / maxSide;
      console.log("Very large model, reducing scale:", scaleFactor);
    } else if (maxSide < 0.1) {
      // Very small model, scale up
      scaleFactor = 5.0 / maxSide;
      console.log("Very small model, increasing scale:", scaleFactor);
    } else if (maxSide < 5) {
      // Small model but not tiny, scale up a bit
      scaleFactor = 10 / maxSide;
      console.log("Normal model, applying standard scale:", scaleFactor);
    }
    
    // Apply scaling to the model
    object.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Update controls after scaling
    controls.update();
  }

  // Funkcja do przechwytywania screenshotu z przeglądarki 3D
  const captureScreenshot = async () => {
    if (!rendererRef.current || !modelId || isPublic) {
      toast({
        title: t('error'),
        description: 'Cannot capture screenshot - renderer not available or model is public',
        variant: "destructive",
      });
      return;
    }

    setIsCapturingScreenshot(true);

    try {
      // Renderuj aktualną scenę
      if (sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Pobierz canvas jako blob
      const canvas = rendererRef.current.domElement;
      
      // Konwertuj canvas do blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 0.9);
      });

      // Przygotuj formData do wysłania
      const formData = new FormData();
      formData.append('thumbnail', blob, 'screenshot.png');

      // Wyślij screenshot jako nową miniaturkę
      const response = await fetch(`/api/models/${modelId}/thumbnail`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot');
      }

      toast({
        title: t('success'),
        description: t('screenshot_captured_successfully'),
      });

      // Powiadom inne komponenty o aktualizacji miniaturki
      window.dispatchEvent(new CustomEvent(`thumbnail-updated-${modelId}`));

    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: t('error'),
        description: t('screenshot_capture_failed'),
        variant: "destructive",
      });
    } finally {
      setIsCapturingScreenshot(false);
    }
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Debug info */}
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs p-1 rounded">
        {debugInfo}
      </div>
      
      {/* Controls overlay */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshModel}
          className="bg-black/50 text-white hover:bg-black/70 border-none p-2"
          title="Refresh model"
        >
          <RefreshCw className="h-6 w-6" />
        </Button>
        <Toggle
          aria-label="Measurement mode"
          pressed={measureMode}
          onPressedChange={setMeasureMode}
          className={`p-2 ${measureMode ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'} border-none`}
          title="Toggle measurement mode"
        >
          <Ruler className="h-6 w-6" />
        </Toggle>
      </div>
      
      {/* Measurement info */}
      {measureMode && (
        <div className="absolute top-12 left-2 z-10 bg-black/70 text-white p-2 rounded max-w-xs">
          <div className="font-bold mb-1 flex items-center">
            <Ruler className="h-4 w-4 mr-2" /> 
            {t('measurement.mode')}
          </div>
          <div className="text-xs mb-2">
            {t('measurement.instructions')}
          </div>
          {measurePoints.length > 0 && (
            <div className="text-xs">
              {t('measurement.points')}: {measurePoints.length}/2
            </div>
          )}
          {measureDistance !== null && (
            <div className="mt-1 p-1 bg-blue-900/50 rounded text-center">
              <span className="font-bold">{t('measurement.distance')}:</span> {measureDistance.toFixed(3)} {t('measurement.units')}
            </div>
          )}
        </div>
      )}
      
      {/* Loading overlay */}
      {(isLoadingFile || isLoadingStlFile) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <div className="bg-white p-4 rounded shadow-md">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
            <div className="text-sm mt-2">Loading model...</div>
          </div>
        </div>
      )}
      
      {/* Three.js container */}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] bg-gray-100"
        style={{ minHeight: '500px' }}
      />
      
      {/* Mode info and dimensions */}
      <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded flex flex-col gap-1">
        {stlFileInfo ? (
          <>
            <div className="flex items-center gap-2 mt-1">
              Format: 
              <Badge variant="outline" className="bg-green-900/50">
                STL
              </Badge>
            </div>
            
            {/* Model dimensions section */}
            {modelDimensions && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div className="font-bold mb-1">{t('dimensions.title')}:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{t('dimensions.width')} (X):</span>
                    <span className="font-mono">{modelDimensions.width.toFixed(2)} mm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{t('dimensions.depth')} (Y):</span>
                    <span className="font-mono">{modelDimensions.depth.toFixed(2)} mm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{t('dimensions.height')} (Z):</span>
                    <span className="font-mono">{modelDimensions.height.toFixed(2)} mm</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-gray-300 text-xs">
              <Badge variant="outline" className="bg-red-700/50">
                Unsupported format
              </Badge>
            </div>
            <div className="text-gray-300 text-xs italic">
              Only STL files are supported
            </div>
          </div>
        )}
      </div>
    </div>
  );
}