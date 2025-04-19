import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Unlock, Trash2, Share, FileText, Edit, ExternalLink, Copy, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import FooterBar from "@/components/FooterBar";
import UploadModal from "@/components/UploadModal";
import { useModelUpload } from "@/lib/hooks";

// Typ modelu do wyświetlenia
interface ClientModel {
  id: number;
  filename: string;
  shareId: string | null;
  shareEnabled: boolean;
  shareEmail: string | null;
  hasPassword: boolean;
  shareExpiryDate: string | null;
  shareLastAccessed: string | null;
}

export default function ClientDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedModel, setSelectedModel] = useState<ClientModel | null>(null);
  const [password, setPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Konfiguracja uploadera plików
  const { isUploading, uploadProgress, upload } = useModelUpload({
    onSuccess: (data) => {
      setIsUploadModalOpen(false);
      toast({
        title: t('upload_success'),
        description: data.filename,
      });
      refetch(); // Odśwież listę modeli
    },
    onError: (error) => {
      toast({
        title: t('upload_failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pobieranie modeli klienta
  const { data: models, isLoading, refetch } = useQuery<ClientModel[]>({
    queryKey: ["/api/client/models"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/models");
      if (!res.ok) {
        throw new Error("Błąd pobierania modeli");
      }
      return await res.json();
    }
  });

  // Mutacja zmiany hasła modelu
  const changePasswordMutation = useMutation({
    mutationFn: async ({ modelId, password }: { modelId: number, password: string }) => {
      const res = await apiRequest("POST", `/api/client/shared-models/${modelId}/password`, { password });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd zmiany hasła");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('password_updated'),
        description: t('password_update_success'),
      });
      setIsPasswordDialogOpen(false);
      setPassword("");
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('password_update_error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutacja usuwania modelu
  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const res = await apiRequest("DELETE", `/api/client/models/${modelId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd usuwania modelu");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('model_deleted'),
        description: t('model_delete_success'),
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('model_delete_error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutacja włączania udostępniania
  const enableSharingMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/models/${modelId}/share`, 
        {
          modelId,
          enableSharing: true,
          email: user?.email
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd podczas włączania udostępniania");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('sharing_enabled'),
        description: t('sharing_enabled_success'),
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('sharing_error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutacja wyłączania udostępniania
  const disableSharingMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/models/${modelId}/share`, 
        {
          modelId,
          enableSharing: false
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd podczas wyłączania udostępniania");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('sharing_disabled'),
        description: t('sharing_disabled_success'),
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('sharing_error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Obsługa zmiany hasła
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModel) {
      changePasswordMutation.mutate({ 
        modelId: selectedModel.id, 
        password 
      });
    }
  };

  // Obsługa usuwania modelu
  const handleDeleteModel = () => {
    if (selectedModel) {
      deleteModelMutation.mutate(selectedModel.id);
    }
  };
  
  // Generuje link do udostępnionego modelu
  const handleShowLink = (model: ClientModel) => {
    if (model.shareId && model.shareEnabled) {
      const baseUrl = window.location.origin;
      const shareLink = `${baseUrl}/shared/${model.shareId}`;
      setShareLink(shareLink);
      setSelectedModel(model);
      setLinkDialogOpen(true);
    } else {
      toast({
        title: t('link_error'),
        description: t('model_not_shared'),
        variant: "destructive",
      });
    }
  };

  // Kopiuje link do schowka
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({
        title: t('link_copied'),
        description: t('link_copied_to_clipboard'),
      });
    });
  };
  
  // Otwiera link w nowej karcie
  const handleOpenLink = () => {
    window.open(shareLink, '_blank');
  };
  
  // Otwiera model do podglądu
  const handleViewModel = (modelId: number) => {
    // Przekieruj do strony głównej z parametrem id modelu w tym samym oknie
    window.location.href = `/?id=${modelId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Obsługa uploadu pliku
  const handleUpload = (file: File, userEmail?: string) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let uploadUrl = '/api/models/upload'; // domyślnie dla STEP
    
    if (fileExtension === 'stl') {
      uploadUrl = '/api/models/upload-stl';
    } else if (fileExtension === 'dxf' || fileExtension === 'dwg') {
      uploadUrl = '/api/models/upload-cad';
    }
    
    console.log("[CLIENT] Przygotowanie do przesłania pliku:", {
      filename: file.name,
      email: userEmail || (user?.email || "brak"),
      fileSize: file.size,
      isLoggedIn: !!user
    });
    
    // Jeśli podano userEmail z komponentu UploadModal, użyj go
    if (userEmail) {
      uploadUrl += `?email=${encodeURIComponent(userEmail)}`;
      console.log("[CLIENT] Dodano email otrzymany z UploadModal:", uploadUrl);
    }
    // Jeśli nie ma userEmail, ale użytkownik jest zalogowany, używamy email z konta
    else if (user?.email) {
      uploadUrl += `?email=${encodeURIComponent(user.email)}`;
      console.log("[CLIENT] Dodano email zalogowanego użytkownika:", uploadUrl);
    }
    
    upload(file, uploadUrl);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={() => setIsUploadModalOpen(true)} />
      
      <main className="flex-grow flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back_to_home')}
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-gray-800">{t('client_dashboard')}</h1>
            <p className="ml-4 text-muted-foreground">
              {t('welcome')}, {user?.fullName || user?.email || user?.username}
            </p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('shared_models')}</CardTitle>
              <CardDescription>{t('shared_models_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {models && models.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('filename')}</TableHead>
                      <TableHead>{t('shared_with')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('last_accessed')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.filename}</TableCell>
                        <TableCell>{model.shareEmail || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {model.shareEnabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                {t('active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                {t('inactive')}
                              </span>
                            )}
                            {model.hasPassword && (
                              <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {model.shareLastAccessed 
                            ? new Date(model.shareLastAccessed).toLocaleDateString() 
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {/* Przycisk podglądu modelu */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewModel(model.id)}
                              title={t('view_model')}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">{t('view_model')}</span>
                            </Button>
                            
                            {/* Przycisk udostępniania - pokazuje link jeśli model jest już udostępniony */}
                            {model.shareEnabled && model.shareId ? (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleShowLink(model)}
                                title={t('view_share_link')}
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">{t('view_share_link')}</span>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => enableSharingMutation.mutate(model.id)}
                                disabled={enableSharingMutation.isPending}
                                title={t('enable_sharing')}
                              >
                                <Share className="h-4 w-4" />
                                <span className="sr-only">{t('enable_sharing')}</span>
                              </Button>
                            )}
                            
                            {/* Przycisk zmiany hasła - dostępny zawsze */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedModel(model);
                                setIsPasswordDialogOpen(true);
                              }}
                              title={t('change_password')}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">{t('change_password')}</span>
                            </Button>
                            
                            {/* Przycisk zakończenia udostępniania - widoczny tylko gdy model jest udostępniony */}
                            {model.shareEnabled && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => disableSharingMutation.mutate(model.id)}
                                disabled={disableSharingMutation.isPending}
                                title={t('disable_sharing')}
                              >
                                <Unlock className="h-4 w-4" />
                                <span className="sr-only">{t('disable_sharing')}</span>
                              </Button>
                            )}
                            
                            {/* Przycisk usuwania - dostępny zawsze */}
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setSelectedModel(model);
                                setIsDeleteDialogOpen(true);
                              }}
                              title={t('delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t('delete')}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t('no_models')}</h3>
                  <p className="text-muted-foreground mt-2">{t('no_models_description')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <FooterBar 
        modelName={t('client_dashboard')} 
        partCount={models?.length || 0} 
        entityCount={0}
      />

      {/* Dialog zmiany hasła */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('change_password')}</DialogTitle>
            <DialogDescription>
              {selectedModel?.filename}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="password">{t('new_password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('leave_empty_to_remove')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog usuwania modelu */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete_model')}</DialogTitle>
            <DialogDescription>
              {t('delete_model_confirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="font-medium">{selectedModel?.filename}</p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteModel}
              disabled={deleteModelMutation.isPending}
            >
              {deleteModelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog z linkiem do udostępnionego modelu */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('shareLink')}</DialogTitle>
            <DialogDescription>
              {selectedModel?.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex space-x-2 items-center">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {selectedModel?.hasPassword && (
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <Lock className="mr-2 h-4 w-4" />
                {t('model_is_password_protected')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLinkDialogOpen(false)}>
              {t('close')}
            </Button>
            <Button onClick={handleOpenLink}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {t('open_in_browser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal uploadu plików */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onUpload={handleUpload}
      />
    </div>
  );
}