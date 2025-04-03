import { MailService } from '@sendgrid/mail';
import { Model } from '@shared/schema';

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

/**
 * Wysyła e-mail z linkiem do udostępnionego modelu
 */
export async function sendShareNotification(
  model: Model, 
  recipient: string, 
  baseUrl: string,
  password?: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not set');
    return false;
  }
  
  try {
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    
    await mailService.send({
      from: FROM_EMAIL,
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
    });
    
    console.log(`SendGrid share notification email sent to ${recipient}`);
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
  recipient: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not set');
    return false;
  }
  
  try {
    await mailService.send({
      from: FROM_EMAIL,
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
    });
    
    console.log(`SendGrid share revocation notification email sent to ${recipient}`);
    return true;
  } catch (error) {
    console.error('Error sending revocation email via SendGrid:', error);
    return false;
  }
}