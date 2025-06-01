import React from 'react';
import { Scissors, Cog, Wrench, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import fastCncLogoPath from '@/assets/cropped-Fast-Cnc-scaled-e1723725217643.jpg';

interface CncServicesAdProps {
  modelType: '3d' | '2d' | 'unknown';
  modelInfo?: any;
}

export default function CncServicesAd({ modelType, modelInfo }: CncServicesAdProps) {
  const { t, language } = useLanguage();
  
  const openContactForm = () => {
    // Pobranie ID modelu i otworzenie formularza kontaktowego z tym ID
    const modelId = modelInfo?.id || '';
    // Sprawdzamy czy istnieje wersja językowa formularza, jeśli nie, używamy domyślnej
    if (['en', 'pl', 'de', 'cs', 'fr', 'es'].includes(language)) {
      window.open(`/quote/${language}.html?modelId=${modelId}`, '_blank');
    } else {
      window.open(`/quote/?modelId=${modelId}`, '_blank');
    }
  };

  return (
    <div className="flex-grow overflow-y-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">{t('services.title', 'Usługi CNC')}</h2>
        <img src={fastCncLogoPath} alt="FastCNC Logo" className="h-8" />
      </div>
      
      <div className="space-y-4">
        {/* Sekcja rekomendacji usług zależna od typu modelu */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          {modelType === '2d' ? (
            <div className="flex items-start">
              <div className="bg-blue-500 p-2 rounded-full mr-4">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">{t('services.laser_cutting', 'Cięcie laserowe')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('services.laser_description', 'Twój projekt 2D jest idealny do realizacji poprzez cięcie laserowe. Oferujemy precyzyjne cięcie laserowe blach, tworzyw sztucznych i innych materiałów.')}
                </p>
                <div className="mt-3">
                  <Button 
                    onClick={openContactForm}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {t('services.get_quote', 'Zapytaj o wycenę')}
                  </Button>
                </div>
              </div>
            </div>
          ) : modelType === '3d' ? (
            <div className="flex items-start">
              <div className="bg-green-500 p-2 rounded-full mr-4">
                <Cog className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">{t('services.cnc_machining', 'Obróbka CNC')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('services.cnc_description', 'Twój model 3D jest gotowy do produkcji. Oferujemy profesjonalne usługi toczenia i frezowania CNC z najwyższą precyzją i jakością.')}
                </p>
                <div className="mt-3">
                  <Button 
                    onClick={openContactForm}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {t('services.get_quote', 'Zapytaj o wycenę')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <div className="bg-gray-500 p-2 rounded-full mr-4">
                <FileType className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{t('services.manufacturing', 'Usługi produkcyjne')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('services.manufacturing_description', 'Zrealizujemy Twój projekt produkcyjny od A do Z. Skontaktuj się z nami, aby omówić szczegóły i otrzymać indywidualną wycenę.')}
                </p>
                <div className="mt-3">
                  <Button 
                    onClick={openContactForm}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    {t('services.get_quote', 'Zapytaj o wycenę')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sekcja usług */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{t('services.our_services', 'Nasze usługi produkcyjne')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Scissors className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-medium">{t('services.laser_cutting', 'Cięcie laserowe')}</h4>
              </div>
              <p className="text-sm text-gray-600">
                {t('services.laser_details', 'Precyzyjne cięcie blachy, tworzyw sztucznych i innych materiałów z dokładnością do 0,05 mm. Idealne do części 2D.')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Cog className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-medium">{t('services.cnc_milling', 'Frezowanie CNC')}</h4>
              </div>
              <p className="text-sm text-gray-600">
                {t('services.milling_details', 'Obróbka skrawaniem materiałów takich jak aluminium, stal, tworzywa sztuczne. Idealne dla złożonych kształtów 3D.')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Wrench className="h-5 w-5 text-orange-600 mr-2" />
                <h4 className="font-medium">{t('services.cnc_turning', 'Toczenie CNC')}</h4>
              </div>
              <p className="text-sm text-gray-600">
                {t('services.turning_details', 'Precyzyjna obróbka części obrotowych z metalu. Idealne do wałków, tulei, części maszyn z dokładnością do 0,01 mm.')}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2">
                <Cog className="h-5 w-5 text-purple-600 mr-2 animate-spin-slow" />
                <h4 className="font-medium">{t('services.prototyping', 'Prototypowanie')}</h4>
              </div>
              <p className="text-sm text-gray-600">
                {t('services.prototyping_details', 'Szybkie wykonanie prototypów i małych serii produkcyjnych. Od projektu do gotowego elementu w kilka dni.')}
              </p>
            </div>
          </div>
          
          {/* Dolny przycisk kontaktowy usunięty aby zmniejszyć wysokość komponentu */}
        </div>
      </div>
    </div>
  );
}
