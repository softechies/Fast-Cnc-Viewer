import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Globe, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ModelDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: number;
  modelName: string;
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
  originalLanguage: string;
  originalDescription: string;
  createdAt: string;
  updatedAt: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'cs', name: 'Čeština' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
];

export function ModelDescriptionDialog({ open, onOpenChange, modelId, modelName }: ModelDescriptionDialogProps) {
  const [description, setDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const { language: currentLanguage, t } = useLanguage();
  const { toast } = useToast();

  // Fetch existing description
  const { data: existingDescription, isLoading: isLoadingDescription } = useQuery<ModelDescription | null>({
    queryKey: ["/api/models", modelId, "description"],
    enabled: open,
  });

  // Set default language and description when dialog opens or data loads
  useEffect(() => {
    if (open) {
      if (existingDescription) {
        setSelectedLanguage(existingDescription.originalLanguage);
        setDescription(existingDescription.originalDescription);
      } else {
        setSelectedLanguage(currentLanguage);
        setDescription("");
      }
    }
  }, [open, existingDescription, currentLanguage]);

  // Save description mutation
  const saveDescriptionMutation = useMutation({
    mutationFn: async (data: { description: string; language: string }) => {
      const res = await apiRequest("POST", `/api/models/${modelId}/description`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save description");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('success'),
        description: data.message || t('description_saved_successfully'),
      });
      
      if (data.warning) {
        toast({
          title: t('warning'),
          description: data.warning,
          variant: "default",
        });
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "description"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete description mutation
  const deleteDescriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/models/${modelId}/description`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete description");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('description_deleted_successfully'),
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "description"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!description.trim()) {
      toast({
        title: t('error'),
        description: t('description_required'),
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedLanguage) {
      toast({
        title: t('error'),
        description: t('language_required'),
        variant: "destructive",
      });
      return;
    }

    saveDescriptionMutation.mutate({
      description: description.trim(),
      language: selectedLanguage,
    });
  };

  const handleDelete = () => {
    if (existingDescription) {
      deleteDescriptionMutation.mutate();
    }
  };

  const getTranslationPreview = () => {
    if (!existingDescription) return null;

    const translations = [];
    LANGUAGES.forEach(lang => {
      const key = `description${lang.code.charAt(0).toUpperCase() + lang.code.slice(1)}` as keyof ModelDescription;
      const translation = existingDescription[key];
      if (translation && typeof translation === 'string') {
        translations.push({ language: lang.name, text: translation });
      }
    });

    return translations;
  };

  const translationPreview = getTranslationPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('manage_model_description')}
          </DialogTitle>
          <DialogDescription>
            {t('model_description_explanation')} <strong>{modelName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoadingDescription ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Language selection */}
            <div className="space-y-2">
              <Label htmlFor="language">{t('original_language')}</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_language')} />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description input */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('model_description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('enter_model_description_placeholder')}
                rows={4}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                {t('auto_translation_note')}
              </p>
            </div>

            {/* Translation preview */}
            {translationPreview && translationPreview.length > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  {t('available_translations')}
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {translationPreview.map((translation, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm text-muted-foreground mb-1">
                        {translation.language}
                      </div>
                      <div className="text-sm">{translation.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('google_translate_powered')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {existingDescription && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteDescriptionMutation.isPending}
            >
              {deleteDescriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('delete_description')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveDescriptionMutation.isPending || !description.trim() || !selectedLanguage}
          >
            {saveDescriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingDescription ? t('update_description') : t('save_description')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}