import nodemailer from 'nodemailer';
import { Model } from '@shared/schema';
import { Language } from '../client/src/lib/translations';

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
  language?: Language
): Promise<boolean> {
  // Default to English if no language is provided
  const emailLanguage: Language = language || 'en';
  
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
    
    // Link do usunięcia udostępnienia
    const deleteUrl = model.shareDeleteToken 
      ? `${baseUrl}/revoke-share/${model.shareId}/${model.shareDeleteToken}`
      : null;
    
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
    
    // Logo FastCNC jako kod HTML inline
    const logoHtml = `
      <div style="margin-bottom: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
          <g fill="none" fill-rule="evenodd">
            <path fill="#DB1D37" d="M22,15.5 L15,22.5 L8,15.5 L15,8.5 L22,15.5 Z M15,0.5 L0,15.5 L15,30.5 L30,15.5 L15,0.5 Z"></path>
            <path fill="#000000" d="M40,9 L55,9 L55,13 L45,13 L45,16.5 L54,16.5 L54,20.5 L45,20.5 L45,28 L40,28 L40,9 Z M57,9 L62,9 L67,19 L72,9 L77,9 L69,24 L65,24 L57,9 Z M84,9 L89,9 L99,28 L93.5,28 L92,24.5 L81,24.5 L79.5,28 L74,28 L84,9 Z M86.5,14 L83.5,20.5 L89.5,20.5 L86.5,14 Z M102,9 L107,9 L107,24 L117,24 L117,28 L102,28 L102,9 Z M40,31 L45,31 L45,35 L49,35 L49,39 L45,39 L45,46 L40,46 L40,31 Z M52,31 L67,31 L67,35 L57,35 L57,36.5 L66,36.5 L66,45 L52,45 L52,41 L61,41 L61,39.5 L52,39.5 L52,31 Z M72,31 L76,31 L76,45 L72,45 L72,31 Z M80,31 L95,31 L95,45 L90,45 L90,35 L85,35 L85,45 L80,45 L80,31 Z"></path>
          </g>
        </svg>
      </div>
    `;
    
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: replaceTemplateVariables(translations.subject, { filename: model.filename }),
      html: `
        ${logoHtml}
        <h2>${translations.shareTitle}</h2>
        <p>${replaceTemplateVariables(translations.shareText, { filename: model.filename })}</p>
        <p>${translations.viewInstructions}</p>
        <p><a href="${shareUrl}" style="padding: 10px 20px; background-color: #DB1D37; color: white; text-decoration: none; border-radius: 5px;">
          ${translations.shareAction}
        </a></p>
        ${password ? replaceTemplateVariables(translations.passwordInstructions, { password }) : ''}
        <p>${replaceTemplateVariables(translations.expiryInfo, { expiryInfo })}</p>
        ${deleteUrl ? `
        <p style="margin-top: 20px;">${translations.deleteInstruction}</p>
        <p><a href="${deleteUrl}" style="padding: 8px 16px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 5px;">
          ${translations.deleteAction}
        </a></p>
        ` : ''}
        <hr />
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <p style="color: #333; margin-bottom: 10px;">
            <strong>${translations.promoMessage}</strong>
          </p>
          <p style="color: #555;">
            <a href="https://fastcnc.eu" style="color: #DB1D37; text-decoration: none;">
              ${translations.visitWebsite}
            </a>
          </p>
        </div>
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
        
        ${deleteUrl ? `
        ${translations.deleteInstruction}
        ${deleteUrl}
        ` : ''}
        
        ${translations.promoMessage}
        ${translations.visitWebsite}
        
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
  language?: Language,
  baseUrl?: string
): Promise<boolean> {
  // Default to English if no language is provided
  const emailLanguage: Language = language || 'en';
  
  // Default base URL jeśli nie jest podany
  const effectiveBaseUrl = baseUrl || (process.env.NODE_ENV === 'production' ? 'https://viewer.fastcnc.eu' : 'http://localhost:5000');
  
  if (!customSmtpTransporter) {
    console.error('Custom SMTP email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  
  try {
    // Import funkcji i stałych z email.ts
    const emailModule = await import('./email');
    
    // Link do usunięcia udostępnienia (jeśli model ma token)
    const deleteUrl = model.shareDeleteToken 
      ? `${effectiveBaseUrl}/revoke-share/${model.shareId}/${model.shareDeleteToken}`
      : null;
    
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
    
    // Logo FastCNC jako kod HTML inline
    const logoHtml = `
      <div style="margin-bottom: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
          <g fill="none" fill-rule="evenodd">
            <path fill="#DB1D37" d="M22,15.5 L15,22.5 L8,15.5 L15,8.5 L22,15.5 Z M15,0.5 L0,15.5 L15,30.5 L30,15.5 L15,0.5 Z"></path>
            <path fill="#000000" d="M40,9 L55,9 L55,13 L45,13 L45,16.5 L54,16.5 L54,20.5 L45,20.5 L45,28 L40,28 L40,9 Z M57,9 L62,9 L67,19 L72,9 L77,9 L69,24 L65,24 L57,9 Z M84,9 L89,9 L99,28 L93.5,28 L92,24.5 L81,24.5 L79.5,28 L74,28 L84,9 Z M86.5,14 L83.5,20.5 L89.5,20.5 L86.5,14 Z M102,9 L107,9 L107,24 L117,24 L117,28 L102,28 L102,9 Z M40,31 L45,31 L45,35 L49,35 L49,39 L45,39 L45,46 L40,46 L40,31 Z M52,31 L67,31 L67,35 L57,35 L57,36.5 L66,36.5 L66,45 L52,45 L52,41 L61,41 L61,39.5 L52,39.5 L52,31 Z M72,31 L76,31 L76,45 L72,45 L72,31 Z M80,31 L95,31 L95,45 L90,45 L90,35 L85,35 L85,45 L80,45 L80,31 Z"></path>
          </g>
        </svg>
      </div>
    `;
    
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: replaceTemplateVariables(translations.revokeSubject, { filename: model.filename }),
      html: `
        ${logoHtml}
        <h2>${translations.revokeTitle}</h2>
        <p>${replaceTemplateVariables(translations.revokeText, { filename: model.filename })}</p>
        <p>${translations.revokeInfo}</p>
        <hr />
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <p style="color: #333; margin-bottom: 10px;">
            <strong>${translations.promoMessage}</strong>
          </p>
          <p style="color: #555;">
            <a href="https://fastcnc.eu" style="color: #DB1D37; text-decoration: none;">
              ${translations.visitWebsite}
            </a>
          </p>
        </div>
        <hr />
        <p style="color: #666; font-size: 12px;">
          ${translations.autoMessage}
        </p>
      `,
      text: `
        ${translations.revokeTitle}
        
        ${replaceTemplateVariables(translations.revokeText, { filename: model.filename })}
        
        ${translations.revokeInfo}
        
        ${translations.promoMessage}
        ${translations.visitWebsite}
        
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