import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from '@/lib/utils';
import StepViewer from '@/components/StepViewer';
import { useModelUpload } from '@/lib/hooks';
import { apiRequest } from '@/lib/queryClient';

interface Model {
  id: number;
  filename: string;
  filesize: number;
  format: string;
  created: string;
  sourceSystem?: string;
  conversionStatus?: string;
}

export default function FileUploadTest() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Konfiguracja uploadu STEP
  const { 
    upload: uploadStep, 
    isUploading: isUploadingStep,
    uploadProgress: stepUploadProgress,
    reset: resetStepUpload
  } = useModelUpload({
    onSuccess: (data) => {
      fetchModels();
      setSelectedModelId(data.id);
    },
    onError: (error) => {
      setError(`Błąd podczas przesyłania pliku STEP: ${error.message}`);
    }
  });
  
  // Konfiguracja uploadu STL
  const { 
    upload: uploadStl, 
    isUploading: isUploadingStl,
    uploadProgress: stlUploadProgress,
    reset: resetStlUpload
  } = useModelUpload({
    onSuccess: (data) => {
      fetchModels();
      setSelectedModelId(data.id);
    },
    onError: (error) => {
      setError(`Błąd podczas przesyłania pliku STL: ${error.message}`);
    }
  });

  // Pobierz listę modeli przy ładowaniu strony
  useEffect(() => {
    fetchModels();
  }, []);

  // Funkcja do pobierania listy modeli
  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setModels(data);
    } catch (err) {
      setError('Nie udało się pobrać listy modeli.');
      console.error('Error fetching models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja do obsługi przesyłania pliku STEP
  const handleStepUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Sprawdź czy plik ma rozszerzenie STEP lub STP
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'step' && fileExtension !== 'stp') {
        setError('Wybierz plik z rozszerzeniem .step lub .stp');
        return;
      }
      
      // Przesyłamy plik STEP
      uploadStep(file, '/api/models/upload');
    }
  };

  // Funkcja do obsługi przesyłania pliku STL
  const handleStlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Sprawdź czy plik ma rozszerzenie STL
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'stl') {
        setError('Wybierz plik z rozszerzeniem .stl');
        return;
      }
      
      // Przesyłamy plik STL
      uploadStl(file, '/api/models/upload-stl');
    }
  };
  
  // Funkcja do usuwania modelu
  const handleDeleteModel = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten model?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Jeśli usunięto wybrany model, wyczyść selekcję
      if (selectedModelId === id) {
        setSelectedModelId(null);
      }
      
      // Odśwież listę modeli
      fetchModels();
    } catch (err) {
      setError('Nie udało się usunąć modelu.');
      console.error('Error deleting model:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Uploadu i Wyświetlania Plików 3D</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Wgraj Plik 3D</CardTitle>
              <CardDescription>
                Wybierz plik STEP lub STL do wczytania
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="step">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="step">STEP (.step, .stp)</TabsTrigger>
                  <TabsTrigger value="stl">STL (.stl)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="step" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="step-file">Wybierz plik STEP</Label>
                    <Input 
                      id="step-file" 
                      type="file" 
                      accept=".step,.stp" 
                      onChange={handleStepUpload}
                      disabled={isUploadingStep}
                    />
                    
                    {isUploadingStep && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${stepUploadProgress}%` }}
                        ></div>
                        <p className="text-xs text-gray-500 mt-1">
                          Przesyłanie: {stepUploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    STEP to standardowy format plików CAD używany do wymiany danych między różnymi systemami CAD.
                  </p>
                </TabsContent>
                
                <TabsContent value="stl" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stl-file">Wybierz plik STL</Label>
                    <Input 
                      id="stl-file" 
                      type="file" 
                      accept=".stl" 
                      onChange={handleStlUpload}
                      disabled={isUploadingStl}
                    />
                    
                    {isUploadingStl && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ width: `${stlUploadProgress}%` }}
                        ></div>
                        <p className="text-xs text-gray-500 mt-1">
                          Przesyłanie: {stlUploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    STL to popularny format plików używany w druku 3D i szybkim prototypowaniu.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={fetchModels}
                className="w-full"
              >
                Odśwież listę modeli
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dostępne Modele</CardTitle>
                <CardDescription>
                  Kliknij, aby zobaczyć podgląd
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-4">Ładowanie listy modeli...</p>
                ) : models.length > 0 ? (
                  <ul className="divide-y">
                    {models.map((model) => (
                      <li 
                        key={model.id} 
                        className={`py-2 px-3 cursor-pointer flex justify-between items-center ${selectedModelId === model.id ? 'bg-gray-100' : ''}`}
                        onClick={() => setSelectedModelId(model.id)}
                      >
                        <div>
                          <p className="font-medium truncate" title={model.filename}>
                            {model.filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            {model.format} | {formatFileSize(model.filesize)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {model.conversionStatus === 'completed' ? '✓ Konwersja zakończona' : 
                             model.conversionStatus === 'pending' ? '⏳ Konwersja w toku' : 
                             model.conversionStatus === 'failed' ? '❌ Konwersja nieudana' : 
                             ''}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModel(model.id);
                          }}
                        >
                          Usuń
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    Brak dostępnych modeli
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Podgląd 3D</CardTitle>
              <CardDescription>
                {selectedModelId 
                  ? `Wyświetlanie modelu ID: ${selectedModelId}` 
                  : 'Wybierz model z listy aby zobaczyć podgląd'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="h-[500px] relative">
              {selectedModelId ? (
                <StepViewer modelId={selectedModelId} />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">
                  <p>Wybierz model, aby wyświetlić podgląd 3D</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}