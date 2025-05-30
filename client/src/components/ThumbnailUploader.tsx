import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Image, Upload, Crop } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ThumbnailUploaderProps {
  modelId: number;
  modelName: string;
}

export function ThumbnailUploader({ modelId, modelName }: ThumbnailUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const uploadThumbnailMutation = useMutation({
    mutationFn: async (thumbnailBlob: Blob) => {
      const formData = new FormData();
      formData.append('thumbnail', thumbnailBlob, `thumbnail_${modelId}.jpg`);
      
      const response = await apiRequest('POST', `/api/models/${modelId}/thumbnail`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('thumbnail_uploaded_successfully'),
      });
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      // Odśwież miniaturki w cache
      queryClient.invalidateQueries({ queryKey: ['/api/client/models'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library'] });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('thumbnail_upload_failed'),
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Sprawdź czy to plik obrazu
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error'),
        description: t('please_select_image_file'),
        variant: "destructive",
      });
      return;
    }

    // Sprawdź rozmiar pliku (maksymalnie 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('error'),
        description: t('file_too_large_5mb'),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Stwórz podgląd
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Stwórz podgląd przycięcia
    const image = document.createElement('img');
    image.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Ustaw rozmiar canvas na kwadrat 300x300
      canvas.width = 300;
      canvas.height = 300;
      
      // Oblicz wymiary do kadrowania na kwadrat
      const size = Math.min(image.width, image.height);
      const startX = (image.width - size) / 2;
      const startY = (image.height - size) / 2;
      
      // Wyczyść canvas
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 300, 300);
      
      // Narysuj obraz w kwadracie
      ctx.drawImage(
        image,
        startX, startY, size, size, // źródło
        0, 0, 300, 300 // cel
      );
      
      // Stwórz URL podglądu
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCroppedPreviewUrl(croppedUrl);
    };
    image.src = url;
  };

  const cropImageToSquare = (image: HTMLImageElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Ustaw rozmiar canvas na kwadrat 300x300
      canvas.width = 300;
      canvas.height = 300;
      
      // Oblicz wymiary do kadrowania na kwadrat
      const size = Math.min(image.width, image.height);
      const startX = (image.width - size) / 2;
      const startY = (image.height - size) / 2;
      
      // Wyczyść canvas
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 300, 300);
      
      // Narysuj obraz w kwadracie
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
          console.error('Canvas toBlob returned null');
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/jpeg', 0.85);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewUrl) return;
    
    setIsProcessing(true);
    
    try {
      // Załaduj obraz
      const image = document.createElement('img');
      image.onload = async () => {
        try {
          console.log('Image loaded, starting crop process');
          // Kadruj do kwadratu
          const croppedBlob = await cropImageToSquare(image);
          console.log('Image cropped successfully, blob size:', croppedBlob.size);
          
          // Prześlij na serwer
          await uploadThumbnailMutation.mutateAsync(croppedBlob);
          console.log('Thumbnail uploaded successfully');
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            title: t('error'),
            description: t('image_processing_failed'),
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };
      
      image.onerror = () => {
        toast({
          title: t('error'),
          description: t('invalid_image_file'),
          variant: "destructive",
        });
        setIsProcessing(false);
      };
      
      image.src = previewUrl;
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCroppedPreviewUrl(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Image className="h-4 w-4 mr-2" />
            {t('upload_thumbnail')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('upload_custom_thumbnail')}</DialogTitle>
            <DialogDescription>
              {t('upload_thumbnail_description').replace('{modelName}', modelName)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Wybór pliku */}
            <div>
              <Label htmlFor="thumbnail-file">{t('select_image_file')}</Label>
              <Input
                id="thumbnail-file"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t('supported_formats_jpg_png_max_5mb')}
              </p>
            </div>

            {/* Podgląd */}
            {previewUrl && (
              <div className="space-y-2">
                <Label>{t('preview')}</Label>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t('original')}</p>
                    <img 
                      src={previewUrl} 
                      alt="Original" 
                      className="max-w-32 max-h-32 object-contain border rounded"
                    />
                  </div>
                  <div className="flex items-center">
                    <Crop className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{t('cropped_to_square')}</p>
                    {croppedPreviewUrl ? (
                      <img 
                        src={croppedPreviewUrl} 
                        alt="Cropped preview" 
                        className="w-32 h-32 object-cover border rounded"
                      />
                    ) : (
                      <div className="w-32 h-32 border rounded bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                        300x300px
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing || uploadThumbnailMutation.isPending}
            >
              {isProcessing || uploadThumbnailMutation.isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('upload_thumbnail')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ukryty canvas do przetwarzania obrazów */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}