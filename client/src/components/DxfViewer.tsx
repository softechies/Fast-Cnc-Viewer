import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DxfViewerProps {
  modelId: number | null;
}

export default function DxfViewer({ modelId }: DxfViewerProps) {
  // Stan komponentu
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("Inicjalizacja...");
  const [modelInfo, setModelInfo] = useState<{
    filename: string;
    filesize: number;
    format: string;
  } | null>(null);
  
  // Stan dla zawartości pliku DXF
  const [dxfContent, setDxfContent] = useState<string | null>(null);
  const [entityCount, setEntityCount] = useState(0);
  const [layers, setLayers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("text");

  // Ładowanie pliku DXF po zmianie modelId
  useEffect(() => {
    if (!modelId) {
      setDebugInfo("Brak wybranego modelu");
      return;
    }
    
    const loadFile = async () => {
      try {
        setIsLoading(true);
        setDebugInfo("Ładowanie pliku DXF...");
        
        // Pobierz informacje o modelu
        const modelResponse = await fetch(`/api/models/${modelId}`);
        if (!modelResponse.ok) {
          throw new Error(`Nie można pobrać informacji o modelu (${modelResponse.status})`);
        }
        
        const modelData = await modelResponse.json();
        setModelInfo({
          filename: modelData.filename,
          filesize: modelData.filesize,
          format: modelData.format || 'dxf'
        });
        
        // Pobierz plik DXF
        const response = await fetch(`/api/models/${modelId}/file`);
        if (!response.ok) {
          throw new Error(`Nie można pobrać pliku (${response.status})`);
        }
        
        const fileContent = await response.text();
        setDxfContent(fileContent);
        
        // Prosta analiza zawartości pliku DXF
        const lines = fileContent.split('\n');
        
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
        setDebugInfo(`DXF załadowany: ${entityCount} elementów, ${layers.length} warstw`);
      } catch (error) {
        console.error("Błąd ładowania pliku DXF:", error);
        setDebugInfo(`Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFile();
  }, [modelId]);

  // Renderowanie prostego przykładu wizualizacji DXF jako SVG
  const renderSimpleSvg = () => {
    // Prosty symbol reprezentujący zawartość DXF
    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox="-50 -50 100 100" 
        style={{ 
          background: "#f7f7f7", 
          minHeight: "500px",
          border: "1px solid #ddd"
        }}
      >
        {/* Siatka */}
        {Array.from({ length: 21 }).map((_, i) => {
          const pos = -50 + i * 5;
          return (
            <g key={i} opacity={0.2}>
              <line 
                x1={-50} y1={pos} x2={50} y2={pos} 
                stroke="#999" strokeWidth="0.5" 
              />
              <line 
                x1={pos} y1={-50} x2={pos} y2={50} 
                stroke="#999" strokeWidth="0.5" 
              />
            </g>
          );
        })}
        
        {/* Osie */}
        <line x1={-50} y1={0} x2={50} y2={0} stroke="red" strokeWidth="0.7" />
        <line x1={0} y1={-50} x2={0} y2={50} stroke="blue" strokeWidth="0.7" />
        
        {/* Prosta reprezentacja zawartości DXF - okrąg */}
        <circle 
          cx="0" cy="0" r="30" 
          stroke="green" strokeWidth="1.2" 
          fill="none" 
        />
        
        {/* Linie przekątne */}
        <line 
          x1={-40} y1={-40} x2={40} y2={40} 
          stroke="green" strokeWidth="1.2" 
        />
        <line 
          x1={-40} y1={40} x2={40} y2={-40} 
          stroke="green" strokeWidth="1.2" 
        />
        
        {/* Linie poziome i pionowe */}
        <line 
          x1={-40} y1={0} x2={40} y2={0} 
          stroke="green" strokeWidth="1.2" 
        />
        <line 
          x1={0} y1={-40} x2={0} y2={40} 
          stroke="green" strokeWidth="1.2" 
        />
        
        {/* Oznaczenia punktów */}
        {layers.length > 0 && (
          <>
            {layers.slice(0, Math.min(5, layers.length)).map((layer, i) => {
              const angle = (i / Math.min(5, layers.length)) * Math.PI * 2;
              const x = Math.cos(angle) * 20;
              const y = Math.sin(angle) * 20;
              return (
                <g key={i}>
                  <circle 
                    cx={x} cy={y} r="2" 
                    fill="red" 
                  />
                  <text 
                    x={x + 3} y={y + 3} 
                    fontSize="4" 
                    fill="#333"
                  >
                    {layer.substring(0, 8)}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>
    );
  };

  // Renderuje listę elementów wykrytych w pliku DXF
  const renderEntityList = () => {
    if (!dxfContent) return null;
    
    const lines = dxfContent.split('\n');
    const entities: string[] = [];
    let currentEntity = '';
    
    // Bardzo prosta analiza - wykrywanie bloków encji
    for (const line of lines) {
      if (line.trim() === 'ENTITY') {
        currentEntity = 'ENTITY';
      } else if (line.includes('LINE') || 
                line.includes('CIRCLE') || 
                line.includes('ARC') || 
                line.includes('TEXT') ||
                line.includes('POLYLINE')) {
        currentEntity += ' ' + line.trim();
        entities.push(currentEntity);
        currentEntity = '';
      }
    }
    
    return (
      <div className="p-4 text-xs">
        <h3 className="font-bold mb-2">Wykryte elementy ({entities.length}):</h3>
        <ScrollArea className="h-[350px] w-full border rounded p-2">
          <ul className="space-y-1">
            {entities.slice(0, 100).map((entity, i) => (
              <li key={i} className="border-b pb-1">
                {entity}
              </li>
            ))}
            {entities.length > 100 && (
              <li className="text-gray-500 italic">
                ...i {entities.length - 100} więcej elementów
              </li>
            )}
          </ul>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
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
      
      {/* Main content */}
      <Card className="w-full h-full overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-medium">
              {modelInfo?.filename || 'Plik CAD 2D'}
              <span className="ml-2 text-xs">
                <Badge variant="outline" className="bg-green-900/50 text-white">
                  {modelInfo?.format.toUpperCase() || 'DXF'} (2D)
                </Badge>
              </span>
            </h3>
            <p className="text-sm text-gray-500">
              Elementy: {entityCount}, Warstwy: {layers.length}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Eksportuj
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="graphic" className="w-full h-[calc(100%-60px)]">
          <div className="border-b px-4">
            <TabsList>
              <TabsTrigger value="graphic">Podgląd graficzny</TabsTrigger>
              <TabsTrigger value="text">Podgląd kodu</TabsTrigger>
              <TabsTrigger value="elements">Lista elementów</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="graphic" className="h-full">
            <div className="w-full h-full min-h-[500px] relative">
              {renderSimpleSvg()}
              
              {/* Debug info */}
              <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs p-1 rounded">
                {debugInfo}
              </div>
              
              {/* Layer list */}
              {layers.length > 0 && (
                <div className="absolute top-2 right-2 z-10 bg-white text-black text-xs p-2 rounded shadow-md max-w-[200px]">
                  <h4 className="font-bold mb-1">Warstwy:</h4>
                  <ul className="space-y-1">
                    {layers.slice(0, 5).map((layer, i) => (
                      <li key={i} className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                        {layer}
                      </li>
                    ))}
                    {layers.length > 5 && (
                      <li className="text-gray-500 italic">
                        ...i {layers.length - 5} więcej
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="text" className="h-full">
            <ScrollArea className="h-full w-full">
              <pre className="p-4 text-xs font-mono bg-gray-100">
                {dxfContent?.substring(0, 10000) || 'Brak danych'}
                {dxfContent && dxfContent.length > 10000 && '...'}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="elements" className="h-full">
            {renderEntityList()}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}