import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import FooterBar from "@/components/FooterBar";
import { useLanguage } from "@/lib/LanguageContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Search, Tag, File, FileText, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Model } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import UploadModal from "@/components/UploadModal";

type LibrarySearchParams = {
  query?: string;
  tags?: string[];
  page?: number;
  limit?: number;
};

export default function LibraryPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 12;

  // Prepare search params
  const searchParams: LibrarySearchParams = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  };

  if (searchQuery) {
    searchParams.query = searchQuery;
  }

  if (selectedTags.length > 0) {
    searchParams.tags = selectedTags;
  }

  // Convert search params to query string
  const queryString = new URLSearchParams();
  if (searchParams.query) queryString.append("query", searchParams.query);
  if (searchParams.tags) queryString.append("tags", searchParams.tags.join(","));
  if (searchParams.page) queryString.append("page", searchParams.page.toString());
  if (searchParams.limit) queryString.append("limit", searchParams.limit.toString());

  // Fetch library models
  const { data: libraryModels, isLoading, error } = useQuery<Model[]>({
    queryKey: ["/api/library", searchParams],
    queryFn: async () => {
      const response = await fetch(`/api/library?${queryString.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch library models");
      }
      return response.json();
    },
  });

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
    setCurrentPage(1); // Reset to first page when changing filters
  };

  // Get all unique tags from library models
  const allTags = Array.from(
    new Set(
      libraryModels
        ?.flatMap(model => model.tags || [])
        .filter(Boolean) || []
    )
  ).sort();

  // Handle pagination
  const handleNextPage = () => {
    if (libraryModels && libraryModels.length === ITEMS_PER_PAGE) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Get file type icon
  const getFileIcon = (model: Model) => {
    if (model.format === "stl" || model.format?.toLowerCase().includes("step")) {
      return <File className="h-6 w-6" />;
    }
    return <FileText className="h-6 w-6" />;
  };

  // Format filesize to human readable
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={() => setIsUploadModalOpen(true)} />
      
      <main className="flex-grow">
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold mb-6">{t("library.title") || "Library"}</h1>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t("common.error") || "Error"}</h2>
              <p className="text-center mb-4">
                {t("library.error") || "Error fetching library models"}: {error instanceof Error ? error.message : String(error)}
              </p>
              <Button onClick={() => window.location.reload()}>
                {t("common.tryAgain") || "Try Again"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              {/* Search and filters */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-lg p-4 border">
                  <h2 className="text-xl font-semibold mb-4">{t("library.filters") || "Filters"}</h2>
                  
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="flex">
                      <Input
                        type="text"
                        placeholder={t("library.searchPlaceholder") || "Search library..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button type="submit" className="rounded-l-none">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  
                  {allTags.length > 0 && (
                    <div>
                      <h3 className="font-medium flex items-center gap-1 mb-2">
                        <Tag className="h-4 w-4" />
                        {t("library.tags") || "Tags"}
                      </h3>
                      <ScrollArea className="h-60">
                        <div className="flex flex-wrap gap-2">
                          {allTags.map((tag) => (
                            <Badge 
                              key={tag}
                              variant={selectedTags.includes(tag) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Models grid */}
              <div className="lg:col-span-3">
                {libraryModels?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-muted/30 rounded-lg">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">{t("library.noModels") || "No models found"}</h2>
                    <p className="text-center text-muted-foreground mb-4">
                      {t("library.noModelsDescription") || "There are no models in the library that match your search criteria."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {libraryModels?.map((model) => (
                        <Card key={model.id} className="overflow-hidden flex flex-col">
                          <CardHeader className="pb-2">
                            <CardTitle className="truncate text-lg">{model.filename}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <div className="text-sm mb-2 flex items-center gap-2">
                              {getFileIcon(model)}
                              <span className="uppercase">{model.format || "UNKNOWN"}</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{formatFileSize(model.filesize)}</span>
                            </div>
                            
                            {model.tags && model.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {model.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {model.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{model.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-2">
                            <Button 
                              className="w-full"
                              onClick={() => setLocation(`/library/model/${model.publicId}`)}
                            >
                              {t("library.viewModel") || "View Model"}
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Pagination controls */}
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                      >
                        {t("common.previous") || "Previous"}
                      </Button>
                      <span className="py-2 px-4">
                        {t("common.page") || "Page"} {currentPage}
                      </span>
                      <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={!libraryModels || libraryModels.length < ITEMS_PER_PAGE}
                      >
                        {t("common.next") || "Next"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <FooterBar />
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        isUploading={false}
        uploadProgress={0}
        onUpload={(file) => {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          let uploadUrl = '/api/models/upload'; // default for STEP
          
          if (fileExtension === 'stl') {
            uploadUrl = '/api/models/upload-stl';
          } else if (fileExtension === 'dxf' || fileExtension === 'dwg') {
            uploadUrl = '/api/models/upload-cad';
          }
          
          // Add auto-share parameter to make the file visible in library
          uploadUrl += '?autoShare=true';
          
          // Use fetch directly since we don't need progress tracking here
          const formData = new FormData();
          formData.append('file', file);
          
          fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          })
            .then(response => {
              if (!response.ok) {
                throw new Error('Upload failed');
              }
              return response.json();
            })
            .then(data => {
              toast({
                title: 'Upload successful',
                description: `${file.name} was uploaded and shared in the library.`,
              });
              // Refresh the library data
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            })
            .catch(error => {
              toast({
                title: 'Upload failed',
                description: error.message,
                variant: 'destructive',
              });
            });
        }} 
      />
    </div>
  );
}
