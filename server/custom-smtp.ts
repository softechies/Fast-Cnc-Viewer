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
  password?: string
): Promise<boolean> {
  if (!customSmtpTransporter) {
    console.error('Custom SMTP email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  
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
  recipient: string
): Promise<boolean> {
  if (!customSmtpTransporter) {
    console.error('Custom SMTP email service not initialized');
    return false;
  }
  
  // Pobierz adres email z konfiguracji lub zmiennych środowiskowych
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  
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
    
    const info = await customSmtpTransporter.sendMail(mailOptions);
    console.log('Custom SMTP revocation email sent, message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending revocation email through custom SMTP:', error);
    return false;
  }
}