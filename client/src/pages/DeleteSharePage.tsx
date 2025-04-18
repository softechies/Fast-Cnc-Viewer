import { useEffect, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LanguageContext } from '@/lib/LanguageContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function DeleteSharePage() {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('DeleteSharePage must be used within a LanguageProvider');
  }
  
  const { t } = context;
  const [location, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract shareId and token from URL
  const urlParts = location.split('/');
  const shareId = urlParts[urlParts.length - 2];
  const token = urlParts[urlParts.length - 1];
  
  const handleCancel = () => {
    // Przekieruj do strony głównej
    setLocation('/');
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      // Wywołaj endpoint API do usunięcia udostępnienia
      const response = await fetch(`/api/shared/${shareId}/${token}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setIsDeleted(true);
      } else {
        const data = await response.json();
        setError(data.message || t('deleteShare.unknownError'));
      }
    } catch (err) {
      console.error('Error deleting share:', err);
      setError(t('deleteShare.connectionError'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('deleteShare.title')}</CardTitle>
          <CardDescription>{t('deleteShare.description')}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {isDeleted ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>{t('deleteShare.successTitle')}</AlertTitle>
              <AlertDescription>
                {t('deleteShare.successMessage')}
              </AlertDescription>
            </Alert>
          ) : error ? (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertTitle>{t('deleteShare.errorTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-gray-600">
              {t('deleteShare.confirmMessage')}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-4">
          {!isDeleted && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                {t('deleteShare.cancel')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('deleteShare.deleting')}
                  </>
                ) : (
                  t('deleteShare.confirm')
                )}
              </Button>
            </>
          )}
          {isDeleted && (
            <Button onClick={() => setLocation('/')}>
              {t('deleteShare.backToHome')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}