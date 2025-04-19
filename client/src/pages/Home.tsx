import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ModelViewer from "@/components/ModelViewer";
import ModelInfo from "@/components/ModelInfo";
import FooterBar from "@/components/FooterBar";
import UploadModal from "@/components/UploadModal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useModelUpload } from "@/lib/hooks";
import { Box, InfoIcon, Upload } from "lucide-react";
import { ModelInfo as ModelInfoType } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("info");
  const [activeModelId, setActiveModelId] = useState<number | null>(null);
  
  // Sprawdź, czy w parametrach URL jest ID modelu
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = urlParams.get('id');
    if (modelId) {
      setActiveModelId(parseInt(modelId, 10));
    }
  }, [location]);
  
  const { isUploading, uploadProgress, upload } = useModelUpload({
    onSuccess: (data) => {
      setActiveModelId(data.id);
      setIsUploadModalOpen(false);
      toast({
        title: t('uploadProgress', { percent: '100' }),
        description: data.filename,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: t('uploadFailed'),
        description: error.message || t('fileError'),
        variant: "destructive",
      });
    },
  });
  
  // Query for model info if we have an active model
  const { data: modelInfo, isLoading: isLoadingInfo } = useQuery<ModelInfoType>({
    queryKey: ['/api/models', activeModelId, 'info'],
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
              <h2 className="text-xl font-medium mb-2">{t('noPreviousFiles')}</h2>
              <p className="text-center max-w-md mb-6">{t('supportedFormats')}</p>
              <Button 
                onClick={() => setIsUploadModalOpen(true)} 
                className="bg-primary hover:bg-blue-700 text-white"
              >
                <Upload className="mr-2 h-4 w-4" />
                <span>{t('upload')}</span>
              </Button>
            </div>
          ) : (
            <ModelViewer modelId={activeModelId} />
          )}
        </section>
        
        <aside className={`w-full lg:w-1/3 bg-white border-l border-gray-200 ${!hasModel ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <div className="w-full h-10 bg-slate-100 border-b border-gray-200 flex items-center px-3">
            <div className="flex items-center gap-2">
              <InfoIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{t('modelInformation')}</span>
            </div>
          </div>
          <div className="flex-grow">
            <ModelInfo 
              isLoading={isLoadingInfo} 
              modelInfo={modelInfo as ModelInfoType}
              modelId={activeModelId}
            />
          </div>
        </aside>
      </main>
      
      <FooterBar 
        modelName={modelInfo?.filename || t('loadingGeneric')} 
        partCount={modelInfo?.parts || 0} 
        entityCount={(modelInfo?.surfaces || 0) + (modelInfo?.solids || 0)}
      />
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onUpload={(file) => {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          let uploadUrl = '/api/models/upload'; // domyślnie dla STEP
          
          if (fileExtension === 'stl') {
            uploadUrl = '/api/models/upload-stl';
          } else if (fileExtension === 'dxf' || fileExtension === 'dwg') {
            uploadUrl = '/api/models/upload-cad';
          }
          
          upload(file, uploadUrl);
        }}
      />
    </div>
  );
}
