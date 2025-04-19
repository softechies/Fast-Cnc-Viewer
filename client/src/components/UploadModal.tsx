import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocation } from 'wouter';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUploading: boolean;
  uploadProgress: number;
  onUpload: (file: File, email: string) => void;
}

export default function UploadModal({ 
  isOpen, 
  onClose, 
  isUploading, 
  uploadProgress, 
  onUpload 
}: UploadModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailPending, setEmailPending] = useState(false); // Stan oczekiwania na sprawdzenie emaila
  
  // Ustawienie e-maila na podstawie zalogowanego użytkownika
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setEmailChecked(true); // Dla zalogowanego użytkownika, email jest już sprawdzony
    }
  }, [user]);
  
  // Funkcja sprawdzająca, czy email istnieje w bazie użytkowników
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) {
      console.log("[CHECK-EMAIL] Nieprawidłowy format emaila:", email);
      return;
    }
    
    console.log("[CHECK-EMAIL] Sprawdzanie czy email istnieje:", email);
    setIsCheckingEmail(true);   // Rozpoczynamy sprawdzanie (spinner)
    setEmailChecked(false);     // Email nie jest jeszcze zweryfikowany
    setEmailPending(true);      // Ustawiamy stan oczekiwania na sprawdzenie
    
    try {
      const endpoint = `/api/check-email/${encodeURIComponent(email)}`;
      console.log("[CHECK-EMAIL] Wysyłanie zapytania do endpointu:", endpoint);
      
      const response = await apiRequest('GET', endpoint);
      
      if (!response.ok) {
        console.error("[CHECK-EMAIL] Nieprawidłowa odpowiedź z serwera:", response.status);
        throw new Error('Failed to check email');
      }
      
      const data = await response.json();
      console.log("[CHECK-EMAIL] Otrzymana odpowiedź:", data);
      
      setEmailExists(data.exists);
      setEmailChecked(true);
      
      console.log("[CHECK-EMAIL] Ustawiono stan:", {
        emailExists: data.exists,
        emailChecked: true,
        isProtected: data.exists && !user?.email
      });
    } catch (error) {
      console.error('[CHECK-EMAIL] Błąd podczas sprawdzania emaila:', error);
      setEmailChecked(true);  // Nawet w przypadku błędu oznaczamy jako sprawdzony
      setEmailExists(false);  // Przy błędzie zakładamy, że email nie istnieje
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('error.unknown'),
      });
    } finally {
      setIsCheckingEmail(false); // Zatrzymujemy spinner
      setEmailPending(false);    // Kończymy oczekiwanie
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(stp|step|stl|dxf|dwg)$/i)) {
        setSelectedFile(file);
      }
    }
  };
  
  const handleUpload = () => {
    // Blokujemy przesyłanie pliku, jeśli email istnieje w bazie i użytkownik nie jest zalogowany
    if (emailChecked && emailExists && !user?.email) {
      console.log("[UPLOAD_MODAL] Blokada uploadu - email istnieje w bazie:", {
        email,
        emailChecked,
        emailExists,
        isLoggedIn: !!user
      });
      
      toast({
        variant: "destructive",
        title: t('warning'),
        description: t('email_exists_warning') || 'This email already exists in our system. Please log in first.',
      });
      return;
    }

    if (selectedFile && email) {
      console.log("[UPLOAD_MODAL] Rozpoczynam upload z emailem:", {
        email,
        filename: selectedFile.name,
        emailChecked,
        emailExists,
        isLoggedIn: !!user
      });
      
      // UWAGA: Object.assign modyfikuje oryginalny obiekt, co może powodować problemy
      // z właściwościami niestandardowymi. Zamiast tego przekazujemy email i plik oddzielnie,
      // aby ClientDashboardPage mógł skonstruować URL z parametrami
      onUpload(selectedFile, email);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('button.upload')}</DialogTitle>
        </DialogHeader>
        
        {isUploading ? (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-center font-medium text-lg mb-2">{t('label.verification')}</h3>
            <p className="text-center text-gray-500 mb-4">{t('message.loading')}</p>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        ) : (
          <>
            <div 
              className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-gray-300'} rounded-md p-6 flex flex-col items-center justify-center transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileUp className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 text-center mb-4">
                {selectedFile 
                  ? `${t('label.file')}: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                  : t('message.no.model')}
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".stp,.step,.stl,.dxf,.dwg" 
                onChange={handleFileSelect}
              />
              <Button 
                onClick={handleBrowseClick}
                className="bg-primary hover:bg-blue-700"
              >
                {t('button.upload')}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">STEP (AP203, AP214), STL, DXF, DWG</p>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const newEmail = e.target.value;
                    setEmail(newEmail);
                    // Resetujemy stan sprawdzania przy zmianie emaila
                    setEmailChecked(false);
                    setEmailExists(false);
                    
                    // Jeśli email jest pusty, to nie ma potrzeby sprawdzania
                    if (!newEmail || !newEmail.includes('@')) {
                      setEmailPending(false);
                    } else {
                      setEmailPending(true); // Zmieniając email, musimy ponownie sprawdzić
                    }
                  }}
                  onBlur={() => {
                    if (email && !user?.email) {
                      checkEmailExists(email);
                    }
                  }}
                  placeholder="email@example.com"
                  disabled={!!user?.email} // Pole wyłączone dla zalogowanych użytkowników
                  required
                />
                {!user?.email && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => checkEmailExists(email)}
                    disabled={isCheckingEmail || !email || !email.includes('@')}
                  >
                    {isCheckingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-medium">Check</span>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {user?.email 
                  ? t('email_autofilled') 
                  : t('email_required')}
              </p>
              
              {/* Pokazujemy alert, jeśli email istnieje w bazie */}
              {emailChecked && emailExists && !user?.email && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('warning')}</AlertTitle>
                  <AlertDescription>
                    <p>{t('email_exists_warning') || 'This email already exists in our system.'}</p>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={() => setLocation('/auth')}
                        className="mr-2"
                      >
                        {t('login_button') || 'Log in'}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                {t('button.cancel')}
              </Button>
              <Button
                disabled={
                  !selectedFile || 
                  !email || 
                  emailPending || 
                  isCheckingEmail ||
                  (emailChecked && emailExists && !user?.email)
                }
                onClick={handleUpload}
                className="bg-primary hover:bg-blue-700"
              >
                {emailPending || isCheckingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('checking')}
                  </>
                ) : (
                  t('button.upload')
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
