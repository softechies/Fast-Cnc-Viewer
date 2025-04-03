import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2, LockIcon, FileIcon, AlertCircle, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ModelViewer from "@/components/ModelViewer";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SharedModelPage() {
  const [, params] = useRoute("/shared/:shareId");
  const shareId = params?.shareId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [modelAccessed, setModelAccessed] = useState(false);
  const [modelId, setModelId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pobierz podstawowe informacje o udostępnionym modelu
  useEffect(() => {
    if (!shareId) return;
    
    const fetchSharedModelInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiRequest({
          url: `/api/shared/${shareId}`,
          method: "GET",
          on401: "throw"
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || t('error'));
        }
        
        const data = await response.json();
        setModelInfo(data);
        setRequiresPassword(data.requiresPassword);
        
        // Jeśli model nie wymaga hasła, automatycznie spróbuj uzyskać dostęp
        if (!data.requiresPassword) {
          accessSharedModel();
        }
      } catch (error) {
        console.error("Error loading model info:", error);
        setError(error instanceof Error ? error.message : t('error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedModelInfo();
  }, [shareId, t]);

  // Funkcja do uzyskania dostępu do modelu (z hasłem lub bez)
  const accessSharedModel = async () => {
    if (!shareId) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest({
        url: `/api/shared/${shareId}/access`,
        method: "POST",
        body: JSON.stringify({
          password: password.length > 0 ? password : undefined
        }),
        headers: {
          "Content-Type": "application/json"
        },
        on401: "throw"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresPassword) {
          setRequiresPassword(true);
          throw new Error(t('message.password.required'));
        } else {
          throw new Error(errorData.message || t('error'));
        }
      }
      
      const modelData = await response.json();
      setModelId(modelData.id);
      setModelAccessed(true);
      setRequiresPassword(false);
      
    } catch (error) {
      console.error("Error accessing model:", error);
      if (error instanceof Error && error.message === t('message.password.required')) {
        setRequiresPassword(true);
      } else {
        toast({
          title: t('error'),
          description: error instanceof Error ? error.message : t('error'),
          variant: "destructive",
          duration: 5000
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obsługa przesyłania formularza z hasłem
  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    accessSharedModel();
  };
  
  // Funkcja do usuwania udostępnienia modelu
  const handleDeleteSharing = async () => {
    if (!shareId) return;
    
    try {
      setIsDeleting(true);
      
      const response = await apiRequest({
        url: `/api/shared/${shareId}`,
        method: "DELETE",
        on401: "throw"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('error'));
      }
      
      toast({
        title: t('success'),
        description: t('sharingRemoved'),
        variant: "default",
        duration: 3000
      });
      
      // Przekieruj do strony głównej po udanym usunięciu
      setTimeout(() => {
        setLocation('/');
      }, 1000);
      
    } catch (error) {
      console.error("Error deleting share:", error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('error'),
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="flex justify-end w-full px-4 mb-8">
          <LanguageSelector />
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t('loading')}...</p>
      </div>
    );
  }

  // Render error state
  if (error && !requiresPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto text-center">
        <div className="flex justify-end w-full px-4 mb-8">
          <LanguageSelector />
        </div>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">{t('error')}</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          {t('button.back')}
        </Button>
      </div>
    );
  }

  // Render password protection screen
  if (requiresPassword && !modelAccessed) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockIcon className="h-5 w-5" />
                {t('model.share.password')}
              </CardTitle>
              <CardDescription>
                {t('message.password.required')}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitPassword}>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <FileIcon className="h-4 w-4" />
                    <span>{modelInfo?.filename}</span>
                  </div>
                  <Label htmlFor="password">{t('label.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('label.password.share.placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t('label.verification')}
                    </>
                  ) : (
                    t('button.view')
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Render main content with the model
  return (
    <div className="container mx-auto py-4">
      <div className="bg-muted/40 rounded-lg p-2 mb-4 border text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{modelInfo?.filename}</span>
            <span className="text-xs text-muted-foreground">
              ({t('label.shared.model')})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isDeleting}
                  className="flex items-center gap-1"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('loading')}...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('model.share.revoke')}
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('model.share.warning')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('message.delete.warning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSharing}>{t('button.delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('app.goto')}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="h-[calc(100vh-180px)] bg-background border rounded-lg overflow-hidden">
        {modelId && <ModelViewer modelId={modelId} />}
      </div>
    </div>
  );
}