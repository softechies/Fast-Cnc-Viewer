import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ModelViewer from "@/components/ModelViewer";
import FooterBar from "@/components/FooterBar";
import UploadModal from "@/components/UploadModal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useModelUpload } from "@/lib/hooks";
import { Box, InfoIcon, Upload } from "lucide-react";
import { ModelInfo as ModelInfoType } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";

export default function Home() {
  const { language, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [isRoot] = useRoute("/");
  
  // Przekieruj z głównej strony bez prefiksu językowego na stronę z prefiksem
  // ale tylko jeśli jesteśmy dokładnie na stronie głównej
  useEffect(() => {
    if (isRoot && location === '/') {
      setLocation(`/${language}`);
    }
  }, [isRoot, language, location]);
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
        <section className="flex-grow bg-gray-50 relative h-[500px] lg:h-auto">
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
      </main>
      
      <FooterBar />
      
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
