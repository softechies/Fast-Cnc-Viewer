import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { FileUp, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useModelUpload } from '@/lib/hooks';
import { useToast } from '@/hooks/use-toast';

interface CadUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CadUploader({ 
  isOpen, 
  onClose,
  onSuccess
}: CadUploaderProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  
  const { isUploading, uploadProgress, upload } = useModelUpload({
    onSuccess: (data) => {
      setUploadedCount(prev => prev + 1);
      toast({
        title: t('upload_success') || 'File uploaded successfully',
        description: data.filename,
      });
      
      if (uploadedCount + 1 === selectedFiles.length) {
        // All files uploaded successfully
        setTimeout(() => {
          if (onSuccess) onSuccess();
          handleClose();
        }, 1000);
      }
    },
    onError: (error) => {
      setFailedCount(prev => prev + 1);
      toast({
        title: t('upload_failed') || 'Upload failed',
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const isUploadComplete = uploadedCount + failedCount === selectedFiles.length && selectedFiles.length > 0;
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        return fileExtension === 'stp' || 
               fileExtension === 'step' || 
               fileExtension === 'stl' || 
               fileExtension === 'dxf' || 
               fileExtension === 'dwg';
      });
      
      if (files.length > 0) {
        setSelectedFiles(files);
      }
    }
  };
  
  const handleUpload = () => {
    if (selectedFiles.length === 0 || !user?.email) return;
    
    // Reset counters
    setUploadedCount(0);
    setFailedCount(0);
    
    // Process each file
    selectedFiles.forEach(file => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let uploadUrl = '/api/models/upload'; // domyślnie dla STEP
      
      if (fileExtension === 'stl') {
        uploadUrl = '/api/models/upload-stl';
      } else if (fileExtension === 'dxf' || fileExtension === 'dwg') {
        uploadUrl = '/api/models/upload-cad';
      }
      
      // Add flag to prevent automatic sharing
      uploadUrl += `?email=${encodeURIComponent(user.email)}&autoShare=false`;
      
      upload(file, uploadUrl);
    });
  };
  
  const handleClose = () => {
    setSelectedFiles([]);
    setUploadedCount(0);
    setFailedCount(0);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('cad_uploader_title') || 'Upload CAD Files'}</DialogTitle>
        </DialogHeader>
        
        {isUploading && !isUploadComplete ? (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-center font-medium text-lg mb-2">
              {t('uploading_files') || 'Uploading Files'}
            </h3>
            <p className="text-center text-gray-500 mb-4">
              {t('uploaded_count') || 'Uploaded'}: {uploadedCount}/{selectedFiles.length}
            </p>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        ) : isUploadComplete ? (
          <div className="py-6">
            <div className="flex flex-col items-center justify-center mb-4">
              {failedCount === 0 ? (
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
              )}
              <h3 className="text-center font-medium text-lg">
                {failedCount === 0 
                  ? (t('upload_complete') || 'Upload Complete') 
                  : (t('upload_partial') || 'Upload Partially Complete')}
              </h3>
              <p className="text-center text-gray-500 mt-2">
                {t('uploaded_count') || 'Uploaded'}: {uploadedCount}/{selectedFiles.length}
                {failedCount > 0 && (
                  <span className="text-red-500 ml-2">
                    ({failedCount} {t('failed') || 'failed'})
                  </span>
                )}
              </p>
            </div>
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
              {selectedFiles.length > 0 ? (
                <div className="text-sm text-gray-700 max-h-40 overflow-y-auto w-full">
                  <p className="font-medium mb-2">{t('selected_files') || 'Selected Files'}: {selectedFiles.length}</p>
                  <ul className="list-disc pl-5">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="truncate">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center mb-4">
                  {t('cad_uploader_message') || 'Upload CAD files to your library without sharing them'}
                </p>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".stp,.step,.stl,.dxf,.dwg" 
                onChange={handleFileSelect}
                multiple
              />
              <Button 
                onClick={handleBrowseClick}
                className="bg-primary hover:bg-blue-700 mt-2"
              >
                {t('select_files') || 'Select Files'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('supportedFormats') || 'Supported formats'}: STEP (AP203, AP214), STL, DXF, DWG
            </p>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                {t('button.cancel')}
              </Button>
              <Button
                disabled={selectedFiles.length === 0 || isUploading}
                onClick={handleUpload}
                className="bg-primary hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('uploading') || 'Uploading...'}
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