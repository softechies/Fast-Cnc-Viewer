import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/lib/LanguageContext';

interface DxfViewerProps {
  modelId: number | null;
}

export default function DxfViewer({ modelId }: DxfViewerProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencja do elementu SVG
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  
  // Stan dla wymiarów modelu 2D
  type ModelDimensions2D = {
    width: number;   // Szerokość (X)
    height: number;  // Wysokość (Y)
    diagonal: number; // Przekątna
    minX: number;    // Minimalna wartość X
    minY: number;    // Minimalna wartość Y
    maxX: number;    // Maksymalna wartość X
    maxY: number;    // Maksymalna wartość Y
  };
  const [modelDimensions, setModelDimensions] = useState<ModelDimensions2D | null>(null);
  
  // Stan dla trybu pomiaru
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  
  // Stan dla elementów pomiaru w SVG
  const [measureElements, setMeasureElements] = useState<SVGElement[]>([]);

  // Funkcja obliczająca wymiary modelu na podstawie SVG
  function calculateSvgDimensions() {
    if (!svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg') as SVGSVGElement;
    if (!svgElement) return;
    
    // Znajdź najlepsze źródło elementów do obliczenia granic
    const entitiesGroup = svgElement.querySelector('#entities') || svgElement;
    
    try {
      // Podejście 1: Użyj viewBox, jeśli jest ustawiony
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        // viewBox jest w formacie: "minX minY width height"
        const [minXStr, minYStr, widthStr, heightStr] = viewBox.split(' ');
        const minX = parseFloat(minXStr);
        const minY = parseFloat(minYStr);
        const width = parseFloat(widthStr);
        const height = parseFloat(heightStr);
        
        // Oblicz maksimum X i Y
        const maxX = minX + width;
        const maxY = minY + height;
        
        // Oblicz przekątną
        const diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        
        setModelDimensions({
          width,
          height,
          diagonal,
          minX,
          minY,
          maxX,
          maxY
        });
        
        console.log("Wymiary modelu DXF (z viewBox):", { 
          width, height, diagonal, 
          minX, minY, maxX, maxY 
        });
        return;
      }
      
      // Podejście 2: Oblicz granice wszystkich elementów
      // Inicjalizuj wartości graniczne z ekstremalnymi wartościami
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      // Znajdź wszystkie elementy, które mogą mieć współrzędne
      const elements = entitiesGroup.querySelectorAll('path, line, circle, rect, polyline, polygon');
      
      elements.forEach((element) => {
        try {
          // Pobierz bounding box elementu - musimy rzutować na SVGGraphicsElement
          const bbox = (element as SVGGraphicsElement).getBBox();
          
          // Zaktualizuj granice
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        } catch (error) {
          // Pomijamy elementy, które nie są SVGGraphicsElement lub nie mają getBBox
          console.log("Pominięto element bez getBBox:", element.tagName);
        }
      });
      
      // Jeśli nie znaleziono elementów lub granice są nieprawidłowe
      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        console.log("Nie można obliczyć wymiarów modelu - brak elementów z wymiarami");
        return;
      }
      
      // Oblicz szerokość, wysokość i przekątną
      const width = maxX - minX;
      const height = maxY - minY;
      const diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
      
      setModelDimensions({
        width,
        height,
        diagonal,
        minX,
        minY,
        maxX,
        maxY
      });
      
      console.log("Wymiary modelu DXF (obliczone):", { 
        width, height, diagonal, 
        minX, minY, maxX, maxY 
      });
    } catch (error) {
      console.error("Błąd podczas obliczania wymiarów SVG:", error);
    }
  };
  
  // Funkcja do obsługi kliknięć w trybie pomiaru
  const handleMeasureClick = (event: MouseEvent) => {
    if (!measureMode || !svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg') as SVGSVGElement;
    if (!svgElement) return;
    
    // Pobierz pozycję SVG
    const svgRect = svgElement.getBoundingClientRect();
    
    // Przygotuj punkt w układzie współrzędnych strony
    const point = new DOMPoint(event.clientX, event.clientY);
    
    // Konwersja punktu z układu współrzędnych strony do układu SVG
    // Uwzględnia transformacje, skalowanie, viewBox itp.
    const entitiesGroup = svgElement.querySelector('#entities') || svgElement;
    
    // Pobierz macierz transformacji od elementu SVG do przeglądarki
    let svgCTM: DOMMatrix | null = null;
    
    // Sprawdź typ elementu i wywołaj odpowiednią metodę
    if ('getScreenCTM' in entitiesGroup && typeof (entitiesGroup as any).getScreenCTM === 'function') {
      svgCTM = (entitiesGroup as SVGGraphicsElement).getScreenCTM();
    } else if (svgElement instanceof SVGSVGElement) {
      // Fallback - użyj elementu głównego SVG
      svgCTM = svgElement.getScreenCTM();
    }
    
    if (!svgCTM) {
      console.error("Nie można uzyskać macierzy transformacji SVG");
      return;
    }
    
    // Odwróć macierz, aby przejść od przeglądarki do SVG
    const inverseCTM = svgCTM.inverse();
    
    // Przekształć punkt kliknięcia na współrzędne SVG
    const svgPoint = point.matrixTransform(inverseCTM);
    
    // Zapisz punkt z dokładnymi współrzędnymi SVG
    const x = svgPoint.x;
    const y = svgPoint.y;
    
    console.log("Punkt kliknięcia w układzie SVG:", { x, y });
    
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
      
      // Oblicz odległość między punktami w jednostkach SVG
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
    
    // Znajdź grupę elementów - najlepiej używać tej samej grupy, co zawiera elementy rysunku
    const entitiesGroup = svgElement.querySelector('#entities') || svgElement;
    
    // Utwórz warstwę pomiarową, jeśli nie istnieje
    let measureGroup = svgElement.querySelector('#measurement-layer');
    if (!measureGroup) {
      measureGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      measureGroup.setAttribute('id', 'measurement-layer');
      svgElement.appendChild(measureGroup);
    }
    
    // Tworzenie punktu jako element SVG
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttribute('cx', String(x));
    point.setAttribute('cy', String(y));
    point.setAttribute('r', '3');  // Zmniejszamy nieco rozmiar punktu
    point.setAttribute('fill', 'red');
    point.setAttribute('stroke', 'white');
    point.setAttribute('stroke-width', '1');
    
    // Dodaj punkt do warstwy pomiarów
    measureGroup.appendChild(point);
    
    // Zapisz element do późniejszego usunięcia
    setMeasureElements(prev => [...prev, point]);
    
    // Dodaj etykietę z współrzędnymi dla pierwszego punktu
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(x + 5));
    label.setAttribute('y', String(y - 5));
    label.setAttribute('fill', 'red');
    label.setAttribute('font-size', '10');
    label.textContent = `(${x.toFixed(1)}, ${y.toFixed(1)})`;
    
    // Dodaj tło dla etykiety
    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelBg.setAttribute('fill', 'white');
    labelBg.setAttribute('fill-opacity', '0.7');
    
    // Dodaj elementy do warstwy pomiarów
    measureGroup.appendChild(labelBg);
    measureGroup.appendChild(label);
    
    // Ustaw wymiary tła po dodaniu etykiety do SVG
    setTimeout(() => {
      try {
        const bbox = label.getBBox();
        labelBg.setAttribute('x', String(bbox.x - 2));
        labelBg.setAttribute('y', String(bbox.y - 2));
        labelBg.setAttribute('width', String(bbox.width + 4));
        labelBg.setAttribute('height', String(bbox.height + 4));
      } catch (e) {
        console.error("Błąd przy pozycjonowaniu etykiety:", e);
      }
    }, 0);
    
    // Zapisz elementy do późniejszego usunięcia
    setMeasureElements(prev => [...prev, label, labelBg]);
  };
  
  // Funkcja do tworzenia linii między punktami
  const createMeasureLine = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (!svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg');
    if (!svgElement) return;
    
    // Znajdź warstwę pomiarową, lub utwórz ją jeśli nie istnieje
    let measureGroup = svgElement.querySelector('#measurement-layer');
    if (!measureGroup) {
      measureGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      measureGroup.setAttribute('id', 'measurement-layer');
      svgElement.appendChild(measureGroup);
    }
    
    // Tworzenie linii jako element SVG
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(p1.x));
    line.setAttribute('y1', String(p1.y));
    line.setAttribute('x2', String(p2.x));
    line.setAttribute('y2', String(p2.y));
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '1.5'); // Nieco cieńsza linia
    line.setAttribute('stroke-dasharray', '3,3'); // Mniejszy wzór przerywania
    
    // Dodaj linię do warstwy pomiarów
    measureGroup.appendChild(line);
    
    // Zapisz element do późniejszego usunięcia
    setMeasureElements(prev => [...prev, line]);
    
    // Oblicz punkt środkowy i odległość
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const distance = calculateDistance(p1, p2);
    
    // Oblicz kąt linii do poziomej osi, aby umieścić etykietę równolegle do linii
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    
    // Utwórz grupę dla etykiety, aby móc ją obrócić
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('transform', `translate(${midX}, ${midY}) rotate(${angle}) translate(0, -10)`);
    
    // Tło dla tekstu
    const textRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    textRect.setAttribute('fill', 'white');
    textRect.setAttribute('fill-opacity', '0.8');
    textRect.setAttribute('rx', '3'); // Zaokrąglone rogi
    textRect.setAttribute('ry', '3');
    
    // Tworzymy tekst
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'red');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    
    // Sformatuj odległość w jednostkach użytkownika
    // Jeśli odległość jest większa niż 10, pokaż tylko 1 miejsce po przecinku
    // W przeciwnym razie pokaż 2 miejsca po przecinku
    text.textContent = `${distance >= 10 ? distance.toFixed(1) : distance.toFixed(2)} jedn.`;
    
    // Dodaj elementy do grupy etykiet
    measureGroup.appendChild(labelGroup);
    labelGroup.appendChild(textRect);
    labelGroup.appendChild(text);
    
    // Dostosuj tło do tekstu po wyrenderowaniu
    setTimeout(() => {
      try {
        const bbox = text.getBBox();
        textRect.setAttribute('x', String(bbox.x - 5));
        textRect.setAttribute('y', String(bbox.y - 5));
        textRect.setAttribute('width', String(bbox.width + 10));
        textRect.setAttribute('height', String(bbox.height + 10));
      } catch (e) {
        console.error("Błąd przy pozycjonowaniu tła etykiety:", e);
      }
    }, 0);
    
    // Zapisz elementy do późniejszego usunięcia
    setMeasureElements(prev => [...prev, line, labelGroup, textRect, text]);
    
    // Dodaj strzałki na końcach linii dla lepszej wizualizacji
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    arrowMarker.setAttribute('id', 'arrow');
    arrowMarker.setAttribute('viewBox', '0 0 10 10');
    arrowMarker.setAttribute('refX', '5');
    arrowMarker.setAttribute('refY', '5');
    arrowMarker.setAttribute('markerWidth', '4');
    arrowMarker.setAttribute('markerHeight', '4');
    arrowMarker.setAttribute('orient', 'auto-start-reverse');
    
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrow.setAttribute('fill', 'red');
    
    arrowMarker.appendChild(arrow);
    marker.appendChild(arrowMarker);
    measureGroup.appendChild(marker);
    
    // Dodaj strzałki do linii
    line.setAttribute('marker-end', 'url(#arrow)');
    line.setAttribute('marker-start', 'url(#arrow)');
    
    // Zapisz markery do usunięcia
    setMeasureElements(prev => [...prev, marker]);
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
        
        // Po załadowaniu SVG, oblicz wymiary modelu
        // Wykonujemy to z opóźnieniem, aby dać czas na wyrenderowanie SVG
        setTimeout(() => {
          calculateSvgDimensions();
        }, 100);
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
                    width: "100%",
                    height: "100%",
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
                  
                  {/* Model dimensions info */}
                  {modelDimensions && (
                    <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded">
                      <div className="font-bold mb-1">Wymiary modelu:</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Szerokość (X):</span>
                          <span className="font-mono">{modelDimensions.width.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Wysokość (Y):</span>
                          <span className="font-mono">{modelDimensions.height.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Przekątna:</span>
                          <span className="font-mono">{modelDimensions.diagonal.toFixed(2)}</span>
                        </div>
                      </div>
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