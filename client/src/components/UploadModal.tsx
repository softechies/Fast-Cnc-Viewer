import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileUp } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUploading: boolean;
  uploadProgress: number;
  onUpload: (file: File) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [email, setEmail] = useState<string>("");
  
  // Ustawienie e-maila na podstawie zalogowanego użytkownika
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);
  
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
    if (selectedFile && email) {
      // Modyfikujemy funkcję, aby przekazać e-mail do naszej funkcji obsługi uploadu
      // Funkcja nadrzędna w komponencie ClientDashboardPage doda e-mail do URL zapytania
      const fileWithEmail = Object.assign(selectedFile, { userEmail: email });
      onUpload(fileWithEmail);
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
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={!!user?.email} // Pole wyłączone dla zalogowanych użytkowników
                required
              />
              <p className="text-xs text-gray-500">
                {user?.email 
                  ? t('email_autofilled') 
                  : t('email_required')}
              </p>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                {t('button.cancel')}
              </Button>
              <Button
                disabled={!selectedFile || !email}
                onClick={handleUpload}
                className="bg-primary hover:bg-blue-700"
              >
                {t('button.upload')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
