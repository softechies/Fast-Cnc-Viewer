import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DxfViewerProps {
  modelId: number | null;
}

export default function DxfViewer({ modelId }: DxfViewerProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencja do elementu SVG
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  
  // Stan dla trybu pomiaru
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  
  // Stan dla elementów pomiaru w SVG
  const [measureElements, setMeasureElements] = useState<SVGElement[]>([]);

  // Funkcja do obsługi kliknięć w trybie pomiaru
  const handleMeasureClick = (event: MouseEvent) => {
    if (!measureMode || !svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Pobierz pozycję SVG
    const svgRect = svgElement.getBoundingClientRect();
    
    // Oblicz pozycję kliknięcia względem SVG
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;
    
    // Dodaj punkt do listy punktów pomiaru
    setMeasurePoints(prev => {
      // Jeśli mamy już 2 punkty, zacznij od nowa
      if (prev.length === 2) {
        // Usuń wszystkie elementy pomiaru
        clearMeasureElements();
        return [{ x, y }];
      }
      
      // Dodaj punkt do tablicy (pierwszy lub drugi punkt)
      return [...prev, { x, y }];
    });
    
    // Stwórz wizualną reprezentację punktu
    createMeasurePoint(x, y);
    
    // Jeśli to drugi punkt, narysuj linię między punktami i oblicz odległość
    if (measurePoints.length === 1) {
      const point1 = measurePoints[0];
      const point2 = { x, y };
      
      // Oblicz odległość między punktami
      const distance = calculateDistance(point1, point2);
      setMeasureDistance(distance);
      
      // Narysuj linię między punktami
      createMeasureLine(point1, point2);
    }
  };
  
  // Funkcja do obliczania odległości między dwoma punktami
  const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };
  
  // Funkcja do tworzenia wizualnej reprezentacji punktu
  const createMeasurePoint = (x: number, y: number) => {
    if (!svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Tworzenie punktu jako element SVG
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttribute('cx', String(x));
    point.setAttribute('cy', String(y));
    point.setAttribute('r', '5');
    point.setAttribute('fill', 'red');
    
    // Dodaj punkt do SVG
    svgElement.appendChild(point);
    
    // Zapisz element do późniejszego usunięcia
    setMeasureElements(prev => [...prev, point]);
  };
  
  // Funkcja do tworzenia linii między punktami
  const createMeasureLine = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (!svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Tworzenie linii jako element SVG
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(p1.x));
    line.setAttribute('y1', String(p1.y));
    line.setAttribute('x2', String(p2.x));
    line.setAttribute('y2', String(p2.y));
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    
    // Dodaj linię do SVG
    svgElement.appendChild(line);
    
    // Zapisz element do późniejszego usunięcia
    setMeasureElements(prev => [...prev, line]);
    
    // Dodaj tekst z odległością
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    const distance = calculateDistance(p1, p2);
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(midX));
    text.setAttribute('y', String(midY - 10));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'red');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', 'bold');
    text.textContent = `${distance.toFixed(2)} jednostek`;
    
    // Dodaj tło dla tekstu
    const textRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const padding = 5;
    const rect = text.getBBox ? text.getBBox() : { x: midX - 50, y: midY - 25, width: 100, height: 20 };
    textRect.setAttribute('x', String(rect.x - padding));
    textRect.setAttribute('y', String(rect.y - padding));
    textRect.setAttribute('width', String(rect.width + 2 * padding));
    textRect.setAttribute('height', String(rect.height + 2 * padding));
    textRect.setAttribute('fill', 'white');
    textRect.setAttribute('fill-opacity', '0.8');
    
    // Dodaj elementy do SVG
    svgElement.appendChild(textRect);
    svgElement.appendChild(text);
    
    // Zapisz elementy do późniejszego usunięcia
    setMeasureElements(prev => [...prev, textRect, text]);
  };
  
  // Funkcja do usuwania wszystkich elementów pomiaru
  const clearMeasureElements = () => {
    measureElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    setMeasureElements([]);
  };
  
  // Efekt do obsługi kliknięć w trybie pomiaru
  useEffect(() => {
    if (!svgWrapperRef.current) return;
    
    const handleClick = (event: MouseEvent) => {
      handleMeasureClick(event);
    };
    
    // Dodaj lub usuń obsługę kliknięć w zależności od trybu pomiaru
    if (measureMode) {
      svgWrapperRef.current.addEventListener('click', handleClick);
    }
    
    // Cleanup
    return () => {
      if (svgWrapperRef.current) {
        svgWrapperRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [measureMode, measurePoints]);
  
  // Efekt do czyszczenia punktów pomiarowych przy wyłączaniu trybu pomiaru
  useEffect(() => {
    if (!measureMode) {
      clearMeasureElements();
      setMeasurePoints([]);
      setMeasureDistance(null);
    }
  }, [measureMode]);

  useEffect(() => {
    if (!modelId) {
      setSvgContent(null);
      setError(null);
      return;
    }

    const fetchSvg = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Najpierw pobierz informacje o modelu, aby sprawdzić uprawnienia
        const modelResponse = await fetch(`/api/models/${modelId}`);
        if (!modelResponse.ok) {
          const errorData = await modelResponse.json();
          console.error("Error fetching model info:", errorData);
          throw new Error(errorData.message || 'Nie masz dostępu do tego modelu');
        }
        
        // Pobierz wygenerowane SVG z serwera
        const response = await fetch(`/api/models/${modelId}/svg`);
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Brak dostępu do tego modelu');
          } else if (response.status === 404) {
            throw new Error('Nie znaleziono pliku SVG lub konwersja nie została jeszcze zakończona');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Problem z załadowaniem SVG');
          }
        }
        
        const svgData = await response.text();
        if (!svgData || svgData.trim() === '') {
          throw new Error('Pobrany plik SVG jest pusty');
        }
        
        setSvgContent(svgData);
      } catch (err) {
        console.error("Error loading SVG:", err);
        setError(err instanceof Error ? err.message : 'Nieznany błąd podczas ładowania SVG');
        setSvgContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSvg();
  }, [modelId]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col">
        <Card className="flex-1 relative overflow-hidden">
          <CardContent className="p-0 h-full flex items-center justify-center">
            <Skeleton className="h-64 w-64 rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Ładowanie podglądu DXF...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col">
        <Card className="flex-1">
          <CardContent className="p-6 h-full flex flex-col items-center justify-center">
            <div className="text-red-500 mb-2">Błąd ładowania pliku DXF</div>
            <div className="text-sm text-gray-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="h-full w-full flex flex-col">
        <Card className="flex-1">
          <CardContent className="p-6 h-full flex items-center justify-center text-gray-500">
            Wybierz model DXF do wyświetlenia
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <TabsList className="mx-auto mb-4">
          <TabsTrigger value="preview">Podgląd graficzny</TabsTrigger>
          <TabsTrigger value="code">Kod SVG</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="flex-1 m-0">
          <Card className="flex-1 h-full">
            <CardContent className="p-1 h-full bg-white overflow-auto relative">
              <div 
                className="h-full w-full flex items-center justify-center"
                style={{ 
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div 
                  className="svg-container"
                  style={{
                    width: "900px",
                    height: "900px",
                    maxWidth: "900px",
                    maxHeight: "900px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    background: "#fff",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Controls overlay */}
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                    <Toggle
                      aria-label="Tryb pomiaru"
                      pressed={measureMode}
                      onPressedChange={setMeasureMode}
                      className={`p-2 ${measureMode ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'} border-none`}
                      title="Włącz/wyłącz tryb pomiaru"
                    >
                      <Ruler className="h-6 w-6" />
                    </Toggle>
                  </div>
                  
                  {/* Measurement info */}
                  {measureMode && (
                    <div className="absolute top-12 left-2 z-10 bg-black/70 text-white p-2 rounded max-w-xs">
                      <div className="font-bold mb-1 flex items-center">
                        <Ruler className="h-4 w-4 mr-2" /> 
                        Tryb pomiaru
                      </div>
                      <div className="text-xs mb-2">
                        Kliknij na rysunek, aby zaznaczyć pierwszy punkt pomiaru, a następnie kliknij ponownie, aby zaznaczyć drugi punkt i zmierzyć odległość.
                      </div>
                      {measurePoints.length > 0 && (
                        <div className="text-xs">
                          Punkty: {measurePoints.length}/2
                        </div>
                      )}
                      {measureDistance !== null && (
                        <div className="mt-1 p-1 bg-blue-900/50 rounded text-center">
                          <span className="font-bold">Odległość:</span> {measureDistance.toFixed(2)} jednostek
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Wrapper na SVG - zajmuje całą powierzchnię kontenera */}
                  <div 
                    ref={svgWrapperRef}
                    className="svg-wrapper" 
                    style={{ 
                      position: "absolute", 
                      top: 0,
                      left: 0,
                      width: "100%", 
                      height: "100%", 
                    }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="code" className="flex-1 m-0">
          <Card className="flex-1 h-full">
            <CardContent className="p-0 h-full">
              <pre className="h-full overflow-auto bg-gray-50 p-4 text-xs">
                {svgContent}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}