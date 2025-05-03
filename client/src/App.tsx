import { Switch, Route, Link, useRoute, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Test3D from "@/pages/Test3D"; 
import FileUploadTest from "@/pages/FileUploadTest";
import SharedModelPage from "@/pages/SharedModelPage";
import DeleteSharePage from "@/pages/DeleteSharePage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AuthPage from "@/pages/AuthPage";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { LanguageProvider, useLanguage } from "./lib/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import fastCncLogo from "@/assets/fastcnc-logo.jpg";
import { useEffect } from "react";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

// Komponent z główną zawartością aplikacji
function AppContent() {
  return <Router />;
}

// Specjalny layout dla strony udostępnionego modelu
function SharedModelLayout({ shareId, language }: { shareId: string, language?: string }) {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <SharedModelPage shareId={shareId} language={language} />
      </main>
      <footer className="bg-gray-100 text-center p-2 text-gray-600 text-sm flex justify-center items-center">
        <a 
          href="https://fastcnc.eu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img src={fastCncLogo} alt="FastCNC Logo" className="w-[80px]" />
        </a>
        <span className="ml-2">{t('label.shared.model', 'Shared model by FastCNC')}</span>
      </footer>
    </div>
  );
}

// Helper function to create all application routes
function createRoutes() {
  return (
    <>
      {/* Strony bez prefiksu językowego (dla wstecznej kompatybilności) */}
      <Route path="/" component={Home} />
      <Route path="/auth">
        {() => <AuthPage />}
      </Route>
      <Route path="/shared/:shareId">
        {(params) => <SharedModelPage shareId={params?.shareId} />}
      </Route>
      <Route path="/client/dashboard">
        {() => (
          <ProtectedRoute allowClient={true} allowAdmin={false}>
            <ClientDashboardPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/upload" component={FileUploadTest} />
      <Route path="/test3d" component={Test3D} />
      <Route path="/delete-share/:shareId/:token" component={DeleteSharePage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard">
        {() => (
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        )}
      </Route>

      {/* Strony z prefiksem językowym */}
      <Route path="/:lang(en|pl|cs|de|fr)" component={Home} />
      <Route path="/:lang(en|pl|cs|de|fr)/auth">
        {() => <AuthPage />}
      </Route>
      <Route path="/:lang(en|pl|cs|de|fr)/shared/:shareId">
        {(params: any) => <SharedModelPage shareId={params?.shareId} language={params?.lang} />}
      </Route>
      <Route path="/:lang(en|pl|cs|de|fr)/client/dashboard">
        {() => (
          <ProtectedRoute allowClient={true} allowAdmin={false}>
            <ClientDashboardPage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/:lang(en|pl|cs|de|fr)/upload" component={FileUploadTest} />
      <Route path="/:lang(en|pl|cs|de|fr)/test3d" component={Test3D} />
      <Route path="/:lang(en|pl|cs|de|fr)/delete-share/:shareId/:token" component={DeleteSharePage} />
      <Route path="/:lang(en|pl|cs|de|fr)/admin/login" component={AdminLoginPage} />
      <Route path="/:lang(en|pl|cs|de|fr)/admin/dashboard">
        {() => (
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        )}
      </Route>

      {/* Strona 404 dla nieistniejących tras */}
      <Route component={NotFound} />
    </>
  );
}

function Router() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Efekt dla aktualizacji języka w URL
  useEffect(() => {
    // Tu można dodać logikę dla automatycznego przekierowania
    // na strony z prefiksem językowym, jeśli jest to potrzebne
  }, [language]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          {createRoutes()}
        </Switch>
      </main>
      <footer className="bg-gray-100 text-center p-4 text-gray-600 text-sm">
        {t('app.footer', 'CAD Viewer')}
      </footer>
    </div>
  );
}

export default App;
