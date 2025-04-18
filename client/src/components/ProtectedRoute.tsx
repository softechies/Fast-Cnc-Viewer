import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  allowClient?: boolean;
  allowAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowClient = true,
  allowAdmin = true,
  redirectTo = "/auth"
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={redirectTo} />;
  }
  
  // Sprawdź uprawnienia użytkownika
  const hasAccess = (allowClient && user.isClient) || (allowAdmin && user.isAdmin);
  
  if (!hasAccess) {
    return <Redirect to={redirectTo} />;
  }

  return <>{children}</>;
}