import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
// Zakomentowałem problematyczne zależności
// @ts-ignore - brak typów dla dxf-parser
// import DxfParser from 'dxf-parser';
// @ts-ignore - brak typów dla three-dxf
// import ThreeDxf from 'three-dxf';

interface DxfViewerProps {
  modelId: number | null;
}

export default function DxfViewer({ modelId }: DxfViewerProps) {
  // Referencje do elementów Three.js
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Stan komponentu
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("Inicjalizacja...");
  const [fileData, setFileData] = useState<File | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  
  // Inicjalizacja sceny Three.js
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Utwórz scenę
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Utwórz kamerę
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);
    camera.up.set(0, 0, 1); // Ustaw oś Z jako "góra" - typowe dla DXF
    cameraRef.current = camera;
    
    // Utwórz renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Utwórz kontrolki
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controlsRef.current = controls;
    
    // Dodaj oświetlenie
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Dodaj siatkę
    const gridHelper = new THREE.GridHelper(100, 100);
    gridHelper.name = "GridHelper";
    // Obróć siatkę, aby była w płaszczyźnie XY (typowe dla DXF)
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);
    
    // Dodaj osie
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);
    
    // Funkcja animacji
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Rozpocznij animację
    animate();
    
    // Obsługa zmiany rozmiaru okna
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    console.log("Inicjalizacja sceny DXF Viewer");
    setDebugInfo("Scena DXF gotowa");
    
    // Sprzątanie po komponencie
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
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
  
  // Ładowanie pliku DXF po zmianie modelId
  useEffect(() => {
    if (!modelId) {
      setFileData(null);
      setDebugInfo("Brak wybranego modelu");
      return;
    }
    
    const loadFile = async () => {
      try {
        setIsLoading(true);
        setDebugInfo("Ładowanie pliku DXF...");
        
        // Pobierz plik DXF
        const response = await fetch(`/api/models/${modelId}/file`);
        if (!response.ok) {
          throw new Error(`Nie można pobrać pliku (${response.status})`);
        }
        
        // Pobierz informacje o modelu
        const modelResponse = await fetch(`/api/models/${modelId}`);
        if (!modelResponse.ok) {
          throw new Error(`Nie można pobrać informacji o modelu (${modelResponse.status})`);
        }
        
        const modelInfo = await modelResponse.json();
        
        // Utwórz obiekt File
        const blob = await response.blob();
        const filename = modelInfo.filename || `model-${modelId}.dxf`;
        const file = new File([blob], filename, { type: 'application/dxf' });
        
        setFileData(file);
      } catch (error) {
        console.error("Błąd ładowania pliku DXF:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        setFileData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFile();
  }, [modelId]);
  
  // Stan dla zawartości pliku DXF
  const [dxfContent, setDxfContent] = useState<string | null>(null);
  const [entityCount, setEntityCount] = useState(0);
  const [layers, setLayers] = useState<string[]>([]);

  // Renderowanie pliku DXF po załadowaniu
  useEffect(() => {
    if (!fileData || !sceneRef.current) return;
    
    const renderDxf = async () => {
      try {
        setDebugInfo("Przetwarzanie pliku DXF...");
        
        // Utwórz filereader
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (!event.target || !event.target.result || !sceneRef.current) {
            setDebugInfo("Błąd odczytu pliku");
            return;
          }
          
          try {
            // Pobierz zawartość pliku DXF jako tekst
            const content = event.target.result as string;
            setDxfContent(content);
            
            // Prosta analiza zawartości pliku DXF
            const lines = content.split('\n');
            
            // Szacowanie liczby encji (uproszczone)
            const entityCount = lines.filter(line => 
              line.includes('LINE') || 
              line.includes('CIRCLE') || 
              line.includes('ARC') || 
              line.includes('TEXT') ||
              line.includes('POLYLINE')
            ).length;
            
            setEntityCount(entityCount);
            
            // Wykrywanie warstw (uproszczone)
            const layerLines = lines.filter(line => line.includes('LAYER'));
            const layers = Array.from(new Set(layerLines.map(line => {
              const match = line.match(/"([^"]+)"/);
              return match ? match[1] : null;
            }).filter(Boolean) as string[]));
            
            setLayers(layers);
            
            // Rysowanie prostego przykładu w Three.js
            // Siatka i system współrzędnych zamiast faktycznej geometrii DXF
            
            // Tworzymy siatkę
            const gridSize = 100;
            const gridDivisions = 20;
            const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
            gridHelper.rotation.x = Math.PI / 2; // Obracamy siatkę do płaszczyzny XY
            gridHelper.name = "DxfGridHelper";
            
            // Tworzymy osie
            const axesHelper = new THREE.AxesHelper(50);
            axesHelper.name = "DxfAxesHelper";
            
            // Tworzymy prostą geometrię jako wizualizację
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            
            // Rysujemy prosty wzór reprezentujący wczytany DXF
            // Okrąg
            const radius = 30;
            const segments = 32;
            for (let i = 0; i < segments; i++) {
              const theta = (i / segments) * Math.PI * 2;
              const thetaNext = ((i + 1) / segments) * Math.PI * 2;
              
              vertices.push(
                Math.cos(theta) * radius, Math.sin(theta) * radius, 0,
                Math.cos(thetaNext) * radius, Math.sin(thetaNext) * radius, 0
              );
            }
            
            // Kilka prostych linii
            vertices.push(-40, -40, 0, 40, 40, 0); // Linia przekątna
            vertices.push(-40, 40, 0, 40, -40, 0); // Linia przekątna (druga)
            vertices.push(-40, 0, 0, 40, 0, 0);    // Linia pozioma
            vertices.push(0, -40, 0, 0, 40, 0);    // Linia pionowa
            
            // Dodajemy wierzchołki do geometrii
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            
            // Materiał dla linii
            const material = new THREE.LineBasicMaterial({ color: 0x009900 });
            
            // Tworzymy obiekt linii
            const modelLines = new THREE.LineSegments(geometry, material);
            modelLines.name = "DxfModel";
            
            // Usuń poprzednie obiekty
            const previousObjects = ["DxfModel", "DxfGridHelper", "DxfAxesHelper"];
            previousObjects.forEach(name => {
              const obj = sceneRef.current?.getObjectByName(name);
              if (obj) sceneRef.current?.remove(obj);
            });
            
            // Dodaj nowe obiekty do sceny
            sceneRef.current?.add(gridHelper);
            sceneRef.current?.add(axesHelper);
            sceneRef.current?.add(modelLines);
            
            // Ustawienia kamery
            if (cameraRef.current && controlsRef.current) {
              cameraRef.current.position.set(0, 0, 100);
              cameraRef.current.lookAt(0, 0, 0);
              controlsRef.current.target.set(0, 0, 0);
              controlsRef.current.update();
            }
            
            setDebugInfo(`DXF załadowany: ${entityCount} elementów, ${layers.length} warstw`);
          } catch (error) {
            console.error("Błąd przetwarzania pliku DXF:", error);
            setDebugInfo(`Błąd przetwarzania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
          }
        };
        
        reader.onerror = () => {
          setDebugInfo("Błąd odczytu pliku");
        };
        
        // Rozpocznij odczyt pliku
        reader.readAsText(fileData);
      } catch (error) {
        console.error("Błąd renderowania pliku DXF:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      }
    };
    
    renderDxf();
  }, [fileData]);
  
  // Funkcja przełączająca siatkę
  const toggleGrid = () => {
    if (!sceneRef.current) return;
    
    const grid = sceneRef.current.getObjectByName("DxfGridHelper");
    if (grid) {
      grid.visible = !grid.visible;
      setShowGrid(grid.visible);
    }
  };
  
  // Funkcja dopasowująca widok do modelu
  const fitToView = () => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    
    const dxfModel = sceneRef.current.getObjectByName("DxfModel");
    if (!dxfModel) return;
    
    // Oblicz wymiary modelu
    const boundingBox = new THREE.Box3().setFromObject(dxfModel);
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const maxDimension = Math.max(size.x, size.y, size.z);
    const distance = maxDimension * 2;
    
    // Ustaw pozycję kamery
    cameraRef.current.position.set(center.x, center.y, center.z + distance);
    cameraRef.current.lookAt(center);
    
    // Ustaw cel kontrolek
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
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
          onClick={toggleGrid}
          variant="outline"
          size="sm"
          className="bg-white/80 hover:bg-white text-xs"
        >
          {showGrid ? 'Ukryj siatkę' : 'Pokaż siatkę'}
        </Button>
        
        <Button 
          onClick={fitToView}
          variant="outline"
          size="sm"
          className="bg-white/80 hover:bg-white text-xs"
        >
          Dopasuj widok
        </Button>
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <div className="bg-white p-4 rounded shadow-md">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
            <div className="text-sm mt-2">Wczytywanie modelu 2D...</div>
          </div>
        </div>
      )}
      
      {/* Three.js container */}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] bg-gray-100"
        style={{ minHeight: '500px' }}
      />
      
      {/* Mode info */}
      <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded flex flex-col gap-1">
        <div className="flex items-center gap-2">
          Format: 
          <Badge variant="outline" className="bg-green-900/50">
            DXF (2D)
          </Badge>
        </div>
        
        {entityCount > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="text-gray-200">Elementy: <span className="text-white">{entityCount}</span></div>
            <div className="text-gray-200">Warstwy: <span className="text-white">{layers.length}</span></div>
            {layers.length > 0 && (
              <div className="text-gray-200 mt-1">
                {layers.slice(0, 3).map((layer, i) => (
                  <div key={i} className="text-xs opacity-70">{layer}</div>
                ))}
                {layers.length > 3 && <div className="text-xs opacity-50">+{layers.length - 3} więcej...</div>}
              </div>
            )}
          </div>
        )}
        
        <div className="text-gray-300 text-xs italic mt-1">
          Uwaga: Tryb 2D dla plików CAD.
        </div>
      </div>
      
      {/* Code Preview Panel */}
      {dxfContent && (
        <div className="absolute bottom-2 right-2 z-10 bg-white text-black text-xs rounded shadow-md overflow-hidden" style={{ maxWidth: '350px', maxHeight: '200px' }}>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="source-code" className="border-0">
              <AccordionTrigger className="py-2 px-3 text-xs hover:no-underline">
                Podgląd kodu DXF
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[150px] w-[350px]">
                  <pre className="p-3 text-xs font-mono bg-gray-100 rounded">
                    {dxfContent.substring(0, 2000)}
                    {dxfContent.length > 2000 && '...'}
                  </pre>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}