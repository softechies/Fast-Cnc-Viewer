import { useLanguage } from '@/lib/LanguageContext';
import fastCncLogo from "@/assets/fastcnc-logo.jpg";
import cadViewerLogo from "@assets/logo-cadviewer.png";

interface FooterBarProps {
  // Usunięte niepotrzebne pola, ponieważ wyświetlamy tylko loga
}

export default function FooterBar({}: FooterBarProps) {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-center items-center text-sm text-gray-500">
        <div className="flex items-center space-x-8">
          <img src={cadViewerLogo} alt="CAD Viewer Logo" className="h-[45px]" />
          <a 
            href="https://fastcnc.eu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img src={fastCncLogo} alt="FastCNC Logo" className="h-8" />
          </a>
        </div>
      </div>
    </footer>
  );
}
