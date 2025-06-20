import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useRoute } from 'wouter';
import fastCncLogo from '@/assets/cropped-Fast-Cnc-scaled-e1723725217643.jpg';

interface ModelInfo {
  id: number;
  filename: string;
  filetype: string;
}

export default function ContactPage() {
  const { t, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Pobierz ID modelu z parametrów URL
  const [modelId, setModelId] = useState<string | null>(null);
  const [inquiryType, setInquiryType] = useState<'general' | 'quote' | 'abuse'>('general');
  

  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('modelId');
    const subject = urlParams.get('subject');
    const message = urlParams.get('message');
    

    
    if (id) {
      setModelId(id);
    }
    
    // Determine inquiry type based on subject
    if (subject && subject.toLowerCase().includes('abuse')) {
      setInquiryType('abuse');
      // Force English language for abuse reports
      setLanguage('en');
    } else if (id) {
      setInquiryType('quote');
    } else {
      setInquiryType('general');
    }
    
    // Wypełnij formularz danymi z URL
    if (subject || message) {
      setFormData(prev => ({
        ...prev,
        message: message || prev.message
      }));
    }
  }, []);
  
  // Pobierz informacje o modelu, jeśli mamy ID
  const { data: modelInfo, isLoading: isLoadingModel } = useQuery<ModelInfo>({
    queryKey: ['/api/models', modelId, 'info'],
    enabled: !!modelId,
  });
  
  // Stan formularza
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Obsługa zmian w formularzu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Walidacja formularza
  const validateForm = () => {
    // For abuse reports, only message is required (anonymous reporting)
    if (inquiryType === 'abuse') {
      if (!formData.message.trim()) return t('abuse.details_required', 'Report details are required');
      return null;
    }
    
    // For other inquiry types, require name and email
    if (!formData.name.trim()) return t('contact.error.name_required', 'Imię i nazwisko jest wymagane');
    if (!formData.email.trim()) return t('contact.error.email_required', 'Adres email jest wymagany');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return t('contact.error.email_invalid', 'Adres email jest nieprawidłowy');
    }
    return null;
  };
  
  // Wysyłanie formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: t('contact.error.validation', 'Błąd walidacji'),
        description: validationError,
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Przygotowanie danych do wysłania
      const urlParams = new URLSearchParams(window.location.search);
      const subject = urlParams.get('subject') || '';
      
      const submitData = {
        name: inquiryType === 'abuse' ? '' : formData.name,
        email: inquiryType === 'abuse' ? '' : formData.email,
        phone: inquiryType === 'abuse' ? '' : formData.phone,
        company: inquiryType === 'abuse' ? '' : formData.company,
        message: formData.message,
        modelId: modelId,
        subject: subject
      };

      // Wysłanie danych do API
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        toast({
          title: inquiryType === 'abuse' 
            ? t('abuse.report_sent', 'Your abuse report has been submitted. Thank you for helping us maintain a safe community.')
            : t('contact.success.title', 'Wiadomość wysłana'),
          description: inquiryType === 'abuse' 
            ? t('abuse.report_sent', 'Your abuse report has been submitted. Thank you for helping us maintain a safe community.')
            : t('contact.success.description', 'Dziękujemy za wiadomość. Skontaktujemy się z Tobą najszybciej jak to możliwe.'),
          variant: 'default',
        });
        // Resetowanie formularza
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSubmitError(inquiryType === 'abuse' 
        ? 'Failed to submit abuse report. Please try again later.'
        : t('contact.error.submit', 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.'));
      toast({
        title: inquiryType === 'abuse' ? 'Report Submission Failed' : t('contact.error.title', 'Błąd wysyłania'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img src={fastCncLogo} alt="FastCNC Logo" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {inquiryType === 'abuse' 
              ? t('common.reportAbuse', 'Report Abuse')
              : t('contact.title', 'Formularz kontaktowy')
            }
          </h1>
          <p className="text-lg text-gray-600">
            {inquiryType === 'abuse'
              ? t('abuse.subtitle', 'Report inappropriate or offensive content')
              : t('contact.subtitle', 'Skontaktuj się z nami w sprawie realizacji Twojego projektu')
            }
          </p>
        </div>
        
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>
              {inquiryType === 'abuse' ? (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {modelInfo ? (
                    <div>
                      <span>{t('abuse.report_for_model', 'Report inappropriate content for model')}:</span>
                      <span className="ml-2 font-semibold">{modelInfo.filename}</span>
                    </div>
                  ) : (
                    t('abuse.report_title', 'Report Inappropriate Content')
                  )}
                </div>
              ) : modelInfo ? (
                <div className="flex items-center">
                  <span>{t('contact.inquiry_about', 'Zapytanie o realizację modelu')}:</span>
                  <span className="ml-2 font-semibold text-blue-600">{modelInfo.filename}</span>
                </div>
              ) : (
                t('contact.general_inquiry', 'Zapytanie ogólne')
              )}
            </CardTitle>
            <CardDescription>
              {inquiryType === 'abuse' 
                ? t('abuse.form_instruction', 'Please provide details about the inappropriate content you wish to report. We take all reports seriously and will investigate promptly.')
                : t('contact.form_instruction', 'Wypełnij poniższy formularz, aby wysłać zapytanie o wycenę lub realizację.')
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">

              
              {inquiryType !== 'abuse' && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.name', 'Imię i nazwisko')} *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder={t('contact.name_placeholder', 'Wpisz swoje imię i nazwisko')} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.email', 'Adres email')} *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder={t('contact.email_placeholder', 'twoj@email.com')} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('contact.phone', 'Numer telefonu')}</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder={t('contact.phone_placeholder', '+48 123 456 789')} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('contact.company', 'Firma')}</Label>
                    <Input 
                      id="company" 
                      name="company" 
                      value={formData.company} 
                      onChange={handleChange} 
                      placeholder={t('contact.company_placeholder', 'Nazwa firmy (opcjonalnie)')} 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="message">
                  {inquiryType === 'abuse' 
                    ? t('abuse.details_label', 'Report Details') 
                    : t('contact.message', 'Treść wiadomości')
                  } *
                </Label>
                <Textarea 
                  id="message" 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange} 
                  placeholder={
                    inquiryType === 'abuse' 
                      ? t('abuse.details_placeholder', 'Please describe the inappropriate content. Include specific details about what type of content violates our community guidelines (e.g., offensive imagery, inappropriate descriptions, copyright infringement, etc.).')
                      : t('contact.message_placeholder', 'Opisz szczegóły swojego projektu, potrzebną ilość części, materiał, termin realizacji, itp.')
                  }
                  rows={inquiryType === 'abuse' ? 6 : 5} 
                  required 
                />
              </div>
              
              {inquiryType === 'abuse' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">{t('abuse.guidelines_title', 'Community Guidelines')}</p>
                      <p>{t('abuse.guidelines_text', 'We do not tolerate inappropriate, offensive, or copyrighted content. All reports are reviewed by our moderation team and appropriate action will be taken.')}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 inline-block mr-2" />
                  {submitError}
                </div>
              )}
              
              {submitSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 inline-block mr-2" />
                  {inquiryType === 'abuse' 
                    ? t('abuse.report_sent', 'Your abuse report has been submitted. Thank you for helping us maintain a safe community.')
                    : t('contact.message_sent', 'Twoja wiadomość została wysłana. Dziękujemy za kontakt.')
                  }
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-500">
                {t('contact.required_fields', 'Pola oznaczone * są wymagane.')}
              </p>
              
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => window.history.back()}
                >
                  {t('contact.back', 'Powrót')}
                </Button>
                
                <Button 
                  type="submit" 
                  className={inquiryType === 'abuse' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      {inquiryType === 'abuse' 
                        ? t('abuse.submitting', 'Submitting Report...') 
                        : t('contact.sending', 'Wysyłanie...')
                      }
                    </>
                  ) : (
                    inquiryType === 'abuse' 
                      ? t('abuse.submit_report', 'Submit Report')
                      : t('contact.send', 'Wyślij wiadomość')
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
