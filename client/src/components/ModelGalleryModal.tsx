import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ImageIcon, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import ModelViewer from './ModelViewer';

interface ModelGalleryModalProps {
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

export function ModelGalleryModal({ modelId, modelName, onThumbnailUpdate }: ModelGalleryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [thumbnailKey, setThumbnailKey] = useState(0); // Force re-render of thumbnail
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
    },
    enabled: isOpen
  });

  // Check if model has existing thumbnail when modal opens
  const loadCurrentThumbnail = async () => {
    try {
      const response = await fetch(`/api/models/${modelId}/thumbnail`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setCurrentThumbnail(url);
      }
    } catch (error) {
      // No thumbnail exists
    }
  };

  const uploadGalleryMutation = useMutation({
    mutationFn: async (files: File[]) => {
      console.log('Starting gallery upload with files:', files.map(f => ({ name: f.name, size: f.size })));
      
      // Reset progress
      setUploadProgress(0);
      
      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`Appending file ${index}:`, file.name, file.size);
        formData.append('images', file);
      });

      console.log('FormData entries count:', formData.has('images'));

      // Create XMLHttpRequest to track upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              setUploadProgress(100);
              resolve(result);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `/api/models/${modelId}/gallery`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('gallery_uploaded_successfully'),
      });
      setUploadProgress(0); // Reset progress after success
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('gallery_upload_failed'),
        variant: "destructive",
      });
      setUploadProgress(0); // Reset progress on error
    },
  });

  const setAsThumbnailMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/models/${modelId}/gallery/${imageId}/thumbnail`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to set thumbnail');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('thumbnail_updated_successfully'),
      });
      refetch();
      // Dispatch custom event to notify ModelThumbnail components
      window.dispatchEvent(new CustomEvent(`thumbnail-updated-${modelId}`));
      // Force thumbnail re-render by updating key
      setThumbnailKey(prev => prev + 1);
      // Invalidate multiple cache keys to refresh all related data
      queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/models', modelId, 'thumbnail'] });
      queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/thumbnail`] });
      queryClient.invalidateQueries({ queryKey: ['/api/models', modelId] });
      // Force refresh of the parent component if callback is provided
      if (onThumbnailUpdate) {
        onThumbnailUpdate();
      }
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('thumbnail_update_failed'),
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/models/${modelId}/gallery/${imageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('image_deleted_successfully'),
      });
      refetch();
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/models', modelId, 'gallery'] });
      // Force thumbnail re-render in case deleted image was the thumbnail
      setThumbnailKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent(`thumbnail-updated-${modelId}`));
      if (onThumbnailUpdate) {
        onThumbnailUpdate();
      }
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('image_delete_failed'),
        variant: "destructive",
      });
    },
  });

  // Generate thumbnail mutation
  const generateThumbnailMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest('POST', `/api/models/${modelId}/generate-thumbnail`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || 'Failed to generate thumbnail');
        }
        return await response.json();
      } catch (error) {
        console.error('Thumbnail generation error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      try {
        toast({
          title: t('success'),
          description: t('thumbnail_generated_successfully'),
          variant: "default",
        });
        
        // Force thumbnail re-render by updating key
        setThumbnailKey(prev => prev + 1);
        
        // Dispatch custom event to notify ModelThumbnail components
        window.dispatchEvent(new CustomEvent(`thumbnail-updated-${modelId}`));
        
        // Invalidate cache to refresh thumbnails and gallery sequentially to avoid race conditions
        await queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/models', modelId, 'thumbnail'] });
        await queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/thumbnail`] });
        await queryClient.invalidateQueries({ queryKey: ['/api/models', modelId, 'gallery'] });
        
        // Refresh the gallery data in this modal
        refetch();
        
        if (onThumbnailUpdate) {
          onThumbnailUpdate();
        }
      } catch (updateError) {
        console.error('Error updating UI after thumbnail generation:', updateError);
      }
    },
    onError: (error: any) => {
      console.error('Thumbnail generation mutation error:', error);
      toast({
        title: t('error'),
        description: error.message || t('thumbnail_generation_failed'),
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select event triggered');
    const files = event.target.files;
    console.log('Selected files:', files);
    
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Files found:', files.length, Array.from(files).map(f => f.name));

    if (galleryImages.length + files.length > 6) {
      toast({
        title: t('error'),
        description: `Możesz dodać maksymalnie 6 zdjęć. Obecnie masz ${galleryImages.length} zdjęć.`,
        variant: "destructive",
      });
      return;
    }

    // Walidacja plików
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('error'),
          description: `${t('invalid_image_file')}: ${file.name}`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: `${t('file_too_large_5mb')}: ${file.name}`,
          variant: "destructive",
        });
        return;
      }
    }

    console.log('About to upload files, converting FileList to Array');
    // Konwertuj FileList do Array przed przesłaniem
    const filesArray = Array.from(files);
    console.log('Files array:', filesArray.map(f => f.name));
    uploadGalleryMutation.mutate(filesArray);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadCurrentThumbnail();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            {t('add_gallery')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('gallery_management')}</DialogTitle>
            <DialogDescription>
              {t('manage_model_gallery').replace('{modelName}', modelName)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Thumbnail Section */}
            <div>
              <h4 className="font-medium mb-3">{t('current_thumbnail')}</h4>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={`/api/models/${modelId}/thumbnail?t=${thumbnailKey}_${Date.now()}`}
                    alt="Current thumbnail"
                    className="w-24 h-24 object-cover rounded border"
                    onError={(e) => {
                      // If thumbnail fails to load, show placeholder
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                    onLoad={(e) => {
                      // If thumbnail loads successfully, hide placeholder
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'block';
                      target.nextElementSibling?.classList.add('hidden');
                    }}
                  />
                  <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center absolute top-0 left-0">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded">
                    {t('active')}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentThumbnail ? t('thumbnail_active') : t('no_thumbnail_set')}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModelViewer(true)}
                  className="mt-2"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t('capture_screenshot')}
                </Button>
              </div>
            </div>

            {/* Upload New Images Section */}
            <div>
              <Label htmlFor="gallery-files" className="text-base font-medium">
                {t('upload_new_images')}
              </Label>
              <Input
                id="gallery-files"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/jpg"
                multiple
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {t('supported_formats_jpg_png_max_5mb')} {t('max_6_photos_at_once')}
              </p>
              
              {/* Progress Bar */}
              {uploadGalleryMutation.isPending && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('uploading_images')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>

            {/* Gallery Images Grid */}
            <div>
              <h4 className="font-medium mb-3">{t('gallery_images')} ({galleryImages.length}/6)</h4>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ładowanie obrazów galerii...</p>
                </div>
              ) : galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={`/api/models/${modelId}/gallery/${img.id}`}
                        alt={img.originalName}
                        className="w-full h-32 object-cover rounded border"
                      />
                      
                      {/* Image Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setAsThumbnailMutation.mutate(img.id)}
                          disabled={setAsThumbnailMutation.isPending || uploadGalleryMutation.isPending}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          {setAsThumbnailMutation.isPending ? `${t('processing')}...` : t('set_as_thumbnail')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteImageMutation.mutate(img.id)}
                          disabled={deleteImageMutation.isPending || uploadGalleryMutation.isPending}
                        >
                          {deleteImageMutation.isPending ? `${t('deleting')}...` : t('delete')}
                        </Button>
                      </div>
                      
                      {/* Active Thumbnail Indicator */}
                      {img.isThumbnail && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded">
                          {t('active')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('no_gallery_images')}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {t('click_set_thumbnail_note')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpen(false)}>
              {t('close_gallery')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  );
}