import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StepViewer from "@/components/StepViewer";
import ModelTreeView from "@/components/ModelTreeView";
import ModelInfo from "@/components/ModelInfo";
import FooterBar from "@/components/FooterBar";
import UploadModal from "@/components/UploadModal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModelUpload } from "@/lib/hooks";
import { Box, InfoIcon } from "lucide-react";
import { ModelInfo as ModelInfoType, ModelTree } from "@shared/schema";

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("structure");
  const [activeModelId, setActiveModelId] = useState<number | null>(null);
  const { isUploading, uploadProgress, uploadModel } = useModelUpload({
    onSuccess: (data) => {
      setActiveModelId(data.id);
      setIsUploadModalOpen(false);
      toast({
        title: "Wczytano plik",
        description: `Plik ${data.filename} został pomyślnie wczytany.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd wczytywania pliku",
        description: error.message || "Nie udało się wczytać pliku STEP.",
        variant: "destructive",
      });
    },
  });
  
  // Query for model info if we have an active model
  const { data: modelInfo, isLoading: isLoadingInfo } = useQuery<ModelInfoType>({
    queryKey: ['/api/models', activeModelId, 'info'],
    enabled: !!activeModelId,
  });

  // Query for model tree if we have an active model
  const { data: modelTree, isLoading: isLoadingTree } = useQuery<ModelTree>({
    queryKey: ['/api/models', activeModelId, 'tree'],
    enabled: !!activeModelId,
  });

  const hasModel = !!activeModelId;

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onUploadClick={() => setIsUploadModalOpen(true)} 
      />
      
      <main className="flex-grow flex flex-col lg:flex-row">
        <section className="flex-grow lg:w-2/3 bg-gray-50 relative h-[500px] lg:h-auto">
          {!hasModel ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Box className="w-16 h-16 mb-4 text-gray-300" />
              <h2 className="text-xl font-medium mb-2">Brak modelu do wyświetlenia</h2>
              <p className="text-center max-w-md mb-6">Wczytaj plik STEP (.stp lub .step) aby rozpocząć przeglądanie</p>
              <button 
                onClick={() => setIsUploadModalOpen(true)} 
                className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center font-medium transition-colors duration-200"
              >
                <i className="fas fa-upload mr-2"></i>
                <span>Wczytaj plik STEP</span>
              </button>
            </div>
          ) : (
            <StepViewer modelId={activeModelId} />
          )}
        </section>
        
        <aside className={`w-full lg:w-1/3 bg-white border-l border-gray-200 ${!hasModel ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="border-b border-gray-200 w-full rounded-none">
              <TabsTrigger value="structure" className="flex items-center">
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9V5c0-1.1.9-2 2-2h4"/>
                  <path d="M9 2h6c1.1 0 2 .9 2 2v4"/>
                  <path d="M15 22h4c1.1 0 2-.9 2-2v-4"/>
                  <path d="M22 9v6c0 1.1-.9 2-2 2h-4"/>
                  <path d="M9 22H5c-1.1 0-2-.9-2-2v-4"/>
                  <path d="M2 9v6c0 1.1.9 2 2 2h4"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Struktura modelu</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center">
                <InfoIcon className="w-4 h-4 mr-2" />
                <span>Informacje</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="structure" className="flex-grow p-0 border-0">
              <ModelTreeView 
                isLoading={isLoadingTree} 
                modelTree={modelTree as ModelTree} 
              />
            </TabsContent>
            
            <TabsContent value="info" className="flex-grow p-0 border-0">
              <ModelInfo 
                isLoading={isLoadingInfo} 
                modelInfo={modelInfo as ModelInfoType} 
              />
            </TabsContent>
          </Tabs>
        </aside>
      </main>
      
      <FooterBar 
        modelName={modelInfo?.filename || "Brak aktywnego modelu"} 
        partCount={modelInfo?.parts || 0} 
        entityCount={(modelInfo?.surfaces || 0) + (modelInfo?.solids || 0)}
      />
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onUpload={uploadModel}
      />
    </div>
  );
}
