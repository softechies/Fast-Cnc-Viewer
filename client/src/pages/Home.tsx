import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ModelViewer from "@/components/ModelViewer";
import FooterBar from "@/components/FooterBar";
import UploadModal from "@/components/UploadModal";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useModelUpload } from "@/lib/hooks";
import { Box, InfoIcon, Upload, BookOpen } from "lucide-react";
import { ModelInfo as ModelInfoType } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";

export default function Home() {
  const { language, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [isRoot] = useRoute("/");
  
  // Przekieruj z głównej strony bez prefiksu językowego na stronę z prefiksem
  // zachowując parametry URL
  useEffect(() => {
    if (isRoot && location === '/') {
      const currentParams = window.location.search;
      setLocation(`/${language}${currentParams}`);
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
        title: t('uploadError', 'Upload failed'),
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    },
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-2xl w-full">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Box className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {t('app_title', 'CAD File Viewer')}
                  </h1>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {t('app_description', 'Professional online viewer for CAD files. Upload and view STL, STEP, DXF, and DWG files directly in your browser. Share models securely with password protection and access them from anywhere.')}
                  </p>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {t('supported_formats', 'Supported Formats')}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">STL</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">STEP</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">DXF</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">DWG</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => setIsUploadModalOpen(true)} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                      size="lg"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      <span>{t('upload_file', 'Upload File')}</span>
                    </Button>
                    <Button 
                      variant="outline"
                      size="lg"
                      onClick={() => setLocation('/cad-library')}
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      <span>{t('library.title')}</span>
                    </Button>
                  </div>
                </div>
              </div>
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