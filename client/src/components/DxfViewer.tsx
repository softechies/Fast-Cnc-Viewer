import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/lib/LanguageContext';

interface DxfViewerProps {
  modelId: number | null;
  isPublic?: boolean;
  publicId?: string;
}

// Interfejs dla wymiarów modelu 2D
interface ModelDimensions2D {
  width: number;   // Szerokość (X)
  height: number;  // Wysokość (Y)
  minX: number;    // Minimalna wartość X
  minY: number;    // Minimalna wartość Y
  maxX: number;    // Maksymalna wartość X
  maxY: number;    // Maksymalna wartość Y
  units: string;   // Jednostki miary (domyślnie mm)
}

export default function DxfViewer({ modelId, isPublic, publicId }: DxfViewerProps) {
  // Get translation function
  const { t } = useLanguage();
  
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencja do elementu SVG
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  
  // Stan dla wymiarów modelu 2D
  const [modelDimensions, setModelDimensions] = useState<ModelDimensions2D | null>(null);

  // Funkcja obliczająca wymiary modelu na podstawie SVG
  function calculateSvgDimensions() {
    if (!svgWrapperRef.current) return;
    
    const svgElement = svgWrapperRef.current.querySelector('svg') as SVGSVGElement;
    if (!svgElement) return;
    
    // Znajdź najlepsze źródło elementów do obliczenia granic
    const entitiesGroup = svgElement.querySelector('#entities') || svgElement;
    
    try {
      // Sprawdź czy mamy informację o jednostkach
      // Ezdxf zazwyczaj ustawia ten atrybut dla SVG
      const units = svgElement.getAttribute('data-units') || 'mm';
      
      // Szukaj najpierw viewBox, potem width/height, na końcu oblicz z elementów
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
        
        setModelDimensions({
          width,
          height,
          minX,
          minY,
          maxX,
          maxY,
          units
        });
        
        console.log("Wymiary modelu DXF (z viewBox):", { 
          width, height, units,
          minX, minY, maxX, maxY 
        });
        return;
      }
      
      // Podejście 2: Spróbuj użyć atrybutów width i height
      const svgWidth = svgElement.getAttribute('width');
      const svgHeight = svgElement.getAttribute('height');
      
      if (svgWidth && svgHeight) {
        // Konwertuj szerokość i wysokość na liczby
        // Usuń jednostki jak 'px', 'mm', itp.
        const width = parseFloat(svgWidth);
        const height = parseFloat(svgHeight);
        
        if (!isNaN(width) && !isNaN(height)) {
          setModelDimensions({
            width,
            height,
            minX: 0,
            minY: 0,
            maxX: width,
            maxY: height,
            units
          });
          
          console.log("Wymiary modelu DXF (z atrybutów width/height):", { 
            width, height, units,
            minX: 0, minY: 0, maxX: width, maxY: height 
          });
          return;
        }
      }
      
      // Podejście 3: Oblicz granice wszystkich elementów
      // Inicjalizuj wartości graniczne z ekstremalnymi wartościami
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      // Znajdź wszystkie elementy, które mogą mieć współrzędne
      // Dla ezdxf, szukamy szczególnie elementów w grupie 'content' lub 'modelspace'
      const contentGroup = svgElement.querySelector('#content') || 
                           svgElement.querySelector('#modelspace') || 
                           entitiesGroup;
      
      const elements = contentGroup.querySelectorAll('path, line, circle, rect, polyline, polygon');
      
      // Uwaga: Ezdxf może używać innej struktury, więc sprawdzamy wszystkie możliwe grupy elementów
      let elementCount = 0;
      
      elements.forEach((element) => {
        try {
          // Pobierz bounding box elementu - musimy rzutować na SVGGraphicsElement
          const bbox = (element as SVGGraphicsElement).getBBox();
          elementCount++;
          
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
      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity || elementCount === 0) {
        console.log("Nie można obliczyć wymiarów modelu - brak elementów z wymiarami");
        
        // Ostatnia szansa: sprawdź czy plik SVG ma jakąś informację o rozmiarze
        const svgStyle = window.getComputedStyle(svgElement);
        const width = parseFloat(svgStyle.width);
        const height = parseFloat(svgStyle.height);
        
        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
          setModelDimensions({
            width,
            height,
            minX: 0,
            minY: 0,
            maxX: width,
            maxY: height,
            units
          });
          
          console.log("Wymiary modelu DXF (z CSS):", { 
            width, height, units,
            minX: 0, minY: 0, maxX: width, maxY: height 
          });
        }
        
        return;
      }
      
      // Oblicz szerokość i wysokość
      const width = maxX - minX;
      const height = maxY - minY;
      
      setModelDimensions({
        width,
        height,
        minX,
        minY,
        maxX,
        maxY,
        units
      });
      
      console.log("Wymiary modelu DXF (obliczone z elementów):", { 
        width, height, units,
        minX, minY, maxX, maxY,
        elements: elementCount
      });
    } catch (error) {
      console.error("Błąd podczas obliczania wymiarów SVG:", error);
    }
  }
  
  // Pobierz model DXF z serwera
  useEffect(() => {
    if (!modelId) return;
    
    setIsLoading(true);
    setError(null);
    
    // Pobierz SVG dla modelu DXF
    fetch(`/api/models/${modelId}/svg`)
      .then(response => {
        console.log('response',response)
        if (!response.ok) {
          throw new Error(`Błąd ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(svg => {
        setSvgContent(svg);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Błąd pobierania SVG:", err);
        setError(err.message);
        setIsLoading(false);
      });
      
  }, [modelId]);
  
  // Po załadowaniu SVG oblicz wymiary
  useEffect(() => {
    if (svgContent && svgWrapperRef.current) {
      // Trochę opóźnienia, aby DOM miał czas na renderowanie SVG
      setTimeout(() => {
        calculateSvgDimensions();
      }, 100);
    }
  }, [svgContent]);
  
  // Renderowanie DXF jako SVG
  const renderSvgContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Badge variant="destructive" className="mb-2">
            {t('error')}
          </Badge>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      );
    }
    
    if (!svgContent) {
      return (
        <div className="flex items-center justify-center h-full text-center p-4">
          <p className="text-sm text-gray-500">{t('dxf.no_preview')}</p>
        </div>
      );
    }
    
    return (
      <div 
        ref={svgWrapperRef}
        className="w-full h-full flex items-center justify-center relative"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  };

  // Renderowanie szczegółów wymiarów, jeśli są dostępne
  const renderDimensionsDetails = () => {
    if (!modelDimensions) return null;
    
    return (
      <div className="p-4 border-t">
        <h4 className="font-medium mb-2 text-sm">{t('dimensions.title')}</h4>
        <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
          <div className="text-gray-500">{t('dimensions.width')}:</div>
          <div className="font-medium text-right">
            {modelDimensions.width.toFixed(2)} {modelDimensions.units}
          </div>
          
          <div className="text-gray-500">{t('dimensions.height')}:</div>
          <div className="font-medium text-right">
            {modelDimensions.height.toFixed(2)} {modelDimensions.units}
          </div>
          
          <div className="col-span-2 mt-2">
            <Badge variant="outline" className="text-xs">{modelDimensions.units.toUpperCase()}</Badge>
          </div>
        </div>
      </div>
    );
  };
  console.log('svgcont',svgContent)
  return (
    <div className="h-full w-full flex flex-col">
      <Tabs defaultValue="preview" className="flex-1 flex flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="preview">{t('preview')}</TabsTrigger>
          <TabsTrigger value="info">{t('details')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="flex-1 min-h-0 relative">
          <Card className="h-full border-t-0 rounded-t-none flex flex-col">
            <CardContent className="flex-1 p-0 relative">
              <div className="w-full h-full relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderSvgContent()}
                </div>
                
                {/* Model dimensions info */}
                {modelDimensions && (
                  <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded">
                    <div className="grid grid-cols-2 gap-x-2">
                      <span>{t('dimensions.width')}:</span>
                      <span className="font-bold">{modelDimensions.width.toFixed(2)} {modelDimensions.units}</span>
                      
                      <span>{t('dimensions.height')}:</span>
                      <span className="font-bold">{modelDimensions.height.toFixed(2)} {modelDimensions.units}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info">
          <Card className="border-t-0 rounded-t-none">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {renderDimensionsDetails()}
                
                {/* Other details can be added here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}