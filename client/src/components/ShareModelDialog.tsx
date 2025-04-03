import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModelInfo } from "@shared/schema";
import { Clipboard, Calendar, Copy, Check, Link2, Mail } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface ShareModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: number | null;
  modelInfo?: ModelInfo;
}

export default function ShareModelDialog({ isOpen, onClose, modelId, modelInfo }: ShareModelDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enableSharing, setEnableSharing] = useState(modelInfo?.shareEnabled || false);
  const [password, setPassword] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [email, setEmail] = useState(modelInfo?.shareEmail || "");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resetuj stan po zamknięciu okna dialogowego
  const handleClose = () => {
    setPassword("");
    setExpiryDate("");
    setEmail("");
    setCopied(false);
    onClose();
  };

  // Obsługa udostępniania modelu
  const handleShare = async () => {
    if (!modelId) return;

    // Sprawdź, czy adres email jest wymagany
    if (enableSharing && email.trim() === "") {
      toast({
        title: t('label.email'),
        description: t('label.email.placeholder'),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSharing(true);
      
      const response = await apiRequest({
        url: `/api/models/${modelId}/share`,
        method: "POST",
        body: JSON.stringify({
          modelId,
          enableSharing,
          password: password.length > 0 ? password : undefined,
          expiryDate: expiryDate.length > 0 ? expiryDate : undefined,
          email: email.trim() !== "" ? email.trim() : undefined,
          language: language // Przesyłanie aktualnie wybranego języka
        }),
        headers: {
          "Content-Type": "application/json"
        },
        on401: "throw"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('error.share'));
      }

      const shareData = await response.json();
      
      // Ustaw URL udostępniania do wyświetlenia
      if (shareData.shareEnabled && shareData.shareUrl) {
        // Użyj pełnego URL, w tym hosta
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}${shareData.shareUrl}`);
      } else {
        setShareUrl("");
      }
      
      // Odśwież dane modelu
      queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/info`] });
      
      toast({
        title: t('message.share.success'),
        description: enableSharing 
          ? (shareData.emailSent 
            ? `${t('message.share.success')}. ${t('message.revocation.sent')}: ${email}.` 
            : `${t('message.share.success')}. ${t('message.share.copied')}.`)
          : t('message.delete.success'),
        variant: "default"
      });
    } catch (error) {
      console.error("Error sharing model:", error);
      toast({
        title: t('header.error'),
        description: error instanceof Error ? error.message : t('error.share'),
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Kopiuj link do schowka
  const copyToClipboard = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: t('button.copy'),
        description: t('message.share.copied'),
        variant: "default"
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('button.share')}</DialogTitle>
          <DialogDescription>
            {t('message.delete.warning')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-sharing" className="text-right">
              {t('button.share')}
            </Label>
            <Switch
              id="enable-sharing"
              checked={enableSharing}
              onCheckedChange={setEnableSharing}
            />
          </div>

          {enableSharing && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {t('label.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('label.password.share.placeholder')}
                  className="col-span-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiry-date" className="text-right flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('label.expiry')}
                </Label>
                <Input
                  id="expiry-date"
                  type="date"
                  className="col-span-3"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('label.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('label.email.placeholder')}
                  className="col-span-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {modelInfo?.shareEnabled && modelInfo?.shareId && (
                <div className="mt-2 p-3 border rounded-lg bg-secondary/20">
                  <Label className="text-sm mb-2 block">{t('header.shared.model')}:</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate text-sm bg-background rounded px-2 py-1">
                      {window.location.origin}/shared/{modelInfo.shareId}
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const url = `${window.location.origin}/shared/${modelInfo.shareId}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: t('button.copy'),
                          description: t('message.share.copied'),
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {modelInfo.hasPassword 
                      ? t('label.password.share') 
                      : t('message.password.required')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {shareUrl && (
          <div className="mb-4 p-3 border rounded-lg bg-secondary/20">
            <div className="text-sm mb-1">{t('message.share.success')}:</div>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={shareUrl} 
                className="text-xs"
              />
              <Button 
                size="icon" 
                variant="outline" 
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('button.cancel')}
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={isSharing}
          >
            {isSharing ? t('label.verification') : (enableSharing ? t('button.share') : t('button.cancel'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}