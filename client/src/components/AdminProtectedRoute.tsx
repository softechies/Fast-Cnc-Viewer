import { ReactNode, useEffect, useState } from 'react';
import { Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');
      
      if (!adminToken || !adminUser) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const user = JSON.parse(adminUser);
        if (user && user.isAdmin) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}