import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, RefreshCw, Clock, Check, X, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SharedModel {
  id: number;
  filename: string;
  filesize: number;
  format: string | null;
  created: string;
  shareId: string | null;
  shareEnabled: boolean;
  shareEmail: string | null;
  shareExpiryDate: string | null;
  shareLastAccessed: string | null;
  hasPassword: boolean;
}

export default function AdminDashboardPage() {
  // Używamy bezpośrednio tekstów angielskich, bez tłumaczeń
  const { t } = useLanguage(); // Zachowujemy dla innych części aplikacji
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [sharedModels, setSharedModels] = useState<SharedModel[]>([]);
  const [revokeModelId, setRevokeModelId] = useState<number | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Sprawdź autentykację przy wczytaniu strony
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "Please log in to access the admin panel",
      });
      setLocation('/admin/login');
      return;
    }
    
    loadSharedModels();
  }, []);
  
  // Funkcja ładująca udostępnione modele
  const loadSharedModels = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/admin/shared-models');
      
      if (!response.ok) {
        throw new Error('Failed to fetch shared models');
      }
      
      const data = await response.json();
      setSharedModels(data);
    } catch (error) {
      console.error('Error loading shared models:', error);
      toast({
        variant: "destructive",
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funkcja kopiująca link do schowka
  const copyShareLink = (shareId: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Link has been copied to clipboard",
    });
  };
  
  // Funkcja odwołująca udostępnianie
  const revokeSharing = async (id: number) => {
    setIsRevoking(true);
    try {
      const response = await apiRequest('DELETE', `/api/admin/shared-models/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke sharing');
      }
      
      toast({
        title: "Sharing Revoked",
        description: "The model sharing has been successfully disabled",
      });
      
      // Odśwież listę modeli
      await loadSharedModels();
    } catch (error) {
      console.error('Error revoking sharing:', error);
      toast({
        variant: "destructive",
        title: "Error Revoking Sharing",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsRevoking(false);
      setRevokeModelId(null);
    }
  };
  
  // Funkcja wylogowująca
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLocation('/admin/login');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };
  
  // Formatowanie rozmiaru pliku
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Formatowanie daty
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container p-4 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={loadSharedModels} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Log Out
          </Button>
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Shared Models</CardTitle>
          <CardDescription>
            Manage all shared model links in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sharedModels.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No shared models found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Shared With</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        {model.filename}
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(model.filesize)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {model.format || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {model.shareEmail || '—'}
                      </TableCell>
                      <TableCell>
                        {formatDate(model.created)}
                      </TableCell>
                      <TableCell>
                        {model.shareLastAccessed ? (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(model.shareLastAccessed)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {model.shareExpiryDate ? formatDate(model.shareExpiryDate) : '—'}
                      </TableCell>
                      <TableCell>
                        {model.hasPassword ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" /> Protected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <X className="h-3 w-3 mr-1" /> Not Protected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Link
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Share Link</h4>
                                <div className="flex gap-2">
                                  <Input 
                                    readOnly 
                                    value={`${window.location.origin}/shared/${model.shareId}`} 
                                    className="flex-1" 
                                  />
                                  <Button 
                                    size="icon" 
                                    onClick={() => copyShareLink(model.shareId!)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => window.open(`/shared/${model.shareId}`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open Link
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setRevokeModelId(model.id)}
                              >
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Revocation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke sharing for this model? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => revokeSharing(model.id)}
                                  disabled={isRevoking}
                                >
                                  {isRevoking && revokeModelId === model.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Yes, Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}