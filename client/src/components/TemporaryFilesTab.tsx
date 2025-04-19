import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, PlusCircle, ExternalLink, UserPlus } from 'lucide-react';
import { formatFileSize, formatDate } from '../lib/utils';
import { apiRequest } from '../lib/queryClient';

interface TemporaryModel {
  id: number;
  filename: string;
  filesize: number;
  format: string;
  created: string;
  modelType: string;
  userEmail: string | null;
  viewTokenFragment: string | null;
}

interface AssignModelInput {
  modelId: number;
  email: string;
}

export default function TemporaryFilesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningModelId, setAssigningModelId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Pobierz pliki tymczasowe
  const { data: temporaryModels, isLoading, error } = useQuery<TemporaryModel[]>({
    queryKey: ['/api/admin/temporary-models'],
    refetchInterval: 30000, // Odświeżaj co 30 sekund
  });

  // Mutacja do przypisywania pliku tymczasowego do użytkownika
  const assignModelMutation = useMutation({
    mutationFn: async ({ modelId, email }: AssignModelInput) => {
      const res = await apiRequest('POST', `/api/admin/temporary-models/${modelId}/assign`, { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Successful",
        description: "The model has been successfully assigned to the user.",
      });
      setAssignDialogOpen(false);
      setUserEmail('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/temporary-models'] });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign the model to the user.",
        variant: 'destructive',
      });
    },
  });

  // Filtrowanie modeli na podstawie wyszukiwania
  const filteredModels = temporaryModels
    ? temporaryModels.filter(
        (model) =>
          model.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (model.userEmail && model.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
          model.format.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Funkcja obsługująca przypisywanie modelu
  const handleAssignModel = (modelId: number) => {
    setAssigningModelId(modelId);
    setAssignDialogOpen(true);
  };

  // Funkcja zatwierdzająca przypisanie
  const confirmAssignModel = () => {
    if (!assigningModelId || !userEmail) {
      toast({
        title: "Validation Error",
        description: "Email address is required",
        variant: 'destructive',
      });
      return;
    }

    assignModelMutation.mutate({ modelId: assigningModelId, email: userEmail });
  };

  return (
    <Card style={{ maxWidth: '1500px', width: '100%' }}>
      <CardHeader>
        <CardTitle>Temporary Files</CardTitle>
        <CardDescription>Manage temporary files uploaded by anonymous users</CardDescription>
        <div className="flex items-center space-x-2 mt-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="card-content-no-scroll">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">
            Error loading temporary files
          </div>
        ) : (
          <Table className="w-full full-width-table">
            <TableCaption>List of files uploaded by anonymous users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    {searchQuery
                      ? "No files match your search criteria"
                      : "No temporary files found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>{model.id}</TableCell>
                    <TableCell className="font-medium">{model.filename}</TableCell>
                    <TableCell>{model.modelType || model.format}</TableCell>
                    <TableCell>{formatFileSize(model.filesize)}</TableCell>
                    <TableCell>{formatDate(model.created)}</TableCell>
                    <TableCell>{model.userEmail || '-'}</TableCell>
                    <TableCell>{model.viewTokenFragment || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2 relative z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/?modelId=${model.id}`, '_blank')}
                          title="View model in viewer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignModel(model.id)}
                          title="Assign to user"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Dialog do przypisywania modelu */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign File to User</DialogTitle>
              <DialogDescription>
                Enter an email address to assign this file to a specific user
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="default"
                onClick={confirmAssignModel}
                disabled={assignModelMutation.isPending}
              >
                {assignModelMutation.isPending ? "Processing..." : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}