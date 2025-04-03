import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Test3D from "@/pages/Test3D"; 
import FileUploadTest from "@/pages/FileUploadTest";

// Navigation header component
function NavHeader() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <h1 className="text-xl font-bold">STEP Viewer</h1>
        <nav className="flex space-x-4">
          <Link href="/" className="hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700">
            Strona główna
          </Link>
          <Link href="/upload" className="hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700">
            Przesyłanie plików
          </Link>
          <Link href="/test3d" className="hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-700">
            Test 3D
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavHeader />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/upload" component={FileUploadTest} />
          <Route path="/test3d" component={Test3D} />
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
