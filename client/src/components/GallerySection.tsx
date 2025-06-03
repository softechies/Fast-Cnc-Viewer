import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ImageIcon, Sparkles, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import ModelViewer from './ModelViewer';

interface GallerySectionProps {
  modelId: number;
  modelName: string;
  onThumbnailUpdate?: () => void;
}

interface GalleryImage {
  id: number;
  filename: string;
  originalName: string;
  filesize: number;
  mimeType: string;
  displayOrder: number;
  isThumbnail: boolean;
  uploadedAt: string;
  s3Key?: string;
}

export function GallerySection({ modelId, modelName, onThumbnailUpdate }: GallerySectionProps) {
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [thumbnailKey, setThumbnailKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Pobierz istniejące obrazy galerii z serwera
  const { data: galleryImages = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/models', modelId, 'gallery'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/models/${modelId}/gallery`);
      if (!response.ok) {
        throw new Error('Failed to fetch gallery images');
      }
      return await response.json();
    }
  });

  // Ustaw aktualną miniaturkę
  React.useEffect(() => {
    const thumbnail = galleryImages.find((img: GalleryImage) => img.isThumbnail);
    if (thumbnail) {
      setCurrentThumbnail(`/api/models/${modelId}/gallery/${thumbnail.id}`);
    } else {
      setCurrentThumbnail(null);
    }
  }, [galleryImages, modelId]);

  // Mutacja do przesyłania obrazów
  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const response = await fetch(`/api/models/${modelId}/gallery`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      return response.json();
    },
    onSuccess: () => {
      refetch();
      onThumbnailUpdate?.();
      setUploadProgress(0);
      toast({
        title: t('gallery_uploaded_successfully'),
        description: t('images_uploaded_to_gallery'),
      });
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast({
        title: t('gallery_upload_failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutacja do ustawiania miniaturki
  const setThumbnailMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest('PUT', `/api/models/${modelId}/gallery/${imageId}/thumbnail`);
      if (!response.ok) {
        throw new Error('Failed to set thumbnail');
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      onThumbnailUpdate?.();
      setThumbnailKey(prev => prev + 1);
      toast({
        title: t('thumbnail_updated_successfully'),
        description: t('new_thumbnail_set'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutacja do usuwania obrazów
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiRequest('DELETE', `/api/models/${modelId}/gallery/${imageId}`);
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      onThumbnailUpdate?.();
      toast({
        title: t('image_deleted_successfully'),
        description: t('image_removed_from_gallery'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('image_delete_failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadProgress(10);
      uploadImagesMutation.mutate(files);
    }
  };

  return (
    <div className="space-y-6 border-t pt-6 mt-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium">{t('gallery_management')}</h5>
        <p className="text-sm text-muted-foreground">
          {t('manage_model_gallery', { modelName })}
        </p>
      </div>

      {/* Sekcja aktualnej miniaturki */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h6 className="font-medium text-sm">{t('current_thumbnail')}</h6>
          <div className="relative">
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
              {currentThumbnail ? (
                <img 
                  key={thumbnailKey}
                  src={`${currentThumbnail}?v=${thumbnailKey}`} 
                  alt="Current thumbnail" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
              {currentThumbnail && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded">
                  {t('active')}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {currentThumbnail ? t('thumbnail_active') : t('no_thumbnail_set')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModelViewer(true)}
              className="mt-2 w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {t('capture_screenshot')}
            </Button>
          </div>
        </div>

        {/* Sekcja przesyłania nowych obrazów */}
        <div className="space-y-3">
          <h6 className="font-medium text-sm">{t('upload_new_images')}</h6>
          <div className="space-y-2">
            <Label htmlFor={`gallery-upload-${modelId}`} className="text-sm">
              {t('select_image_files')}
            </Label>
            <Input
              id={`gallery-upload-${modelId}`}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploadImagesMutation.isPending}
              className="w-full"
            />
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="w-full" />
            )}
            <p className="text-xs text-muted-foreground">
              {t('click_set_thumbnail_note')}
            </p>
          </div>
        </div>

        {/* Miniaturka statystyki */}
        <div className="space-y-3">
          <h6 className="font-medium text-sm">{t('gallery_images')}</h6>
          <div className="text-2xl font-bold text-primary">
            {galleryImages.length}
          </div>
          <p className="text-sm text-muted-foreground">
            {galleryImages.length === 0 ? t('no_gallery_images') : t('images_in_gallery')}
          </p>
        </div>
      </div>

      {/* Sekcja przesłanych obrazów */}
      {galleryImages.length > 0 && (
        <div className="space-y-3">
          <h6 className="font-medium text-sm">{t('uploaded_images')}</h6>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {galleryImages.map((img: GalleryImage) => (
              <div key={img.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`/api/models/${modelId}/gallery/${img.id}`}
                    alt={img.originalName}
                    className="w-full h-full object-cover"
                  />
                  {img.isThumbnail && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                      {t('thumbnail')}
                    </div>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setThumbnailMutation.mutate(img.id)}
                      disabled={setThumbnailMutation.isPending || img.isThumbnail}
                      className="text-xs px-2 py-1"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('set_as_thumbnail')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImageMutation.mutate(img.id)}
                      disabled={deleteImageMutation.isPending}
                      className="text-xs px-2 py-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {img.originalName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal podglądu modelu 3D do robienia screenshotów */}
      {showModelViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[90vw] h-[90vh] max-w-6xl max-h-[800px] relative">
            {/* Header modalnego okna */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{t('capture_screenshot')} - {modelName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModelViewer(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Podgląd modelu 3D */}
            <div className="p-4 h-[calc(100%-120px)]">
              <ModelViewer
                modelId={modelId}
                isPublic={false}
              />
            </div>
            
            {/* Footer z instrukcjami */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t rounded-b-lg">
              <p className="text-sm text-gray-600">
                {t('screenshot_instructions')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}