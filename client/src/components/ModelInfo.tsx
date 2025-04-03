import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ModelInfo as ModelInfoType } from '@shared/schema';
import { formatFileSize } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import ShareModelDialog from './ShareModelDialog';
import { useLanguage } from '@/lib/LanguageContext';

interface ModelInfoProps {
  isLoading: boolean;
  modelInfo?: ModelInfoType;
  modelId: number | null;
}

export default function ModelInfo({ isLoading, modelInfo, modelId }: ModelInfoProps) {
  const { t } = useLanguage();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex-grow overflow-y-auto p-4">
        <Skeleton className="h-7 w-36 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!modelInfo) {
    return (
      <div className="flex-grow overflow-y-auto p-4 text-center text-gray-500">
        <p>{t('loading')}</p>
      </div>
    );
  }
  
  return (
    <div className="flex-grow overflow-y-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">{t('modelInformation')}</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setIsShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          <span>{t('share')}</span>
        </Button>
      </div>
      
      {/* Dialog udostępniania */}
      <ShareModelDialog 
        isOpen={isShareDialogOpen} 
        onClose={() => setIsShareDialogOpen(false)}
        modelId={modelId}
        modelInfo={modelInfo}
      />
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('fileType')}</h3>
          <p className="text-sm font-medium text-gray-900">{modelInfo.filename}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('fileType')}</h3>
          <p className="text-sm font-medium text-gray-900">{modelInfo.format || '-'}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('fileSize')}</h3>
          <p className="text-sm font-medium text-gray-900">{formatFileSize(modelInfo.filesize)}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('createdDate')}</h3>
          <p className="text-sm font-medium text-gray-900">{new Date(modelInfo.created).toLocaleDateString()}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">System</h3>
          <p className="text-sm font-medium text-gray-900">{modelInfo.sourceSystem || '-'}</p>
        </div>
        
        {/* Status udostępniania */}
        {modelInfo.shareEnabled && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t('sharedModel')}</h3>
            <div className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center text-sm text-emerald-700 font-medium mb-1">
                <Share2 className="h-4 w-4 mr-1" /> 
                {t('shareSuccess')}
              </div>
              {modelInfo.hasPassword && (
                <p className="text-xs text-gray-600">{t('passwordProtected')}</p>
              )}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('modelEntities')}</h3>
          <div className="bg-gray-50 rounded-md p-3">
            <ul className="text-sm space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600">{t('parts')}:</span>
                <span className="font-medium text-gray-900">{modelInfo.parts || 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('assemblies')}:</span>
                <span className="font-medium text-gray-900">{modelInfo.assemblies || 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('surfaces')}:</span>
                <span className="font-medium text-gray-900">{modelInfo.surfaces || 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('solids')}:</span>
                <span className="font-medium text-gray-900">{modelInfo.solids || 0}</span>
              </li>
            </ul>
          </div>
        </div>
        
        {modelInfo.properties && Object.keys(modelInfo.properties).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t('additionalInfo')}</h3>
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <tbody>
                  {Object.entries(modelInfo.properties).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-200 last:border-b-0">
                      <td className="py-2 px-3 text-gray-600">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
