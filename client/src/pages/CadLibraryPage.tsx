import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, Download, FileIcon, Calendar, User } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import FooterBar from "@/components/FooterBar";
import Header from "@/components/Header";

interface PublicModel {
  id: number;
  filename: string;
  fileType: string;
  uploadDate: string;
  tags: string[];
  description?: string;
  fileSize?: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
}

export default function CadLibraryPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Pobieranie publicznych modeli
  const { data: models, isLoading, error } = useQuery<PublicModel[]>({
    queryKey: ['/api/library'],
    queryFn: async () => {
      const response = await fetch('/api/library');
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania biblioteki');
      }
      return response.json();
    }
  });

  // Filtrowanie modeli
  const filteredModels = models?.filter(model => {
    const matchesSearch = model.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.tags && Array.isArray(model.tags) && model.tags.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesTag = !selectedTag || (model.tags && Array.isArray(model.tags) && model.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  }) || [];

  // Pobieranie wszystkich unikalnych tagów
  const allTags = Array.from(new Set(models?.flatMap(model => model.tags && Array.isArray(model.tags) ? model.tags : []) || []));

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    const type = fileType.toLowerCase();
    if (type.includes('step') || type.includes('stp')) return '🔧';
    if (type.includes('stl')) return '📐';
    if (type.includes('dxf')) return '📏';
    return '📄';
  };

  const handleViewModel = (model: any) => {
    // Używamy publicId do maskowania prawdziwego ID modelu
    const publicId = model.publicId || model.id;
    window.open(`/models/${publicId}`, '_blank');
  };

  const handleDownloadModel = (model: any) => {
    const publicId = model.publicId || model.id;
    const link = document.createElement('a');
    link.href = `/api/public/models/${publicId}/file`;
    link.download = model.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onUploadClick={() => {}} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </div>
        </main>
        <FooterBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onUploadClick={() => {}} />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">{t('error')}</h1>
              <p className="text-gray-600">{t('failed_to_load_library')}</p>
            </div>
          </div>
        </main>
        <FooterBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={() => {}} />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('public_cad_library')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('public_library_description')}
            </p>
          </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={t('search_models_tags')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                {t('all_categories')}
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            {t('showing_models').replace('{count}', filteredModels.length.toString()).replace('{total}', (models?.length || 0).toString())}
          </p>
        </div>

        {/* Models Grid */}
        {filteredModels.length === 0 ? (
          <div className="text-center py-16">
            <FileIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('no_models_found')}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? t('try_different_search') : t('no_public_models_yet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {getFileTypeIcon(model.fileType)} {model.filename}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {model.fileType?.toUpperCase() || 'Unknown'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* File Info */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(model.uploadDate)}
                    </div>
                    {model.fileSize && (
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4" />
                        {formatFileSize(model.fileSize)}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {model.description && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {model.description}
                    </p>
                  )}

                  {/* Dimensions */}
                  {model.dimensions && (
                    <div className="text-sm text-gray-600">
                      <strong>{t('cad_library_dimensions')}:</strong>
                      <span className="ml-1">
                        {model.dimensions.width}×{model.dimensions.height}
                        {model.dimensions.depth && `×${model.dimensions.depth}`} mm
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {model.tags && Array.isArray(model.tags) && model.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {model.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {model.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{model.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleViewModel(model)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('cad_library_view')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadModel(model)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {t('cad_library_download')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>
      
      <FooterBar />
    </div>
  );
}