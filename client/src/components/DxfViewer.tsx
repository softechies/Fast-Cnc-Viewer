import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface DxfViewerProps {
  modelId: number | null;
}

export default function DxfViewer({ modelId }: DxfViewerProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        
        // Pobierz wygenerowane SVG z serwera
        const response = await fetch(`/api/models/${modelId}/svg`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load SVG');
        }
        
        const svgData = await response.text();
        setSvgContent(svgData);
      } catch (err) {
        console.error("Error loading SVG:", err);
        setError(err instanceof Error ? err.message : 'Unknown error loading SVG');
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
                  {/* Wrapper na SVG - zajmuje całą powierzchnię kontenera */}
                  <div 
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