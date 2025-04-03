import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import fastCncLogo from "../assets/fast-cnc-logo.jpg";

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const { t } = useLanguage();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src={fastCncLogo} 
            alt="Fast CNC Logo" 
            className="h-8"
          />
          <h1 className="text-xl font-semibold text-gray-800">{t('applicationName')}</h1>
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
        </div>
      </div>
    </header>
  );
}
