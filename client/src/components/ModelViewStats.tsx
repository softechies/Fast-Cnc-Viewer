import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ModelViewStats as ModelViewStatsType } from '@shared/schema';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, UserRound, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ModelViewStatsProps {
  modelId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelViewStats({ modelId, isOpen, onClose }: ModelViewStatsProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const { data: stats, isLoading, error } = useQuery<ModelViewStatsType>({
    queryKey: ['/api/admin/shared-models', modelId, 'stats'],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      if (!id) return null;
      
      const response = await fetch(`/api/admin/shared-models/${id}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    },
    enabled: isOpen && modelId !== null
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>View Statistics</DialogTitle>
          <DialogDescription>
            View detailed statistics about model views
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-4 text-destructive">
            Error loading statistics. Please try again.
          </div>
        ) : !stats ? (
          <div className="text-center p-4">
            No statistics available for this model.
          </div>
        ) : (
          <div className="mt-4">
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="visitors">Visitors</TabsTrigger>
                <TabsTrigger value="details">Detailed Views</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 flex flex-col items-center">
                    <Eye className="w-8 h-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">{stats.totalViews}</div>
                    <div className="text-muted-foreground">Total Views</div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex flex-col items-center">
                    <UserRound className="w-8 h-8 text-primary mb-2" />
                    <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
                    <div className="text-muted-foreground">Unique Visitors</div>
                  </div>
                  
                  {stats.firstView && (
                    <div className="border rounded-lg p-4 flex flex-col items-center">
                      <Calendar className="w-8 h-8 text-primary mb-2" />
                      <div className="text-lg font-medium">{formatDate(stats.firstView)}</div>
                      <div className="text-muted-foreground">First View</div>
                    </div>
                  )}
                  
                  {stats.lastView && (
                    <div className="border rounded-lg p-4 flex flex-col items-center">
                      <Clock className="w-8 h-8 text-primary mb-2" />
                      <div className="text-lg font-medium">{formatDate(stats.lastView)}</div>
                      <div className="text-muted-foreground">Last View</div>
                    </div>
                  )}
                </div>
                
                {stats.browserStats && stats.browserStats.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Browser Statistics</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Browser</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.browserStats.map((browser: {name: string, count: number}, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{browser.name}</TableCell>
                            <TableCell className="text-right">{browser.count}</TableCell>
                            <TableCell className="text-right">
                              {((browser.count / stats.totalViews) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="visitors" className="p-4">
                <h3 className="font-medium mb-2">Unique Visitors</h3>
                {stats.ipAddresses && stats.ipAddresses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Last Visit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.ipAddresses.map((ip, index) => (
                        <TableRow key={index}>
                          <TableCell>{ip.address}</TableCell>
                          <TableCell className="text-right">{ip.count}</TableCell>
                          <TableCell className="text-right">
                            {ip.lastView ? formatDate(ip.lastView) : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No visitor data available.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="details" className="p-4">
                <h3 className="font-medium mb-2">Detailed View Log</h3>
                {stats.viewDetails && stats.viewDetails.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Browser</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.viewDetails.map((view, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(view.viewedAt)}</TableCell>
                          <TableCell>{view.ipAddress}</TableCell>
                          <TableCell>
                            <div className="truncate max-w-[250px]" title={view.userAgent}>
                              {view.userAgent}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No detailed view data available.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}