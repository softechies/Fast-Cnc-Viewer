import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import type { ClientRegistration, ClientLogin, ClientPasswordChange } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Typ użytkownika zwracany z API
export type AuthUser = {
  id: number;
  username: string;
  email: string | null;
  fullName: string | null;
  isClient: boolean;
  isAdmin: boolean;
};

// Typ kontekstu autoryzacji
type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, ClientLogin>;
  registerMutation: UseMutationResult<AuthUser, Error, ClientRegistration>;
  logoutMutation: UseMutationResult<void, Error, void>;
  changePasswordMutation: UseMutationResult<{ message: string }, Error, ClientPasswordChange>;
};

// Tworzenie kontekstu autoryzacji
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider komponentu autoryzacji
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Pobieranie informacji o aktualnie zalogowanym użytkowniku
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        if (res.status === 401) {
          return null;
        }
        return await res.json();
      } catch (error) {
        return null; // Jeśli nie zalogowany lub błąd, zwróć null
      }
    },
    retry: false,
  });

  // Mutacja logowania
  const loginMutation = useMutation({
    mutationFn: async (credentials: ClientLogin) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd logowania");
      }
      return await res.json();
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Zalogowano pomyślnie",
        description: `Witaj, ${user.fullName || user.email}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd logowania",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutacja rejestracji
  const registerMutation = useMutation({
    mutationFn: async (credentials: ClientRegistration) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd rejestracji");
      }
      return await res.json();
    },
    onSuccess: (user: AuthUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Rejestracja zakończona sukcesem",
        description: `Konto ${user.fullName || user.email} zostało utworzone i zalogowane`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd rejestracji",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutacja wylogowania
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        throw new Error("Błąd wylogowania");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Wylogowano pomyślnie",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd wylogowania",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutacja zmiany hasła
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ClientPasswordChange) => {
      const res = await apiRequest("POST", "/api/user/change-password", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd zmiany hasła");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Hasło zmienione",
        description: data.message || "Twoje hasło zostało pomyślnie zmienione",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd zmiany hasła",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook do korzystania z kontekstu autoryzacji
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}