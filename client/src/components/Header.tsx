import { Button } from "@/components/ui/button";
import { Upload, LogIn, User, LogOut, BookOpen, Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import fastCncLogo from "../assets/fast-cnc-logo.jpg";

import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const { t } = useLanguage();
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Wyodrębnij kod języka z aktualnego URL-a
  const langMatch = location.match(/^\/([a-z]{2})(?:\/|$)/);
  const currentLang = langMatch ? langMatch[1] : '';
  

  
  // Automatyczne przekierowanie do URL-a z kodem języka
  useEffect(() => {
    // Lista ścieżek, które wymagają kodu języka
    const pathsRequiringLang = ['/cad-library', '/auth', '/client/dashboard', '/admin/dashboard', '/quote'];
    
    // Sprawdź czy obecna ścieżka wymaga kodu języka i czy go nie ma
    const needsLangRedirect = pathsRequiringLang.some(path => location === path || location.startsWith(`${path}/`));
    
    if (needsLangRedirect && !currentLang) {
      setLocation(`/en${location}`);
    }
  }, [location, currentLang, setLocation]);
  
  // Funkcja do budowania URL-a z aktualnym językiem
  const buildUrlWithLang = (path: string) => {
    return currentLang ? `/${currentLang}${path}` : `/en${path}`;
  };
  
  if (isMobile) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
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
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>{t('navigation.menu', 'Menu')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <LanguageSelector />
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href={buildUrlWithLang('/cad-library')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>{t('library.title')}</span>
                  </Link>
                </Button>
                
                <Button 
                  onClick={() => {
                    onUploadClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-primary hover:bg-blue-700 text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{t('upload')}</span>
                </Button>
                
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b">
                      {user.username}
                    </div>
                    {user.isClient && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link href={buildUrlWithLang('/client/dashboard')}>
                          <User className="mr-2 h-4 w-4" />
                          {t('client_dashboard')}
                        </Link>
                      </Button>
                    )}
                    {user.isAdmin && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link href={buildUrlWithLang('/admin/dashboard')}>
                          <User className="mr-2 h-4 w-4" />
                          {t('admin.dashboardTitle')}
                        </Link>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => {
                        logoutMutation.mutate();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('logout')}</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link href={buildUrlWithLang('/auth')}>
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>{t('login')}</span>
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

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
