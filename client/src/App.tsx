import { Switch, Route, Link, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Test3D from "@/pages/Test3D"; 
import FileUploadTest from "@/pages/FileUploadTest";
import SharedModelPage from "@/pages/SharedModelPage";

// Komponent nagłówka został usunięty, ponieważ jest już obecny w komponencie Home

// Sprawdza czy jesteśmy na stronie udostępnionego modelu
function SharedModelLayout() {
  const [isSharedRoute] = useRoute("/shared/:shareId");
  
  if (isSharedRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-gray-800 text-white p-3">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold">STEP Viewer - Udostępniony model</h1>
          </div>
        </header>
        <main className="flex-grow">
          <SharedModelPage />
        </main>
        <footer className="bg-gray-100 text-center p-2 text-gray-600 text-sm">
          &copy; 2024 STEP Viewer | Udostępniony model
        </footer>
      </div>
    );
  }
  
  return null;
}

function Router() {
  const [isSharedRoute] = useRoute("/shared/:shareId");
  
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
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="bg-gray-100 text-center p-4 text-gray-600 text-sm">
        &copy; 2024 STEP Viewer | Aplikacja do przeglądania plików CAD
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
