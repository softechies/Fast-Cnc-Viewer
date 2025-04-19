import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModelInfo } from "@shared/schema";
import { Clipboard, Calendar, Copy, Check, Link2, LogIn, Mail, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import fastCncLogo from "@/assets/fastcnc-logo.jpg";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";

interface ShareModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: number | null;
  modelInfo?: ModelInfo;
}

export default function ShareModelDialog({ isOpen, onClose, modelId, modelInfo }: ShareModelDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [enableSharing, setEnableSharing] = useState(modelInfo?.shareEnabled || false);
  const [password, setPassword] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [email, setEmail] = useState(modelInfo?.shareEmail || "");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // Efekt do automatycznego ustawiania emaila na podstawie zalogowanego użytkownika
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);
  
  // Dane formularza rejestracji
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    fullName: "",
    company: ""
  });

  // Sprawdzanie czy email już istnieje w systemie
  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) return;
    
    try {
      setCheckingEmail(true);
      const response = await apiRequest(
        "GET", 
        `/api/check-email/${encodeURIComponent(emailToCheck)}`,
        undefined,
        { on401: "returnNull" }
      );
      
      const data = await response.json();
      setEmailExists(data.exists);
      
      // Jeśli email istnieje, wyłącz opcję tworzenia konta
      if (data.exists) {
        setCreateAccount(false);
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setCheckingEmail(false);
    }
  };
  
  // Wywołaj sprawdzenie emaila po opuszczeniu pola
  const handleEmailBlur = () => {
    if (email && !user) {
      checkEmailExists(email);
    }
  };
  
  // Obsługa zmiany pola email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Resetuj stan istnienia emaila przy zmianie
    if (emailExists) setEmailExists(false);
  };

  // Obsługa zmiany pól formularza rejestracji
  const handleRegisterDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  // Resetuj stan po zamknięciu okna dialogowego
  const handleClose = () => {
    setPassword("");
    setExpiryDate("");
    // Resetuj email tylko jeśli użytkownik nie jest zalogowany
    if (!user) {
      setEmail("");
    } else if (user.email) {
      // W przypadku zalogowanego użytkownika, ustaw email na email użytkownika
      setEmail(user.email);
    }
    setCreateAccount(false);
    setRegisterData({
      username: "",
      password: "",
      fullName: "",
      company: ""
    });
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
    
    // Jeśli zaznaczono checkbox tworzenia konta, sprawdź czy wymagane pola są wypełnione
    if (!user && createAccount) {
      if (!registerData.fullName) {
        toast({
          title: t('full_name'),
          description: t('full_name') + " " + t('errors.required'),
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsSharing(true);
      
      // Dane do wysłania do API
      const shareData = {
        modelId,
        enableSharing,
        password: password.length > 0 ? password : undefined,
        expiryDate: expiryDate.length > 0 ? expiryDate : undefined,
        email: email.trim() !== "" ? email.trim() : undefined,
        language: language, // Przesyłanie aktualnie wybranego języka
        createAccount: !user && createAccount ? true : undefined, // Dodaj flagę tworzenia konta
        // Dodaj dane rejestracji, jeśli zaznaczono checkbox
        userData: !user && createAccount ? {
          username: registerData.username,
          password: registerData.password || password, // Używamy hasła z formularza rejestracji lub hasła udostępniania
          fullName: registerData.fullName,
          company: registerData.company,
          email: email // Używamy email z głównego formularza
        } : undefined
      };
      
      const response = await apiRequest(
        "POST",
        `/api/models/${modelId}/share`,
        shareData,
        {
          on401: "throw"
        }
      );

      const responseData = await response.json();
      
      // Ustaw URL udostępniania do wyświetlenia
      if (responseData.shareEnabled && responseData.shareUrl) {
        // Użyj pełnego URL, w tym hosta
        const baseUrl = window.location.origin;
        setShareUrl(`${baseUrl}${responseData.shareUrl}`);
      } else {
        setShareUrl("");
      }
      
      // Odśwież dane modelu i dane użytkownika (jeśli utworzono konto)
      queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/info`] });
      if (createAccount) {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
      
      // Pokaż odpowiedni komunikat
      let description = enableSharing 
        ? (responseData.emailSent 
          ? `${t('message.share.success')}. ${t('message.revocation.sent')}: ${email}.` 
          : `${t('message.share.success')}. ${t('message.share.copied')}.`)
        : t('message.delete.success');
      
      // Jeśli utworzono konto, dodaj informację o tym
      if (responseData.accountCreated) {
        description += " " + t('account_created');
      }
      
      toast({
        title: t('message.share.success'),
        description: description,
        variant: "default"
      });
    } catch (error) {
      console.error("Error sharing model:", error);
      toast({
        title: t('header.error'),
        description: error instanceof Error ? error.message : t('errors.share'),
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
        <div className="flex justify-center mb-2">
          <img src={fastCncLogo} alt="FastCNC Logo" className="w-[100px]" />
        </div>
        <DialogHeader>
          <DialogTitle>{t('button.share')}</DialogTitle>
          <DialogDescription>
            {t('message.share.warning')}
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
                <div className="col-span-3">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('label.email.placeholder')}
                    className={emailExists ? "border-orange-400" : ""}
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    disabled={!!user} // Zablokuj edycję dla zalogowanych użytkowników
                    required
                  />
                  {emailExists && (
                    <div className="flex flex-col space-y-2 mt-1">
                      <p className="text-xs text-orange-500">
                        {t('email_already_exists')}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8 w-full"
                        onClick={() => {
                          handleClose();
                          setLocation('/auth');
                        }}
                      >
                        <LogIn className="mr-2 h-3 w-3" />
                        {t('login')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {!user && !emailExists && (
                <>
                  <div className="flex items-center space-x-2 mt-1 ml-[calc(25%+8px)]">
                    <Checkbox 
                      id="create-account" 
                      checked={createAccount}
                      onCheckedChange={(checked) => setCreateAccount(checked === true)}
                      disabled={emailExists}
                    />
                    <Label 
                      htmlFor="create-account" 
                      className={`text-sm flex items-center ${emailExists ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}
                    >
                      <UserPlus className="h-4 w-4 mr-1 text-muted-foreground" />
                      {t('create_account_sharing')}
                    </Label>
                  </div>
                  
                  {/* Formularz rejestracji rozwijany po zaznaczeniu checkboxa */}
                  {createAccount && (
                    <div className="border rounded-md p-4 mt-2 bg-secondary/10">
                      <h4 className="font-medium text-sm mb-3">{t('create_account')}</h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="reg-username" className="text-sm">{t('username')}</Label>
                          <Input 
                            id="reg-username" 
                            name="username" 
                            value={registerData.username} 
                            onChange={handleRegisterDataChange}
                            className="h-8 text-sm"
                          />
                          <p className="text-xs text-muted-foreground">{t('username_optional')}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="reg-password" className="text-sm">{t('password')} *</Label>
                          <Input 
                            id="reg-password" 
                            name="password" 
                            type="password" 
                            value={registerData.password} 
                            onChange={handleRegisterDataChange}
                            className="h-8 text-sm"
                            placeholder={!registerData.password ? t('sharePassword') + ' ' + t('username_optional') : ''}
                          />
                          {!registerData.password && (
                            <p className="text-xs text-muted-foreground">
                              {t('label.password.share.placeholder')}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="reg-fullName" className="text-sm">{t('full_name')} *</Label>
                          <Input 
                            id="reg-fullName" 
                            name="fullName" 
                            value={registerData.fullName} 
                            onChange={handleRegisterDataChange}
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="reg-company" className="text-sm">{t('company')}</Label>
                          <Input 
                            id="reg-company" 
                            name="company" 
                            value={registerData.company} 
                            onChange={handleRegisterDataChange}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

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