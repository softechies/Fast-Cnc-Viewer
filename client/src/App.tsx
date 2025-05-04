import { Switch, Route, Link, useLocation } from "wouter";
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
import ContactPage from "@/pages/ContactPage";
import LibraryPage from "@/pages/LibraryPage";
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

// Uproszczona wersja routingu
function Router() {
  const { t } = useLanguage();
  const [location] = useLocation();
  
  // Sprawdzamy czy jesteśmy na stronie głównej
  const isMainRoute = location === '/' || /^\/([a-z]{2})\/?$/.test(location);
  console.log("Current location:", location); // Diagnostic log
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          {/* Trasy podstawowe - UWAGA: kolejność ma znaczenie */}
          <Route path="/auth">
            {() => <AuthPage />}
          </Route>
          <Route path="/:lang(en|pl|cs|de|fr)/auth">
            {() => <AuthPage />}
          </Route>
          <Route path="/" component={Home} />
          <Route path="/:lang(en|pl|cs|de|fr)" component={Home} />
          
          {/* Pozostałe trasy */}
          <Route path="/shared/:shareId">
            {(params) => <SharedModelPage shareId={params.shareId} />}
          </Route>
          <Route path="/:lang(en|pl|cs|de|fr)/shared/:shareId">
            {(params) => {
              // Params jako string literal dla TypeScript
              const paramsLang = params.lang as 'en' | 'pl' | 'cs' | 'de' | 'fr';
              return <SharedModelPage shareId={params.shareId} language={paramsLang} />;
            }}
          </Route>
          
          {/* Strony chronione */}
          <Route path="/client/dashboard">
            {() => (
              <ProtectedRoute allowClient={true} allowAdmin={false}>
                <ClientDashboardPage />
              </ProtectedRoute>
            )}
          </Route>
          <Route path="/:lang(en|pl|cs|de|fr)/client/dashboard">
            {() => (
              <ProtectedRoute allowClient={true} allowAdmin={false}>
                <ClientDashboardPage />
              </ProtectedRoute>
            )}
          </Route>
          
          {/* Pozostałe trasy */}
          <Route path="/upload" component={FileUploadTest} />
          <Route path="/:lang(en|pl|cs|de|fr)/upload" component={FileUploadTest} />
          <Route path="/test3d" component={Test3D} />
          <Route path="/:lang(en|pl|cs|de|fr)/test3d" component={Test3D} />
          <Route path="/delete-share/:shareId/:token" component={DeleteSharePage} />
          <Route path="/:lang(en|pl|cs|de|fr)/delete-share/:shareId/:token" component={DeleteSharePage} />
          
          {/* Library page */}
          <Route path="/library" component={LibraryPage} />
          <Route path="/:lang(en|pl|cs|de|fr)/library" component={LibraryPage} />

          {/* Strona kontaktowa */}
          <Route path="/quote" component={ContactPage} />
          <Route path="/:lang(en|pl|cs|de|fr)/quote" component={ContactPage} />
          
          {/* Strony administracyjne */}
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/:lang(en|pl|cs|de|fr)/admin/login" component={AdminLoginPage} />
          <Route path="/admin/dashboard">
            {() => (
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            )}
          </Route>
          <Route path="/:lang(en|pl|cs|de|fr)/admin/dashboard">
            {() => (
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            )}
          </Route>

          {/* Strona 404 dla nieistniejących tras - na końcu */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {/* Usunięta stopka z tekstem copyright */}
    </div>
  );
}

export default App;
