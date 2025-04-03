import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileUp } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
      if (file.name.match(/\.(stp|step|stl)$/i)) {
        setSelectedFile(file);
      }
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
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
          <DialogTitle className="text-xl">Wczytaj plik modelu 3D</DialogTitle>
        </DialogHeader>
        
        {isUploading ? (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-center font-medium text-lg mb-2">Przetwarzanie pliku</h3>
            <p className="text-center text-gray-500 mb-4">Proszę czekać, trwa ładowanie modelu...</p>
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
                  ? `Wybrany plik: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                  : 'Przeciągnij i upuść plik STEP lub STL, albo kliknij aby wybrać'}
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".stp,.step,.stl" 
                onChange={handleFileSelect}
              />
              <Button 
                onClick={handleBrowseClick}
                className="bg-primary hover:bg-blue-700"
              >
                Wybierz plik
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Obsługiwane formaty: STEP (AP203, AP214), STL</p>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                Anuluj
              </Button>
              <Button
                disabled={!selectedFile}
                onClick={handleUpload}
                className="bg-primary hover:bg-blue-700"
              >
                Wczytaj
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
