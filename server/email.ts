import nodemailer from 'nodemailer';
import { Model } from '@shared/schema';
import { Language } from '../client/src/lib/translations';

// Konfiguracja transportera do wysyłania e-maili
let transporter: nodemailer.Transporter;

interface EmailConfig {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  }
}

// Domyślna konfiguracja dla środowiska deweloperskiego - używa Ethereal dla testów
const defaultConfig: EmailConfig = {
  from: '"CAD Viewer" <no-reply@cadviewer.app>',
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  // Auth będzie utworzone dynamicznie
};

// Identyfikatory tłumaczeń dla e-maili
export const EMAIL_TRANSLATIONS = {
  en: {
    subject: 'CAD Model Link: {filename}',
    shareTitle: 'CAD Model was shared with you',
    shareText: 'Someone has shared a CAD model <strong>{filename}</strong> with you for viewing.',
    shareAction: 'View Model',
    viewInstructions: 'You can view it by clicking the link below:',
    passwordInstructions: '<strong>To access the model, use password:</strong> {password}',
    expiryInfo: 'This link will be active {expiryInfo}.',
    expiryDate: 'until {date}',
    expiryNone: 'until cancelled by the owner',
    autoMessage: 'This message was generated automatically. Please do not reply to this email.',
    // Revocation email
    revokeSubject: 'CAD Model sharing has been cancelled: {filename}',
    revokeTitle: 'CAD Model sharing has been cancelled',
    revokeText: 'The sharing of CAD model <strong>{filename}</strong> has been cancelled by the owner.',
    revokeInfo: 'The link you previously received will no longer work.'
  },
  pl: {
    subject: 'Link do modelu CAD: {filename}',
    shareTitle: 'Udostępniono Ci model CAD',
    shareText: 'Ktoś udostępnił Ci model CAD <strong>{filename}</strong> do wyświetlenia.',
    shareAction: 'Wyświetl model',
    viewInstructions: 'Możesz go zobaczyć klikając poniższy link:',
    passwordInstructions: '<strong>Aby uzyskać dostęp, użyj hasła:</strong> {password}',
    expiryInfo: 'Link będzie aktywny {expiryInfo}.',
    expiryDate: 'do {date}',
    expiryNone: 'do momentu anulowania udostępniania przez właściciela pliku',
    autoMessage: 'Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.',
    // Revocation email
    revokeSubject: 'Udostępnianie modelu CAD zostało anulowane: {filename}',
    revokeTitle: 'Udostępnianie modelu CAD zostało anulowane',
    revokeText: 'Udostępnianie modelu CAD <strong>{filename}</strong> zostało anulowane przez właściciela.',
    revokeInfo: 'Link, który wcześniej otrzymałeś, nie będzie już działał.'
  },
  de: {
    subject: 'CAD-Modell-Link: {filename}',
    shareTitle: 'Ein CAD-Modell wurde mit Ihnen geteilt',
    shareText: 'Jemand hat ein CAD-Modell <strong>{filename}</strong> zur Ansicht mit Ihnen geteilt.',
    shareAction: 'Modell anzeigen',
    viewInstructions: 'Sie können es durch Klicken auf den untenstehenden Link anzeigen:',
    passwordInstructions: '<strong>Um auf das Modell zuzugreifen, verwenden Sie das Passwort:</strong> {password}',
    expiryInfo: 'Dieser Link ist aktiv {expiryInfo}.',
    expiryDate: 'bis {date}',
    expiryNone: 'bis es vom Eigentümer widerrufen wird',
    autoMessage: 'Diese Nachricht wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.',
    // Revocation email
    revokeSubject: 'Die Freigabe des CAD-Modells wurde aufgehoben: {filename}',
    revokeTitle: 'Die Freigabe des CAD-Modells wurde aufgehoben',
    revokeText: 'Die Freigabe des CAD-Modells <strong>{filename}</strong> wurde vom Eigentümer aufgehoben.',
    revokeInfo: 'Der Link, den Sie zuvor erhalten haben, funktioniert nicht mehr.'
  },
  fr: {
    subject: 'Lien du modèle CAO: {filename}',
    shareTitle: 'Un modèle CAO a été partagé avec vous',
    shareText: 'Quelqu\'un a partagé un modèle CAO <strong>{filename}</strong> avec vous pour visualisation.',
    shareAction: 'Voir le modèle',
    viewInstructions: 'Vous pouvez le voir en cliquant sur le lien ci-dessous:',
    passwordInstructions: '<strong>Pour accéder au modèle, utilisez le mot de passe:</strong> {password}',
    expiryInfo: 'Ce lien sera actif {expiryInfo}.',
    expiryDate: 'jusqu\'au {date}',
    expiryNone: 'jusqu\'à annulation par le propriétaire',
    autoMessage: 'Ce message a été généré automatiquement. Veuillez ne pas répondre à cet email.',
    // Revocation email
    revokeSubject: 'Le partage du modèle CAO a été annulé: {filename}',
    revokeTitle: 'Le partage du modèle CAO a été annulé',
    revokeText: 'Le partage du modèle CAO <strong>{filename}</strong> a été annulé par le propriétaire.',
    revokeInfo: 'Le lien que vous avez reçu précédemment ne fonctionnera plus.'
  },
  cs: {
    subject: 'Odkaz na CAD model: {filename}',
    shareTitle: 'CAD model byl s vámi sdílen',
    shareText: 'Někdo s vámi sdílel CAD model <strong>{filename}</strong> k prohlížení.',
    shareAction: 'Zobrazit model',
    viewInstructions: 'Můžete si jej prohlédnout kliknutím na odkaz níže:',
    passwordInstructions: '<strong>Pro přístup k modelu použijte heslo:</strong> {password}',
    expiryInfo: 'Tento odkaz bude aktivní {expiryInfo}.',
    expiryDate: 'do {date}',
    expiryNone: 'dokud nebude zrušen vlastníkem',
    autoMessage: 'Tato zpráva byla vygenerována automaticky. Prosím neodpovídejte na tento e-mail.',
    // Revocation email
    revokeSubject: 'Sdílení CAD modelu bylo zrušeno: {filename}',
    revokeTitle: 'Sdílení CAD modelu bylo zrušeno',
    revokeText: 'Sdílení CAD modelu <strong>{filename}</strong> bylo zrušeno vlastníkem.',
    revokeInfo: 'Odkaz, který jste dříve obdrželi, již nebude funkční.'
  }
};

// Funkcja do wykrywania języka z nagłówków Accept-Language
export function detectLanguage(acceptLanguage?: string): Language {
  if (!acceptLanguage) {
    return 'en'; // Domyślny język
  }
  
  // Parsuj nagłówek Accept-Language
  const languages = acceptLanguage.split(',')
    .map(lang => {
      const [code, priority] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0], // Pobierz kod języka bez regionu
        priority: priority ? parseFloat(priority) : 1.0
      };
    })
    .sort((a, b) => b.priority - a.priority);
  
  // Sprawdź czy któryś z preferowanych języków jest wspierany
  for (const lang of languages) {
    if (lang.code === 'pl') return 'pl';
    if (lang.code === 'cs') return 'cs';
    if (lang.code === 'de') return 'de';
    if (lang.code === 'fr') return 'fr';
    if (lang.code === 'en') return 'en';
  }
  
  return 'en'; // Domyślny język
}

// Funkcja pomocnicza do zastępowania zmiennych w szablonie
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{${key}}`, 'g'), value);
  }, template);
}

/**
 * Inicjalizuje serwis e-mail z konfiguracją
 */
export async function initializeEmailService(config?: Partial<EmailConfig>): Promise<void> {
  try {
    // Połącz domyślną konfigurację z dostarczoną konfiguracją
    const finalConfig = { ...defaultConfig, ...config };
    
    // Jeśli nie podano danych uwierzytelniających, utwórz testowe konto Ethereal
    if (!finalConfig.auth) {
      console.log('Creating test email account...');
      const testAccount = await nodemailer.createTestAccount();
      finalConfig.auth = {
        user: testAccount.user,
        pass: testAccount.pass
      };
      console.log('Test email account created:', testAccount.user);
    }
    
    // Utwórz transporter z konfiguracją
    transporter = nodemailer.createTransport({
      host: finalConfig.host,
      port: finalConfig.port,
      secure: finalConfig.secure,
      auth: finalConfig.auth,
    });
    
    // Testowe połączenie
    await transporter.verify();
    console.log('Email service initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    throw error;
  }
}

/**
 * Wysyła e-mail z linkiem do udostępnionego modelu w odpowiednim języku
 */
export async function sendShareNotification(
  model: Model, 
  recipient: string, 
  baseUrl: string,
  password?: string,
  language: Language = 'en'
): Promise<boolean> {
  if (!transporter) {
    console.error('Email service not initialized');
    return false;
  }
  
  try {
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS.en;
    
    // Przygotuj zmienne do szablonu
    const expiryInfo = model.shareExpiryDate 
      ? replaceTemplateVariables(translations.expiryDate, { date: model.shareExpiryDate })
      : translations.expiryNone;
    
    const mailOptions = {
      from: defaultConfig.from,
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
        
        ${replaceTemplateVariables(translations.shareText, { filename: model.filename }).replace(/<[^>]*>/g, '')}
        
        ${translations.viewInstructions}
        ${shareUrl}
        
        ${password ? replaceTemplateVariables(translations.passwordInstructions, { password }).replace(/<[^>]*>/g, '') : ''}
        
        ${replaceTemplateVariables(translations.expiryInfo, { expiryInfo })}
        
        ${translations.autoMessage}
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // Dla Ethereal pokazujemy link do podglądu wiadomości
    if (defaultConfig.host === 'smtp.ethereal.email') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Wysyła powiadomienie o usunięciu udostępnienia w odpowiednim języku
 */
export async function sendSharingRevokedNotification(
  model: Model,
  recipient: string,
  language: Language = 'en'
): Promise<boolean> {
  if (!transporter) {
    console.error('Email service not initialized');
    return false;
  }
  
  try {
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS.en;
    
    const mailOptions = {
      from: defaultConfig.from,
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
        
        ${replaceTemplateVariables(translations.revokeText, { filename: model.filename }).replace(/<[^>]*>/g, '')}
        
        ${translations.revokeInfo}
        
        ${translations.autoMessage}
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    if (defaultConfig.host === 'smtp.ethereal.email') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}