import { Box, Layers } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import fastCncLogo from "@/assets/fastcnc-logo.jpg";

interface FooterBarProps {
  modelName: string;
  partCount: number;
  entityCount: number;
}

export default function FooterBar({ modelName, partCount, entityCount }: FooterBarProps) {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
        <div className="flex items-center">
          <span className="mr-4">{modelName}</span>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
          <span>
            <Box className="inline h-4 w-4 mr-1" />
            <span>{partCount}</span> {t('parts')}
          </span>
          <span>
            <Layers className="inline h-4 w-4 mr-1" />
            <span>{entityCount}</span> {t('surfaces')}
          </span>
          <a 
            href="https://fastcnc.eu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center ml-4 hover:opacity-80 transition-opacity"
          >
            <img src={fastCncLogo} alt="FastCNC Logo" className="h-8" />
          </a>
        </div>
      </div>
    </footer>
  );
}
