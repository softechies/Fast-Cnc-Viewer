import { Button } from "@/components/ui/button";
import { Upload, LogIn, User, LogOut, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import fastCncLogo from "../assets/fast-cnc-logo.jpg";

import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const { t } = useLanguage();
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Wyodrębnij kod języka z aktualnego URL-a
  const langMatch = location.match(/^\/([a-z]{2})(?:\/|$)/);
  const currentLang = langMatch ? langMatch[1] : '';
  
  console.log('Header location:', location, 'detected lang:', currentLang); // Debug
  
  // Automatyczne przekierowanie do URL-a z kodem języka
  useEffect(() => {
    // Lista ścieżek, które wymagają kodu języka
    const pathsRequiringLang = ['/cad-library', '/auth', '/client/dashboard', '/admin/dashboard', '/quote'];
    
    // Sprawdź czy obecna ścieżka wymaga kodu języka i czy go nie ma
    const needsLangRedirect = pathsRequiringLang.some(path => location === path || location.startsWith(`${path}/`));
    
    if (needsLangRedirect && !currentLang) {
      console.log('Redirecting to URL with language code:', `/en${location}`);
      setLocation(`/en${location}`);
    }
  }, [location, currentLang, setLocation]);
  
  // Funkcja do budowania URL-a z aktualnym językiem
  const buildUrlWithLang = (path: string) => {
    return currentLang ? `/${currentLang}${path}` : `/en${path}`;
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">

          <a 
            href="https://fastcnc.eu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src={fastCncLogo} 
              alt="Fast CNC Logo" 
              className="w-[80px]"
            />
          </a>
        </div>
        
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="mr-2"
          >
            <Link href={buildUrlWithLang('/cad-library')}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>{t('library.title')}</span>
            </Link>
          </Button>
          
          <Button 
            onClick={onUploadClick}
            className="bg-primary hover:bg-blue-700 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            <span>{t('upload')}</span>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="ml-2">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.isClient && (
                  <DropdownMenuItem asChild>
                    <Link href={buildUrlWithLang('/client/dashboard')}>
                      {t('client_dashboard')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href={buildUrlWithLang('/admin/dashboard')}>
                      {t('admin.dashboardTitle')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrlWithLang('/auth')}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>{t('login')}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
