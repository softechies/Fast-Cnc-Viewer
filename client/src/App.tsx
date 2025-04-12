import { Switch, Route, Link, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Test3D from "@/pages/Test3D"; 
import FileUploadTest from "@/pages/FileUploadTest";
import SharedModelPage from "@/pages/SharedModelPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { LanguageProvider, useLanguage } from "./lib/LanguageContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppContent />
        <Toaster />
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
  const { t } = useLanguage();
  
  if (isSharedRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <SharedModelPage />
        </main>
        <footer className="bg-gray-100 text-center p-2 text-gray-600 text-sm">
          {t('app.footer')} {t('label.shared.model')}
        </footer>
      </div>
    );
  }
  
  return null;
}

function Router() {
  const [isSharedRoute] = useRoute("/shared/:shareId");
  const { t } = useLanguage();
  
  // Jeśli jesteśmy na trasie udostępnionego modelu, użyj innego layoutu
  if (isSharedRoute) {
    return <SharedModelLayout />;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/upload" component={FileUploadTest} />
          <Route path="/test3d" component={Test3D} />
          <Route path="/shared/:shareId" component={SharedModelPage} />
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/admin/dashboard">
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="bg-gray-100 text-center p-4 text-gray-600 text-sm">
        {t('app.footer')}
      </footer>
    </div>
  );
}

export default App;
