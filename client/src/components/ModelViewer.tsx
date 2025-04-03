import { useEffect, useState, lazy, Suspense, Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

// Lazy load components to handle loading errors
const StepViewer = lazy(() => import('./StepViewer'));
const DxfViewer = lazy(() => import('./DxfViewer'));

// Komponent do obsługi błędów w komponentach React
class ErrorBoundary extends Component<{ 
  children: ReactNode; 
  fallback: ReactNode;
}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error) {
    console.error("Error caught by ErrorBoundary:", error);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    
    return this.props.children;
  }
}

interface ModelViewerProps {
  modelId: number | null;
}

// Typ modelu określa, jaki renderer będzie używany
type ModelType = '3d' | '2d' | 'unknown';

export default function ModelViewer({ modelId }: ModelViewerProps) {
  const { t } = useLanguage();
  const [modelType, setModelType] = useState<ModelType>('unknown');
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSwitchedMode, setHasSwitchedMode] = useState(false);

  // Pobierz informacje o modelu i określ jego typ
  useEffect(() => {
    if (!modelId) {
      setModelType('unknown');
      setModelInfo(null);
      return;
    }

    const fetchModelInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/models/${modelId}`);
        if (!response.ok) {
          throw new Error(`Nie można pobrać informacji o modelu (${response.status})`);
        }
        
        const data = await response.json();
        setModelInfo(data);
        
        // Określ typ modelu na podstawie rozszerzenia pliku
        const filename = data.filename?.toLowerCase() || '';
        
        // Automatycznie wykryj typ pliku
        let detectedType: ModelType = 'unknown';
        
        if (filename.endsWith('.step') || filename.endsWith('.stp') || filename.endsWith('.stl')) {
          detectedType = '3d';
        } else if (filename.endsWith('.dxf') || filename.endsWith('.dwg')) {
          detectedType = '2d';
        }
        
        setModelType(detectedType);
        // Zawsze ustawiamy hasSwitchedMode na true, aby uniemożliwić przełączanie
        setHasSwitchedMode(true);
      } catch (error) {
        console.error("Błąd pobierania informacji o modelu:", error);
        setError(error instanceof Error ? error.message : 'Nieznany błąd');
        setModelType('unknown');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModelInfo();
  }, [modelId]);
  
  return (
    <div className="w-full h-full flex flex-col min-h-[400px]">
      {/* Kontrolki widoku */}
      <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('mode')}:</span>
          
          <Badge variant={modelType === '3d' ? 'default' : 'outline'}>
            3D
          </Badge>
          
          <Badge variant={modelType === '2d' ? 'default' : 'outline'}>
            2D
          </Badge>
          
          {modelInfo?.filename && (
            <span className="text-xs text-slate-500 ml-3">
              {modelInfo.filename}
            </span>
          )}
        </div>
      </div>
      
      {/* Obszar widoku modelu */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-sm">Ładowanie modelu...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <div className="text-center max-w-md p-4">
              <AlertCircle size={40} className="mx-auto text-red-500 mb-2" />
              <h3 className="text-lg font-medium mb-1">Błąd ładowania modelu</h3>
              <p className="text-sm text-slate-600">{error}</p>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <>
            {modelType === '3d' && (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-sm">Ładowanie komponentu 3D...</p>
                  </div>
                </div>
              }>
                <ErrorBoundary fallback={
                  <div className="p-8 text-center">
                    <AlertCircle size={40} className="mx-auto text-amber-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Problem z renderowaniem 3D</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Wystąpił problem z załadowaniem komponentu do renderowania 3D. 
                      Sprawdź czy Twoja przeglądarka wspiera WebGL.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Odśwież stronę
                    </Button>
                  </div>
                }>
                  <StepViewer modelId={modelId} />
                </ErrorBoundary>
              </Suspense>
            )}
            
            {modelType === '2d' && (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-sm">Ładowanie komponentu 2D...</p>
                  </div>
                </div>
              }>
                <ErrorBoundary fallback={
                  <div className="p-8 text-center">
                    <AlertCircle size={40} className="mx-auto text-amber-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Problem z renderowaniem 2D</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Wystąpił problem z załadowaniem komponentu do renderowania plików 2D.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Odśwież stronę
                    </Button>
                  </div>
                }>
                  <DxfViewer modelId={modelId} />
                </ErrorBoundary>
              </Suspense>
            )}
            
            {modelType === 'unknown' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Wybierz model do wyświetlenia</p>
                  <p className="text-sm text-slate-500">
                    Obsługiwane formaty: STEP, STP, STL, DXF, DWG
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}