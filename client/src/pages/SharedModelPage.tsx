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
import fastCncLogo from "@/assets/fastcnc-logo.jpg";
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

  // Pobierz podstawowe informacje o udostępnionym modelu
  useEffect(() => {
    if (!shareId) return;
    
    const fetchSharedModelInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiRequest(
          "GET",
          `/api/shared/${shareId}`,
          undefined,
          {
            on401: "throw"
          }
        );
        
        // apiRequest już rzuca błąd, jeśli response nie jest ok, więc ten kod nie jest już potrzebny
        
        const data = await response.json();
        setModelInfo(data);
        setRequiresPassword(data.requiresPassword);
        
        // Jeśli model nie wymaga hasła, automatycznie spróbuj uzyskać dostęp
        if (!data.requiresPassword) {
          accessSharedModel();
        }
      } catch (error) {
        console.error("Błąd podczas pobierania informacji o modelu:", error);
        setError(error instanceof Error ? error.message : t("errors.model.fetch"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedModelInfo();
  }, [shareId]);

  // Funkcja do uzyskania dostępu do modelu (z hasłem lub bez)
  const accessSharedModel = async () => {
    if (!shareId) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest(
        "POST",
        `/api/shared/${shareId}/access`,
        {
          password: password.length > 0 ? password : undefined
        },
        {
          on401: "throw"
        }
      );
      
      const modelData = await response.json();
      
      if (modelData.requiresPassword) {
        setRequiresPassword(true);
        throw new Error(t("errors.password_required"));
      }
      
      setModelId(modelData.id);
      setModelAccessed(true);
      setRequiresPassword(false);
      
    } catch (error) {
      console.error("Błąd podczas uzyskiwania dostępu do modelu:", error);
      if (error instanceof Error && error.message === t("errors.password_required")) {
        setRequiresPassword(true);
      } else {
        toast({
          title: t("errors.title"),
          description: error instanceof Error ? error.message : t("errors.model.access"),
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
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("loading.shared_model")}</p>
      </div>
    );
  }

  if (error && !requiresPassword) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Nie można wyświetlić modelu</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Wróć do strony głównej
        </Button>
      </div>
    );
  }

  // Jeśli wymagane jest hasło
  if (requiresPassword && !modelAccessed) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <Card className="w-full max-w-md">
          <div className="flex justify-between items-center px-4 mt-4">
            <img src={fastCncLogo} alt="FastCNC Logo" className="h-12" />
            <LanguageSelector />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockIcon className="h-5 w-5" />
              Chroniony model
            </CardTitle>
            <CardDescription>
              Ten model jest chroniony hasłem.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitPassword}>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <FileIcon className="h-4 w-4" />
                  <span>{modelInfo?.filename}</span>
                </div>
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Wprowadź hasło do modelu"
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
                    Weryfikacja...
                  </>
                ) : (
                  "Uzyskaj dostęp"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Gdy model został pomyślnie otwarty
  return (
    <div className="container mx-auto py-4">
      <div className="bg-muted/40 rounded-lg p-2 mb-4 border text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={fastCncLogo} alt="FastCNC Logo" className="h-6 mr-2" />
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{modelInfo?.filename}</span>
            <span className="text-xs text-muted-foreground">
              (Udostępniony model)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Przejdź do aplikacji</span>
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