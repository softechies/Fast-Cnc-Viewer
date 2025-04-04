import mailchimp from '@mailchimp/mailchimp_transactional';
import { Model } from '@shared/schema';
import { Language } from '../client/src/lib/translations';

// Używamy zdefiniowanych typów z pliku mailchimp.d.ts

// Importuj emailowe tłumaczenia
import { EMAIL_TRANSLATIONS } from './email';

// Interfejs konfiguracji Mailchimp
interface MailchimpConfig {
  apiKey: string; // Klucz API Mailchimp Transactional (dawniej Mandrill)
  fromEmail: string; // Email nadawcy
  fromName: string; // Nazwa nadawcy
}

let mailchimpClient: any = null;
let mailchimpConfig: MailchimpConfig | null = null;

/**
 * Inicjalizuje klienta Mailchimp
 */
export async function initializeMailchimpService(config: MailchimpConfig): Promise<boolean> {
  try {
    if (!config.apiKey) {
      console.error("Brak klucza API dla Mailchimp");
      return false;
    }

    console.log(`Próba inicjalizacji Mailchimp z adresem: ${config.fromEmail} i nazwą: ${config.fromName}`);
    
    try {
      // Inicjalizacja klienta Mailchimp
      mailchimpClient = mailchimp(config.apiKey);
      mailchimpConfig = config;
      
      console.log(`Klient Mailchimp zainicjalizowany, sprawdzam połączenie...`);

      // Sprawdź połączenie
      const testResult = await mailchimpClient.users.ping();
      console.log(`Odpowiedź z Mailchimp ping: ${JSON.stringify(testResult)}`);
      
      if (testResult === "PONG!") {
        console.log("Mailchimp API połączenie ustanowione pomyślnie");
        return true;
      } else {
        console.error("Błąd połączenia z Mailchimp API - nieoczekiwana odpowiedź:", testResult);
        return false;
      }
    } catch (pingError: any) {
      // Szczegółowe informacje o błędzie
      if (pingError.response) {
        // Serwer zwrócił błąd
        console.error("Błąd Mailchimp API - odpowiedź serwera:", {
          status: pingError.response.status,
          statusText: pingError.response.statusText,
          data: pingError.response.data
        });
        
        // Sprawdź czy to problem z kluczem API
        if (pingError.response.status === 401) {
          console.error("Mailchimp API - nieprawidłowy klucz API. Proszę sprawdzić klucz API Mailchimp Transactional.");
        }
      } else if (pingError.request) {
        // Nie otrzymano odpowiedzi
        console.error("Mailchimp API - brak odpowiedzi z serwera");
      } else {
        // Inny rodzaj błędu
        console.error("Błąd podczas testowania połączenia Mailchimp:", pingError.message);
      }
      return false;
    }
  } catch (error) {
    console.error("Błąd inicjalizacji Mailchimp:", error);
    return false;
  }
}

/**
 * Zastępuje zmienne w szablonie
 */
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}

/**
 * Wysyła e-mail z linkiem do udostępnionego modelu
 */
export async function sendShareNotificationMailchimp(
  model: Model, 
  baseUrl: string, 
  recipientEmail: string,
  language: Language = 'en'
): Promise<boolean> {
  try {
    if (!mailchimpClient || !mailchimpConfig) {
      console.error("Mailchimp nie został zainicjalizowany");
      return false;
    }

    // Pobierz tłumaczenia dla wybranego języka
    const translations = EMAIL_TRANSLATIONS[language as keyof typeof EMAIL_TRANSLATIONS] || EMAIL_TRANSLATIONS.en;
    
    // Przygotuj zmienne do wstawienia w szablon
    const variables = {
      modelName: model.filename,
      shareLink: `${baseUrl}/shared/${model.shareId}`,
      expiryDate: model.shareExpiryDate ? new Date(model.shareExpiryDate).toLocaleDateString(language) : translations.expiryNone
    };
    
    // Przygotuj treść emaila z szablonu
    const emailSubject = translations.subject.replace('{filename}', model.filename);
    const emailTextContent = replaceTemplateVariables(translations.shareText, variables);
    const emailHtmlContent = replaceTemplateVariables(translations.shareText, variables);

    // Wyślij email przez Mailchimp
    const message = {
      from_email: mailchimpConfig.fromEmail,
      from_name: mailchimpConfig.fromName,
      subject: emailSubject,
      text: emailTextContent,
      html: emailHtmlContent,
      to: [
        {
          email: recipientEmail,
          type: 'to'
        }
      ]
    };

    const response = await mailchimpClient.messages.send({ message });
    
    // Sprawdź status wysyłki
    const success = response && response[0] && response[0].status === 'sent';
    
    if (success) {
      console.log(`Email o udostępnieniu wysłany do ${recipientEmail} przez Mailchimp`);
      return true;
    } else {
      console.error("Błąd wysyłania emaila przez Mailchimp:", response);
      return false;
    }
  } catch (error) {
    console.error("Błąd wysyłania emaila przez Mailchimp:", error);
    return false;
  }
}

/**
 * Wysyła e-mail z informacją o wycofaniu udostępnienia
 */
export async function sendSharingRevokedNotificationMailchimp(
  model: Model, 
  recipientEmail: string,
  language: Language = 'en'
): Promise<boolean> {
  try {
    if (!mailchimpClient || !mailchimpConfig) {
      console.error("Mailchimp nie został zainicjalizowany");
      return false;
    }

    // Pobierz tłumaczenia dla wybranego języka
    const translations = EMAIL_TRANSLATIONS[language as keyof typeof EMAIL_TRANSLATIONS] || EMAIL_TRANSLATIONS.en;
    
    // Przygotuj zmienne do wstawienia w szablon
    const variables = {
      modelName: model.filename,
    };
    
    // Przygotuj treść emaila z szablonu
    const emailSubject = translations.revokeSubject.replace('{filename}', model.filename);
    const emailTextContent = replaceTemplateVariables(translations.revokeText, variables);
    const emailHtmlContent = replaceTemplateVariables(translations.revokeText, variables);

    // Wyślij email przez Mailchimp
    const message = {
      from_email: mailchimpConfig.fromEmail,
      from_name: mailchimpConfig.fromName,
      subject: emailSubject,
      text: emailTextContent,
      html: emailHtmlContent,
      to: [
        {
          email: recipientEmail,
          type: 'to'
        }
      ]
    };

    const response = await mailchimpClient.messages.send({ message });
    
    // Sprawdź status wysyłki
    const success = response && response[0] && response[0].status === 'sent';
    
    if (success) {
      console.log(`Email o wycofaniu udostępnienia wysłany do ${recipientEmail} przez Mailchimp`);
      return true;
    } else {
      console.error("Błąd wysyłania emaila przez Mailchimp:", response);
      return false;
    }
  } catch (error) {
    console.error("Błąd wysyłania emaila przez Mailchimp:", error);
    return false;
  }
}