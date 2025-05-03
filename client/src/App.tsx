import { Switch, Route, Link, useRoute } from "wouter";
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

// Helper function to create routes with language prefix
function createLocalizedRoutes() {
  const { language, t } = useLanguage();
  const routes = [
    { path: "/", component: Home },
    { path: "/client/dashboard", component: () => (
      <ProtectedRoute allowClient={true} allowAdmin={false}>
        <ClientDashboardPage />
      </ProtectedRoute>
    )},
    { path: "/upload", component: FileUploadTest },
    { path: "/test3d", component: Test3D },
    { path: "/delete-share/:shareId/:token", component: DeleteSharePage },
    { path: "/admin/login", component: AdminLoginPage },
    { path: "/admin/dashboard", component: () => (
      <AdminProtectedRoute>
        <AdminDashboardPage />
      </AdminProtectedRoute>
    )},
  ];
  
  // Obsługa specjalnych tras
  const specialRoutes = [
    // Strona autoryzacji z prefiksem językowym
    <Route key="auth-lang" path="/:lang(en|pl|cs|de|fr)/auth">
      {() => <AuthPage />}
    </Route>,
    // Strona autoryzacji bez prefiksu językowego (dla wstecznej kompatybilności)
    <Route key="auth-no-lang" path="/auth">
      {() => <AuthPage />}
    </Route>,
    // Udostępniony model bez prefiksu językowego
    <Route key="shared-no-lang" path="/shared/:shareId">
      {(params) => <SharedModelPage shareId={params?.shareId} />}
    </Route>,
    // Udostępniony model z prefiksem językowym
    <Route key="shared-lang" path="/:lang(en|pl|cs|de|fr)/shared/:shareId">
      {(params) => <SharedModelPage shareId={params?.shareId} language={params?.lang} />}
    </Route>
  ];
  
  return (
    <>
      {/* Specjalne trasy z obsługą parametrów */}
      {specialRoutes}
      
      {/* Language prefixed routes (e.g. /en/client/dashboard) */}
      {routes.map(({ path, component: Component }) => {
        // Create both /[lang]/route and /[lang] (for root path)
        const localizedPath = path === "/" 
          ? `/:lang(en|pl|cs|de|fr)` 
          : `/:lang(en|pl|cs|de|fr)${path}`;
        
        return <Route key={`lang-${path}`} path={localizedPath} component={Component} />;
      })}
      
      {/* Also keep original routes without language prefix for backward compatibility */}
      {routes.map(({ path, component: Component }) => (
        <Route key={`original-${path}`} path={path} component={Component} />
      ))}
      
      {/* Catch all route */}
      <Route component={NotFound} />
    </>
  );
}

function Router() {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          {createLocalizedRoutes()}
        </Switch>
      </main>
      <footer className="bg-gray-100 text-center p-4 text-gray-600 text-sm">
        {t('app.footer', 'CAD Viewer')}
      </footer>
    </div>
  );
}

export default App;
