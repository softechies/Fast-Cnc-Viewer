import nodemailer from 'nodemailer';
import { Model } from '@shared/schema';

// Konfiguracja transportera do wysyłania e-maili
// W środowisku produkcyjnym należy użyć rzeczywistego serwera SMTP
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
 * Wysyła e-mail z linkiem do udostępnionego modelu
 */
export async function sendShareNotification(
  model: Model, 
  recipient: string, 
  baseUrl: string,
  password?: string
): Promise<boolean> {
  if (!transporter) {
    console.error('Email service not initialized');
    return false;
  }
  
  try {
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    
    const mailOptions = {
      from: defaultConfig.from,
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
        <p>Link będzie aktywny ${model.shareExpiryDate ? `do ${model.shareExpiryDate}` : 'do momentu anulowania udostępniania przez właściciela pliku'}.</p>
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
        
        Link będzie aktywny ${model.shareExpiryDate ? `do ${model.shareExpiryDate}` : 'do momentu anulowania udostępniania przez właściciela pliku'}.
        
        Ta wiadomość została wygenerowana automatycznie. Prosimy nie odpowiadać na ten adres e-mail.
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
 * Wysyła powiadomienie o usunięciu udostępnienia
 */
export async function sendSharingRevokedNotification(
  model: Model,
  recipient: string
): Promise<boolean> {
  if (!transporter) {
    console.error('Email service not initialized');
    return false;
  }
  
  try {
    const mailOptions = {
      from: defaultConfig.from,
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