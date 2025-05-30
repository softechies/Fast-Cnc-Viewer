import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ModelGalleryModalProps {
  modelId: number;
  modelName: string;
}

interface GalleryImage {
  file: File;
  previewUrl: string;
  croppedPreviewUrl?: string;
}

export function ModelGalleryModal({ modelId, modelName }: ModelGalleryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Check if model has existing thumbnail when modal opens
  const loadCurrentThumbnail = async () => {
    try {
      const response = await fetch(`/api/models/${modelId}/thumbnail`, {
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setCurrentThumbnail(url);
      }
    } catch (error) {
      // No existing thumbnail, that's fine
    }
  };

  const uploadThumbnailMutation = useMutation({
    mutationFn: async (thumbnailBlob: Blob) => {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailBlob, `thumbnail_${modelId}.jpg`);
      
      const response = await fetch(`/api/models/${modelId}/thumbnail`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('thumbnail_uploaded_successfully'),
      });
      // Refresh thumbnail display
      loadCurrentThumbnail();
      // Clear uploaded images
      setGalleryImages([]);
      // Refresh cache
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
        queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/thumbnail`] });
        queryClient.removeQueries({ queryKey: [`/api/models/${modelId}/thumbnail`] });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('thumbnail_upload_failed'),
        variant: "destructive",
      });
    },
  });

  const cropImageToSquare = (galleryImage: GalleryImage): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = 300;
        canvas.height = 300;
        
        const size = Math.min(image.width, image.height);
        const startX = (image.width - size) / 2;
        const startY = (image.height - size) / 2;
        
        ctx.drawImage(
          image,
          startX, startY, size, size,
          0, 0, 300, 300
        );
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/jpeg', 0.85);
      };
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = galleryImage.previewUrl;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 6) {
      toast({
        title: t('error'),
        description: `Możesz dodać maksymalnie 6 zdjęć. Obecnie masz ${galleryImages.length} zdjęć.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: GalleryImage[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('error'),
          description: `${t('invalid_image_file')}: ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: `${t('file_too_large_5mb')}: ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      validFiles.push({
        file,
        previewUrl
      });
    }

    if (validFiles.length > 0) {
      setGalleryImages(prev => [...prev, ...validFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setGalleryImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const setAsThumbnail = async (galleryImage: GalleryImage) => {
    setIsProcessing(true);
    try {
      const croppedBlob = await cropImageToSquare(galleryImage);
      await uploadThumbnailMutation.mutateAsync(croppedBlob);
    } catch (error) {
      console.error('Error setting thumbnail:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadCurrentThumbnail();
    } else {
      // Clean up URLs when closing
      galleryImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setGalleryImages([]);
      if (currentThumbnail) {
        URL.revokeObjectURL(currentThumbnail);
        setCurrentThumbnail(null);
      }
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                {currentThumbnail ? (
                  <div className="relative">
                    <img
                      src={currentThumbnail}
                      alt="Current thumbnail"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded">
                      {t('active')}
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {currentThumbnail ? t('thumbnail_active') : t('no_thumbnail_set')}
                </div>
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
                {t('supported_formats_jpg_png_max_5mb')} Maksymalnie 6 zdjęć na raz.
              </p>
            </div>

            {/* Uploaded Images Grid */}
            {galleryImages.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">{t('uploaded_images')} ({galleryImages.length}/6)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.previewUrl}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      
                      {/* Image Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setAsThumbnail(img)}
                          disabled={isProcessing}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          {t('set_as_thumbnail')}
                        </Button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('click_set_thumbnail_note')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpen(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}