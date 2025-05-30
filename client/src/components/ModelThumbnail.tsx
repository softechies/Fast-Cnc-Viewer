import { useState, useEffect } from "react";
import { File, Image } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ModelThumbnailProps {
  modelId: number;
  filename: string;
  format?: string | null;
  className?: string;
}

export function ModelThumbnail({ modelId, filename, format, className = "w-16 h-16" }: ModelThumbnailProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const queryClient = useQueryClient();

  const thumbnailUrl = `/api/models/${modelId}/thumbnail?t=${refreshKey}`;

  // Listen for thumbnail updates from query invalidation
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Check if any thumbnail-related query was invalidated
      const thumbnailQueries = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && (
            key.includes(`/api/models/${modelId}/thumbnail`) ||
            (key.includes('/api/models') && key.includes(modelId) && key.includes('thumbnail')) ||
            key.includes('/api/client/models')
          );
        }
      });
      
      if (thumbnailQueries.length > 0) {
        setRefreshKey(Date.now());
        setThumbnailError(false);
        setIsLoading(true);
      }
    });

    return unsubscribe;
  }, [modelId, queryClient]);

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setIsLoading(false);
  };

  const handleThumbnailLoad = () => {
    setIsLoading(false);
  };

  // Determine the icon based on file format
  const getFormatIcon = () => {
    if (!format) return <File className="w-8 h-8 text-muted-foreground" />;
    
    const lowerFormat = format.toLowerCase();
    if (lowerFormat === 'step' || lowerFormat === 'stp') {
      return <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
        <span className="text-xs font-semibold text-blue-700">3D</span>
      </div>;
    } else if (lowerFormat === 'stl') {
      return <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
        <span className="text-xs font-semibold text-green-700">STL</span>
      </div>;
    } else if (lowerFormat === 'dxf' || lowerFormat === 'dwg') {
      return <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
        <span className="text-xs font-semibold text-orange-700">2D</span>
      </div>;
    }
    
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  if (thumbnailError) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}>
        {getFormatIcon()}
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-gray-100 rounded-lg overflow-hidden border`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image className="w-8 h-8 text-muted-foreground animate-pulse" />
        </div>
      )}
      <img
        src={thumbnailUrl}
        alt={`Thumbnail for ${filename}`}
        className="w-full h-full object-cover"
        onError={handleThumbnailError}
        onLoad={handleThumbnailLoad}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
}