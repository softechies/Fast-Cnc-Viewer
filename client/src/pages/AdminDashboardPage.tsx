import { useEffect, useState, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, RefreshCw, Clock, Check, X, Link as LinkIcon, Copy, ExternalLink, BarChart2, Search, ArrowUp, ArrowDown, Key, FileX, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import ModelViewStats from '@/components/ModelViewStats';
import TemporaryFilesTab from '@/components/TemporaryFilesTab';

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
  const [statsModelId, setStatsModelId] = useState<number | null>(null);
  
  // Stany dla usuwania modelu
  const [deleteModelId, setDeleteModelId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Nowe stany dla wyszukiwania i sortowania
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'created' | 'shareLastAccessed' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Stany dla zarządzania hasłem
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

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
        throw new Error('Failed to fetch user models');
      }
      
      const data = await response.json();
      setSharedModels(data);
    } catch (error) {
      console.error('Error loading user models:', error);
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
  
  // Funkcja kopiująca hasło do schowka
  const copyPassword = (password: string) => {
    if (!password) return;
    
    navigator.clipboard.writeText(password);
    toast({
      title: "Password Copied",
      description: "Password has been copied to clipboard",
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
  
  // Funkcja usuwająca model całkowicie
  const deleteModel = async (id: number) => {
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/admin/models/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete model');
      }
      
      toast({
        title: "Model Deleted",
        description: "The model has been completely deleted",
      });
      
      // Odśwież listę modeli
      await loadSharedModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        variant: "destructive",
        title: "Error Deleting Model",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModelId(null);
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
  
  // Funkcja sortująca
  const handleSort = (field: 'created' | 'shareLastAccessed') => {
    if (sortField === field) {
      // Jeśli już sortujemy po tym polu, zmień kierunek
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Jeśli sortujemy po nowym polu, ustaw je i domyślny kierunek (od najnowszych)
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Funkcja pobierająca aktualne hasło modelu
  const fetchCurrentPassword = async (modelId: number) => {
    if (!modelId) return;
    
    setIsLoadingPassword(true);
    try {
      const response = await apiRequest('GET', `/api/admin/shared-models/${modelId}/password`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch password');
      }
      
      const data = await response.json();
      return data.plainPassword || '';
    } catch (error) {
      console.error('Error fetching password:', error);
      toast({
        variant: "destructive",
        title: "Error Fetching Password",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      return '';
    } finally {
      setIsLoadingPassword(false);
    }
  };
  
  // Funkcja otwierająca dialog do zmiany hasła
  const openPasswordDialog = async (model: SharedModel) => {
    setSelectedModelId(model.id);
    setSelectedModelName(model.filename);
    setNewPassword('');
    setPasswordDialogOpen(true);
    
    // Jeśli model ma hasło, pobierz aktualne hasło
    if (model.hasPassword) {
      const currentPass = await fetchCurrentPassword(model.id);
      setCurrentPassword(currentPass);
    } else {
      setCurrentPassword('');
    }
  };
  
  // Funkcja resetująca/ustawiająca hasło
  const resetPassword = async () => {
    if (!selectedModelId || !newPassword.trim()) return;
    
    setIsSettingPassword(true);
    try {
      const response = await apiRequest('POST', `/api/admin/shared-models/${selectedModelId}/reset-password`, {
        newPassword: newPassword.trim()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      // Aktualizuj lokalny stan z nową informacją o haśle
      setSharedModels(sharedModels.map(model => 
        model.id === selectedModelId ? { ...model, hasPassword: true } : model
      ));
      
      toast({
        title: "Password Updated",
        description: `Password has been updated for ${selectedModelName}`,
      });
      
      // Zamknij dialog
      setPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        variant: "destructive",
        title: "Error Setting Password",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSettingPassword(false);
    }
  };
  
  // Filtruj i sortuj modele
  const filteredAndSortedModels = useMemo(() => {
    // Najpierw filtrujemy
    let result = [...sharedModels];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(model => 
        (model.filename && model.filename.toLowerCase().includes(query)) ||
        (model.shareEmail && model.shareEmail.toLowerCase().includes(query))
      );
    }
    
    // Następnie sortujemy, jeśli wybrano pole
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        // Obsługa null wartości (umieszczamy je na końcu listy)
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        
        // Porównanie dat
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        
        return sortDirection === 'asc' 
          ? aDate - bDate 
          : bDate - aDate;
      });
    }
    
    return result;
  }, [sharedModels, searchQuery, sortField, sortDirection]);

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
      
      {/* Okno dialogowe statystyk */}
      <ModelViewStats 
        modelId={statsModelId}
        isOpen={statsModelId !== null}
        onClose={() => setStatsModelId(null)}
      />
      
      <Tabs defaultValue="user" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user">User Models</TabsTrigger>
          <TabsTrigger value="temporary">Temporary Files</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>User Models</CardTitle>
              <CardDescription>
                Manage all models assigned to registered users
              </CardDescription>
              
              {/* Pole wyszukiwania */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by filename or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sharedModels.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No user models found
                </div>
              ) : filteredAndSortedModels.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No models match your search
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Filename</TableHead>
                        <TableHead className="whitespace-nowrap">Format</TableHead>
                        <TableHead className="whitespace-nowrap">Owner Email</TableHead>
                        <TableHead className="whitespace-nowrap">Sharing Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:text-primary whitespace-nowrap"
                          onClick={() => handleSort('created')}
                        >
                          <div className="flex items-center">
                            Created
                            {sortField === 'created' && (
                              sortDirection === 'asc' 
                                ? <ArrowUp className="ml-1 h-4 w-4" />
                                : <ArrowDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:text-primary whitespace-nowrap"
                          onClick={() => handleSort('shareLastAccessed')}
                        >
                          <div className="flex items-center">
                            Last Accessed
                            {sortField === 'shareLastAccessed' && (
                              sortDirection === 'asc' 
                                ? <ArrowUp className="ml-1 h-4 w-4" />
                                : <ArrowDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="whitespace-nowrap">Expiry Date</TableHead>
                        <TableHead className="whitespace-nowrap">Password</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedModels.map((model) => (
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
                            {model.shareEnabled ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" /> Shared
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                <X className="h-3 w-3 mr-1" /> Not Shared
                              </Badge>
                            )}
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
                            <div className="flex items-center justify-between gap-2">
                              {model.hasPassword ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Check className="h-3 w-3 mr-1" /> Protected
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                  <X className="h-3 w-3 mr-1" /> Not Protected
                                </Badge>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={() => openPasswordDialog(model)}
                              >
                                <Key className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStatsModelId(model.id)}
                              >
                                <BarChart2 className="h-4 w-4 mr-2" />
                                Stats
                              </Button>
                              
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
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="destructive" 
                                          size="icon"
                                          onClick={() => setDeleteModelId(model.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Model Permanently</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to permanently delete this model? This will remove the model 
                                            from the database and delete all associated files from the server. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => deleteModel(model.id)}
                                            disabled={isDeleting}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            {isDeleting && deleteModelId === model.id ? (
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : null}
                                            Yes, Delete Permanently
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete model permanently</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
        </TabsContent>
        
        <TabsContent value="temporary" className="space-y-4">
          <TemporaryFilesTab />
        </TabsContent>
      </Tabs>
      
      {/* Dialog do zarządzania hasłem */}
      <Dialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedModelName ? (
                <>
                  {currentPassword ? 'Manage Password for:' : 'Set Password for:'} 
                  <span className="font-normal ml-1">{selectedModelName}</span>
                </>
              ) : 'Password Management'}
            </DialogTitle>
            <DialogDescription>
              {currentPassword 
                ? 'View the current password or set a new one to replace it.' 
                : 'Enter a password to protect this shared file.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Aktualne hasło, jeśli istnieje */}
            {currentPassword && (
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly 
                    value={currentPassword}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => copyPassword(currentPassword)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the current plaintext password that users need to enter to access the file.
                </p>
              </div>
            )}
            
            {/* Nowe hasło */}
            <div className="space-y-2">
              <Label htmlFor="password">{currentPassword ? 'New Password' : 'Password'}</Label>
              <Input 
                id="password" 
                type="text" 
                placeholder={currentPassword ? "Enter new password to change" : "Enter password to protect file"} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={resetPassword} 
              disabled={isSettingPassword || !newPassword.trim()}
            >
              {isSettingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Set Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}