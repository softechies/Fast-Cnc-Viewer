import nodemailer from 'nodemailer';
import { Model } from '@shared/schema';

// Konfiguracja do użycia z Gmail
let transporterGmail: nodemailer.Transporter | null = null;

interface GmailConfig {
  user: string;      // Adres email Gmail
  pass: string;      // Hasło aplikacji (App Password) z Gmail
  from?: string;     // Nagłówek "From" w wiadomościach (może być inny niż adres)
}

/**
 * Inicjalizuje serwis email na bazie konta Gmail
 */
export function initializeGmailService(config: GmailConfig): boolean {
  try {
    if (!config.user || !config.pass) {
      console.warn("Gmail credentials are missing, email notifications will not work correctly");
      return false;
    }
    
    // Inicjalizacja transportera Gmail
    transporterGmail = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    
    console.log("Gmail email service initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Gmail email service:", error);
    return false;
  }
}

/**
 * Wysyła e-mail z linkiem do udostępnionego modelu przez Gmail
 */
export async function sendShareNotificationGmail(
  model: Model, 
  recipient: string, 
  baseUrl: string,
  password?: string
): Promise<boolean> {
  if (!transporterGmail) {
    console.error('Gmail email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.GMAIL_FROM || process.env.GMAIL_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  
  try {
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: `Link do modelu CAD: ${model.filename}`,
      html: `
        <h2>Udostępniono Ci model CAD</h2>
        <p>Ktoś udostępnił Ci model CAD <strong>${model.filename}</strong> do wyświetlenia.</p>
        <p>Możesz go zobaczyć klikając poniższy link:</p>
        <p><a href="${shareUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
          Wyświetl model
        </a></p>
        ${password ? `<p><strong>Aby uzyskać dostęp, użyj hasła:</strong> ${password}</p>` : ''}
        <p>Link będzie aktywny ${model.shareExpiryDate ? `do ${new Date(model.shareExpiryDate).toLocaleDateString()}` : 'do momentu anulowania udostępniania przez właściciela pliku'}.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.
        </p>
      `,
      text: `
        Udostępniono Ci model CAD
        
        Ktoś udostępnił Ci model CAD "${model.filename}" do wyświetlenia.
        
        Możesz go zobaczyć pod adresem: ${shareUrl}
        
        ${password ? `Aby uzyskać dostęp, użyj hasła: ${password}` : ''}
        
        Link będzie aktywny ${model.shareExpiryDate ? `do ${new Date(model.shareExpiryDate).toLocaleDateString()}` : 'do momentu anulowania udostępniania przez właściciela pliku'}.
        
        Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.
      `
    };
    
    const info = await transporterGmail.sendMail(mailOptions);
    console.log('Gmail email sent, message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email through Gmail:', error);
    return false;
  }
}

/**
 * Wysyła powiadomienie o usunięciu udostępnienia przez Gmail
 */
export async function sendSharingRevokedNotificationGmail(
  model: Model,
  recipient: string
): Promise<boolean> {
  if (!transporterGmail) {
    console.error('Gmail email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.GMAIL_FROM || process.env.GMAIL_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  
  try {
    const mailOptions = {
      from: fromEmail,
      to: recipient,
      subject: `Udostępnianie modelu CAD zostało anulowane: ${model.filename}`,
      html: `
        <h2>Udostępnianie modelu CAD zostało anulowane</h2>
        <p>Udostępnianie modelu CAD <strong>${model.filename}</strong> zostało anulowane przez właściciela.</p>
        <p>Link, który wcześniej otrzymałeś, nie będzie już działał.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.
        </p>
      `,
      text: `
        Udostępnianie modelu CAD zostało anulowane
        
        Udostępnianie modelu CAD "${model.filename}" zostało anulowane przez właściciela.
        
        Link, który wcześniej otrzymałeś, nie będzie już działał.
        
        Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.
      `
    };
    
    const info = await transporterGmail.sendMail(mailOptions);
    console.log('Gmail revocation email sent, message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending revocation email through Gmail:', error);
    return false;
  }
}