import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { languages, languageNames, Language } from '@/lib/translations';
import { Check, ChevronDown, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setOpen(false);
  };

  // Get current language label
  const currentLanguageLabel = languageNames[language];

  return (
    <div className="relative inline-block">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{currentLanguageLabel}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {languages.map((langCode) => (
            <DropdownMenuItem
              key={langCode}
              onClick={() => handleLanguageChange(langCode)}
              className="flex items-center justify-between cursor-pointer"
            >
              {languageNames[langCode]}
              {language === langCode && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}