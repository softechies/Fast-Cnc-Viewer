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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Unlock, Trash2, Share, FileText, Edit, ExternalLink, Copy, ArrowLeft, Plus, BookOpen, Download, Camera, ImageIcon, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import FooterBar from "@/components/FooterBar";
import UploadModal from "@/components/UploadModal";
import CadUploader from "@/components/CadUploader";
import { useModelUpload } from "@/lib/hooks";
import { ModelThumbnail } from "@/components/ModelThumbnail";

import { Textarea } from "@/components/ui/textarea";
import { ModelCategorization } from "@/components/ModelCategorization";
import { ModelDescriptionDialog } from "@/components/ModelDescriptionDialog";
import ModelViewer from "@/components/ModelViewer";
import { Progress } from "@/components/ui/progress";
import { GallerySection } from "@/components/GallerySection";

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
  isPublic: boolean;
  categoryId: number | null;
}

export default function ClientDashboardPage() {
  const { t, language: currentLanguage } = useLanguage();
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
  const [isCadUploaderOpen, setIsCadUploaderOpen] = useState(false);
  const [expandedModelId, setExpandedModelId] = useState<number | null>(null);
  const [modelDescriptions, setModelDescriptions] = useState<Record<string, string>>({});
  const [modelTags, setModelTags] = useState<Record<string, string>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<Record<number, string>>({});
  const [showModelViewer, setShowModelViewer] = useState(false);
  const [currentModelForScreenshot, setCurrentModelForScreenshot] = useState<ClientModel | null>(null);
  
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

  // Pobieranie kategorii
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user
  });

  // Pobieranie tagów i opisów dla wszystkich modeli
  const { data: modelTagsData = {} } = useQuery({
    queryKey: ["/api/models/tags-descriptions"],
    queryFn: async () => {
      if (!models || models.length === 0) return {};
      
      const tagsAndDescriptions: Record<string, any> = {};
      
      // Pobierz tagi i opisy dla każdego modelu
      for (const model of models) {
        try {
          // Pobierz tagi
          const tagsRes = await apiRequest("GET", `/api/models/${model.id}/tags`);
          const tags = tagsRes.ok ? await tagsRes.json() : [];
          
          // Pobierz opis
          const descRes = await apiRequest("GET", `/api/models/${model.id}/description`);
          const description = descRes.ok ? await descRes.json() : null;
          
          tagsAndDescriptions[model.id] = {
            tags,
            description
          };
        } catch (error) {
          console.error(`Error fetching data for model ${model.id}:`, error);
        }
      }
      
      return tagsAndDescriptions;
    },
    enabled: !!models && models.length > 0
  });

  // Aktualizuj pola tekstowe na podstawie pobranych danych
  useEffect(() => {
    if (modelTagsData && Object.keys(modelTagsData).length > 0) {
      const newDescriptions: Record<string, string> = {};
      const newTags: Record<string, string> = {};
      
      Object.entries(modelTagsData).forEach(([modelId, data]: [string, any]) => {
        const modelIdNum = parseInt(modelId);
        
        // Aktualizuj opisy dla każdego języka
        if (data.description) {
          if (data.description.descriptionEn) {
            newDescriptions[`${modelId}_en`] = data.description.descriptionEn;
          }
          if (data.description.descriptionPl) {
            newDescriptions[`${modelId}_pl`] = data.description.descriptionPl;
          }
          if (data.description.descriptionCs) {
            newDescriptions[`${modelId}_cs`] = data.description.descriptionCs;
          }
          if (data.description.descriptionDe) {
            newDescriptions[`${modelId}_de`] = data.description.descriptionDe;
          }
          if (data.description.descriptionFr) {
            newDescriptions[`${modelId}_fr`] = data.description.descriptionFr;
          }
          if (data.description.descriptionEs) {
            newDescriptions[`${modelId}_es`] = data.description.descriptionEs;
          }
        }
        
        // Aktualizuj tagi dla każdego języka
        if (data.tags && data.tags.length > 0) {
          const tagsByLanguage = {
            en: data.tags.map((tag: any) => tag.nameEn).filter(Boolean).join(', '),
            pl: data.tags.map((tag: any) => tag.namePl).filter(Boolean).join(', '),
            cs: data.tags.map((tag: any) => tag.nameCs).filter(Boolean).join(', '),
            de: data.tags.map((tag: any) => tag.nameDe).filter(Boolean).join(', '),
            fr: data.tags.map((tag: any) => tag.nameFr).filter(Boolean).join(', '),
            es: data.tags.map((tag: any) => tag.nameEs).filter(Boolean).join(', ')
          };
          
          Object.entries(tagsByLanguage).forEach(([lang, tagsStr]) => {
            if (tagsStr) {
              newTags[`${modelId}_${lang}`] = tagsStr;
            }
          });
        }
      });
      
      setModelDescriptions(prev => ({ ...prev, ...newDescriptions }));
      setModelTags(prev => ({ ...prev, ...newTags }));
    }
  }, [modelTagsData]);

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

  // Mutacja aktualizacji kategorii modelu
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ modelId, categoryId }: { modelId: number, categoryId: number | null }) => {
      const res = await apiRequest("PUT", `/api/models/${modelId}/category`, { categoryId });
      if (!res.ok) {
        throw new Error("Błąd podczas aktualizacji kategorii");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: "Kategoria została zaktualizowana",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutacja zarządzania statusem publicznej biblioteki CAD
  const togglePublicLibraryMutation = useMutation({
    mutationFn: async ({ modelId, isPublic }: { modelId: number; isPublic: boolean }) => {
      const res = await apiRequest(
        "POST", 
        `/api/client/models/${modelId}/public-library`, 
        { isPublic }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd podczas aktualizacji statusu publicznej biblioteki");
      }
      return await res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.isPublic ? t('public_library_added') : t('public_library_removed'),
        description: variables.isPublic ? t('public_library_added_message') : t('public_library_removed_message'),
      });
      refetch();
    },
    onError: (error: Error, variables) => {
      // Sprawdź czy to błąd związany z modelem chronionym hasłem
      if (error.message.includes("chronionego hasłem") || 
          error.message.includes("password-protected") ||
          error.message.includes("chráněný heslem") ||
          error.message.includes("Passwort-geschützt") ||
          error.message.includes("protégé par mot de passe")) {
        toast({
          title: t('error'),
          description: t('password_protected_public_error'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('error'),
          description: error.message,
          variant: "destructive",
        });
      }
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
    // Przekieruj do strony głównej z parametrem id modelu zachowując kontekst językowy
    const currentPath = location.split('/')[1];
    const isLanguagePath = ['en', 'pl', 'cs', 'de', 'fr'].includes(currentPath);
    const targetPath = isLanguagePath ? `/${currentPath}?id=${modelId}` : `/?id=${modelId}`;
    setLocation(targetPath);
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
    
    // Dodajemy parametr autoShare=true, aby model był automatycznie udostępniany po przesłaniu
    // Ten parametr jest używany w endpointach upload-stl, upload-cad i upload
    const queryParams = [];
    
    // Jeśli podano userEmail z komponentu UploadModal, użyj go
    if (userEmail) {
      queryParams.push(`email=${encodeURIComponent(userEmail)}`);
      console.log("[CLIENT] Dodano email otrzymany z UploadModal");
    }
    // Jeśli nie ma userEmail, ale użytkownik jest zalogowany, używamy email z konta
    else if (user?.email) {
      queryParams.push(`email=${encodeURIComponent(user.email)}`);
      console.log("[CLIENT] Dodano email zalogowanego użytkownika");
    }
    
    // Dodajemy parametr autoShare=true
    queryParams.push('autoShare=true');
    console.log("[CLIENT] Dodano parametr autoShare=true");
    
    // Dodajemy parametry do URL
    if (queryParams.length > 0) {
      uploadUrl += `?${queryParams.join('&')}`;
    }
    
    console.log("[CLIENT] Finalny URL uploadu:", uploadUrl);
    
    upload(file, uploadUrl);
  };

  const handleDownload = (model: ClientModel) => {
    const downloadUrl = `/api/models/${model.id}/file`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = model.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={() => setIsUploadModalOpen(true)} />
      
      <main className="flex-grow flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back_to_home')}
              </Link>
            </Button>
            <h1 className="text-xl font-medium text-gray-800">{t('client_dashboard')}</h1>
            <p className="ml-4 text-muted-foreground">
              {t('welcome')}, {user?.fullName || user?.email || user?.username}
            </p>
          </div>
        </div>
        
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>{t('your_cad_library')}</CardTitle>
                <CardDescription>{t('models_uploaded_to_account')}</CardDescription>
              </div>
              <div className="flex flex-row space-x-2">
                <Button onClick={() => setIsCadUploaderOpen(true)} variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload to library
                </Button>
                <Button onClick={() => setIsUploadModalOpen(true)}>
                  <Share className="mr-2 h-4 w-4" />
                  Upload and share
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cad-library">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t('library.title')}
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {models && models.length > 0 ? (
                <div className="text-muted-foreground">
                  {t('models_count_in_library', { count: models.length })}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  {t('no_models_in_library')}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('shared_models')}</CardTitle>
              <CardDescription>{t('shared_models_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {models && models.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('filename')}</TableHead>
                        <TableHead>{t('upload_thumbnail')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead>{t('shared_status')}</TableHead>
                        <TableHead>{t('last_accessed')}</TableHead>
                        <TableHead>{t('add_to_cad_library')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.flatMap((model) => {
                        const mainRow = (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <ModelThumbnail 
                                modelId={model.id} 
                                filename={model.filename}
                                className="w-12 h-12 flex-shrink-0"
                              />
                              <span className="truncate">{model.filename}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setExpandedModelId(expandedModelId === model.id ? null : model.id);
                                if (!selectedLanguages[model.id]) {
                                  setSelectedLanguages(prev => ({ ...prev, [model.id]: currentLanguage }));
                                }
                              }}
                              className="w-full"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              {t('model_details')}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={model.categoryId?.toString() || "none"}
                              onValueChange={(value) => {
                                const categoryId = value === "none" ? null : parseInt(value);
                                updateCategoryMutation.mutate({ modelId: model.id, categoryId });
                              }}
                              disabled={updateCategoryMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder={t('select_category')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{t('no_category')}</SelectItem>
                                {categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0" 
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <span className="truncate">
                                        {t(category.slug) || category.nameEn}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
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
                          <TableCell>
                            <Switch 
                              checked={model.isPublic || false}
                              onCheckedChange={async (checked: boolean) => {
                                if (checked) {
                                  // Sprawdź czy model ma kategorię przed dodaniem do publicznej biblioteki
                                  if (!model.categoryId) {
                                    toast({
                                      title: t('error'),
                                      description: t('category_required_for_public'),
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  // Sprawdź czy model ma miniaturkę przed dodaniem do publicznej biblioteki
                                  try {
                                    const response = await fetch(`/api/models/${model.id}/thumbnail`, {
                                      method: 'HEAD'
                                    });
                                    if (!response.ok) {
                                      toast({
                                        title: t('error'),
                                        description: t('thumbnail_required_for_public'),
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                  } catch (error) {
                                    toast({
                                      title: t('error'),
                                      description: t('thumbnail_required_for_public'),
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                }
                                
                                togglePublicLibraryMutation.mutate({
                                  modelId: model.id,
                                  isPublic: checked
                                });
                              }}
                              className={model.isPublic && model.hasPassword ? "data-[state=checked]:bg-red-500" : ""}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {/* Przycisk pobierania */}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDownload(model)}
                                title={t('common.download') || 'Download'}
                                className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">{t('common.download') || 'Download'}</span>
                              </Button>
                              
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
                        );

                        const expandedRow = expandedModelId === model.id ? (
                          <TableRow key={`${model.id}-expanded`}>
                            <TableCell colSpan={7} className="bg-gray-50 p-0">
                              <div className="p-6 space-y-4 border-t">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-lg">{t('model_details')} - {model.filename}</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExpandedModelId(null)}
                                  >
                                    {t('close')}
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium">{t('category')}</Label>
                                    <Select 
                                      value={model.categoryId?.toString() || "none"} 
                                      onValueChange={(value) => {
                                        const categoryId = value === "none" ? null : parseInt(value);
                                        updateCategoryMutation.mutate({ modelId: model.id, categoryId });
                                      }}
                                      disabled={updateCategoryMutation.isPending}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('select_category')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">{t('no_category')}</SelectItem>
                                        {Array.isArray(categories) && categories.map((category: any) => (
                                          <SelectItem key={category.id} value={category.id.toString()}>
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                                style={{ backgroundColor: category.color }}
                                              />
                                              <span className="truncate">
                                                {t(category.slug) || category.nameEn}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium">{t('common.tags')}</Label>
                                    <div className="space-y-2">
                                      <Select 
                                        value={selectedLanguages[model.id] || currentLanguage} 
                                        onValueChange={(value) => {
                                          setSelectedLanguages(prev => ({ ...prev, [model.id]: value }));
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder={t('select_language')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="en">English</SelectItem>
                                          <SelectItem value="pl">Polski</SelectItem>
                                          <SelectItem value="cs">Čeština</SelectItem>
                                          <SelectItem value="de">Deutsch</SelectItem>
                                          <SelectItem value="fr">Français</SelectItem>
                                          <SelectItem value="es">Español</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      <Input
                                        placeholder={t('enter_tags_placeholder')}
                                        value={modelTags[`${model.id}_${selectedLanguages[model.id] || currentLanguage}`] || ""}
                                        onChange={(e) => {
                                          const key = `${model.id}_${selectedLanguages[model.id] || currentLanguage}`;
                                          setModelTags(prev => ({ ...prev, [key]: e.target.value }));
                                        }}
                                        className="w-full"
                                      />
                                      
                                      <Button 
                                        size="sm"
                                        onClick={async () => {
                                          const language = selectedLanguages[model.id] || currentLanguage;
                                          const tags = modelTags[`${model.id}_${language}`];
                                          if (tags?.trim()) {
                                            try {
                                              const response = await apiRequest('POST', `/api/models/${model.id}/tags-translate`, {
                                                tags: tags.trim(),
                                                language: language
                                              });
                                              
                                              if (response.ok) {
                                                toast({
                                                  title: t('success'),
                                                  description: t('tags_saved_successfully'),
                                                });
                                                // Invaliduj cache'e
                                                queryClient.invalidateQueries({ queryKey: ["/api/models/tags-descriptions"] });
                                                queryClient.invalidateQueries({ queryKey: [`/api/models/${model.id}/tags`] });
                                              } else {
                                                throw new Error('Failed to save tags');
                                              }
                                            } catch (error) {
                                              toast({
                                                title: t('error'),
                                                description: t('tags_save_failed'),
                                                variant: "destructive",
                                              });
                                            }
                                          }
                                        }}
                                      >
                                        {t('save_tags')}
                                      </Button>
                                      
                                      <p className="text-xs text-muted-foreground">
                                        {t('tags_help_text')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">

                                  <div className="space-y-3">
                                    <Label className="text-sm font-medium">{t('model_description')}</Label>
                                    <div className="space-y-2">
                                      <Select 
                                        value={selectedLanguages[model.id] || currentLanguage} 
                                        onValueChange={(value) => {
                                          setSelectedLanguages(prev => ({ ...prev, [model.id]: value }));
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder={t('select_language')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="en">English</SelectItem>
                                          <SelectItem value="pl">Polski</SelectItem>
                                          <SelectItem value="cs">Čeština</SelectItem>
                                          <SelectItem value="de">Deutsch</SelectItem>
                                          <SelectItem value="fr">Français</SelectItem>
                                          <SelectItem value="es">Español</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      <Textarea
                                        placeholder={t('enter_model_description_placeholder')}
                                        value={modelDescriptions[`${model.id}_${selectedLanguages[model.id] || currentLanguage}`] || ""}
                                        onChange={(e) => {
                                          const key = `${model.id}_${selectedLanguages[model.id] || currentLanguage}`;
                                          setModelDescriptions(prev => ({ ...prev, [key]: e.target.value }));
                                        }}
                                        rows={3}
                                        className="w-full"
                                      />
                                      
                                      <Button 
                                        size="sm"
                                        onClick={async () => {
                                          const language = selectedLanguages[model.id] || currentLanguage;
                                          const description = modelDescriptions[`${model.id}_${language}`];
                                          if (description?.trim()) {
                                            try {
                                              const response = await apiRequest('POST', `/api/models/${model.id}/description`, {
                                                description: description.trim(),
                                                language: language
                                              });
                                              
                                              if (response.ok) {
                                                toast({
                                                  title: t('success'),
                                                  description: t('description_saved_successfully'),
                                                });
                                                // Invaliduj cache'e
                                                queryClient.invalidateQueries({ queryKey: ["/api/models/tags-descriptions"] });
                                                queryClient.invalidateQueries({ queryKey: [`/api/models/${model.id}/description`] });
                                              } else {
                                                throw new Error('Failed to save description');
                                              }
                                            } catch (error) {
                                              toast({
                                                title: t('error'),
                                                description: t('description_save_failed'),
                                                variant: "destructive",
                                              });
                                            }
                                          }
                                        }}
                                      >
                                        {t('save_description')}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground">
                                  {t('auto_translation_note')}
                                </p>
                                
                                {/* Sekcja galerii */}
                                <GallerySection modelId={model.id} modelName={model.filename} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null;

                        return [mainRow, expandedRow].filter(Boolean);
                      })}
                  </TableBody>
                </Table>
                </div>
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
      
      {/* CadUploader - nowa funkcjonalność do zapisywania plików bez udostępniania */}
      <CadUploader
        isOpen={isCadUploaderOpen}
        onClose={() => setIsCadUploaderOpen(false)}
        onSuccess={() => refetch()}
      />


    </div>
  );
}