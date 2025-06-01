import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import FooterBar from "@/components/FooterBar";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, File, FileText, Download, Image as ImageIcon, Flag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ModelViewer from "@/components/ModelViewer";
import CncServicesAd from "@/components/CncServicesAd";
import { useQuery } from "@tanstack/react-query";
import { Model } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GalleryImage {
  id: number;
  modelId: number;
  filename: string;
  originalName: string;
  filesize: number;
  mimeType: string;
  displayOrder: number;
  isThumbnail: boolean;
  uploadedAt: string;
  s3Key?: string;
}

interface ModelDescription {
  id: number;
  modelId: number;
  descriptionEn?: string;
  descriptionPl?: string;
  descriptionCs?: string;
  descriptionDe?: string;
  descriptionFr?: string;
  descriptionEs?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PublicModelPage() {
  const { t, language } = useLanguage();
  const [, params] = useRoute("/library/model/:publicId");
  const [, paramsWithLang] = useRoute("/:lang/library/model/:publicId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const publicId = params?.publicId || paramsWithLang?.publicId;

  console.log('PublicModelPage rendered with params:', params);
  console.log('PublicId:', publicId);

  // Fetch model info
  const { data: modelInfo, isLoading: isLoadingModel, error: modelError } = useQuery<Model>({
    queryKey: [`/api/public/models/${publicId}`],
    enabled: !!publicId,
  });

  // Fetch model description
  const { data: modelDescription, isLoading: isLoadingDescription } = useQuery<ModelDescription>({
    queryKey: [`/api/public/models/${publicId}/description`],
    enabled: !!publicId,
  });

  // Fetch gallery images
  const { data: galleryImages, isLoading: isLoadingGallery, error: galleryError } = useQuery<GalleryImage[]>({
    queryKey: ['public-model-gallery', publicId],
    queryFn: async () => {
      console.log('Fetching gallery for publicId:', publicId);
      const response = await fetch(`/api/public/models/${publicId}/gallery`);
      if (!response.ok) {
        throw new Error('Failed to fetch gallery');
      }
      const data = await response.json();
      console.log('Gallery data:', data);
      return data;
    },
    enabled: !!publicId,
  });

  console.log('Gallery state:', { galleryImages, isLoadingGallery, galleryError });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (model: Model) => {
    const format = model.format?.toLowerCase();
    if (format === 'stl') return <File className="h-4 w-4 text-blue-500" />;
    if (format === 'dxf' || format === 'dwg') return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const handleDownload = () => {
    if (!modelInfo || !publicId) return;
    
    const downloadUrl = `/api/public/models/${publicId}/file`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = modelInfo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  // Get description in current language
  const getModelDescription = () => {
    if (!modelDescription) return null;
    
    const languageKey = `description${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof ModelDescription;
    return modelDescription[languageKey] || modelDescription.descriptionEn || null;
  };

  const getImageUrl = (image: GalleryImage) => {
    return `/api/models/${modelInfo?.id}/gallery/${image.id}`;
  };

  const handleReportAbuse = () => {
    if (!modelInfo || !publicId) return;
    
    // Przygotuj dane do formularza kontaktowego
    const subject = `Report Abuse - Model: ${modelInfo.filename}`;
    const modelUrl = `${window.location.origin}/library/model/${publicId}`;
    const message = `I would like to report inappropriate content for the following model:
    
Model: ${modelInfo.filename}
URL: ${modelUrl}
Model ID: ${modelInfo.id}

Reason for report:
[Please describe the issue]`;

    // Przekieruj do strony kontaktowej z wypełnionymi danymi - zawsze używaj wersji angielskiej dla zgłoszeń nadużyć
    const contactPath = '/en/contact';
    const params = new URLSearchParams({
      subject: subject,
      message: message,
      modelId: modelInfo.id.toString()
    });
    
    setLocation(`${contactPath}?${params.toString()}`);
  };

  if (isLoadingModel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onUploadClick={() => {}} />
        <main className="flex-grow">
          <div className="container mx-auto py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
        <FooterBar />
      </div>
    );
  }

  if (modelError || !modelInfo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onUploadClick={() => {}} />
        <main className="flex-grow">
          <div className="container mx-auto py-6">
            <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t("common.error") || "Error"}</h2>
              <p className="text-center mb-4">
                {t("library.modelNotFound") || "Model not found"}
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.goBack") || "Go Back"}
              </Button>
            </div>
          </div>
        </main>
        <FooterBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={() => {}} />
      
      <main className="flex-grow">
        <div className="container mx-auto py-6">
          {/* Back button */}
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => {
              const libraryPath = language && language !== 'en' ? `/${language}/cad-library` : '/cad-library';
              setLocation(libraryPath);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.backToLibrary") || "Back to Library"}
          </Button>

          {/* 3D Viewer - Full Width */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getFileIcon(modelInfo)}
                {modelInfo.filename}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
                <ModelViewer
                  modelId={modelInfo.id}
                  isPublic={true}
                  publicId={publicId}
                />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="uppercase font-medium">{modelInfo.format}</span>
                  <span>•</span>
                  <span>{formatFileSize(modelInfo.filesize)}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t("common.download") || "Download"}
                  </Button>
                  
                  <Button variant="outline" onClick={handleReportAbuse}>
                    <Flag className="h-4 w-4 mr-2" />
                    {t("common.reportAbuse") || "Report Abuse"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FastCNC Services Advertisement */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <CncServicesAd 
                modelType={modelInfo.format?.toLowerCase() === 'stl' ? '3d' : modelInfo.format?.toLowerCase() === 'dxf' ? '2d' : 'unknown'} 
                modelInfo={modelInfo} 
              />
            </CardContent>
          </Card>

          {/* Model Description */}
          {getModelDescription() && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("common.description") || "Description"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {getModelDescription()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("common.modelInfo") || "Model Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">{t("common.filename") || "Filename"}:</span>
                  <p className="text-sm text-muted-foreground break-all">{modelInfo.filename}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium">{t("common.format") || "Format"}:</span>
                  <p className="text-sm text-muted-foreground">{modelInfo.format}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium">{t("common.filesize") || "File Size"}:</span>
                  <p className="text-sm text-muted-foreground">{formatFileSize(modelInfo.filesize)}</p>
                </div>
                
                {modelInfo.tags && modelInfo.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">{t("common.tags") || "Tags"}:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {modelInfo.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            {galleryImages && galleryImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    {t("common.gallery") || "Gallery"} ({galleryImages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingGallery ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {galleryImages.map((image) => (
                        <div
                          key={image.id}
                          className="aspect-square bg-muted/30 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(image)}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={image.originalName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedImage?.originalName}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={getImageUrl(selectedImage)}
                alt={selectedImage.originalName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FooterBar />
    </div>
  );
}