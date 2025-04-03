import nodemailer from 'nodemailer';
import { Model } from '@shared/schema';

// Konfiguracja transportera do własnego serwera SMTP
let customSmtpTransporter: nodemailer.Transporter | null = null;

interface CustomSmtpConfig {
  host: string;         // Adres hosta SMTP (np. smtp.twojadomena.pl)
  port: number;         // Port SMTP (zwykle 587 lub 465)
  secure: boolean;      // Czy używać SSL/TLS (true dla portu 465, false dla 587)
  user: string;         // Nazwa użytkownika do serwera SMTP
  pass: string;         // Hasło do serwera SMTP
  from?: string;        // Nagłówek "From" w wiadomościach (może być inny niż adres email)
}

/**
 * Inicjalizuje serwis email z własnym serwerem SMTP
 */
export function initializeCustomSmtpService(config: CustomSmtpConfig): boolean {
  try {
    if (!config.host || !config.user || !config.pass) {
      console.warn("SMTP configuration is incomplete, email notifications may not work correctly");
      return false;
    }
    
    // Inicjalizacja transportera SMTP
    customSmtpTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    
    console.log(`Custom SMTP email service initialized successfully (${config.host}:${config.port})`);
    return true;
  } catch (error) {
    console.error("Failed to initialize custom SMTP email service:", error);
    return false;
  }
}

/**
 * Wysyła e-mail z linkiem do udostępnionego modelu przez własny serwer SMTP
 */
export async function sendShareNotificationSmtp(
  model: Model, 
  recipient: string, 
  baseUrl: string,
  password?: string,
  language: string = 'en'
): Promise<boolean> {
  if (!customSmtpTransporter) {
    console.error('Custom SMTP email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';

  try {
    // Import funkcji i stałych z email.ts
    const emailModule = await import('./email');
    
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    
    // Konwersja stringa language do typu Language
    const emailLanguage = language as 'en' | 'pl' | 'de' | 'fr' | 'cs';
    
    // Pobierz tłumaczenia dla danego języka
    const translations = emailModule.EMAIL_TRANSLATIONS[emailLanguage] || emailModule.EMAIL_TRANSLATIONS.en;
    
    // Przygotuj zmienne do szablonu
    const expiryInfo = model.shareExpiryDate 
      ? translations.expiryDate.replace('{date}', new Date(model.shareExpiryDate).toLocaleDateString(emailLanguage))
      : translations.expiryNone;
      
    // Używamy funkcji z email.ts zamiast definiować lokalnie
    const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(`{${key}}`, value);
      }
      return result;
    };
    
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: replaceTemplateVariables(translations.subject, { filename: model.filename }),
      html: `
        <h2>${translations.shareTitle}</h2>
        <p>${replaceTemplateVariables(translations.shareText, { filename: model.filename })}</p>
        <p>${translations.viewInstructions}</p>
        <p><a href="${shareUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
          ${translations.shareAction}
        </a></p>
        ${password ? replaceTemplateVariables(translations.passwordInstructions, { password }) : ''}
        <p>${replaceTemplateVariables(translations.expiryInfo, { expiryInfo })}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          ${translations.autoMessage}
        </p>
      `,
      text: `
        ${translations.shareTitle}
        
        ${replaceTemplateVariables(translations.shareText, { filename: model.filename })}
        
        ${translations.viewInstructions}
        ${shareUrl}
        
        ${password ? replaceTemplateVariables(translations.passwordInstructions, { password }) : ''}
        
        ${replaceTemplateVariables(translations.expiryInfo, { expiryInfo })}
        
        ${translations.autoMessage}
      `
    };
    
    const info = await customSmtpTransporter.sendMail(mailOptions);
    console.log('Custom SMTP email sent, message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email through custom SMTP:', error);
    return false;
  }
}

/**
 * Wysyła powiadomienie o usunięciu udostępnienia przez własny serwer SMTP
 */
export async function sendSharingRevokedNotificationSmtp(
  model: Model,
  recipient: string,
  language: string = 'en'
): Promise<boolean> {
  if (!customSmtpTransporter) {
    console.error('Custom SMTP email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  
  try {
    // Import funkcji i stałych z email.ts
    const emailModule = await import('./email');
    
    // Konwersja stringa language do typu Language
    const emailLanguage = language as 'en' | 'pl' | 'de' | 'fr' | 'cs';
    
    // Pobierz tłumaczenia dla danego języka
    const translations = emailModule.EMAIL_TRANSLATIONS[emailLanguage] || emailModule.EMAIL_TRANSLATIONS.en;
    
    // Używamy funkcji strzałkowej zamiast zwykłej deklaracji funkcji
    const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(`{${key}}`, value);
      }
      return result;
    };
    
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: replaceTemplateVariables(translations.revokeSubject, { filename: model.filename }),
      html: `
        <h2>${translations.revokeTitle}</h2>
        <p>${replaceTemplateVariables(translations.revokeText, { filename: model.filename })}</p>
        <p>${translations.revokeInfo}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          ${translations.autoMessage}
        </p>
      `,
      text: `
        ${translations.revokeTitle}
        
        ${replaceTemplateVariables(translations.revokeText, { filename: model.filename })}
        
        ${translations.revokeInfo}
        
        ${translations.autoMessage}
      `
    };
    
    const info = await customSmtpTransporter.sendMail(mailOptions);
    console.log('Custom SMTP revocation email sent, message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending revocation email through custom SMTP:', error);
    return false;
  }
}