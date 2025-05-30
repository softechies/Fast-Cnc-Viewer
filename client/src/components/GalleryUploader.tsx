import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface GalleryUploaderProps {
  modelId: number;
  modelName: string;
}

interface GalleryImage {
  file: File;
  previewUrl: string;
  croppedPreviewUrl?: string;
}

export function GalleryUploader({ modelId, modelName }: GalleryUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const uploadGalleryMutation = useMutation({
    mutationFn: async (images: GalleryImage[]) => {
      if (images.length === 0) return;

      // Przygotuj pierwsze zdjęcie jako miniaturkę (przycięte do kwadratu)
      const thumbnailBlob = await cropImageToSquare(images[0]);
      
      // Prześlij miniaturkę
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
        description: t('gallery_uploaded_successfully'),
      });
      handleClose();
      // Odśwież cache
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
        queryClient.invalidateQueries({ queryKey: ['/api/library'] });
        queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/thumbnail`] });
        queryClient.removeQueries({ queryKey: [`/api/models/${modelId}/thumbnail`] });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('gallery_upload_failed'),
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
        
        // Ustaw rozmiar canvas na kwadrat 300x300
        canvas.width = 300;
        canvas.height = 300;
        
        // Oblicz wymiary do przycięcia (środkowy kwadrat)
        const size = Math.min(image.width, image.height);
        const startX = (image.width - size) / 2;
        const startY = (image.height - size) / 2;
        
        // Rysuj przycięty obraz
        ctx.drawImage(
          image,
          startX, startY, size, size, // źródło
          0, 0, 300, 300 // cel
        );
        
        // Konwertuj do Blob
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

    // Sprawdź czy możemy dodać więcej zdjęć (max 6)
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
      // Sprawdź czy to jest plik obrazu
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('error'),
          description: `${t('invalid_image_file')}: ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      // Sprawdź rozmiar pliku (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: `${t('file_too_large_5mb')}: ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      // Utwórz URL podglądu
      const previewUrl = URL.createObjectURL(file);
      validFiles.push({
        file,
        previewUrl
      });
    }

    if (validFiles.length > 0) {
      setGalleryImages(prev => [...prev, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setGalleryImages(prev => {
      const newImages = [...prev];
      // Zwolnij URL
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleUpload = async () => {
    if (galleryImages.length === 0) {
      toast({
        title: t('error'),
        description: t('please_select_image_file'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await uploadGalleryMutation.mutateAsync(galleryImages);
    } catch (error) {
      console.error('Error uploading gallery:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Zwolnij wszystkie URL
    galleryImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setGalleryImages([]);
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            {t('add_gallery')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('add_gallery_title')}</DialogTitle>
            <DialogDescription>
              {t('add_gallery_description').replace('{modelName}', modelName)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="gallery-files">{t('select_image_files')}</Label>
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
                {t('supported_formats_jpg_png_max_5mb')} Maksymalnie 6 zdjęć.
              </p>
            </div>

            {galleryImages.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">{t('gallery_preview')} ({galleryImages.length}/6)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.previewUrl}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          {t('thumbnail')}
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('first_image_thumbnail_note')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={galleryImages.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('upload_gallery')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}