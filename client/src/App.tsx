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

// Sprawdza czy jesteśmy na stronie udostępnionego modelu
function SharedModelLayout() {
  const [isSharedRoute] = useRoute("/shared/:shareId");
  const [isLanguageSharedRoute] = useRoute("/:lang(en|pl|cs|de|fr)/shared/:shareId");
  const { t } = useLanguage();
  
  if (isSharedRoute || isLanguageSharedRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <SharedModelPage />
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
          <span className="ml-2">{t('label.shared.model')}</span>
        </footer>
      </div>
    );
  }
  
  return null;
}

// Helper function to create routes with language prefix
function createLocalizedRoutes() {
  const { language, t } = useLanguage();
  const routes = [
    { path: "/", component: Home },
    { path: "/auth", component: AuthPage },
    { path: "/client/dashboard", component: () => (
      <ProtectedRoute allowClient={true} allowAdmin={false}>
        <ClientDashboardPage />
      </ProtectedRoute>
    )},
    { path: "/upload", component: FileUploadTest },
    { path: "/test3d", component: Test3D },
    { path: "/shared/:shareId", component: SharedModelPage },
    { path: "/delete-share/:shareId/:token", component: DeleteSharePage },
    { path: "/admin/login", component: AdminLoginPage },
    { path: "/admin/dashboard", component: () => (
      <AdminProtectedRoute>
        <AdminDashboardPage />
      </AdminProtectedRoute>
    )},
  ];
  
  return (
    <>
      {/* Language prefixed routes (e.g. /en/auth, /pl/shared/123) */}
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
  const [isSharedRoute] = useRoute("/shared/:shareId");
  const [isLanguageSharedRoute] = useRoute("/:lang(en|pl|cs|de|fr)/shared/:shareId");
  const { t } = useLanguage();
  
  // Jeśli jesteśmy na trasie udostępnionego modelu, użyj innego layoutu
  if (isSharedRoute || isLanguageSharedRoute) {
    return <SharedModelLayout />;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          {createLocalizedRoutes()}
        </Switch>
      </main>
      <footer className="bg-gray-100 text-center p-4 text-gray-600 text-sm">
        {t('app.footer')}
      </footer>
    </div>
  );
}

export default App;
