import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UseModelUploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useModelUpload({ onSuccess, onError }: UseModelUploadOptions = {}) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { file: File, url: string }) => {
      const { file, url } = data;
      const formData = new FormData();
      formData.append('file', file);
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        xhr.open('POST', url);
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      // Odśwież wszystkie listy modeli (główną i klienta)
      queryClient.invalidateQueries({
        queryKey: ['/api/models']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/client/models']
      });
      
      setUploadProgress(100);
      if (onSuccess) onSuccess(data);
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      if (onError) onError(error);
    }
  });
  
  // Function to reset upload progress
  const reset = () => {
    setUploadProgress(0);
  };
  
  // Function to upload a file to a specific URL
  const upload = (file: File, url: string) => {
    mutate({ file, url });
  };
  
  return {
    upload,
    isUploading: isPending,
    uploadProgress,
    reset
  };
}
