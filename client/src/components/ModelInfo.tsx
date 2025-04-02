import { Skeleton } from '@/components/ui/skeleton';
import { ModelInfo as ModelInfoType } from '@shared/schema';
import { formatFileSize } from '@/lib/utils';

interface ModelInfoProps {
  isLoading: boolean;
  modelInfo?: ModelInfoType;
}

export default function ModelInfo({ isLoading, modelInfo }: ModelInfoProps) {
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
        <p>Nie znaleziono informacji o modelu</p>
      </div>
    );
  }
  
  return (
    <div className="flex-grow overflow-y-auto p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Informacje o modelu</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Nazwa pliku</h3>
          <p className="text-sm font-medium text-gray-900">{modelInfo.filename}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Format</h3>
          <p className="text-sm font-medium text-gray-900">{modelInfo.format || 'Nieznany'}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Rozmiar pliku</h3>
          <p className="text-sm font-medium text-gray-900">{formatFileSize(modelInfo.filesize)}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Data utworzenia</h3>
          <p className="text-sm font-medium text-gray-900">{new Date(modelInfo.created).toLocaleDateString()}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">System źródłowy</h3>
          <p className="text-sm font-medium text-gray-900">{modelInfo.sourceSystem || 'Nieznany'}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Elementy</h3>
          <div className="bg-gray-50 rounded-md p-3">
            <ul className="text-sm space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600">Części:</span>
                <span className="font-medium text-gray-900">{modelInfo.parts || 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Złożenia:</span>
                <span className="font-medium text-gray-900">{modelInfo.assemblies || 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Powierzchnie:</span>
                <span className="font-medium text-gray-900">{modelInfo.surfaces || 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Bryły:</span>
                <span className="font-medium text-gray-900">{modelInfo.solids || 0}</span>
              </li>
            </ul>
          </div>
        </div>
        
        {modelInfo.properties && Object.keys(modelInfo.properties).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Właściwości modelu</h3>
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
