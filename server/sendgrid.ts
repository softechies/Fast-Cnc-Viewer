import { MailService } from '@sendgrid/mail';
import { Model } from '@shared/schema';
import { Language } from '../client/src/lib/translations';

// Sprawdza, czy klucz API SendGrid jest dostępny
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable is not set, email notifications will not work correctly");
}

// Inicjalizacja serwisu SendGrid
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid email service initialized");
}

const FROM_EMAIL = '"CAD Viewer" <no-reply@cadviewer.app>';

// Tłumaczenia dla wiadomości e-mail
const EMAIL_TRANSLATIONS = {
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
    autoMessage: 'This message was generated automatically. Please do not reply to this email.'
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
    autoMessage: 'Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.'
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
    autoMessage: 'Tato zpráva byla vygenerována automaticky. Prosím neodpovídejte na tento e-mail.'
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
    autoMessage: 'Diese Nachricht wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.'
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
    autoMessage: 'Ce message a été généré automatiquement. Veuillez ne pas répondre à cet email.'
  }
};

// Funkcja pomocnicza do zastępowania zmiennych w szablonie
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{${key}}`, 'g'), value);
  }, template);
}

/**
 * Wysyła e-mail z linkiem do udostępnionego modelu
 */
export async function sendShareNotification(
  model: Model, 
  recipient: string, 
  baseUrl: string,
  password?: string,
  language: Language = 'en'
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not set');
    return false;
  }
  
  try {
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    
    // Pobierz tłumaczenia dla wybranego języka
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS.en;
    
    // Przygotuj zmienne do szablonu
    const expiryInfo = model.shareExpiryDate 
      ? replaceTemplateVariables(translations.expiryDate, { date: new Date(model.shareExpiryDate).toLocaleDateString(language.includes('-') ? language : undefined) })
      : translations.expiryNone;
    
    await mailService.send({
      from: FROM_EMAIL,
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
    });
    
    console.log(`SendGrid share notification email sent to ${recipient} in ${language}`);
    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
}

/**
 * Wysyła powiadomienie o usunięciu udostępnienia
 */
export async function sendSharingRevokedNotification(
  model: Model,
  recipient: string,
  language: Language = 'en'
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not set');
    return false;
  }
  
  try {
    // Pobierz tłumaczenia dla wybranego języka
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS.en;
    
    // Przygotujemy własne tłumaczenia dla powiadomienia o cofnięciu dostępu
    const revokeMessages = {
      en: {
        subject: `CAD Model sharing has been cancelled: ${model.filename}`,
        title: 'CAD Model sharing has been cancelled',
        text: `The sharing of CAD model <strong>${model.filename}</strong> has been cancelled by the owner.`,
        info: 'The link you previously received will no longer work.',
        autoMessage: translations.autoMessage
      },
      pl: {
        subject: `Udostępnianie modelu CAD zostało anulowane: ${model.filename}`,
        title: 'Udostępnianie modelu CAD zostało anulowane',
        text: `Udostępnianie modelu CAD <strong>${model.filename}</strong> zostało anulowane przez właściciela.`,
        info: 'Link, który wcześniej otrzymałeś, nie będzie już działał.',
        autoMessage: translations.autoMessage
      },
      cs: {
        subject: `Sdílení CAD modelu bylo zrušeno: ${model.filename}`,
        title: 'Sdílení CAD modelu bylo zrušeno',
        text: `Sdílení CAD modelu <strong>${model.filename}</strong> bylo zrušeno vlastníkem.`,
        info: 'Odkaz, který jste dříve obdrželi, již nebude funkční.',
        autoMessage: translations.autoMessage
      },
      de: {
        subject: `Die Freigabe des CAD-Modells wurde aufgehoben: ${model.filename}`,
        title: 'Die Freigabe des CAD-Modells wurde aufgehoben',
        text: `Die Freigabe des CAD-Modells <strong>${model.filename}</strong> wurde vom Eigentümer aufgehoben.`,
        info: 'Der Link, den Sie zuvor erhalten haben, funktioniert nicht mehr.',
        autoMessage: translations.autoMessage
      },
      fr: {
        subject: `Le partage du modèle CAO a été annulé: ${model.filename}`,
        title: 'Le partage du modèle CAO a été annulé',
        text: `Le partage du modèle CAO <strong>${model.filename}</strong> a été annulé par le propriétaire.`,
        info: 'Le lien que vous avez reçu précédemment ne fonctionnera plus.',
        autoMessage: translations.autoMessage
      }
    };
    
    // Wybierz odpowiednie tłumaczenia
    const revokeMsg = revokeMessages[language] || revokeMessages.en;
    
    await mailService.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: revokeMsg.subject,
      html: `
        <h2>${revokeMsg.title}</h2>
        <p>${revokeMsg.text}</p>
        <p>${revokeMsg.info}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          ${revokeMsg.autoMessage}
        </p>
      `,
      text: `
        ${revokeMsg.title}
        
        ${revokeMsg.text.replace(/<[^>]*>/g, '')}
        
        ${revokeMsg.info}
        
        ${revokeMsg.autoMessage}
      `
    });
    
    console.log(`SendGrid share revocation notification email sent to ${recipient} in ${language}`);
    return true;
  } catch (error) {
    console.error('Error sending revocation email via SendGrid:', error);
    return false;
  }
}