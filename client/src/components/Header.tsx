import { Button } from "@/components/ui/button";
import { Upload, LogIn, User, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import fastCncLogo from "../assets/fast-cnc-logo.jpg";
import cadViewerLogo from "@assets/logo-cadviewer.png";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src={cadViewerLogo} 
            alt="CAD Viewer Logo" 
            className="h-[50px]" 
          />
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
                    <Link href="/client/dashboard">
                      {t('client_dashboard')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">
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
              <Link href="/auth">
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
