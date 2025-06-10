var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/email.ts
var email_exports = {};
__export(email_exports, {
  EMAIL_TRANSLATIONS: () => EMAIL_TRANSLATIONS,
  detectLanguage: () => detectLanguage,
  initializeEmailService: () => initializeEmailService,
  sendShareNotification: () => sendShareNotification,
  sendSharingRevokedNotification: () => sendSharingRevokedNotification
});
import nodemailer from "nodemailer";
function detectLanguage(acceptLanguage) {
  if (!acceptLanguage) {
    return "en";
  }
  const languages = acceptLanguage.split(",").map((lang) => {
    const [code, priority] = lang.trim().split(";q=");
    return {
      code: code.split("-")[0],
      // Pobierz kod języka bez regionu
      priority: priority ? parseFloat(priority) : 1
    };
  }).sort((a, b) => b.priority - a.priority);
  for (const lang of languages) {
    if (lang.code === "pl") return "pl";
    if (lang.code === "cs") return "cs";
    if (lang.code === "de") return "de";
    if (lang.code === "fr") return "fr";
    if (lang.code === "en") return "en";
  }
  return "en";
}
function replaceTemplateVariables(template, variables) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{${key}}`, "g"), value);
  }, template);
}
async function initializeEmailService(config) {
  try {
    const finalConfig = { ...defaultConfig, ...config };
    if (!finalConfig.auth) {
      console.log("Creating test email account...");
      const testAccount = await nodemailer.createTestAccount();
      finalConfig.auth = {
        user: testAccount.user,
        pass: testAccount.pass
      };
      console.log("Test email account created:", testAccount.user);
    }
    transporter = nodemailer.createTransport({
      host: finalConfig.host,
      port: finalConfig.port,
      secure: finalConfig.secure,
      auth: finalConfig.auth
    });
    await transporter.verify();
    console.log("Email service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize email service:", error);
    throw error;
  }
}
async function sendShareNotification(model, recipient, baseUrl, password, language = "en") {
  if (!transporter) {
    console.error("Email service not initialized");
    return false;
  }
  try {
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS.en;
    const deleteUrl = model.shareDeleteToken ? `${baseUrl}/revoke-share/${model.shareId}/${model.shareDeleteToken}` : null;
    const expiryInfo = model.shareExpiryDate ? replaceTemplateVariables(translations.expiryDate, { date: model.shareExpiryDate }) : translations.expiryNone;
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
      from: defaultConfig.from,
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
        ${password ? replaceTemplateVariables(translations.passwordInstructions, { password }) : ""}
        <p>${replaceTemplateVariables(translations.expiryInfo, { expiryInfo })}</p>
        ${deleteUrl ? `
        <p style="margin-top: 20px;">${translations.deleteInstruction}</p>
        <p><a href="${deleteUrl}" style="padding: 8px 16px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 5px;">
          ${translations.deleteAction}
        </a></p>
        ` : ""}
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
        
        ${replaceTemplateVariables(translations.shareText, { filename: model.filename }).replace(/<[^>]*>/g, "")}
        
        ${translations.viewInstructions}
        ${shareUrl}
        
        ${password ? replaceTemplateVariables(translations.passwordInstructions, { password }).replace(/<[^>]*>/g, "") : ""}
        
        ${replaceTemplateVariables(translations.expiryInfo, { expiryInfo })}
        
        ${deleteUrl ? `
        ${translations.deleteInstruction}
        ${deleteUrl}
        ` : ""}
        
        ${translations.promoMessage}
        ${translations.visitWebsite}
        
        ${translations.autoMessage}
      `
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    if (defaultConfig.host === "smtp.ethereal.email") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
async function sendSharingRevokedNotification(model, recipient, language = "en") {
  if (!transporter) {
    console.error("Email service not initialized");
    return false;
  }
  try {
    const translations = EMAIL_TRANSLATIONS[language] || EMAIL_TRANSLATIONS.en;
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
      from: defaultConfig.from,
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
        
        ${replaceTemplateVariables(translations.revokeText, { filename: model.filename }).replace(/<[^>]*>/g, "")}
        
        ${translations.revokeInfo}
        
        ${translations.promoMessage}
        ${translations.visitWebsite}
        
        ${translations.autoMessage}
      `
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    if (defaultConfig.host === "smtp.ethereal.email") {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
var transporter, defaultConfig, EMAIL_TRANSLATIONS;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    defaultConfig = {
      from: '"CAD Viewer" <no-reply@cadviewer.app>',
      host: "smtp.ethereal.email",
      port: 587,
      secure: false
      // Auth będzie utworzone dynamicznie
    };
    EMAIL_TRANSLATIONS = {
      en: {
        subject: "CAD Model Link: {filename}",
        shareTitle: "CAD Model was shared with you",
        shareText: "Someone has shared a CAD model <strong>{filename}</strong> with you for viewing.",
        shareAction: "View Model",
        viewInstructions: "You can view it by clicking the link below:",
        passwordInstructions: "<strong>To access the model, use password:</strong> {password}",
        expiryInfo: "This link will be active {expiryInfo}.",
        expiryDate: "until {date}",
        expiryNone: "until cancelled by the owner",
        autoMessage: "This message was generated automatically. Please do not reply to this email.",
        // Revocation email
        revokeSubject: "CAD Model sharing has been cancelled: {filename}",
        revokeTitle: "CAD Model sharing has been cancelled",
        revokeText: "The sharing of CAD model <strong>{filename}</strong> has been cancelled by the owner.",
        revokeInfo: "The link you previously received will no longer work.",
        // Sharing management
        deleteInstruction: "If you want to cancel the sharing at any time, you can use the link below:",
        deleteAction: "Cancel Sharing",
        // Promotional message
        promoMessage: "Thank you for using our application. Try sharing your own model or use our CNC services.",
        visitWebsite: "Visit our website: https://fastcnc.eu"
      },
      pl: {
        subject: "Link do modelu CAD: {filename}",
        shareTitle: "Udost\u0119pniono Ci model CAD",
        shareText: "Kto\u015B udost\u0119pni\u0142 Ci model CAD <strong>{filename}</strong> do wy\u015Bwietlenia.",
        shareAction: "Wy\u015Bwietl model",
        viewInstructions: "Mo\u017Cesz go zobaczy\u0107 klikaj\u0105c poni\u017Cszy link:",
        passwordInstructions: "<strong>Aby uzyska\u0107 dost\u0119p, u\u017Cyj has\u0142a:</strong> {password}",
        expiryInfo: "Link b\u0119dzie aktywny {expiryInfo}.",
        expiryDate: "do {date}",
        expiryNone: "do momentu anulowania udost\u0119pniania przez w\u0142a\u015Bciciela pliku",
        autoMessage: "Ta wiadomo\u015B\u0107 zosta\u0142a wygenerowana automatycznie. Prosimy nie odpowiada\u0107 na ten adres e-mail.",
        // Revocation email
        revokeSubject: "Udost\u0119pnianie modelu CAD zosta\u0142o anulowane: {filename}",
        revokeTitle: "Udost\u0119pnianie modelu CAD zosta\u0142o anulowane",
        revokeText: "Udost\u0119pnianie modelu CAD <strong>{filename}</strong> zosta\u0142o anulowane przez w\u0142a\u015Bciciela.",
        revokeInfo: "Link, kt\xF3ry wcze\u015Bniej otrzyma\u0142e\u015B, nie b\u0119dzie ju\u017C dzia\u0142a\u0142.",
        // Sharing management
        deleteInstruction: "Je\u015Bli chcesz anulowa\u0107 udost\u0119pnianie w dowolnym momencie, mo\u017Cesz u\u017Cy\u0107 poni\u017Cszego linku:",
        deleteAction: "Anuluj udost\u0119pnianie",
        // Promotional message
        promoMessage: "Dzi\u0119kujemy za korzystanie z naszej aplikacji. Spr\xF3buj udost\u0119pni\u0107 w\u0142asny model lub skorzysta\u0107 z naszych us\u0142ug CNC.",
        visitWebsite: "Odwied\u017A nasz\u0105 stron\u0119: https://fastcnc.eu"
      },
      de: {
        subject: "CAD-Modell-Link: {filename}",
        shareTitle: "Ein CAD-Modell wurde mit Ihnen geteilt",
        shareText: "Jemand hat ein CAD-Modell <strong>{filename}</strong> zur Ansicht mit Ihnen geteilt.",
        shareAction: "Modell anzeigen",
        viewInstructions: "Sie k\xF6nnen es durch Klicken auf den untenstehenden Link anzeigen:",
        passwordInstructions: "<strong>Um auf das Modell zuzugreifen, verwenden Sie das Passwort:</strong> {password}",
        expiryInfo: "Dieser Link ist aktiv {expiryInfo}.",
        expiryDate: "bis {date}",
        expiryNone: "bis es vom Eigent\xFCmer widerrufen wird",
        autoMessage: "Diese Nachricht wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.",
        // Revocation email
        revokeSubject: "Die Freigabe des CAD-Modells wurde aufgehoben: {filename}",
        revokeTitle: "Die Freigabe des CAD-Modells wurde aufgehoben",
        revokeText: "Die Freigabe des CAD-Modells <strong>{filename}</strong> wurde vom Eigent\xFCmer aufgehoben.",
        revokeInfo: "Der Link, den Sie zuvor erhalten haben, funktioniert nicht mehr.",
        // Sharing management
        deleteInstruction: "Wenn Sie die Freigabe jederzeit aufheben m\xF6chten, k\xF6nnen Sie den folgenden Link verwenden:",
        deleteAction: "Freigabe aufheben",
        // Promotional message
        promoMessage: "Vielen Dank f\xFCr die Nutzung unserer Anwendung. Versuchen Sie, Ihr eigenes Modell zu teilen oder nutzen Sie unsere CNC-Dienstleistungen.",
        visitWebsite: "Besuchen Sie unsere Website: https://fastcnc.eu"
      },
      fr: {
        subject: "Lien du mod\xE8le CAO: {filename}",
        shareTitle: "Un mod\xE8le CAO a \xE9t\xE9 partag\xE9 avec vous",
        shareText: "Quelqu'un a partag\xE9 un mod\xE8le CAO <strong>{filename}</strong> avec vous pour visualisation.",
        shareAction: "Voir le mod\xE8le",
        viewInstructions: "Vous pouvez le voir en cliquant sur le lien ci-dessous:",
        passwordInstructions: "<strong>Pour acc\xE9der au mod\xE8le, utilisez le mot de passe:</strong> {password}",
        expiryInfo: "Ce lien sera actif {expiryInfo}.",
        expiryDate: "jusqu'au {date}",
        expiryNone: "jusqu'\xE0 annulation par le propri\xE9taire",
        autoMessage: "Ce message a \xE9t\xE9 g\xE9n\xE9r\xE9 automatiquement. Veuillez ne pas r\xE9pondre \xE0 cet email.",
        // Revocation email
        revokeSubject: "Le partage du mod\xE8le CAO a \xE9t\xE9 annul\xE9: {filename}",
        revokeTitle: "Le partage du mod\xE8le CAO a \xE9t\xE9 annul\xE9",
        revokeText: "Le partage du mod\xE8le CAO <strong>{filename}</strong> a \xE9t\xE9 annul\xE9 par le propri\xE9taire.",
        revokeInfo: "Le lien que vous avez re\xE7u pr\xE9c\xE9demment ne fonctionnera plus.",
        // Sharing management
        deleteInstruction: "Si vous souhaitez annuler le partage \xE0 tout moment, vous pouvez utiliser le lien ci-dessous:",
        deleteAction: "Annuler le partage",
        // Promotional message
        promoMessage: "Merci d'utiliser notre application. Essayez de partager votre propre mod\xE8le ou utilisez nos services CNC.",
        visitWebsite: "Visitez notre site web: https://fastcnc.eu"
      },
      cs: {
        subject: "Odkaz na CAD model: {filename}",
        shareTitle: "CAD model byl s v\xE1mi sd\xEDlen",
        shareText: "N\u011Bkdo s v\xE1mi sd\xEDlel CAD model <strong>{filename}</strong> k prohl\xED\u017Een\xED.",
        shareAction: "Zobrazit model",
        viewInstructions: "M\u016F\u017Eete si jej prohl\xE9dnout kliknut\xEDm na odkaz n\xED\u017Ee:",
        passwordInstructions: "<strong>Pro p\u0159\xEDstup k modelu pou\u017Eijte heslo:</strong> {password}",
        expiryInfo: "Tento odkaz bude aktivn\xED {expiryInfo}.",
        expiryDate: "do {date}",
        expiryNone: "dokud nebude zru\u0161en vlastn\xEDkem",
        autoMessage: "Tato zpr\xE1va byla vygenerov\xE1na automaticky. Pros\xEDm neodpov\xEDdejte na tento e-mail.",
        // Revocation email
        revokeSubject: "Sd\xEDlen\xED CAD modelu bylo zru\u0161eno: {filename}",
        revokeTitle: "Sd\xEDlen\xED CAD modelu bylo zru\u0161eno",
        revokeText: "Sd\xEDlen\xED CAD modelu <strong>{filename}</strong> bylo zru\u0161eno vlastn\xEDkem.",
        revokeInfo: "Odkaz, kter\xFD jste d\u0159\xEDve obdr\u017Eeli, ji\u017E nebude funk\u010Dn\xED.",
        // Sharing management
        deleteInstruction: "Pokud chcete kdykoli zru\u0161it sd\xEDlen\xED, m\u016F\u017Eete pou\u017E\xEDt n\xE1sleduj\xEDc\xED odkaz:",
        deleteAction: "Zru\u0161it sd\xEDlen\xED",
        // Promotional message
        promoMessage: "D\u011Bkujeme, \u017Ee pou\u017E\xEDv\xE1te na\u0161i aplikaci. Vyzkou\u0161ejte sd\xEDlen\xED vlastn\xEDho modelu nebo vyu\u017Eijte na\u0161ich slu\u017Eeb CNC.",
        visitWebsite: "Nav\u0161tivte na\u0161e webov\xE9 str\xE1nky: https://fastcnc.eu"
      }
    };
  }
});

// server/custom-smtp.ts
var custom_smtp_exports = {};
__export(custom_smtp_exports, {
  initializeCustomSmtpService: () => initializeCustomSmtpService,
  sendContactFormEmail: () => sendContactFormEmail,
  sendShareNotificationSmtp: () => sendShareNotificationSmtp,
  sendSharingRevokedNotificationSmtp: () => sendSharingRevokedNotificationSmtp
});
import nodemailer2 from "nodemailer";
function initializeCustomSmtpService(config) {
  try {
    if (!config.host || !config.user || !config.pass) {
      console.warn("SMTP configuration is incomplete, email notifications may not work correctly");
      return false;
    }
    customSmtpTransporter = nodemailer2.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
    console.log(`Custom SMTP email service initialized successfully (${config.host}:${config.port})`);
    return true;
  } catch (error) {
    console.error("Failed to initialize custom SMTP email service:", error);
    return false;
  }
}
async function sendShareNotificationSmtp(model, recipient, baseUrl, password, language) {
  const emailLanguage = language || "en";
  if (!customSmtpTransporter) {
    console.error("Custom SMTP email service not initialized");
    return false;
  }
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  try {
    const emailModule = await Promise.resolve().then(() => (init_email(), email_exports));
    const shareUrl = `${baseUrl}/shared/${model.shareId}`;
    const deleteUrl = model.shareDeleteToken ? `${baseUrl}/revoke-share/${model.shareId}/${model.shareDeleteToken}` : null;
    const translations = emailModule.EMAIL_TRANSLATIONS[emailLanguage] || emailModule.EMAIL_TRANSLATIONS.en;
    const expiryInfo = model.shareExpiryDate ? translations.expiryDate.replace("{date}", new Date(model.shareExpiryDate).toLocaleDateString(emailLanguage)) : translations.expiryNone;
    const replaceTemplateVariables2 = (template, variables) => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(`{${key}}`, value);
      }
      return result;
    };
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
      subject: replaceTemplateVariables2(translations.subject, { filename: model.filename }),
      html: `
        ${logoHtml}
        <h2>${translations.shareTitle}</h2>
        <p>${replaceTemplateVariables2(translations.shareText, { filename: model.filename })}</p>
        <p>${translations.viewInstructions}</p>
        <p><a href="${shareUrl}" style="padding: 10px 20px; background-color: #DB1D37; color: white; text-decoration: none; border-radius: 5px;">
          ${translations.shareAction}
        </a></p>
        ${password ? replaceTemplateVariables2(translations.passwordInstructions, { password }) : ""}
        <p>${replaceTemplateVariables2(translations.expiryInfo, { expiryInfo })}</p>
        ${deleteUrl ? `
        <p style="margin-top: 20px;">${translations.deleteInstruction}</p>
        <p><a href="${deleteUrl}" style="padding: 8px 16px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 5px;">
          ${translations.deleteAction}
        </a></p>
        ` : ""}
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
        
        ${replaceTemplateVariables2(translations.shareText, { filename: model.filename })}
        
        ${translations.viewInstructions}
        ${shareUrl}
        
        ${password ? replaceTemplateVariables2(translations.passwordInstructions, { password }) : ""}
        
        ${replaceTemplateVariables2(translations.expiryInfo, { expiryInfo })}
        
        ${deleteUrl ? `
        ${translations.deleteInstruction}
        ${deleteUrl}
        ` : ""}
        
        ${translations.promoMessage}
        ${translations.visitWebsite}
        
        ${translations.autoMessage}
      `
    };
    const info = await customSmtpTransporter.sendMail(mailOptions);
    console.log("Custom SMTP email sent, message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email through custom SMTP:", error);
    return false;
  }
}
async function sendContactFormEmail(formData, language = "en", modelInfo) {
  if (!customSmtpTransporter) {
    console.error("Custom SMTP email service not initialized");
    return false;
  }
  const toEmail = "info@fastcnc.eu";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  try {
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
    const subject = `Nowa wiadomo\u015B\u0107 z formularza kontaktowego od ${formData.name}`;
    let modelSection = "";
    if (formData.modelId && modelInfo) {
      modelSection = `
        <div style="margin-top: 15px; padding: 10px; background-color: #f0f8ff; border-radius: 5px; border: 1px solid #cce5ff;">
          <h3 style="margin-top: 0; color: #0056b3;">Informacje o modelu</h3>
          <p>
            <strong>Nazwa pliku:</strong> ${modelInfo.filename || "Nie podano"}<br>
            <strong>ID modelu:</strong> ${formData.modelId}
          </p>
        </div>
      `;
    }
    const phoneDisplay = formData.phone ? `<strong>Telefon:</strong> ${formData.phone}<br>` : "";
    const companyDisplay = formData.company ? `<strong>Firma:</strong> ${formData.company}<br>` : "";
    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      replyTo: formData.email,
      // Ustawienie Reply-To na adres nadawcy, by odpowiedź trafiła do klienta
      subject,
      html: `
        ${logoHtml}
        <h2>Nowa wiadomo\u015B\u0107 z formularza kontaktowego</h2>
        
        <div style="margin-bottom: 20px;">
          <p>
            <strong>Imi\u0119 i nazwisko:</strong> ${formData.name}<br>
            <strong>Email:</strong> ${formData.email}<br>
            ${phoneDisplay}
            ${companyDisplay}
          </p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-top: 0;">Wiadomo\u015B\u0107:</h3>
          <div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px; border: 1px solid #e0e0e0;">
            ${formData.message.replace(/\n/g, "<br>")}
          </div>
        </div>
        
        ${modelSection}
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          Wiadomo\u015B\u0107 wys\u0142ana automatycznie z formularza kontaktowego aplikacji CAD Viewer.<br>
          J\u0119zyk formularza: ${language}<br>
          Data i czas: ${(/* @__PURE__ */ new Date()).toLocaleString()}
        </p>
      `,
      text: `
        Nowa wiadomo\u015B\u0107 z formularza kontaktowego
        
        Imi\u0119 i nazwisko: ${formData.name}
        Email: ${formData.email}
        ${formData.phone ? `Telefon: ${formData.phone}
` : ""}
        ${formData.company ? `Firma: ${formData.company}
` : ""}
        
        Wiadomo\u015B\u0107:
        ${formData.message}
        
        ${formData.modelId && modelInfo ? `
        Informacje o modelu:
        Nazwa pliku: ${modelInfo.filename || "Nie podano"}
        ID modelu: ${formData.modelId}
        ` : ""}
        
        Wiadomo\u015B\u0107 wys\u0142ana automatycznie z formularza kontaktowego aplikacji CAD Viewer.
        J\u0119zyk formularza: ${language}
        Data i czas: ${(/* @__PURE__ */ new Date()).toLocaleString()}
      `
    };
    const info = await customSmtpTransporter.sendMail(mailOptions);
    console.log("Contact form email sent, message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending contact form email:", error);
    return false;
  }
}
async function sendSharingRevokedNotificationSmtp(model, recipient, language, baseUrl) {
  const emailLanguage = language || "en";
  const effectiveBaseUrl = baseUrl || (process.env.NODE_ENV === "production" ? "https://viewer.fastcnc.eu" : "http://localhost:5000");
  if (!customSmtpTransporter) {
    console.error("Custom SMTP email service not initialized");
    return false;
  }
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || '"CAD Viewer App" <no-reply@cadviewer.app>';
  try {
    const emailModule = await Promise.resolve().then(() => (init_email(), email_exports));
    const deleteUrl = model.shareDeleteToken ? `${effectiveBaseUrl}/revoke-share/${model.shareId}/${model.shareDeleteToken}` : null;
    const translations = emailModule.EMAIL_TRANSLATIONS[emailLanguage] || emailModule.EMAIL_TRANSLATIONS.en;
    const replaceTemplateVariables2 = (template, variables) => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(`{${key}}`, value);
      }
      return result;
    };
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
      subject: replaceTemplateVariables2(translations.revokeSubject, { filename: model.filename }),
      html: `
        ${logoHtml}
        <h2>${translations.revokeTitle}</h2>
        <p>${replaceTemplateVariables2(translations.revokeText, { filename: model.filename })}</p>
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
        
        ${replaceTemplateVariables2(translations.revokeText, { filename: model.filename })}
        
        ${translations.revokeInfo}
        
        ${translations.promoMessage}
        ${translations.visitWebsite}
        
        ${translations.autoMessage}
      `
    };
    const info = await customSmtpTransporter.sendMail(mailOptions);
    console.log("Custom SMTP revocation email sent, message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending revocation email through custom SMTP:", error);
    return false;
  }
}
var customSmtpTransporter;
var init_custom_smtp = __esm({
  "server/custom-smtp.ts"() {
    "use strict";
    customSmtpTransporter = null;
  }
});

// server/google-translate.ts
var google_translate_exports = {};
__export(google_translate_exports, {
  detectLanguage: () => detectLanguage2,
  mapToSupportedLanguage: () => mapToSupportedLanguage,
  translateDescription: () => translateDescription
});
async function translateText(text2, targetLanguage, sourceLanguage) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error("Google Translate API key not configured");
  }
  const url = "https://translation.googleapis.com/language/translate/v2";
  const params = new URLSearchParams({
    key: apiKey,
    q: text2,
    target: targetLanguage,
    format: "text"
  });
  if (sourceLanguage) {
    params.append("source", sourceLanguage);
  }
  try {
    const response = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Translate API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    if (!data.data || !data.data.translations || data.data.translations.length === 0) {
      throw new Error("Invalid response from Google Translate API");
    }
    const translation = data.data.translations[0];
    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}
async function translateDescription(originalText, originalLanguage) {
  const sourceLanguageCode = LANGUAGE_CODES[originalLanguage];
  const results = {};
  const originalKey = `description${originalLanguage.charAt(0).toUpperCase() + originalLanguage.slice(1)}`;
  results[originalKey] = originalText;
  for (const [langKey, langCode] of Object.entries(LANGUAGE_CODES)) {
    if (langKey === originalLanguage) {
      continue;
    }
    try {
      const translation = await translateText(originalText, langCode, sourceLanguageCode);
      const descriptionKey = `description${langKey.charAt(0).toUpperCase() + langKey.slice(1)}`;
      results[descriptionKey] = translation.translatedText;
      console.log(`Translated to ${langKey}: "${translation.translatedText}"`);
    } catch (error) {
      console.error(`Failed to translate to ${langKey}:`, error);
    }
  }
  return results;
}
async function detectLanguage2(text2) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("Google Translate API key not configured");
    return null;
  }
  const url = "https://translation.googleapis.com/language/translate/v2/detect";
  const params = new URLSearchParams({
    key: apiKey,
    q: text2
  });
  try {
    const response = await fetch(`${url}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    if (!response.ok) {
      throw new Error(`Language detection error: ${response.status}`);
    }
    const data = await response.json();
    if (data.data && data.data.detections && data.data.detections[0] && data.data.detections[0][0]) {
      return data.data.detections[0][0].language;
    }
    return null;
  } catch (error) {
    console.error("Language detection error:", error);
    return null;
  }
}
function mapToSupportedLanguage(detectedLanguage) {
  for (const [ourLang, googleLang] of Object.entries(LANGUAGE_CODES)) {
    if (googleLang === detectedLanguage) {
      return ourLang;
    }
  }
  return "en";
}
var LANGUAGE_CODES;
var init_google_translate = __esm({
  "server/google-translate.ts"() {
    "use strict";
    LANGUAGE_CODES = {
      en: "en",
      pl: "pl",
      cs: "cs",
      de: "de",
      fr: "fr",
      es: "es"
    };
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accessSharedModelSchema: () => accessSharedModelSchema,
  adminLoginSchema: () => adminLoginSchema,
  cadModelMetadataSchema: () => cadModelMetadataSchema,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  clientLoginSchema: () => clientLoginSchema,
  clientPasswordChangeSchema: () => clientPasswordChangeSchema,
  clientRegistrationSchema: () => clientRegistrationSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertModelDescriptionSchema: () => insertModelDescriptionSchema,
  insertModelGallerySchema: () => insertModelGallerySchema,
  insertModelSchema: () => insertModelSchema,
  insertModelViewSchema: () => insertModelViewSchema,
  insertTagSchema: () => insertTagSchema,
  insertUserSchema: () => insertUserSchema,
  modelDescriptions: () => modelDescriptions,
  modelDescriptionsRelations: () => modelDescriptionsRelations,
  modelGallery: () => modelGallery,
  modelGalleryRelations: () => modelGalleryRelations,
  modelInfoSchema: () => modelInfoSchema,
  modelTags: () => modelTags,
  modelTagsRelations: () => modelTagsRelations,
  modelTreeSchema: () => modelTreeSchema,
  modelViewStatsSchema: () => modelViewStatsSchema,
  modelViews: () => modelViews,
  models: () => models,
  modelsRelations: () => modelsRelations,
  resetPasswordRequestSchema: () => resetPasswordRequestSchema,
  resetPasswordSchema: () => resetPasswordSchema,
  searchLibrarySchema: () => searchLibrarySchema,
  selectModelGallerySchema: () => selectModelGallerySchema,
  shareModelSchema: () => shareModelSchema,
  stlModelMetadataSchema: () => stlModelMetadataSchema,
  tags: () => tags,
  tagsRelations: () => tagsRelations,
  updateModelTagsSchema: () => updateModelTagsSchema,
  updateSharedModelSchema: () => updateSharedModelSchema,
  userDataSchema: () => userDataSchema,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  // Email jest teraz wymagany i używany do logowania
  username: text("username").unique(),
  // Username jest teraz opcjonalny 
  password: text("password").notNull(),
  fullName: text("full_name"),
  company: text("company"),
  isAdmin: boolean("is_admin").default(false),
  // Pole określające, czy użytkownik jest administratorem
  isClient: boolean("is_client").default(false),
  // Pole określające, czy użytkownik jest klientem
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  resetToken: text("reset_token"),
  // Token do resetowania hasła
  resetTokenExpiry: timestamp("reset_token_expiry")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  company: true,
  isAdmin: true,
  isClient: true
});
var clientRegistrationSchema = z.object({
  email: z.string().email("Nieprawid\u0142owy adres email"),
  password: z.string().min(6, "Has\u0142o musi mie\u0107 co najmniej 6 znak\xF3w"),
  fullName: z.string().min(1, "Imi\u0119 i nazwisko s\u0105 wymagane"),
  company: z.string().optional(),
  username: z.string().min(3, "Nazwa u\u017Cytkownika musi mie\u0107 co najmniej 3 znaki").optional()
});
var clientLoginSchema = z.object({
  email: z.string().email("Nieprawid\u0142owy adres email"),
  password: z.string().min(1, "Has\u0142o jest wymagane")
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  namePl: text("name_pl").notNull(),
  nameDe: text("name_de").notNull(),
  nameFr: text("name_fr").notNull(),
  nameCs: text("name_cs").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionPl: text("description_pl"),
  descriptionDe: text("description_de"),
  descriptionFr: text("description_fr"),
  descriptionCs: text("description_cs"),
  icon: text("icon"),
  // Lucide icon name
  color: text("color").default("#3B82F6"),
  // Hex color for category
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  namePl: text("name_pl").notNull(),
  nameDe: text("name_de").notNull(),
  nameFr: text("name_fr").notNull(),
  nameCs: text("name_cs").notNull(),
  nameEs: text("name_es").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),
  color: text("color").default("#6B7280"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  usageCount: true,
  createdAt: true
});
var modelTags = pgTable("model_tags", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var models = pgTable("models", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").unique(),
  // Maskowany identyfikator do użytku w URL-ach
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  format: text("format"),
  created: text("created").notNull(),
  sourceSystem: text("source_system"),
  metadata: jsonb("metadata"),
  // Zawiera wszystkie dodatkowe dane, w tym ścieżki do plików STL i JSON
  shareId: text("share_id").unique(),
  // Unikalny identyfikator do udostępniania
  shareEnabled: boolean("share_enabled").default(false),
  // Czy udostępnianie jest włączone
  sharePassword: text("share_password"),
  // Opcjonalne hasło do zabezpieczenia pliku (przechowywane jako hash)
  shareExpiryDate: text("share_expiry_date"),
  // Data wygaśnięcia udostępniania (opcjonalnie)
  shareDeleteToken: text("share_delete_token"),
  // Unikalny token do usuwania udostępnienia przez użytkownika
  shareEmail: text("share_email"),
  // Email osoby, której udostępniono model
  shareNotificationSent: boolean("share_notification_sent").default(false),
  // Czy powiadomienie zostało wysłane
  shareLastAccessed: text("share_last_accessed"),
  // Ostatni dostęp do udostępnionego modelu
  tags: text("tags").array(),
  // Tablica tagów dla łatwego wyszukiwania
  categoryId: integer("category_id").references(() => categories.id),
  isPublic: boolean("is_public").default(false)
  // Czy model jest dostępny w publicznej bibliotece CAD
});
var modelDescriptions = pgTable("model_descriptions", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  descriptionEn: text("description_en"),
  descriptionPl: text("description_pl"),
  descriptionCs: text("description_cs"),
  descriptionDe: text("description_de"),
  descriptionFr: text("description_fr"),
  descriptionEs: text("description_es"),
  originalLanguage: text("original_language").notNull(),
  // Język oryginalnego opisu
  originalDescription: text("original_description").notNull(),
  // Oryginalny opis użytkownika
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertModelSchema = createInsertSchema(models).omit({
  id: true
});
var insertModelDescriptionSchema = createInsertSchema(modelDescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var modelTreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["model", "assembly", "part", "feature"]),
  children: z.array(z.any()).optional(),
  selected: z.boolean().optional()
});
var modelInfoSchema = z.object({
  filename: z.string(),
  filesize: z.number(),
  format: z.string().optional(),
  created: z.string(),
  sourceSystem: z.string().optional(),
  parts: z.number().optional(),
  assemblies: z.number().optional(),
  surfaces: z.number().optional(),
  solids: z.number().optional(),
  properties: z.record(z.string(), z.string()).optional(),
  // Dodane pola dotyczące udostępniania
  shareEnabled: z.boolean().optional(),
  shareId: z.string().optional(),
  hasPassword: z.boolean().optional(),
  shareEmail: z.string().optional(),
  shareExpiryDate: z.string().optional(),
  shareLastAccessed: z.string().optional(),
  shareDeleteToken: z.string().optional(),
  tags: z.array(z.string()).optional()
  // Lista tagów do wyszukiwania
});
var modelGallery = pgTable("model_gallery", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filesize: integer("filesize").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  isThumbnail: boolean("is_thumbnail").default(false).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  s3Key: varchar("s3_key", { length: 500 })
});
var modelGalleryRelations = relations(modelGallery, ({ one }) => ({
  model: one(models, {
    fields: [modelGallery.modelId],
    references: [models.id]
  })
}));
var modelDescriptionsRelations = relations(modelDescriptions, ({ one }) => ({
  model: one(models, {
    fields: [modelDescriptions.modelId],
    references: [models.id]
  })
}));
var insertModelGallerySchema = createInsertSchema(modelGallery);
var selectModelGallerySchema = createInsertSchema(modelGallery);
var userDataSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  fullName: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email("Nieprawid\u0142owy adres email").optional()
});
var shareModelSchema = z.object({
  modelId: z.number(),
  enableSharing: z.boolean(),
  password: z.string().optional(),
  expiryDate: z.string().optional(),
  email: z.string().email("Nieprawid\u0142owy adres email").optional(),
  language: z.string().optional(),
  // Język używany do wiadomości e-mail
  createAccount: z.boolean().optional(),
  // Czy utworzyć konto podczas udostępniania
  userData: userDataSchema.optional()
  // Dane użytkownika do rejestracji podczas udostępniania
});
var accessSharedModelSchema = z.object({
  shareId: z.string(),
  password: z.string().optional()
});
var adminLoginSchema = z.object({
  username: z.string().min(1, "Nazwa u\u017Cytkownika jest wymagana"),
  password: z.string().min(1, "Has\u0142o jest wymagane")
});
var modelViews = pgTable("model_views", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id).notNull(),
  shareId: text("share_id"),
  // Może być null jeśli wyświetlenie nastąpiło przez standardowy dostęp
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  authenticated: boolean("authenticated").default(false)
  // Czy użytkownik przeszedł uwierzytelnienie (np. hasło)
});
var insertModelViewSchema = createInsertSchema(modelViews).omit({
  id: true
});
var modelViewStatsSchema = z.object({
  totalViews: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  uniqueIPs: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  // Uwaga: zmienione na 'uniqueIPs' dla spójności z UI
  firstView: z.string().optional(),
  lastView: z.string().optional(),
  viewDetails: z.array(z.object({
    ipAddress: z.string(),
    userAgent: z.string().optional(),
    viewedAt: z.string(),
    authenticated: z.boolean().optional()
  })),
  ipAddresses: z.array(z.object({
    address: z.string(),
    count: z.union([z.number(), z.string()]).transform((val) => Number(val)),
    lastView: z.string().optional()
  })).optional(),
  browserStats: z.array(z.object({
    name: z.string(),
    count: z.union([z.number(), z.string()]).transform((val) => Number(val))
  })).optional()
});
var clientPasswordChangeSchema = z.object({
  oldPassword: z.string().min(1, "Aktualne has\u0142o jest wymagane"),
  newPassword: z.string().min(6, "Nowe has\u0142o musi mie\u0107 co najmniej 6 znak\xF3w")
});
var resetPasswordRequestSchema = z.object({
  email: z.string().email("Nieprawid\u0142owy adres email")
});
var resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, "Nowe has\u0142o musi mie\u0107 co najmniej 6 znak\xF3w")
});
var updateSharedModelSchema = z.object({
  modelId: z.number(),
  password: z.string().optional(),
  expiryDate: z.string().optional()
});
var updateModelTagsSchema = z.object({
  modelId: z.number(),
  tags: z.array(z.string())
});
var searchLibrarySchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20)
});
var stlModelMetadataSchema = z.object({
  filePath: z.string(),
  stlFilePath: z.string(),
  s3Key: z.string().nullable(),
  // Klucz S3 dla plików przechowywanych w chmurze
  isDirectStl: z.boolean().default(false),
  stlFormat: z.string().default("unknown"),
  parts: z.number(),
  assemblies: z.number(),
  surfaces: z.number(),
  solids: z.number(),
  userEmail: z.string().nullable(),
  properties: z.object({
    author: z.string(),
    organization: z.string(),
    partNumber: z.string(),
    revision: z.string()
  }),
  viewToken: z.string().optional()
  // Token dostępu dla niezalogowanych użytkowników
});
var cadModelMetadataSchema = z.object({
  filePath: z.string(),
  fileType: z.string(),
  cadFormat: z.string(),
  entities: z.number(),
  layers: z.number(),
  userEmail: z.string().nullable(),
  properties: z.object({
    author: z.string(),
    organization: z.string(),
    drawingNumber: z.string(),
    revision: z.string()
  }),
  viewToken: z.string().optional()
  // Token dostępu dla niezalogowanych użytkowników
});
var categoriesRelations = relations(categories, ({ many }) => ({
  models: many(models),
  tags: many(tags)
}));
var tagsRelations = relations(tags, ({ one, many }) => ({
  category: one(categories, {
    fields: [tags.categoryId],
    references: [categories.id]
  }),
  modelTags: many(modelTags)
}));
var modelsRelations = relations(models, ({ one, many }) => ({
  user: one(users, {
    fields: [models.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [models.categoryId],
    references: [categories.id]
  }),
  description: one(modelDescriptions, {
    fields: [models.id],
    references: [modelDescriptions.modelId]
  }),
  modelTags: many(modelTags),
  gallery: many(modelGallery),
  views: many(modelViews)
}));
var modelTagsRelations = relations(modelTags, ({ one }) => ({
  model: one(models, {
    fields: [modelTags.modelId],
    references: [models.id]
  }),
  tag: one(tags, {
    fields: [modelTags.tagId],
    references: [tags.id]
  })
}));

// server/storage.ts
import { eq, sql, and, desc, or, like, ilike, inArray } from "drizzle-orm";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
var PostgresStorage = class {
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async getUserByResetToken(token) {
    const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
    return result[0];
  }
  async searchUsers(query) {
    const result = await db.select().from(users).where(
      or(
        ilike(users.username, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.fullName, `%${query}%`)
      )
    );
    return result;
  }
  async getModelsByEmail(email) {
    return await db.select().from(models).where(eq(models.shareEmail, email));
  }
  async getModelsByClientId(clientId) {
    return await db.select().from(models).where(eq(models.userId, clientId));
  }
  async getSharedModelsByEmail(email) {
    return await db.select().from(models).where(
      and(
        eq(models.shareEmail, email),
        eq(models.shareEnabled, true)
      )
    );
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async createModel(insertModel) {
    const { nanoid: nanoid4 } = await import("nanoid");
    const publicId = `model_${nanoid4(12)}`;
    const modelData = {
      ...insertModel,
      publicId,
      userId: insertModel.userId ?? null,
      format: insertModel.format ?? null,
      sourceSystem: insertModel.sourceSystem ?? null,
      metadata: insertModel.metadata ?? null,
      shareId: insertModel.shareId ?? null,
      shareEnabled: insertModel.shareEnabled ?? false,
      sharePassword: insertModel.sharePassword ?? null,
      shareExpiryDate: insertModel.shareExpiryDate ?? null,
      shareEmail: insertModel.shareEmail ?? null,
      shareNotificationSent: insertModel.shareNotificationSent ?? false,
      shareLastAccessed: insertModel.shareLastAccessed ?? null
    };
    const result = await db.insert(models).values(modelData).returning();
    return result[0];
  }
  async getModel(id) {
    const result = await db.select().from(models).where(eq(models.id, id)).limit(1);
    return result[0];
  }
  async getModelByPublicId(publicId) {
    const result = await db.select().from(models).where(eq(models.publicId, publicId)).limit(1);
    return result[0];
  }
  async getModelsByUserId(userId) {
    return await db.select().from(models).where(eq(models.userId, userId));
  }
  async deleteModel(id) {
    const result = await db.delete(models).where(eq(models.id, id)).returning({ id: models.id });
    return result.length > 0;
  }
  async updateModel(id, updates) {
    const result = await db.update(models).set(updates).where(eq(models.id, id)).returning();
    return result[0];
  }
  async getModels() {
    return await db.select().from(models);
  }
  async getModelByShareId(shareId) {
    const result = await db.select().from(models).where(eq(models.shareId, shareId)).limit(1);
    if (result.length > 0 && result[0].shareEnabled) {
      return result[0];
    }
    return void 0;
  }
  async getSharedModels() {
    const result = await db.select().from(models).where(
      sql`${models.userId} IS NOT NULL`
      // Modele przypisane do użytkowników
    );
    return result;
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  async recordModelView(viewData) {
    const result = await db.insert(modelViews).values(viewData).returning();
    return result[0];
  }
  async getModelViewStats(modelId) {
    const views = await db.select().from(modelViews).where(eq(modelViews.modelId, modelId)).orderBy(desc(modelViews.viewedAt));
    if (views.length === 0) {
      return {
        totalViews: 0,
        uniqueIPs: 0,
        viewDetails: []
      };
    }
    const uniqueClientIPs = /* @__PURE__ */ new Set();
    for (const view of views) {
      uniqueClientIPs.add(view.ipAddress);
    }
    const uniqueIPsCount = uniqueClientIPs.size;
    const firstView = views[views.length - 1].viewedAt.toISOString();
    const lastView = views[0].viewedAt.toISOString();
    const viewDetails = views.map((view) => ({
      ipAddress: view.ipAddress,
      userAgent: view.userAgent || void 0,
      viewedAt: view.viewedAt.toISOString(),
      authenticated: view.authenticated || false
    }));
    const ipAddressMap = {};
    for (const view of views) {
      const ipAddress = view.ipAddress;
      if (!ipAddressMap[ipAddress]) {
        ipAddressMap[ipAddress] = { count: 0, lastView: view.viewedAt };
      }
      ipAddressMap[ipAddress].count += 1;
      if (view.viewedAt > ipAddressMap[ipAddress].lastView) {
        ipAddressMap[ipAddress].lastView = view.viewedAt;
      }
    }
    const ipAddresses = Object.entries(ipAddressMap).map(([address, data]) => ({
      address,
      count: data.count,
      lastView: data.lastView.toISOString()
    }));
    const browserStats = [];
    const browserMap = {};
    for (const view of views) {
      if (view.userAgent) {
        const browserName = this.detectBrowser(view.userAgent);
        browserMap[browserName] = (browserMap[browserName] || 0) + 1;
      }
    }
    for (const [name, count] of Object.entries(browserMap)) {
      browserStats.push({ name, count });
    }
    browserStats.sort((a, b) => b.count - a.count);
    return {
      totalViews: views.length,
      uniqueIPs: uniqueIPsCount,
      firstView,
      lastView,
      viewDetails,
      ipAddresses,
      browserStats
    };
  }
  // Pomocnicza funkcja do wykrywania przeglądarki na podstawie userAgent
  detectBrowser(userAgent) {
    userAgent = userAgent.toLowerCase();
    if (userAgent.includes("firefox")) return "Firefox";
    if (userAgent.includes("chrome") && !userAgent.includes("edg")) return "Chrome";
    if (userAgent.includes("safari") && !userAgent.includes("chrome")) return "Safari";
    if (userAgent.includes("edg")) return "Edge";
    if (userAgent.includes("opera") || userAgent.includes("opr")) return "Opera";
    if (userAgent.includes("msie") || userAgent.includes("trident")) return "Internet Explorer";
    return "Other";
  }
  async getModelViewCount(modelId) {
    const countResult = await db.select({ count: sql`count(*)` }).from(modelViews).where(eq(modelViews.modelId, modelId));
    return countResult[0]?.count || 0;
  }
  // Implementacja metod dla biblioteki otwartej
  async getLibraryModels(options) {
    try {
      const { query, tags: tags2, page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      let baseQuery = eq(models.isPublic, true);
      if (query) {
        baseQuery = and(
          baseQuery,
          or(
            like(models.filename, `%${query}%`),
            // Używamy PostgreSQL-owej składni dla sprawdzania tablicy JSON
            sql`${models.tags}::jsonb @> ${JSON.stringify([query])}::jsonb`
          )
        );
      }
      if (tags2 && tags2.length > 0) {
        baseQuery = and(
          baseQuery,
          sql`${models.tags}::jsonb @> ${JSON.stringify(tags2)}::jsonb`
        );
      }
      const result = await db.select().from(models).where(baseQuery).orderBy(desc(models.created)).limit(limit).offset(offset);
      return result;
    } catch (error) {
      console.error("Error getting library models:", error);
      return [];
    }
  }
  async updateModelTags(modelId, tags2) {
    try {
      const [updatedModel] = await db.update(models).set({ tags: tags2.length > 0 ? tags2 : null }).where(eq(models.id, modelId)).returning();
      return updatedModel;
    } catch (error) {
      console.error("Error updating model tags:", error);
      return void 0;
    }
  }
  // Gallery methods
  async getModelGallery(modelId) {
    try {
      const result = await db.select().from(modelGallery).where(eq(modelGallery.modelId, modelId)).orderBy(modelGallery.displayOrder);
      return result;
    } catch (error) {
      console.error("Error getting model gallery:", error);
      return [];
    }
  }
  async addGalleryImage(image) {
    try {
      const existingImages = await this.getModelGallery(image.modelId);
      const maxOrder = existingImages.length > 0 ? Math.max(...existingImages.map((img) => img.displayOrder)) + 1 : 0;
      const [newImage] = await db.insert(modelGallery).values({
        modelId: image.modelId,
        filename: image.filename,
        originalName: image.originalName,
        filesize: image.filesize,
        mimeType: image.mimeType,
        displayOrder: image.displayOrder ?? maxOrder,
        isThumbnail: image.isThumbnail ?? false,
        s3Key: image.s3Key ?? null
      }).returning();
      return newImage;
    } catch (error) {
      console.error("Error adding gallery image:", error);
      throw error;
    }
  }
  async deleteGalleryImage(imageId) {
    try {
      const result = await db.delete(modelGallery).where(eq(modelGallery.id, imageId));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      return false;
    }
  }
  async updateGalleryImageOrder(imageId, newOrder) {
    try {
      const [updatedImage] = await db.update(modelGallery).set({ displayOrder: newOrder }).where(eq(modelGallery.id, imageId)).returning();
      return updatedImage;
    } catch (error) {
      console.error("Error updating gallery image order:", error);
      return void 0;
    }
  }
  async clearGalleryThumbnails(modelId) {
    try {
      await db.update(modelGallery).set({ isThumbnail: false }).where(eq(modelGallery.modelId, modelId));
    } catch (error) {
      console.error("Error clearing gallery thumbnails:", error);
    }
  }
  async setGalleryThumbnail(imageId) {
    try {
      const [updatedImage] = await db.update(modelGallery).set({ isThumbnail: true }).where(eq(modelGallery.id, imageId)).returning();
      return updatedImage;
    } catch (error) {
      console.error("Error setting gallery thumbnail:", error);
      return void 0;
    }
  }
  async updateModelThumbnail(modelId, thumbnailPath) {
    try {
      const [currentModel] = await db.select().from(models).where(eq(models.id, modelId)).limit(1);
      if (!currentModel) return;
      const currentMetadata = currentModel.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        thumbnailPath
      };
      await db.update(models).set({ metadata: updatedMetadata }).where(eq(models.id, modelId));
    } catch (error) {
      console.error("Error updating model thumbnail:", error);
    }
  }
  // Category and tag operations
  async getCategories() {
    const result = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
    return result;
  }
  async getCategory(id) {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0] || void 0;
  }
  async getTags(categoryId) {
    if (categoryId) {
      const result = await db.select().from(tags).where(and(eq(tags.isActive, true), eq(tags.categoryId, categoryId))).orderBy(desc(tags.usageCount));
      return result;
    } else {
      const result = await db.select().from(tags).where(eq(tags.isActive, true)).orderBy(desc(tags.usageCount));
      return result;
    }
  }
  async getTag(id) {
    const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return result[0] || void 0;
  }
  async createTag(tag) {
    const result = await db.insert(tags).values(tag).returning();
    return result[0];
  }
  async updateModelCategory(modelId, categoryId) {
    const result = await db.update(models).set({ categoryId }).where(eq(models.id, modelId)).returning();
    return result[0] || void 0;
  }
  async addModelTags(modelId, tagIds) {
    if (tagIds.length === 0) return;
    const insertData = tagIds.map((tagId) => ({
      modelId,
      tagId
    }));
    await db.insert(modelTags).values(insertData).onConflictDoNothing();
    await db.update(tags).set({ usageCount: sql`${tags.usageCount} + 1` }).where(sql`${tags.id} = ANY(${tagIds})`);
  }
  async removeModelTags(modelId, tagIds) {
    if (tagIds.length === 0) return;
    await db.delete(modelTags).where(and(
      eq(modelTags.modelId, modelId),
      sql`${modelTags.tagId} = ANY(${tagIds})`
    ));
    await db.update(tags).set({ usageCount: sql`GREATEST(0, ${tags.usageCount} - 1)` }).where(sql`${tags.id} = ANY(${tagIds})`);
  }
  async getModelTags(modelId) {
    const result = await db.select({
      id: tags.id,
      nameEn: tags.nameEn,
      namePl: tags.namePl,
      nameDe: tags.nameDe,
      nameFr: tags.nameFr,
      nameCs: tags.nameCs,
      nameEs: tags.nameEs,
      slug: tags.slug,
      categoryId: tags.categoryId,
      color: tags.color,
      usageCount: tags.usageCount,
      isActive: tags.isActive,
      createdAt: tags.createdAt
    }).from(modelTags).innerJoin(tags, eq(modelTags.tagId, tags.id)).where(eq(modelTags.modelId, modelId));
    return result;
  }
  // Model description operations
  async getModelDescription(modelId) {
    const result = await db.select().from(modelDescriptions).where(eq(modelDescriptions.modelId, modelId)).limit(1);
    return result[0] || void 0;
  }
  async createModelDescription(description) {
    const result = await db.insert(modelDescriptions).values(description).returning();
    return result[0];
  }
  async updateModelDescription(modelId, updates) {
    const result = await db.update(modelDescriptions).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(modelDescriptions.modelId, modelId)).returning();
    return result[0] || void 0;
  }
  async deleteModelDescription(modelId) {
    const result = await db.delete(modelDescriptions).where(eq(modelDescriptions.modelId, modelId));
    return (result.rowCount || 0) > 0;
  }
  // Additional tag methods for the new tags system
  async getTagBySlug(slug) {
    const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
    return result[0] || void 0;
  }
  async updateTag(id, updates) {
    const result = await db.update(tags).set({ ...updates, createdAt: sql`${tags.createdAt}` }).where(eq(tags.id, id)).returning();
    return result[0] || void 0;
  }
  async setModelTags(modelId, tagIds) {
    await db.delete(modelTags).where(eq(modelTags.modelId, modelId));
    if (tagIds.length > 0) {
      const insertData = tagIds.map((tagId) => ({
        modelId,
        tagId
      }));
      await db.insert(modelTags).values(insertData);
      await db.update(tags).set({ usageCount: sql`${tags.usageCount} + 1` }).where(inArray(tags.id, tagIds));
    }
  }
};
var storage = new PostgresStorage();

// server/routes.ts
import multer from "multer";
init_email();
init_custom_smtp();
import { z as z2 } from "zod";
import fs2 from "fs";
import path2 from "path";
import { nanoid as nanoid2 } from "nanoid";
import { exec } from "child_process";
import { fileURLToPath as fileURLToPath2 } from "url";
import { dirname as dirname2 } from "path";
import util from "util";
import bcrypt from "bcryptjs";

// server/s3-service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "fs";
var S3Service = class {
  s3Client;
  bucketName;
  initialized = false;
  constructor() {
  }
  initialize(config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
    this.bucketName = config.bucketName;
    this.initialized = true;
  }
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error("S3Service not initialized. Call initialize() first.");
    }
  }
  /**
   * Przesyła plik do S3 z ścieżki
   */
  async uploadFile(filePath, s3Key, contentType) {
    this.ensureInitialized();
    try {
      const fileStream = createReadStream(filePath);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: contentType || "application/octet-stream",
        ServerSideEncryption: "AES256"
      });
      await this.s3Client.send(command);
      return s3Key;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error("Failed to upload file to S3");
    }
  }
  /**
   * Przesyła buffer do S3
   */
  async uploadBuffer(s3Key, buffer, contentType) {
    this.ensureInitialized();
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
        ServerSideEncryption: "AES256"
      });
      await this.s3Client.send(command);
      return s3Key;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error("Failed to upload file to S3");
    }
  }
  /**
   * Tworzy podpisany URL do pobierania pliku
   */
  async getSignedDownloadUrl(s3Key, expiresIn = 3600) {
    this.ensureInitialized();
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Failed to generate download URL");
    }
  }
  /**
   * Usuwa plik z S3
   */
  async deleteFile(s3Key) {
    this.ensureInitialized();
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });
      await this.s3Client.send(command);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      throw new Error("Failed to delete file from S3");
    }
  }
  /**
   * Generuje klucz S3 na podstawie typu pliku i ID użytkownika
   */
  generateS3Key(userId, filename, fileType) {
    const timestamp2 = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${fileType}/${userId}/${timestamp2}_${sanitizedFilename}`;
  }
  /**
   * Sprawdza czy serwis jest zainicjalizowany
   */
  isInitialized() {
    return this.initialized;
  }
};
var s3Service = new S3Service();
function initializeS3Service() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || "us-east-1";
  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.warn("S3 service not initialized: missing required environment variables");
    console.warn("Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME");
    return false;
  }
  try {
    s3Service.initialize({
      region,
      accessKeyId,
      secretAccessKey,
      bucketName
    });
    console.log("S3 service initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize S3 service:", error);
    return false;
  }
}

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { compareSync, hashSync, genSaltSync } from "bcryptjs";
import connectPg from "connect-pg-simple";
import { nanoid } from "nanoid";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  const salt = genSaltSync(SALT_ROUNDS);
  return hashSync(password, salt);
}
async function comparePasswords(supplied, stored) {
  return compareSync(supplied, stored);
}
function setupAuth(app2) {
  const PostgresSessionStore = connectPg(session);
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || nanoid(),
    // Używaj zmiennej środowiskowej lub generuj losowy sekret
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 dni
      sameSite: "lax"
    },
    store: new PostgresSessionStore({
      pool,
      tableName: "session",
      // Tabela automatycznie utworzona przez connect-pg-simple
      createTableIfMissing: true
    })
  };
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        const adminUser = await storage.getUserByUsername(email);
        if (!adminUser) {
          return done(null, false, { message: "Nieprawid\u0142owy email lub has\u0142o" });
        }
        const isMatch2 = await comparePasswords(password, adminUser.password);
        if (!isMatch2) {
          return done(null, false, { message: "Invalid email or password" });
        }
        await storage.updateUser(adminUser.id, {
          lastLogin: /* @__PURE__ */ new Date()
        });
        return done(null, {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          fullName: adminUser.fullName,
          company: adminUser.company,
          isAdmin: Boolean(adminUser.isAdmin),
          isClient: Boolean(adminUser.isClient)
        });
      }
      const isMatch = await comparePasswords(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Invalid email or password" });
      }
      await storage.updateUser(user.id, {
        lastLogin: /* @__PURE__ */ new Date()
      });
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        isAdmin: Boolean(user.isAdmin),
        isClient: Boolean(user.isClient)
      });
    } catch (error) {
      return done(error);
    }
  }));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        isAdmin: Boolean(user.isAdmin),
        isClient: Boolean(user.isClient)
      });
    } catch (error) {
      return done(error);
    }
  });
  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: "Not logged in" });
  }
  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    return res.status(403).json({ error: "Access denied" });
  }
  function isClient(req, res, next) {
    if (req.isAuthenticated() && req.user.isClient) {
      return next();
    }
    return res.status(403).json({ error: "Access denied" });
  }
  app2.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, fullName, company } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email jest wymagany" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email jest ju\u017C u\u017Cywany" });
      }
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "U\u017Cytkownik o takiej nazwie ju\u017C istnieje" });
        }
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        // Email jest teraz głównym identyfikatorem
        username,
        // Username jest opcjonalny
        password: hashedPassword,
        fullName,
        company,
        isAdmin: false,
        isClient: true
      });
      try {
        const allModels = await storage.getModels();
        let assignedModelsCount = 0;
        for (const model of allModels) {
          const metadata = model.metadata;
          if (metadata && metadata.viewToken && !model.shareEnabled) {
            const modelEmail = metadata.userEmail;
            const sessionHasToken = req.session.viewTokens && req.session.viewTokens[model.id] === metadata.viewToken;
            if (modelEmail && modelEmail === email || sessionHasToken) {
              await storage.updateModel(model.id, {
                userId: user.id,
                shareEmail: email
              });
              assignedModelsCount++;
              console.log(`Przypisano model #${model.id} (${model.filename}) do nowego u\u017Cytkownika ${email}`);
            }
          }
        }
        console.log(`\u0141\u0105cznie przypisano ${assignedModelsCount} modeli tymczasowych do nowego u\u017Cytkownika ${email}`);
      } catch (assignError) {
        console.error("B\u0142\u0105d podczas przypisywania modeli tymczasowych:", assignError);
      }
      req.login({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        isAdmin: Boolean(user.isAdmin),
        isClient: Boolean(user.isClient)
      }, (err) => {
        if (err) {
          return res.status(500).json({ error: "B\u0142\u0105d logowania po rejestracji" });
        }
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isAdmin: Boolean(user.isAdmin),
          isClient: Boolean(user.isClient)
        });
      });
    } catch (error) {
      console.error("B\u0142\u0105d rejestracji:", error);
      return res.status(500).json({ error: "B\u0142\u0105d serwera podczas rejestracji" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "B\u0142\u0105d logowania" });
      }
      req.login(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        return res.json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "B\u0142\u0105d wylogowania" });
      }
      res.json({ message: "Wylogowano pomy\u015Blnie" });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not logged in" });
    }
    res.json(req.user);
  });
  app2.get("/api/check-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ exists: false, error: "Nieprawid\u0142owy adres email" });
      }
      const existingUser = await storage.getUserByEmail(email);
      res.json({ exists: !!existingUser });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ exists: false, error: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas sprawdzania adresu email" });
    }
  });
  app2.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "U\u017Cytkownik nie znaleziony" });
      }
      const isMatch = await comparePasswords(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Aktualne has\u0142o jest niepoprawne" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      res.json({ message: "Has\u0142o zosta\u0142o zmienione" });
    } catch (error) {
      console.error("B\u0142\u0105d zmiany has\u0142a:", error);
      res.status(500).json({ error: "B\u0142\u0105d serwera podczas zmiany has\u0142a" });
    }
  });
  app2.get("/api/client/models", isClient, async (req, res) => {
    try {
      const modelsById = await storage.getModelsByClientId(req.user.id);
      const modelsByEmail = await storage.getSharedModelsByEmail(req.user.email);
      const modelIds = /* @__PURE__ */ new Set();
      const allModels = [];
      for (const model of modelsById) {
        modelIds.add(model.id);
        allModels.push(model);
      }
      for (const model of modelsByEmail) {
        if (!modelIds.has(model.id)) {
          modelIds.add(model.id);
          allModels.push(model);
        }
      }
      const modelsWithPassword = allModels.map((model) => ({
        ...model,
        hasPassword: !!(model.sharePassword || model.share_password)
      }));
      res.json(modelsWithPassword);
    } catch (error) {
      console.error("B\u0142\u0105d pobierania modeli klienta:", error);
      res.status(500).json({ error: "B\u0142\u0105d serwera podczas pobierania modeli" });
    }
  });
  app2.post("/api/client/shared-models/:id/password", isClient, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const { password } = req.body;
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie znaleziony" });
      }
      if (model.userId !== req.user.id && (model.shareEmail !== req.user.email || !model.shareEnabled)) {
        return res.status(403).json({ error: "Brak dost\u0119pu do tego modelu" });
      }
      const updatedModel = await storage.updateModel(modelId, {
        sharePassword: password ? await hashPassword(password) : null
      });
      res.json({ message: "Has\u0142o modelu zaktualizowane", hasPassword: !!password });
    } catch (error) {
      console.error("B\u0142\u0105d aktualizacji has\u0142a modelu:", error);
      res.status(500).json({ error: "B\u0142\u0105d serwera podczas aktualizacji has\u0142a" });
    }
  });
  app2.delete("/api/client/models/:id", isClient, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie znaleziony" });
      }
      if (model.userId !== req.user.id && (model.shareEmail !== req.user.email || !model.shareEnabled)) {
        return res.status(403).json({ error: "Brak dost\u0119pu do tego modelu" });
      }
      const result = await storage.deleteModel(modelId);
      if (result) {
        res.json({ message: "Model zosta\u0142 usuni\u0119ty" });
      } else {
        res.status(500).json({ error: "B\u0142\u0105d usuwania modelu" });
      }
    } catch (error) {
      console.error("B\u0142\u0105d usuwania modelu:", error);
      res.status(500).json({ error: "B\u0142\u0105d serwera podczas usuwania modelu" });
    }
  });
  app2.locals.auth = {
    isAuthenticated,
    isAdmin,
    isClient
  };
}

// server/thumbnail-generator.ts
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var DEFAULT_OPTIONS = {
  width: 300,
  height: 300,
  quality: 85,
  background: "#f8f9fa"
};
async function generateSTLThumbnail(stlFilePath, outputPath, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return new Promise((resolve, reject) => {
    const advancedScript = path.join(__dirname, "advanced_stl_renderer.py");
    const args = [
      advancedScript,
      stlFilePath,
      outputPath,
      "--width",
      opts.width.toString(),
      "--height",
      opts.height.toString()
    ];
    const python = spawn("python3", args);
    let stderr = "";
    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log("STL thumbnail generated with advanced renderer");
        resolve(true);
      } else {
        console.log("Advanced renderer failed, trying fallback:", stderr);
        const fallbackScript = path.join(__dirname, "generate_stl_thumbnail.py");
        const fallbackArgs = [
          fallbackScript,
          stlFilePath,
          outputPath,
          "--width",
          opts.width.toString(),
          "--height",
          opts.height.toString(),
          "--quality",
          opts.quality.toString(),
          "--background",
          opts.background
        ];
        const fallbackPython = spawn("python3", fallbackArgs);
        let fallbackStderr = "";
        fallbackPython.stderr.on("data", (data) => {
          fallbackStderr += data.toString();
        });
        fallbackPython.on("close", (fallbackCode) => {
          if (fallbackCode === 0 && fs.existsSync(outputPath)) {
            console.log("STL thumbnail generated with fallback renderer");
            resolve(true);
          } else {
            console.error("Both STL renderers failed:", fallbackStderr);
            resolve(false);
          }
        });
        fallbackPython.on("error", (error) => {
          console.error("Fallback Python process error:", error);
          resolve(false);
        });
      }
    });
    python.on("error", (error) => {
      console.error("Advanced Python process error:", error);
      resolve(false);
    });
  });
}
async function generateDXFThumbnail(dxfFilePath, outputPath, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "dxf_matplotlib_converter.py");
    const tempSvgPath = outputPath.replace(".png", ".svg");
    const svgArgs = [pythonScript, dxfFilePath, tempSvgPath];
    const svgProcess = spawn("python3", svgArgs);
    let svgStderr = "";
    svgProcess.stderr.on("data", (data) => {
      svgStderr += data.toString();
    });
    svgProcess.on("close", (svgCode) => {
      if (svgCode === 0 && fs.existsSync(tempSvgPath)) {
        const convertArgs = [
          tempSvgPath,
          "-resize",
          `${opts.width}x${opts.height}`,
          "-background",
          opts.background,
          "-quality",
          opts.quality.toString(),
          outputPath
        ];
        const convertProcess = spawn("convert", convertArgs);
        let convertStderr = "";
        convertProcess.stderr.on("data", (data) => {
          convertStderr += data.toString();
        });
        convertProcess.on("close", (convertCode) => {
          if (fs.existsSync(tempSvgPath)) {
            fs.unlinkSync(tempSvgPath);
          }
          if (convertCode === 0 && fs.existsSync(outputPath)) {
            resolve(true);
          } else {
            console.error("DXF thumbnail conversion failed:", convertStderr);
            resolve(false);
          }
        });
        convertProcess.on("error", (error) => {
          console.error("Convert process error:", error);
          if (fs.existsSync(tempSvgPath)) {
            fs.unlinkSync(tempSvgPath);
          }
          resolve(false);
        });
      } else {
        console.error("SVG generation failed:", svgStderr);
        resolve(false);
      }
    });
    svgProcess.on("error", (error) => {
      console.error("Python SVG process error:", error);
      resolve(false);
    });
  });
}
async function generateSTEPThumbnail(stepFilePath, outputPath, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "generate_step_thumbnail.py");
    const args = [
      pythonScript,
      stepFilePath,
      outputPath,
      "--width",
      opts.width.toString(),
      "--height",
      opts.height.toString(),
      "--quality",
      opts.quality.toString(),
      "--background",
      opts.background
    ];
    const python = spawn("python3", args);
    let stderr = "";
    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(true);
      } else {
        console.error("STEP thumbnail generation failed:", stderr);
        resolve(false);
      }
    });
    python.on("error", (error) => {
      console.error("Python process error:", error);
      resolve(false);
    });
  });
}
async function generateThumbnail(filePath, outputPath, options = {}, originalFilename) {
  const filenameForExtension = originalFilename || filePath;
  const ext = path.extname(filenameForExtension).toLowerCase();
  console.log(`[THUMBNAIL] Generating thumbnail for file: ${filePath}, original: ${originalFilename}, extension: ${ext}, output: ${outputPath}`);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  try {
    switch (ext) {
      case ".stl":
        return await generateSTLThumbnail(filePath, outputPath, options);
      case ".dxf":
      case ".dwg":
        return await generateDXFThumbnail(filePath, outputPath, options);
      case ".step":
      case ".stp":
        return await generateSTEPThumbnail(filePath, outputPath, options);
      default:
        console.error(`Unsupported file format for thumbnail: ${ext}`);
        return false;
    }
  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return false;
  }
}
function getThumbnailPath(modelId, extension = ".png") {
  return path.join(process.cwd(), "uploads/thumbnails", `model_${modelId}${extension}`);
}

// server/routes.ts
init_google_translate();
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
async function hasAccessToModel(req, modelId) {
  try {
    const model = await storage.getModel(modelId);
    if (!model) return false;
    if (req.isAuthenticated() && req.user.isAdmin) {
      return true;
    }
    if (req.isAuthenticated() && model.userId === req.user.id) {
      return true;
    }
    if (model.shareEnabled) {
      return true;
    }
    const viewTokens = req.session.viewTokens || {};
    if (viewTokens[modelId.toString()]) {
      const metadata = model.metadata;
      if (metadata && metadata.viewToken && metadata.viewToken === viewTokens[modelId.toString()]) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking model access:", error);
    return false;
  }
}
var execPromise = util.promisify(exec);
async function convertDxfToSvg(dxfFilePath) {
  try {
    if (!fs2.existsSync(dxfFilePath)) {
      console.error("DXF file does not exist:", dxfFilePath);
      return null;
    }
    const enhancedScript = path2.join(__dirname2, "enhanced_dxf_converter.py");
    const matplotlibScript = path2.join(__dirname2, "dxf_matplotlib_converter.py");
    const fallbackScript = path2.join(__dirname2, "dxf_converter.py");
    let scriptToUse = enhancedScript;
    let scriptName = "enhanced";
    if (!fs2.existsSync(enhancedScript)) {
      console.warn("Enhanced DXF converter not found, falling back to matplotlib converter");
      if (!fs2.existsSync(matplotlibScript)) {
        console.warn("Matplotlib DXF converter script not found, falling back to original converter");
        if (!fs2.existsSync(fallbackScript)) {
          console.error("No DXF converter scripts found");
          return null;
        }
        scriptToUse = fallbackScript;
        scriptName = "fallback";
      } else {
        scriptToUse = matplotlibScript;
        scriptName = "matplotlib";
      }
    }
    const tempSvgPath = path2.join("./uploads", `${path2.parse(dxfFilePath).name}_${Date.now()}.svg`);
    try {
      const scriptCommand = `python3 "${scriptToUse}" "${dxfFilePath}" svg "${tempSvgPath}"`;
      console.log(`Executing: ${scriptCommand}`);
      await execPromise(scriptCommand);
      if (fs2.existsSync(tempSvgPath)) {
        const svgContent = fs2.readFileSync(tempSvgPath, "utf8");
        if (svgContent) {
          console.log(`Successfully converted DXF to SVG using ${scriptName} converter`);
          return svgContent;
        } else {
          console.error("Empty SVG file created");
          return null;
        }
      } else {
        console.error("SVG file was not created");
        return null;
      }
    } catch (error) {
      console.error(`Error executing DXF to SVG conversion with ${scriptName} converter:`, error);
      const debugLogPath = "/tmp/enhanced_dxf_converter.log";
      let debugInfo = "";
      if (fs2.existsSync(debugLogPath)) {
        try {
          debugInfo = fs2.readFileSync(debugLogPath, "utf8");
          debugInfo = debugInfo.split("\n").slice(-5).join("\n");
        } catch (e) {
        }
      }
      if (scriptToUse === enhancedScript && fs2.existsSync(matplotlibScript)) {
        console.log("Enhanced converter failed, trying matplotlib converter");
        try {
          await execPromise(`python3 "${matplotlibScript}" "${dxfFilePath}" svg "${tempSvgPath}"`);
          if (fs2.existsSync(tempSvgPath)) {
            const svgContent = fs2.readFileSync(tempSvgPath, "utf8");
            if (svgContent) {
              console.log("Successfully converted DXF to SVG using matplotlib converter");
              return svgContent;
            }
          }
        } catch (matplotlibError) {
          console.error("Matplotlib conversion also failed:", matplotlibError);
          if (fs2.existsSync(fallbackScript)) {
            console.log("Trying original fallback converter");
            try {
              await execPromise(`python3 "${fallbackScript}" "${dxfFilePath}" svg "${tempSvgPath}"`);
              if (fs2.existsSync(tempSvgPath)) {
                const svgContent = fs2.readFileSync(tempSvgPath, "utf8");
                if (svgContent) {
                  console.log("Successfully converted DXF to SVG using original fallback converter");
                  return svgContent;
                }
              }
            } catch (fallbackError) {
              console.error("All converters failed");
            }
          }
        }
      } else if (scriptToUse === matplotlibScript && fs2.existsSync(fallbackScript)) {
        console.log("Matplotlib converter failed, trying fallback converter");
        try {
          await execPromise(`python3 "${fallbackScript}" "${dxfFilePath}" svg "${tempSvgPath}"`);
          if (fs2.existsSync(tempSvgPath)) {
            const svgContent = fs2.readFileSync(tempSvgPath, "utf8");
            if (svgContent) {
              console.log("Successfully converted DXF to SVG using fallback converter");
              return svgContent;
            }
          }
        } catch (fallbackError) {
          console.error("Fallback conversion also failed:", fallbackError);
        }
      }
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%">
          <rect width="400" height="200" fill="#f8f8f8" />
          <text x="50" y="80" font-family="Arial" font-size="16" fill="red">Error converting DXF to SVG</text>
          <text x="50" y="110" font-family="Arial" font-size="12">${error instanceof Error ? error.message : "Unknown error"}</text>
          ${debugInfo ? `<text x="50" y="130" font-family="Arial" font-size="10" fill="#666">Debug: ${debugInfo.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>` : ""}
        </svg>
      `;
    }
  } catch (error) {
    console.error("Error in convertDxfToSvg:", error);
    return null;
  }
}
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var stepUpload = multer({
  dest: "./uploads/step-uploads",
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path2.extname(file.originalname).toLowerCase();
    if (ext === ".stp" || ext === ".step") {
      cb(null, true);
    } else {
      cb(new Error("Only STEP files are allowed"), false);
    }
  }
});
var stlUpload = multer({
  dest: "./uploads/stl-uploads",
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path2.extname(file.originalname).toLowerCase();
    if (ext === ".stl") {
      cb(null, true);
    } else {
      cb(new Error("Only STL files are allowed"), false);
    }
  }
});
var cadUpload = multer({
  dest: "./uploads/cad-uploads",
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path2.extname(file.originalname).toLowerCase();
    if (ext === ".dxf" || ext === ".dwg") {
      cb(null, true);
    } else {
      cb(new Error("Only DXF or DWG files are allowed"), false);
    }
  }
});
function extractStepMetadata(filePath) {
  try {
    const header = fs2.readFileSync(filePath, "utf8").slice(0, 8e3);
    const formatMatch = header.match(/FILE_SCHEMA\s*\(\s*\(\s*'(.+?)'/i);
    const format = formatMatch ? formatMatch[1].includes("AP214") ? "STEP AP214" : formatMatch[1].includes("AP203") ? "STEP AP203" : formatMatch[1].includes("AP242") ? "STEP AP242" : "STEP" : "STEP";
    const sourceSystemMatch = header.match(/originating_system\s*\>\s*'(.+?)'/i);
    const sourceSystem = sourceSystemMatch ? sourceSystemMatch[1] : "Unknown";
    const authorMatch = header.match(/author\s*\>\s*\(\s*'(.+?)'\s*\)/i);
    const author = authorMatch && authorMatch[1] ? authorMatch[1] : "Unknown";
    const organizationMatch = header.match(/organization\s*\>\s*\(\s*'(.+?)'\s*\)/i);
    const organization = organizationMatch && organizationMatch[1] ? organizationMatch[1] : "Unknown";
    const fileContent = fs2.readFileSync(filePath, "utf8");
    const partMatches = fileContent.match(/MANIFOLD_SOLID_BREP/g) || [];
    const parts = partMatches.length > 0 ? partMatches.length : 5;
    const assemblyMatches = fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE/g) || [];
    const assemblies = assemblyMatches.length > 0 ? assemblyMatches.length : 2;
    const surfaceMatches = fileContent.match(/B_SPLINE_SURFACE/g) || [];
    const surfaces = surfaceMatches.length > 0 ? surfaceMatches.length : 10;
    const solidMatches = fileContent.match(/BREP_WITH_VOIDS|MANIFOLD_SOLID_BREP/g) || [];
    const solids = solidMatches.length > 0 ? solidMatches.length : 5;
    return {
      format,
      sourceSystem,
      parts,
      assemblies,
      surfaces,
      solids,
      properties: {
        author,
        organization,
        partNumber: "STEP-" + nanoid2(6).toUpperCase(),
        revision: "A"
      }
    };
  } catch (error) {
    console.error("Error parsing STEP file:", error);
    return {
      format: "Unknown STEP Format",
      sourceSystem: "Unknown",
      parts: 1,
      assemblies: 1,
      surfaces: 1,
      solids: 1,
      properties: {
        author: "Unknown",
        organization: "Unknown",
        partNumber: "STEP-" + nanoid2(6).toUpperCase(),
        revision: "A"
      }
    };
  }
}
async function convertStepToStl(stepFilePath) {
  return new Promise((resolve) => {
    try {
      if (!fs2.existsSync(stepFilePath)) {
        console.error("STEP file does not exist:", stepFilePath);
        return resolve(null);
      }
      console.log(`Skip conversion: FreeCAD not available. Will use direct STEP parsing.`);
      setTimeout(() => {
        resolve(null);
      }, 500);
    } catch (error) {
      console.error("Error in convertStepToStl:", error);
      resolve(null);
    }
  });
}
function generateModelTree(filename, filePath) {
  try {
    const modelId = nanoid2(8);
    if (filePath && fs2.existsSync(filePath)) {
      const fileContent = fs2.readFileSync(filePath, "utf8");
      const assemblyMatches = fileContent.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/g) || [];
      const assemblies = assemblyMatches.map((match) => {
        const name = match.match(/NEXT_ASSEMBLY_USAGE_OCCURRENCE\('([^']+)'/);
        return name ? name[1] : `Assembly_${nanoid2(4)}`;
      });
      const partMatches = fileContent.match(/MANIFOLD_SOLID_BREP\('([^']+)'/g) || [];
      const parts = partMatches.map((match) => {
        const name = match.match(/MANIFOLD_SOLID_BREP\('([^']+)'/);
        return name ? name[1] : `Part_${nanoid2(4)}`;
      });
      if (assemblies.length > 0 || parts.length > 0) {
        const tree = {
          id: modelId,
          name: filename,
          type: "model",
          children: []
        };
        assemblies.forEach((assembly, index) => {
          const assemblyNode = {
            id: `${modelId}-assembly-${index + 1}`,
            name: assembly,
            type: "assembly",
            children: []
          };
          const partsPerAssembly = Math.max(1, Math.floor(parts.length / (assemblies.length || 1)));
          const startIdx = index * partsPerAssembly;
          const endIdx = Math.min(startIdx + partsPerAssembly, parts.length);
          for (let i = startIdx; i < endIdx; i++) {
            assemblyNode.children.push({
              id: `${modelId}-part-${i + 1}`,
              name: parts[i],
              type: "part"
            });
          }
          tree.children.push(assemblyNode);
        });
        if (assemblies.length === 0 && parts.length > 0) {
          parts.forEach((part, index) => {
            tree.children.push({
              id: `${modelId}-part-${index + 1}`,
              name: part,
              type: "part"
            });
          });
        }
        return tree;
      }
    }
    return {
      id: modelId,
      name: filename,
      type: "model",
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: "Main Assembly",
          type: "assembly",
          children: [
            { id: `${modelId}-part-1`, name: "Component_1", type: "part" },
            { id: `${modelId}-part-2`, name: "Component_2", type: "part" },
            { id: `${modelId}-part-3`, name: "Component_3", type: "part" }
          ]
        }
      ]
    };
  } catch (error) {
    console.error("Error generating model tree:", error);
    const modelId = nanoid2(8);
    return {
      id: modelId,
      name: filename,
      type: "model",
      children: [
        {
          id: `${modelId}-assembly-1`,
          name: "Assembly",
          type: "assembly",
          children: [
            { id: `${modelId}-part-1`, name: "Part_1", type: "part" }
          ]
        }
      ]
    };
  }
}
function detectLanguageFromHeader(acceptLanguageHeader) {
  if (!acceptLanguageHeader) return null;
  const languages = acceptLanguageHeader.split(",").map((lang) => {
    const [code, quality] = lang.trim().split(";");
    return {
      code: code.split("-")[0],
      // Get primary language code
      quality: quality ? parseFloat(quality.split("=")[1]) : 1
      // Default quality is 1.0
    };
  }).sort((a, b) => b.quality - a.quality);
  const supportedLanguages = ["en", "pl", "cs", "de", "fr"];
  for (const lang of languages) {
    if (supportedLanguages.includes(lang.code)) {
      return lang.code;
    }
  }
  return null;
}
async function registerRoutes(app2) {
  try {
    fs2.mkdirSync("./uploads", { recursive: true });
    fs2.mkdirSync("./uploads/step-uploads", { recursive: true });
    fs2.mkdirSync("./uploads/stl-uploads", { recursive: true });
    fs2.mkdirSync("./uploads/cad-uploads", { recursive: true });
    console.log("Upload directories created successfully");
  } catch (error) {
    console.error("Error creating upload directories:", error);
  }
  setupAuth(app2);
  const staticMiddleware = express.static("public");
  app2.use(staticMiddleware);
  try {
    await initializeEmailService();
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const smtpInitialized = initializeCustomSmtpService({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM
      });
      if (smtpInitialized) {
        console.log("Custom SMTP email service initialized successfully");
      }
    } else {
      console.warn("No custom SMTP credentials provided, email notifications will use test service only");
    }
  } catch (error) {
    console.error("Failed to initialize email services, sharing notifications will not work correctly:", error);
  }
  try {
    const s3Initialized = initializeS3Service();
    if (s3Initialized) {
      console.log("S3 service initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize S3 service:", error);
  }
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app2.get("/api/language-preference", (req, res) => {
    const acceptLanguage = req.headers["accept-language"];
    const detectedLanguage = detectLanguageFromHeader(acceptLanguage);
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    res.json({
      detectedLanguage: detectedLanguage || "en",
      acceptLanguage: acceptLanguage || "",
      ip
    });
  });
  app2.get("/api/models", async (req, res) => {
    try {
      const models3 = await storage.getModels();
      const modelsList = models3.map((model) => ({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        conversionStatus: model.metadata?.conversionStatus || "unknown"
      }));
      res.json(modelsList);
    } catch (error) {
      console.error("Error getting models list:", error);
      res.status(500).json({ message: "Failed to get models list" });
    }
  });
  app2.post("/api/models/upload", stepUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = req.file;
      const stats = fs2.statSync(file.path);
      const metadata = extractStepMetadata(file.path);
      const userEmail = req.query.email || null;
      const autoShare = req.query.autoShare !== "false";
      console.log(`[DEBUG STEP] Parametry \u017C\u0105dania:`, {
        queryEmail: req.query.email,
        normalizedEmail: userEmail,
        autoShare,
        authenticated: req.isAuthenticated(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        file: file.originalname,
        size: stats.size
      });
      if (userEmail && !req.isAuthenticated()) {
        console.log(`[DEBUG STEP] Sprawdzam email ${userEmail} dla niezalogowanego u\u017Cytkownika`);
        const user = await storage.getUserByEmail(userEmail);
        console.log(`[DEBUG STEP] Wynik sprawdzenia:`, {
          emailExists: !!user,
          userId: user?.id,
          username: user?.username,
          isClient: user?.isClient,
          isAdmin: user?.isAdmin
        });
        if (user) {
          console.log(`[DEBUG STEP] Blokuj\u0119 dost\u0119p dla emaila ${userEmail}, kt\xF3ry nale\u017Cy do istniej\u0105cego u\u017Cytkownika (ID: ${user.id})`);
          if (file && fs2.existsSync(file.path)) {
            fs2.unlinkSync(file.path);
            console.log(`[DEBUG STEP] Usuni\u0119to plik tymczasowy: ${file.path}`);
          }
          return res.status(403).json({
            message: "Adres email jest ju\u017C zarejestrowany w systemie. Zaloguj si\u0119, aby przes\u0142a\u0107 plik.",
            emailExists: true
          });
        }
      }
      let userId = 1;
      let shareEmail = null;
      if (req.isAuthenticated()) {
        userId = req.user.id;
        shareEmail = req.user.email;
      } else if (userEmail) {
        shareEmail = userEmail;
      }
      let filePath = file.path;
      let s3Key = null;
      if (s3Service.isInitialized()) {
        try {
          s3Key = s3Service.generateS3Key(userId, file.originalname, "step");
          await s3Service.uploadFile(file.path, s3Key, "application/step");
          console.log(`STEP file uploaded to S3: ${s3Key}`);
        } catch (s3Error) {
          console.error("Failed to upload STEP file to S3, using local storage:", s3Error);
        }
      }
      const modelData = {
        userId,
        filename: file.originalname,
        filesize: stats.size,
        format: metadata.format,
        created: (/* @__PURE__ */ new Date()).toISOString(),
        sourceSystem: metadata.sourceSystem,
        shareEmail,
        // Automatyczne przypisanie e-mail z URL
        // Ustawienie shareEnabled na podstawie parametru autoShare 
        shareEnabled: autoShare && req.isAuthenticated(),
        // Tylko dla zalogowanych użytkowników włączamy autoShare
        metadata: {
          ...metadata,
          filePath,
          // Store the file path for later processing
          s3Key,
          // Dodajemy klucz S3 do metadanych
          conversionStatus: "pending",
          userEmail,
          // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
          autoShare
          // Zapisz informację o autoShare w metadanych
        }
      };
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created
      });
      (async () => {
        try {
          console.log(`Starting background conversion for model ID ${model.id}`);
          const stlFilePath = await convertStepToStl(file.path);
          if (stlFilePath && fs2.existsSync(stlFilePath)) {
            const updatedMetadata = {
              ...model.metadata,
              stlFilePath,
              conversionStatus: "completed",
              conversionTime: (/* @__PURE__ */ new Date()).toISOString()
            };
            await storage.updateModel(model.id, {
              metadata: updatedMetadata
            });
            console.log(`Conversion completed successfully for model ID ${model.id}`);
            console.log(`Model uploaded without automatic thumbnail generation. Model ID: ${model.id}`);
          } else {
            const updatedMetadata = {
              ...model.metadata,
              conversionStatus: "failed",
              conversionError: "STL file was not created"
            };
            await storage.updateModel(model.id, {
              metadata: updatedMetadata
            });
            console.error(`Conversion failed for model ID ${model.id}`);
          }
        } catch (error) {
          console.error(`Error in background conversion for model ID ${model.id}:`, error);
          const updatedMetadata = {
            ...model.metadata,
            conversionStatus: "failed",
            conversionError: error instanceof Error ? error.message : "Unknown error"
          };
          await storage.updateModel(model.id, {
            metadata: updatedMetadata
          });
        }
      })();
    } catch (error) {
      console.error("Error uploading model:", error);
      res.status(500).json({ message: "Failed to upload model" });
    }
  });
  app2.get("/api/models/by-id/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hasAccess = await hasAccessToModel(req, id);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
      }
      res.json(model);
    } catch (error) {
      console.error("Error getting model:", error);
      res.status(500).json({ message: "Failed to get model" });
    }
  });
  app2.get("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hasAccess = await hasAccessToModel(req, id);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
      }
      const metadata = model.metadata;
      const modelInfo = {
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        parts: metadata?.parts,
        assemblies: metadata?.assemblies,
        surfaces: metadata?.surfaces,
        solids: metadata?.solids,
        properties: metadata?.properties,
        shareEnabled: model.shareEnabled || false,
        shareId: model.shareId,
        hasPassword: !!model.sharePassword,
        tags: model.tags || []
      };
      res.json(modelInfo);
    } catch (error) {
      console.error("Error getting model:", error);
      res.status(500).json({ message: "Failed to get model" });
    }
  });
  app2.get("/api/models/:id/info", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hasAccess = await hasAccessToModel(req, id);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
      }
      const metadata = model.metadata;
      const modelInfo = {
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        parts: metadata?.parts,
        assemblies: metadata?.assemblies,
        surfaces: metadata?.surfaces,
        solids: metadata?.solids,
        properties: metadata?.properties,
        // Dodane informacje o udostępnianiu
        shareEnabled: model.shareEnabled || false,
        shareId: model.shareId,
        hasPassword: !!model.sharePassword,
        tags: model.tags || []
      };
      res.json(modelInfo);
    } catch (error) {
      console.error("Error getting model info:", error);
      res.status(500).json({ message: "Failed to get model info" });
    }
  });
  app2.get("/api/public/models/:publicId", async (req, res) => {
    try {
      const publicId = req.params.publicId;
      const model = await storage.getModelByPublicId(publicId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      if (!model.isPublic) {
        return res.status(403).json({
          message: "This model is not available in the public library"
        });
      }
      const metadata = model.metadata;
      const modelInfo = {
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem,
        categoryId: model.categoryId,
        parts: metadata?.parts,
        assemblies: metadata?.assemblies,
        surfaces: metadata?.surfaces,
        solids: metadata?.solids,
        properties: metadata?.properties,
        isPublic: model.isPublic,
        requiresPassword: false
        // Publiczne modele nie wymagają hasła
      };
      res.json(modelInfo);
    } catch (error) {
      console.error("Error getting public model info:", error);
      res.status(500).json({ message: "Failed to get model info" });
    }
  });
  app2.get("/api/public/models/:publicId/gallery", async (req, res) => {
    try {
      const publicId = req.params.publicId;
      const model = await storage.getModelByPublicId(publicId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      if (!model.isPublic) {
        return res.status(403).json({
          message: "This model is not available in the public library"
        });
      }
      const galleryImages = await storage.getModelGallery(model.id);
      res.json(galleryImages);
    } catch (error) {
      console.error("Error getting public model gallery:", error);
      res.status(500).json({ message: "Failed to get model gallery" });
    }
  });
  app2.get("/api/public/models/:publicId/description", async (req, res) => {
    try {
      const publicId = req.params.publicId;
      const model = await storage.getModelByPublicId(publicId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      if (!model.isPublic) {
        return res.status(403).json({
          message: "This model is not available in the public library"
        });
      }
      const description = await storage.getModelDescription(model.id);
      res.json(description);
    } catch (error) {
      console.error("Error getting public model description:", error);
      res.status(500).json({ message: "Failed to get model description" });
    }
  });
  app2.get("/api/public/models/:publicId/file", async (req, res) => {
    try {
      const publicId = req.params.publicId;
      const model = await storage.getModelByPublicId(publicId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      if (!model.isPublic) {
        return res.status(403).json({
          message: "This model is not available in the public library"
        });
      }
      const metadata = model.metadata;
      const filePath = metadata?.filePath;
      const s3Key = metadata?.s3Key;
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600);
          const response = await fetch(signedUrl);
          if (response.ok) {
            res.setHeader("Content-Type", "application/step");
            res.setHeader("Content-Disposition", `attachment; filename="${model.filename}"`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);
            return;
          }
        } catch (error) {
          console.error("Error downloading from S3:", error);
        }
      }
      if (!filePath || !fs2.existsSync(filePath)) {
        return res.status(404).json({ message: "Model file not found" });
      }
      res.setHeader("Content-Type", "application/step");
      res.setHeader("Content-Disposition", `attachment; filename="${model.filename}"`);
      fs2.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error("Error serving public model file:", error);
      res.status(500).json({ message: "Failed to serve model file" });
    }
  });
  app2.head("/api/models/:id/thumbnail", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).end();
      }
      const metadata = model.metadata;
      const thumbnailPath = metadata?.thumbnailPath;
      if (thumbnailPath && s3Service.isInitialized()) {
        try {
          await s3Service.getSignedDownloadUrl(thumbnailPath, 3600);
          res.status(200).end();
          return;
        } catch (s3Error) {
          console.error("Failed to check thumbnail in S3:", s3Error);
        }
      }
      const localThumbnailPath = getThumbnailPath(modelId);
      if (fs2.existsSync(localThumbnailPath)) {
        res.status(200).end();
        return;
      }
      return res.status(404).end();
    } catch (error) {
      console.error("Error checking thumbnail:", error);
      res.status(500).end();
    }
  });
  app2.get("/api/models/:id/thumbnail", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const metadata = model.metadata;
      const thumbnailPath = metadata?.thumbnailPath;
      if (thumbnailPath && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(thumbnailPath, 3600);
          res.redirect(signedUrl);
          return;
        } catch (s3Error) {
          console.error("Failed to get thumbnail from S3:", s3Error);
        }
      }
      const localThumbnailPath = getThumbnailPath(modelId);
      if (fs2.existsSync(localThumbnailPath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        fs2.createReadStream(localThumbnailPath).pipe(res);
        return;
      }
      return res.status(404).json({ message: "Thumbnail not found" });
    } catch (error) {
      console.error("Error serving thumbnail:", error);
      res.status(500).json({ message: "Failed to serve thumbnail" });
    }
  });
  const thumbnailUpload = multer({
    dest: "uploads/temp-thumbnails/",
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  const galleryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB limit per file
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    }
  });
  app2.post("/api/models/:id/thumbnail", thumbnailUpload.single("thumbnail"), async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No thumbnail file provided" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      const thumbnailPath = getThumbnailPath(modelId);
      const thumbnailDir = path2.dirname(thumbnailPath);
      if (!fs2.existsSync(thumbnailDir)) {
        fs2.mkdirSync(thumbnailDir, { recursive: true });
      }
      if (fs2.existsSync(thumbnailPath)) {
        fs2.unlinkSync(thumbnailPath);
      }
      let galleryImageId = null;
      try {
        if (file.originalname === "screenshot.png") {
          let s3Key = null;
          if (s3Service.isInitialized()) {
            try {
              const s3Path = `thumbnails/${modelId}/screenshot_${Date.now()}.png`;
              s3Key = await s3Service.uploadFile(file.path, s3Path, "image/png");
              console.log(`Screenshot uploaded to S3: ${s3Key}`);
            } catch (s3Error) {
              console.error("Failed to upload screenshot to S3:", s3Error);
            }
          }
          const galleryImage = await storage.addGalleryImage({
            modelId,
            filename: `screenshot_${Date.now()}.png`,
            originalName: "Screenshot",
            filesize: file.size,
            mimeType: "image/png",
            displayOrder: 1,
            isThumbnail: false,
            s3Key
          });
          galleryImageId = galleryImage.id;
          console.log(`Screenshot added to gallery with ID: ${galleryImageId}`);
        }
      } catch (galleryError) {
        console.error("Failed to add screenshot to gallery:", galleryError);
      }
      fs2.copyFileSync(file.path, thumbnailPath);
      fs2.unlinkSync(file.path);
      console.log(`Custom thumbnail uploaded for model ${modelId}`);
      res.json({
        success: true,
        message: "Thumbnail uploaded successfully",
        thumbnailUrl: `/api/models/${modelId}/thumbnail`,
        galleryImageId
      });
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      res.status(500).json({ message: "Failed to upload thumbnail" });
    }
  });
  app2.get("/api/models/:id/tree", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hasAccess = await hasAccessToModel(req, id);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
      }
      const metadata = model.metadata;
      const filePath = metadata?.filePath;
      const modelTree = generateModelTree(model.filename, filePath);
      res.json(modelTreeSchema.parse(modelTree));
    } catch (error) {
      console.error("Error getting model tree:", error);
      res.status(500).json({ message: "Failed to get model tree" });
    }
  });
  app2.get("/api/models/:id/file", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hasAccess = await hasAccessToModel(req, id);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
      }
      const metadata = model.metadata;
      const filePath = metadata?.filePath;
      const s3Key = metadata?.s3Key;
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600);
          const response = await fetch(signedUrl);
          if (response.ok) {
            res.setHeader("Content-Type", "application/step");
            res.setHeader("Content-Disposition", `attachment; filename="${model.filename}"`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);
            return;
          }
        } catch (s3Error) {
          console.error("Failed to get file from S3:", s3Error);
        }
      }
      if (!filePath || !fs2.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      res.setHeader("Content-Type", "application/step");
      res.setHeader("Content-Disposition", `attachment; filename="${model.filename}"`);
      fs2.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error("Error serving model file:", error);
      res.status(500).json({ message: "Failed to serve model file" });
    }
  });
  app2.get("/api/models/:id/stl", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hasAccess = await hasAccessToModel(req, id);
      if (!hasAccess) {
        return res.status(403).json({
          message: "Access denied. This model is not shared and you don't have permission to view it.",
          accessDenied: true
        });
      }
      const metadata = model.metadata;
      const stlFilePath = metadata?.stlFilePath;
      const s3Key = metadata?.s3Key;
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600);
          const response = await fetch(signedUrl);
          if (response.ok) {
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Disposition", `attachment; filename="${path2.basename(model.filename, path2.extname(model.filename))}.stl"`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.send(buffer);
            return;
          }
        } catch (s3Error) {
          console.error("Failed to get STL file from S3:", s3Error);
        }
      }
      if (!stlFilePath || !fs2.existsSync(stlFilePath)) {
        return res.status(404).json({ message: "STL file not found" });
      }
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${path2.basename(model.filename, path2.extname(model.filename))}.stl"`);
      fs2.createReadStream(stlFilePath).pipe(res);
    } catch (error) {
      console.error("Error serving STL file:", error);
      res.status(500).json({ message: "Failed to serve STL file" });
    }
  });
  app2.get("/api/models/:id/svg", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      if (model.format !== "DXF" && model.format !== "DWG") {
        return res.status(400).json({
          message: "SVG conversion is only available for DXF/DWG files",
          format: model.format
        });
      }
      const metadata = model.metadata;
      let dxfFilePath = metadata?.filePath;
      const s3Key = metadata?.s3Key;
      if (s3Key && s3Service.isInitialized()) {
        try {
          const signedUrl = await s3Service.getSignedDownloadUrl(s3Key, 3600);
          const response = await fetch(signedUrl);
          if (response.ok) {
            const tempFilePath = `/tmp/dxf_temp_${Date.now()}.${model.format.toLowerCase()}`;
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs2.writeFileSync(tempFilePath, buffer);
            dxfFilePath = tempFilePath;
            console.log(`Downloaded ${model.format} file from S3 for conversion: ${s3Key}`);
          }
        } catch (s3Error) {
          console.error("Failed to get DXF/DWG file from S3:", s3Error);
        }
      }
      if (!dxfFilePath || !fs2.existsSync(dxfFilePath)) {
        return res.status(404).json({ message: "DXF/DWG file not found" });
      }
      const svgContent = await convertDxfToSvg(dxfFilePath);
      if (s3Key && dxfFilePath.includes("/tmp/dxf_temp_")) {
        try {
          fs2.unlinkSync(dxfFilePath);
        } catch (cleanupError) {
          console.warn("Failed to cleanup temp DXF file:", cleanupError);
        }
      }
      if (!svgContent) {
        return res.status(500).json({ message: "Failed to convert DXF to SVG" });
      }
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svgContent);
    } catch (error) {
      console.error("Error converting DXF to SVG:", error);
      res.status(500).json({ message: "Failed to convert DXF to SVG" });
    }
  });
  app2.post("/api/models/upload-stl", stlUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = req.file;
      const stats = fs2.statSync(file.path);
      const userEmail = req.query.email || null;
      const autoShare = req.query.autoShare === "true";
      console.log(`[DEBUG STL] Parametry \u017C\u0105dania:`, {
        queryEmail: req.query.email,
        normalizedEmail: userEmail,
        autoShare,
        authenticated: req.isAuthenticated(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        file: file.originalname,
        size: stats.size
      });
      if (userEmail && !req.isAuthenticated()) {
        console.log(`[DEBUG STL] Sprawdzam email ${userEmail} dla niezalogowanego u\u017Cytkownika`);
        const user = await storage.getUserByEmail(userEmail);
        console.log(`[DEBUG STL] Wynik sprawdzenia:`, {
          emailExists: !!user,
          userId: user?.id,
          username: user?.username,
          isClient: user?.isClient,
          isAdmin: user?.isAdmin
        });
        if (user) {
          console.log(`[DEBUG STL] Blokuj\u0119 dost\u0119p dla emaila ${userEmail}, kt\xF3ry nale\u017Cy do istniej\u0105cego u\u017Cytkownika (ID: ${user.id})`);
          if (file && fs2.existsSync(file.path)) {
            fs2.unlinkSync(file.path);
            console.log(`[DEBUG STL] Usuni\u0119to plik tymczasowy: ${file.path}`);
          }
          return res.status(403).json({
            message: "Adres email jest ju\u017C zarejestrowany w systemie. Zaloguj si\u0119, aby przes\u0142a\u0107 plik.",
            emailExists: true
          });
        }
      }
      let userId = req.isAuthenticated() ? req.user.id : 1;
      let shareEmail = null;
      if (req.isAuthenticated()) {
        shareEmail = req.user.email;
      } else if (userEmail) {
        shareEmail = userEmail;
      }
      let isSTLBinary = false;
      try {
        const buffer = Buffer.alloc(5);
        const fd = fs2.openSync(file.path, "r");
        fs2.readSync(fd, buffer, 0, 5, 0);
        fs2.closeSync(fd);
        const signature = buffer.toString("utf8", 0, 5);
        isSTLBinary = signature.toLowerCase() !== "solid";
        console.log(`Detected STL format for ${file.originalname}: ${isSTLBinary ? "Binary" : "ASCII"}`);
      } catch (formatError) {
        console.error("Error detecting STL format:", formatError);
        isSTLBinary = true;
      }
      const isOwner = req.isAuthenticated();
      const shareId = nanoid2(10);
      let filePath = file.path;
      let s3Key = null;
      if (s3Service.isInitialized()) {
        try {
          s3Key = s3Service.generateS3Key(userId, file.originalname, "stl");
          await s3Service.uploadFile(file.path, s3Key, "application/octet-stream");
          filePath = s3Key;
          console.log(`STL file uploaded to S3: ${s3Key}`);
        } catch (s3Error) {
          console.error("Failed to upload to S3, using local storage:", s3Error);
        }
      }
      const modelData = {
        userId,
        filename: file.originalname,
        filesize: stats.size,
        format: "STL",
        created: (/* @__PURE__ */ new Date()).toISOString(),
        sourceSystem: "direct_upload",
        shareEmail,
        // Automatyczne przypisanie e-mail
        // W osobnym obiekcie, który zostanie wstawiony po walidacji
        shareId,
        // Ustawienie shareEnabled na podstawie parametru autoShare
        shareEnabled: autoShare && req.isAuthenticated(),
        // Tylko dla zalogowanych użytkowników włączamy autoShare
        metadata: {
          filePath,
          stlFilePath: filePath,
          // For STL direct upload, the original file is also the STL file
          s3Key,
          // Dodajemy klucz S3 do metadanych
          isDirectStl: true,
          stlFormat: isSTLBinary ? "binary" : "ascii",
          // Dodajemy informację o formacie STL
          parts: 1,
          assemblies: 1,
          surfaces: 10,
          solids: 1,
          userEmail: shareEmail,
          // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
          properties: {
            author: shareEmail || "User",
            organization: req.isAuthenticated() ? req.user.company || "Direct Upload" : "Direct Upload",
            partNumber: "STL-" + nanoid2(6).toUpperCase(),
            revision: "A"
          }
        }
      };
      const viewToken = nanoid2(32);
      const stlMetadata = modelData.metadata;
      stlMetadata.viewToken = viewToken;
      stlMetadata.s3Key = s3Key;
      modelData.metadata = stlMetadata;
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      if (!req.session.viewTokens) {
        req.session.viewTokens = {};
      }
      req.session.viewTokens[model.id] = viewToken;
      console.log(`Model ID: ${model.id} przypisany token dost\u0119pu: ${viewToken}`);
      console.log(`Token zapisany w sesji u\u017Cytkownika: ${req.session.viewTokens[model.id]}`);
      const updatedModel = await storage.getModel(model.id);
      if (!updatedModel) {
        throw new Error("Model not found after update");
      }
      console.log(`STL model uploaded by ${isOwner ? "authenticated user" : "anonymous user"}, ID: ${model.id}, shareEnabled was set to ${updatedModel.shareEnabled}`);
      console.log(`STL model uploaded without automatic thumbnail generation. Model ID: ${model.id}`);
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        isStl: true,
        stlFormat: isSTLBinary ? "binary" : "ascii",
        shareEnabled: updatedModel.shareEnabled
      });
    } catch (error) {
      console.error("Error uploading STL model:", error);
      res.status(500).json({ message: "Failed to upload STL model" });
    }
  });
  app2.post("/api/models/upload-cad", cadUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = req.file;
      const stats = fs2.statSync(file.path);
      const fileExtension = path2.extname(file.originalname).toLowerCase();
      const format = fileExtension === ".dxf" ? "DXF" : "DWG";
      const userEmail = req.query.email || null;
      const autoShare = req.query.autoShare === "true";
      console.log(`[DEBUG CAD] Parametry \u017C\u0105dania:`, {
        queryEmail: req.query.email,
        normalizedEmail: userEmail,
        autoShare,
        authenticated: req.isAuthenticated(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        file: file.originalname,
        size: stats.size,
        format
      });
      if (userEmail && !req.isAuthenticated()) {
        console.log(`[DEBUG CAD] Sprawdzam email ${userEmail} dla niezalogowanego u\u017Cytkownika`);
        const user = await storage.getUserByEmail(userEmail);
        console.log(`[DEBUG CAD] Wynik sprawdzenia:`, {
          emailExists: !!user,
          userId: user?.id,
          username: user?.username,
          isClient: user?.isClient,
          isAdmin: user?.isAdmin
        });
        if (user) {
          console.log(`[DEBUG CAD] Blokuj\u0119 dost\u0119p dla emaila ${userEmail}, kt\xF3ry nale\u017Cy do istniej\u0105cego u\u017Cytkownika (ID: ${user.id})`);
          if (file && fs2.existsSync(file.path)) {
            fs2.unlinkSync(file.path);
            console.log(`[DEBUG CAD] Usuni\u0119to plik tymczasowy: ${file.path}`);
          }
          return res.status(403).json({
            message: "Adres email jest ju\u017C zarejestrowany w systemie. Zaloguj si\u0119, aby przes\u0142a\u0107 plik.",
            emailExists: true
          });
        }
      }
      let userId = req.isAuthenticated() ? req.user.id : 1;
      let shareEmail = null;
      if (req.isAuthenticated()) {
        shareEmail = req.user.email;
      } else if (userEmail) {
        shareEmail = userEmail;
      }
      let filePath = file.path;
      let s3Key = null;
      if (s3Service.isInitialized()) {
        try {
          s3Key = s3Service.generateS3Key(userId, file.originalname, "dxf");
          const mimeType = format === "DXF" ? "application/dxf" : "application/dwg";
          await s3Service.uploadFile(file.path, s3Key, mimeType);
          console.log(`${format} file uploaded to S3: ${s3Key}`);
        } catch (s3Error) {
          console.error(`Failed to upload ${format} file to S3, using local storage:`, s3Error);
        }
      }
      const isOwner = req.isAuthenticated();
      const shareId = nanoid2(10);
      const modelData = {
        userId,
        filename: file.originalname,
        filesize: stats.size,
        format,
        created: (/* @__PURE__ */ new Date()).toISOString(),
        sourceSystem: "direct_upload",
        shareEmail,
        // Automatyczne przypisanie e-mail
        // Ustawienie shareEnabled na podstawie parametru autoShare
        shareEnabled: autoShare && req.isAuthenticated(),
        // Tylko dla zalogowanych użytkowników włączamy autoShare
        shareId,
        metadata: {
          filePath,
          s3Key,
          // Dodajemy klucz S3 do metadanych
          fileType: "2d",
          cadFormat: format.toLowerCase(),
          entities: 0,
          // To be determined by the renderer
          layers: 0,
          // To be determined by the renderer
          userEmail: shareEmail,
          // Zachowaj e-mail użytkownika w metadanych do przyszłego użytku
          properties: {
            author: shareEmail || "User",
            organization: req.isAuthenticated() ? req.user.company || "Direct Upload" : "Direct Upload",
            drawingNumber: format + "-" + nanoid2(6).toUpperCase(),
            revision: "A"
          }
        }
      };
      const viewToken = nanoid2(32);
      const cadMetadata = modelData.metadata;
      cadMetadata.viewToken = viewToken;
      modelData.metadata = cadMetadata;
      const validatedData = insertModelSchema.parse(modelData);
      const model = await storage.createModel(validatedData);
      if (!req.session.viewTokens) {
        req.session.viewTokens = {};
      }
      req.session.viewTokens[model.id] = viewToken;
      console.log(`CAD model ID: ${model.id} przypisany token dost\u0119pu: ${viewToken}`);
      console.log(`Token zapisany w sesji u\u017Cytkownika: ${req.session.viewTokens[model.id]}`);
      console.log(`CAD model uploaded without automatic thumbnail generation. Model ID: ${model.id}`);
      res.status(201).json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        is2D: true
      });
    } catch (error) {
      console.error("Error uploading CAD model:", error);
      res.status(500).json({ message: "Failed to upload CAD model" });
    }
  });
  app2.delete("/api/models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const metadata = model.metadata;
      const filePath = metadata?.filePath;
      if (filePath && fs2.existsSync(filePath)) {
        fs2.unlinkSync(filePath);
        console.log(`Deleted STEP file: ${filePath}`);
      }
      const stlFilePath = metadata?.stlFilePath;
      if (stlFilePath && fs2.existsSync(stlFilePath)) {
        fs2.unlinkSync(stlFilePath);
        console.log(`Deleted STL file: ${stlFilePath}`);
      }
      const jsonFilePath = stlFilePath ? path2.join(
        path2.dirname(stlFilePath),
        `${path2.basename(stlFilePath, ".stl")}.json`
      ) : null;
      if (jsonFilePath && fs2.existsSync(jsonFilePath)) {
        fs2.unlinkSync(jsonFilePath);
        console.log(`Deleted JSON info file: ${jsonFilePath}`);
      }
      await storage.deleteModel(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ message: "Failed to delete model" });
    }
  });
  app2.post("/api/models/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      const shareData = shareModelSchema.parse(req.body);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      let accountCreated = false;
      let shareId = model.shareId;
      const needsRevocationEmail = model.shareEnabled && !shareData.enableSharing && model.shareEmail;
      if (shareData.enableSharing && !shareId) {
        shareId = nanoid2(10);
      }
      let deleteToken = model.shareDeleteToken;
      if (shareData.enableSharing && !deleteToken) {
        deleteToken = nanoid2(32);
      }
      let sharePassword = null;
      if (shareData.password) {
        sharePassword = await bcrypt.hash(shareData.password, 10);
      }
      const updateData = {
        shareId,
        shareEnabled: shareData.enableSharing,
        sharePassword,
        shareExpiryDate: shareData.expiryDate,
        shareDeleteToken: deleteToken
      };
      if (shareData.email) {
        updateData.shareEmail = shareData.email;
        updateData.shareNotificationSent = false;
      }
      if (shareData.createAccount && shareData.email) {
        try {
          const existingUser = await storage.getUserByEmail(shareData.email);
          if (!existingUser) {
            const userData = shareData.userData || {};
            let username = userData.username || "";
            if (!username) {
              const emailParts = shareData.email.split("@");
              const baseUsername = emailParts[0];
              username = baseUsername;
              let suffix = 1;
              let userWithUsername = await storage.getUserByUsername(username);
              while (userWithUsername) {
                username = `${baseUsername}${suffix}`;
                suffix++;
                userWithUsername = await storage.getUserByUsername(username);
              }
            }
            const password = userData.password || shareData.password || nanoid2(10);
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await storage.createUser({
              username,
              password: hashedPassword,
              email: shareData.email,
              fullName: userData.fullName || null,
              company: userData.company || null,
              isAdmin: false,
              isClient: true
            });
            req.login({
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              fullName: newUser.fullName,
              company: newUser.company,
              isAdmin: Boolean(newUser.isAdmin),
              isClient: Boolean(newUser.isClient)
            }, (err) => {
              if (err) {
                console.error("Error logging in new user:", err);
              }
            });
            accountCreated = true;
            updateData.userId = newUser.id;
            console.log(`Created new user account for ${shareData.email} with username ${username}`);
          } else {
            console.log(`User with email ${shareData.email} already exists, skipping account creation`);
          }
        } catch (accountError) {
          console.error("Error creating user account:", accountError);
        }
      }
      const updatedModel = await storage.updateModel(id, updateData);
      if (shareData.enableSharing && shareData.email) {
        try {
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const host = req.headers["host"] || "localhost:3000";
          let baseUrl;
          if (host === "viewer.fastcnc.eu") {
            baseUrl = "https://viewer.fastcnc.eu";
            console.log("Using production baseUrl:", baseUrl);
          } else {
            baseUrl = `${protocol}://${host}`;
            console.log("Using detected baseUrl:", baseUrl);
          }
          const userLanguage = shareData.language || detectLanguage(req.headers["accept-language"]);
          console.log(`Using language for email: ${userLanguage} (${shareData.language ? "from frontend" : "from browser header"})`);
          let emailSent = false;
          const productionDomain = process.env.PRODUCTION_DOMAIN || "viewer.fastcnc.eu";
          const isProduction = process.env.NODE_ENV === "production" || host === productionDomain;
          console.log(`Environment: ${isProduction ? "Production" : "Development"}, Host: ${host}`);
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            emailSent = await sendShareNotificationSmtp(
              updatedModel,
              shareData.email,
              baseUrl,
              shareData.password,
              // Przekazujemy niezahashowane hasło
              userLanguage
              // Przekazujemy wykryty język użytkownika
            );
            if (emailSent) {
              console.log(`Share notification email sent via custom SMTP to ${shareData.email} in ${userLanguage}`);
              await storage.updateModel(id, { shareNotificationSent: true });
            } else if (!isProduction) {
              console.warn("Custom SMTP email failed, trying Nodemailer fallback (dev environment only)");
              emailSent = await sendShareNotification(
                updatedModel,
                shareData.email,
                baseUrl,
                shareData.password
              );
              if (emailSent) {
                console.log(`Share notification email sent via Nodemailer to ${shareData.email}`);
                await storage.updateModel(id, { shareNotificationSent: true });
              } else {
                console.error(`Failed to send share notification email to ${shareData.email}`);
              }
            } else {
              console.error(`Failed to send share notification email via SMTP to ${shareData.email} in production environment`);
            }
          } else if (!isProduction) {
            emailSent = await sendShareNotification(
              updatedModel,
              shareData.email,
              baseUrl,
              shareData.password
            );
            if (emailSent) {
              console.log(`Share notification email sent via Nodemailer to ${shareData.email}`);
              await storage.updateModel(id, { shareNotificationSent: true });
            } else {
              console.error(`Failed to send share notification email to ${shareData.email}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send email to ${shareData.email}`);
          }
        } catch (emailError) {
          console.error("Error sending share notification email:", emailError);
        }
      } else if (needsRevocationEmail) {
        try {
          let revocationSent = false;
          const userLanguage = detectLanguage(req.headers["accept-language"]);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          const host = req.headers["host"] || "localhost:3000";
          const isProduction = host === "viewer.fastcnc.eu";
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model,
              model.shareEmail,
              userLanguage
              // Przekazujemy wykryty język użytkownika
            );
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else if (!isProduction) {
              console.warn("Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)");
              revocationSent = await sendSharingRevokedNotification(model, model.shareEmail);
              if (revocationSent) {
                console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
              } else {
                console.error(`Failed to send share revocation email to ${model.shareEmail}`);
              }
            } else {
              console.error(`Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`);
            }
          } else if (!isProduction) {
            revocationSent = await sendSharingRevokedNotification(model, model.shareEmail);
            if (revocationSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            } else {
              console.error(`Failed to send share revocation email to ${model.shareEmail}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`);
          }
        } catch (emailError) {
          console.error("Error sending share revocation email:", emailError);
        }
      }
      res.json({
        modelId: id,
        shareId: updatedModel?.shareId,
        shareEnabled: updatedModel?.shareEnabled,
        hasPassword: !!sharePassword,
        shareUrl: shareData.enableSharing ? `/shared/${shareId}` : null,
        expiryDate: updatedModel?.shareExpiryDate,
        shareDeleteToken: updatedModel?.shareDeleteToken,
        emailSent: shareData.enableSharing && shareData.email,
        accountCreated
        // Dodajemy informację o utworzeniu konta
      });
    } catch (error) {
      console.error("Error sharing model:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid sharing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to share model" });
    }
  });
  app2.post("/api/shared/:shareId/access", async (req, res) => {
    try {
      const { shareId } = req.params;
      const accessData = accessSharedModelSchema.parse({
        ...req.body,
        shareId
      });
      const model = await storage.getModelByShareId(shareId);
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      if (model.shareExpiryDate) {
        const expiryDate = new Date(model.shareExpiryDate);
        const now = /* @__PURE__ */ new Date();
        if (now > expiryDate) {
          return res.status(403).json({ message: "This shared link has expired" });
        }
      }
      if (model.sharePassword) {
        if (!accessData.password) {
          return res.status(401).json({ message: "Password required", requiresPassword: true });
        }
        const passwordIsValid = await bcrypt.compare(accessData.password, model.sharePassword);
        if (!passwordIsValid) {
          return res.status(401).json({ message: "Invalid password" });
        }
      }
      if (model.sharePassword) {
        let ipAddress = "unknown";
        if (req.headers["x-forwarded-for"]) {
          const forwarded = String(req.headers["x-forwarded-for"]).split(",")[0].trim();
          if (forwarded) {
            ipAddress = forwarded;
          }
        } else if (req.socket.remoteAddress) {
          ipAddress = req.socket.remoteAddress;
        }
        const userAgent = req.headers["user-agent"] || "unknown";
        try {
          await storage.recordModelView({
            modelId: model.id,
            shareId,
            ipAddress,
            userAgent,
            viewedAt: /* @__PURE__ */ new Date(),
            authenticated: true
            // To oznacza, że dostęp został uwierzytelniony (jeśli było hasło)
          });
        } catch (viewError) {
          console.error("Error accessing shared model:", viewError);
        }
      }
      await storage.updateModel(model.id, {
        shareLastAccessed: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        sourceSystem: model.sourceSystem
      });
    } catch (error) {
      console.error("Error accessing shared model:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid access data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to access shared model" });
    }
  });
  app2.get("/api/shared/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const model = await storage.getModelByShareId(shareId);
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      if (model.shareExpiryDate) {
        const expiryDate = new Date(model.shareExpiryDate);
        const now = /* @__PURE__ */ new Date();
        if (now > expiryDate) {
          return res.status(403).json({ message: "This shared link has expired" });
        }
      }
      if (!model.sharePassword) {
        try {
          let ipAddress = "unknown";
          if (req.headers["x-forwarded-for"]) {
            const forwarded = String(req.headers["x-forwarded-for"]).split(",")[0].trim();
            if (forwarded) {
              ipAddress = forwarded;
            }
          } else if (req.socket.remoteAddress) {
            ipAddress = req.socket.remoteAddress;
          }
          const userAgent = req.headers["user-agent"] || "unknown";
          await storage.recordModelView({
            modelId: model.id,
            shareId,
            ipAddress,
            userAgent,
            viewedAt: /* @__PURE__ */ new Date()
          });
        } catch (viewError) {
          console.error("Failed to record model view:", viewError);
        }
      }
      await storage.updateModel(model.id, {
        shareLastAccessed: (/* @__PURE__ */ new Date()).toISOString()
      });
      const requiresPassword = !!model.sharePassword;
      res.json({
        filename: model.filename,
        format: model.format,
        created: model.created,
        requiresPassword
      });
    } catch (error) {
      console.error("Error getting shared model info:", error);
      res.status(500).json({ message: "Failed to get shared model info" });
    }
  });
  app2.get("/revoke-share/:shareId/:token", async (req, res) => {
    try {
      const { shareId, token } = req.params;
      const model = await storage.getModelByShareId(shareId);
      if (!model) {
        return res.status(404).send(`
          <html>
            <head>
              <title>Error - Share Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .error { color: #e53e3e; }
                .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="error">Error</h1>
                <p>The shared model was not found or has already been deleted.</p>
                <a href="/" class="btn">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      if (!model.shareDeleteToken || model.shareDeleteToken !== token) {
        return res.status(403).send(`
          <html>
            <head>
              <title>Error - Invalid Token</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                .container { max-width: 600px; margin: 0 auto; }
                .error { color: #e53e3e; }
                .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="error">Invalid Security Token</h1>
                <p>The security token you provided is invalid or has expired.</p>
                <a href="/" class="btn">Go to Homepage</a>
              </div>
            </body>
          </html>
        `);
      }
      await storage.updateModel(model.id, {
        shareEnabled: false,
        shareId: null,
        sharePassword: null,
        shareEmail: null,
        shareExpiryDate: null,
        shareDeleteToken: null
      });
      if (model.shareEmail) {
        try {
          const host = req.headers["host"] || "localhost:5000";
          const protocol = host.includes("localhost") ? "http" : "https";
          const baseUrl = `${protocol}://${host}`;
          await sendSharingRevokedNotificationSmtp(model, model.shareEmail, void 0, baseUrl);
          console.log(`Wys\u0142ano powiadomienie o usuni\u0119ciu udost\u0119pnienia do ${model.shareEmail}`);
        } catch (emailError) {
          console.error("B\u0142\u0105d podczas wysy\u0142ania powiadomienia o usuni\u0119ciu udost\u0119pnienia:", emailError);
        }
      }
      res.status(200).send(`
        <html>
          <head>
            <title>Share Revocation Successful</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; }
              .success { color: #38a169; }
              .logo { max-width: 120px; margin-bottom: 20px; }
              .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="/assets/cropped-Fast-Cnc-scaled-e1723725217643.jpg" alt="FastCNC logo" class="logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
              <h1 class="success">Share Revocation Successful</h1>
              <p>The shared model "${model.filename}" has been successfully unshared and is no longer accessible.</p>
              <a href="/" class="btn">Go to Homepage</a>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error revoking share with token:", error);
      res.status(500).send(`
        <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .container { max-width: 600px; margin: 0 auto; }
              .error { color: #e53e3e; }
              .btn { display: inline-block; background-color: #3182ce; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="/assets/cropped-Fast-Cnc-scaled-e1723725217643.jpg" alt="FastCNC logo" class="logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
              <h1 class="error">Error</h1>
              <p>An error occurred while processing your request. Please try again later.</p>
              <a href="/" class="btn">Go to Homepage</a>
            </div>
          </body>
        </html>
      `);
    }
  });
  app2.delete("/api/shared/:shareId/:token", async (req, res) => {
    try {
      const { shareId, token } = req.params;
      const model = await storage.getModelByShareId(shareId);
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      if (!model.shareDeleteToken || model.shareDeleteToken !== token) {
        return res.status(403).json({ message: "Invalid security token" });
      }
      if (model.shareEmail) {
        try {
          const userLanguage = detectLanguage(req.headers["accept-language"]);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          const host = req.headers["host"] || "localhost:3000";
          const isProduction = host === "viewer.fastcnc.eu";
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            const baseUrl = `${req.protocol}://${req.headers["host"]}`;
            const revocationSent = await sendSharingRevokedNotificationSmtp(
              model,
              model.shareEmail,
              userLanguage,
              // Przekazujemy wykryty język użytkownika
              baseUrl
            );
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else if (!isProduction) {
              console.warn("Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)");
              const nodemailerSent = await sendSharingRevokedNotification(model, model.shareEmail);
              if (nodemailerSent) {
                console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
              } else {
                console.error(`Failed to send share revocation email to ${model.shareEmail}`);
              }
            } else {
              console.error(`Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`);
            }
          } else if (!isProduction) {
            const nodemailerSent = await sendSharingRevokedNotification(model, model.shareEmail);
            if (nodemailerSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            } else {
              console.error(`Failed to send share revocation email to ${model.shareEmail}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`);
          }
        } catch (emailError) {
          console.error("Error sending share revocation email:", emailError);
        }
      }
      await storage.updateModel(model.id, {
        shareEnabled: false
      });
      res.status(200).json({
        message: "Sharing has been revoked",
        modelId: model.id
      });
    } catch (error) {
      console.error("Error revoking shared model:", error);
      res.status(500).json({ message: "Failed to revoke shared model" });
    }
  });
  app2.delete("/api/shared/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const model = await storage.getModelByShareId(shareId);
      if (!model || !model.shareEnabled) {
        return res.status(404).json({ message: "Shared model not found" });
      }
      if (model.shareEmail) {
        try {
          let revocationSent = false;
          const userLanguage = detectLanguage(req.headers["accept-language"]);
          console.log(`Using browser language for revocation email: ${userLanguage}`);
          const host = req.headers["host"] || "localhost:3000";
          const isProduction = host === "viewer.fastcnc.eu";
          if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
            const baseUrl = `${req.protocol}://${req.headers["host"]}`;
            revocationSent = await sendSharingRevokedNotificationSmtp(
              model,
              model.shareEmail,
              userLanguage,
              // Przekazujemy wykryty język użytkownika
              baseUrl
            );
            if (revocationSent) {
              console.log(`Share revocation notification sent via custom SMTP to ${model.shareEmail} in ${userLanguage}`);
            } else if (!isProduction) {
              console.warn("Custom SMTP revocation email failed, trying Nodemailer fallback (dev environment only)");
              revocationSent = await sendSharingRevokedNotification(model, model.shareEmail);
              if (revocationSent) {
                console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
              } else {
                console.error(`Failed to send share revocation email to ${model.shareEmail}`);
              }
            } else {
              console.error(`Failed to send share revocation email via SMTP to ${model.shareEmail} in production environment`);
            }
          } else if (!isProduction) {
            revocationSent = await sendSharingRevokedNotification(model, model.shareEmail);
            if (revocationSent) {
              console.log(`Share revocation notification sent via Nodemailer to ${model.shareEmail}`);
            } else {
              console.error(`Failed to send share revocation email to ${model.shareEmail}`);
            }
          } else {
            console.error(`SMTP not configured in production environment, unable to send revocation email to ${model.shareEmail}`);
          }
        } catch (emailError) {
          console.error("Error sending share revocation email:", emailError);
        }
      }
      const updatedModel = await storage.updateModel(model.id, {
        shareEnabled: false
      });
      res.status(200).json({
        message: "Sharing has been revoked",
        modelId: model.id
      });
    } catch (error) {
      console.error("Error revoking shared model:", error);
      res.status(500).json({ message: "Failed to revoke shared model" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const loginData = adminLoginSchema.parse(req.body);
      const user = await storage.getUserByUsername(loginData.username);
      if (!user || !user.isAdmin) {
        return res.status(401).json({ message: "Nieprawid\u0142owe dane logowania lub brak uprawnie\u0144 administratora" });
      }
      const passwordValid = await comparePassword(loginData.password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ message: "Nieprawid\u0142owe dane logowania" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({
        ...userWithoutPassword,
        token: nanoid2(32)
        // Bardzo prosty token, w produkcji użyłbyś JWT lub podobnego 
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas logowania" });
    }
  });
  app2.get("/api/admin/shared-models", async (req, res) => {
    try {
      const userModels = await storage.getSharedModels();
      const modelsList = userModels.map((model) => ({
        id: model.id,
        filename: model.filename,
        filesize: model.filesize,
        format: model.format,
        created: model.created,
        shareId: model.shareId,
        shareEnabled: model.shareEnabled,
        shareEmail: model.shareEmail,
        shareExpiryDate: model.shareExpiryDate,
        shareLastAccessed: model.shareLastAccessed,
        hasPassword: !!model.sharePassword
      }));
      res.json(modelsList);
    } catch (error) {
      console.error("Error getting user models list:", error);
      res.status(500).json({ message: "Failed to get user models list" });
    }
  });
  app2.get("/api/admin/temporary-models", async (req, res) => {
    try {
      const allModels = await storage.getModels();
      const temporaryModels = allModels.filter((model) => {
        const metadata = model.metadata;
        return metadata && metadata.viewToken && !model.shareEnabled;
      });
      const modelsList = temporaryModels.map((model) => {
        const metadata = model.metadata;
        let modelType = "unknown";
        let userEmail = null;
        if (metadata) {
          if (metadata.stlFilePath) {
            modelType = "STL";
          } else if (metadata.fileType === "2d") {
            modelType = metadata.cadFormat ? metadata.cadFormat.toUpperCase() : "CAD";
          }
          userEmail = metadata.userEmail || null;
        }
        return {
          id: model.id,
          filename: model.filename,
          filesize: model.filesize,
          format: model.format,
          created: model.created,
          modelType,
          userEmail,
          // Dołącz tylko pierwszy fragment tokenu do identyfikacji
          viewTokenFragment: metadata && metadata.viewToken ? metadata.viewToken.substring(0, 8) + "..." : null
        };
      });
      res.json(modelsList);
    } catch (error) {
      console.error("Error getting temporary models list:", error);
      res.status(500).json({ message: "Failed to get temporary models list" });
    }
  });
  app2.post("/api/admin/temporary-models/:id/assign", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const { email } = req.body;
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      if (!email || !email.includes("@")) {
        return res.status(400).json({ message: "Valid email is required" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const metadata = model.metadata;
      if (!metadata || !metadata.viewToken || model.shareEnabled) {
        return res.status(400).json({ message: "This is not a temporary model" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User with this email not found" });
      }
      const updatedModel = await storage.updateModel(modelId, {
        userId: user.id,
        shareEmail: email
      });
      if (!updatedModel) {
        return res.status(500).json({ message: "Failed to update model" });
      }
      res.status(200).json({
        success: true,
        message: "Model assigned to user successfully",
        modelId,
        userId: user.id,
        email
      });
    } catch (error) {
      console.error("Error assigning temporary model to user:", error);
      res.status(500).json({ message: "Failed to assign model to user" });
    }
  });
  app2.delete("/api/admin/shared-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      if (!model.shareEnabled || !model.shareId) {
        return res.status(400).json({ message: "Model is not shared" });
      }
      const update = {
        shareEnabled: false,
        shareId: null,
        sharePassword: null,
        shareExpiryDate: null,
        shareEmail: null
      };
      const updatedModel = await storage.updateModel(modelId, update);
      if (updatedModel && model.shareEmail) {
        try {
          const language = "en";
          try {
            const host = req.headers["host"] || "localhost:5000";
            const protocol = host.includes("localhost") ? "http" : "https";
            const baseUrl = `${protocol}://${host}`;
            await sendSharingRevokedNotificationSmtp(model, model.shareEmail, language, baseUrl);
          } catch (emailError) {
            console.warn("Custom SMTP notification failed, trying Nodemailer:", emailError);
            await sendSharingRevokedNotification(model, language);
          }
        } catch (notificationError) {
          console.error("Failed to send sharing revocation notification:", notificationError);
        }
      }
      res.status(200).json({ message: "Sharing successfully disabled" });
    } catch (error) {
      console.error("Error disabling sharing:", error);
      res.status(500).json({ message: "Failed to disable sharing" });
    }
  });
  app2.delete("/api/admin/models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const deleteResult = await storage.deleteModel(modelId);
      if (!deleteResult) {
        return res.status(500).json({ message: "Failed to delete model from database" });
      }
      try {
        if (model.metadata) {
          const metadata = typeof model.metadata === "string" ? JSON.parse(model.metadata) : model.metadata;
          if (metadata.stlFilePath && fs2.existsSync(metadata.stlFilePath)) {
            fs2.unlinkSync(metadata.stlFilePath);
          }
          if (metadata.filePath && fs2.existsSync(metadata.filePath)) {
            fs2.unlinkSync(metadata.filePath);
          }
          if (metadata.dxfFilePath && fs2.existsSync(metadata.dxfFilePath)) {
            fs2.unlinkSync(metadata.dxfFilePath);
          }
        }
      } catch (fileError) {
        console.error("Error deleting physical files:", fileError);
      }
      res.status(200).json({ message: "Model completely deleted" });
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ message: "Failed to delete model" });
    }
  });
  app2.get("/api/admin/shared-models/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      try {
        const stats = await storage.getModelViewStats(id);
        const validatedStats = modelViewStatsSchema.parse(stats);
        res.json(validatedStats);
      } catch (statsError) {
        console.error("Error getting model view stats (table may not exist):", statsError);
        res.json({
          totalViews: 0,
          uniqueIPs: 0,
          viewDetails: [],
          ipAddresses: [],
          browserStats: []
        });
      }
    } catch (error) {
      console.error("Error getting model view statistics:", error);
      res.status(500).json({ message: "Failed to get model view statistics" });
    }
  });
  app2.post("/api/contact-form", async (req, res) => {
    try {
      const formData = req.body;
      const language = req.query.lang || "en";
      let modelInfo;
      const isAbuseReport = formData.subject && formData.subject.toLowerCase().includes("abuse");
      if (!formData.message) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }
      if (!isAbuseReport && (!formData.name || !formData.email)) {
        return res.status(400).json({ success: false, message: "Name and email are required for non-abuse reports" });
      }
      if (formData.modelId) {
        try {
          modelInfo = await storage.getModel(Number(formData.modelId));
        } catch (error) {
          console.warn(`Failed to fetch model info for contact form, modelId: ${formData.modelId}`, error);
        }
      }
      const { sendContactFormEmail: sendContactFormEmail2 } = await Promise.resolve().then(() => (init_custom_smtp(), custom_smtp_exports));
      const success = await sendContactFormEmail2(formData, language, modelInfo);
      if (success) {
        res.status(200).json({ success: true, message: "Message sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send message" });
      }
    } catch (error) {
      console.error("Error processing contact form submission:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
  app2.post("/api/admin/shared-models/:id/reset-password", async (req, res) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      const { newPassword } = req.body;
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedModel = await storage.updateModel(modelId, {
        sharePassword: hashedPassword
      });
      res.json({
        success: true,
        message: "Password has been updated",
        modelId,
        hasPassword: true
      });
    } catch (error) {
      console.error("Error resetting model password:", error);
      res.status(500).json({ message: "Failed to reset model password" });
    }
  });
  app2.get("/api/admin/shared-models/:id/password", async (req, res) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      if (isNaN(modelId)) {
        return res.status(400).json({ message: "Invalid model ID" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      res.json({
        modelId,
        hasPassword: !!model.sharePassword,
        message: "For security reasons, plaintext passwords are not stored or displayed."
      });
    } catch (error) {
      console.error("Error getting model password status:", error);
      res.status(500).json({ message: "Failed to get model password status" });
    }
  });
  app2.get("/api/check-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      console.log(`[DEBUG CHECK-EMAIL] Parametry \u017C\u0105dania:`, {
        rawEmail: req.params.email,
        normalizedEmail: email,
        authenticated: req.isAuthenticated(),
        userId: req.user?.id,
        userEmail: req.user?.email,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      if (!email || !email.includes("@")) {
        console.log(`[DEBUG CHECK-EMAIL] Nieprawid\u0142owy format emaila: ${email}`);
        return res.status(400).json({ message: "Invalid email format" });
      }
      const user = await storage.getUserByEmail(email);
      console.log(`[DEBUG CHECK-EMAIL] Wynik sprawdzenia:`, {
        emailExists: !!user,
        userId: user?.id,
        username: user?.username,
        isClient: user?.isClient,
        isAdmin: user?.isAdmin
      });
      res.json({
        exists: !!user,
        email
      });
    } catch (error) {
      console.error("[DEBUG CHECK-EMAIL] B\u0142\u0105d podczas sprawdzania email:", error);
      res.status(500).json({ message: "Failed to check email" });
    }
  });
  app2.get("/api/client/models", async (req, res) => {
    try {
      console.log("=== DEBUG: /api/client/models endpoint called ===");
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      const user = req.user;
      console.log(`User: ${user.email}, isAdmin: ${user.isAdmin}`);
      if (user.isAdmin) {
        const allModels = await storage.getModels();
        return res.json(allModels);
      }
      if (user.email) {
        const userModels = await storage.getModelsByEmail(user.email);
        console.log(`Retrieved ${userModels.length} models for user ${user.email}`);
        const modelsWithPassword = userModels.map((model) => {
          const hasPassword = !!(model.sharePassword || model.share_password);
          console.log(`Model ${model.id} (${model.filename}): sharePassword="${model.sharePassword}", share_password="${model.share_password}", hasPassword=${hasPassword}`);
          return {
            ...model,
            hasPassword
          };
        });
        console.log(`Final result:`, JSON.stringify(modelsWithPassword.map((m) => ({ id: m.id, filename: m.filename, hasPassword: m.hasPassword })), null, 2));
        return res.json(modelsWithPassword);
      }
      return res.json([]);
    } catch (error) {
      console.error("Error retrieving client models:", error);
      res.status(500).json({ error: "B\u0142\u0105d podczas pobierania modeli klienta" });
    }
  });
  app2.delete("/api/client/models/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Nieprawid\u0142owe ID modelu" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      const user = req.user;
      if (!user.isAdmin && user.email !== model.shareEmail) {
        return res.status(403).json({ error: "Brak uprawnie\u0144 do usuni\u0119cia tego modelu" });
      }
      await storage.deleteModel(modelId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client model:", error);
      res.status(500).json({ error: "B\u0142\u0105d podczas usuwania modelu" });
    }
  });
  app2.post("/api/client/shared-models/:id/password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Nieprawid\u0142owe ID modelu" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      const user = req.user;
      if (!user.isAdmin && user.email !== model.shareEmail) {
        return res.status(403).json({ error: "Brak uprawnie\u0144 do zmiany has\u0142a tego modelu" });
      }
      const { password } = req.body;
      let hashedPassword = null;
      if (password) {
        hashedPassword = await hashPassword(password);
      }
      await storage.updateModel(modelId, {
        sharePassword: hashedPassword
      });
      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating model password:", error);
      res.status(500).json({ error: "B\u0142\u0105d podczas aktualizacji has\u0142a modelu" });
    }
  });
  app2.post("/api/client/models/:id/public-library", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Niezalogowany" });
      }
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Nieprawid\u0142owe ID modelu" });
      }
      const { isPublic } = req.body;
      if (typeof isPublic !== "boolean") {
        return res.status(400).json({ error: "Nieprawid\u0142owa warto\u015B\u0107 isPublic" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model nie istnieje" });
      }
      const user = req.user;
      if (!user.isAdmin && user.email !== model.shareEmail) {
        return res.status(403).json({ error: "Brak uprawnie\u0144 do modyfikacji tego modelu" });
      }
      if (isPublic) {
        const validationErrors = [];
        if (model.shareEnabled && model.sharePassword && model.sharePassword.trim() !== "") {
          return res.status(400).json({
            error: "Nie mo\u017Cna doda\u0107 do publicznej biblioteki modelu chronionego has\u0142em. Najpierw usu\u0144 udost\u0119pnianie prywatne lub usu\u0144 has\u0142o.",
            requiresPasswordRemoval: true
          });
        }
        const metadata = model.metadata;
        const hasThumbnail = metadata?.thumbnailPath || fs2.existsSync && fs2.existsSync(getThumbnailPath(modelId));
        if (!hasThumbnail) {
          validationErrors.push("Model musi mie\u0107 miniaturk\u0119");
        }
        try {
          const description = await storage.getModelDescription(modelId);
          if (!description || !description.descriptionEn && !description.descriptionPl) {
            validationErrors.push("Model musi mie\u0107 opis w co najmniej jednym j\u0119zyku");
          }
        } catch (descError) {
          validationErrors.push("Model musi mie\u0107 opis");
        }
        try {
          const modelTags2 = await storage.getModelTags(modelId);
          if (!modelTags2 || modelTags2.length === 0) {
            validationErrors.push("Model musi mie\u0107 co najmniej jeden tag");
          }
        } catch (tagsError) {
          validationErrors.push("Model musi mie\u0107 tagi");
        }
        if (validationErrors.length > 0) {
          return res.status(400).json({
            error: "Model nie spe\u0142nia wymaga\u0144 publicznej biblioteki",
            validationErrors
          });
        }
      }
      await storage.updateModel(modelId, {
        isPublic
      });
      return res.json({
        success: true,
        isPublic,
        message: isPublic ? "Model dodany do publicznej biblioteki CAD" : "Model usuni\u0119ty z publicznej biblioteki CAD"
      });
    } catch (error) {
      console.error("Error updating public library status:", error);
      res.status(500).json({ error: "B\u0142\u0105d podczas aktualizacji statusu publicznej biblioteki" });
    }
  });
  app2.get("/api/library", async (req, res) => {
    try {
      const query = req.query.query;
      const tags2 = req.query.tags ? req.query.tags.split(",") : void 0;
      const page = parseInt(req.query.page || "1");
      const limit = parseInt(req.query.limit || "20");
      const libraryModels = await storage.getLibraryModels({
        query,
        tags: tags2,
        page,
        limit
      });
      res.json(libraryModels);
    } catch (error) {
      console.error("Error fetching library models:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/models/:id/tags", async (req, res) => {
    try {
      const { id } = req.params;
      const modelId = parseInt(id);
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      if (!req.isAuthenticated() || req.user.id !== model.userId && !req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updateTagsData = updateModelTagsSchema.parse({
        modelId,
        tags: req.body.tags || []
      });
      const updatedModel = await storage.updateModelTags(modelId, updateTagsData.tags);
      res.json({
        success: true,
        model: updatedModel,
        message: "Model tags updated successfully"
      });
    } catch (error) {
      console.error("Error updating model tags:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/models/:id/gallery", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      if (model.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const galleryImages = await storage.getModelGallery(modelId);
      res.json(galleryImages);
    } catch (error) {
      console.error("Error getting model gallery:", error);
      res.status(500).json({ error: "Failed to get gallery" });
    }
  });
  app2.post("/api/models/:id/gallery", galleryUpload.array("images", 6), async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const files = req.files;
      console.log("Gallery upload request received:", {
        modelId,
        filesCount: files ? files.length : 0,
        files: files ? files.map((f) => ({ name: f.originalname, size: f.size })) : "No files",
        body: req.body
      });
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!files || files.length === 0) {
        console.log("No files received in gallery upload");
        return res.status(400).json({ error: "No files uploaded" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      if (model.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const uploadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          bufferLength: file.buffer ? file.buffer.length : "no buffer"
        });
        if (!file.buffer || file.buffer.length === 0) {
          console.error(`File ${i} has no buffer or empty buffer`);
          continue;
        }
        const filename = `gallery_${modelId}_${Date.now()}_${i}.${file.originalname.split(".").pop()}`;
        let s3Key = null;
        if (s3Service.isInitialized()) {
          s3Key = `gallery/${req.user.id}/${filename}`;
          console.log(`Uploading to S3 with key: ${s3Key}, buffer size: ${file.buffer.length}`);
          await s3Service.uploadBuffer(s3Key, file.buffer, file.mimetype);
        } else {
          const uploadPath = path2.join("./uploads", "gallery", filename);
          await fs2.promises.mkdir(path2.dirname(uploadPath), { recursive: true });
          await fs2.promises.writeFile(uploadPath, file.buffer);
        }
        const galleryImage = await storage.addGalleryImage({
          modelId,
          filename,
          originalName: file.originalname,
          filesize: file.size,
          mimeType: file.mimetype,
          s3Key,
          isThumbnail: i === 0
        });
        uploadedImages.push(galleryImage);
      }
      res.json({
        success: true,
        message: "Gallery images uploaded successfully",
        images: uploadedImages
      });
    } catch (error) {
      console.error("Error uploading gallery images:", error);
      res.status(500).json({ error: "Failed to upload gallery images" });
    }
  });
  app2.get("/api/models/:modelId/gallery/:imageId", async (req, res) => {
    try {
      const modelId = parseInt(req.params.modelId);
      const imageId = parseInt(req.params.imageId);
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      const galleryImages = await storage.getModelGallery(modelId);
      const image = galleryImages.find((img) => img.id === imageId);
      if (!image) {
        return res.status(404).json({ error: "Gallery image not found" });
      }
      if (image.s3Key && s3Service.isInitialized()) {
        const signedUrl = await s3Service.getSignedDownloadUrl(image.s3Key);
        res.redirect(signedUrl);
      } else {
        const imagePath = path2.join("./uploads", "gallery", image.filename);
        if (await fs2.promises.access(imagePath).then(() => true).catch(() => false)) {
          res.sendFile(path2.resolve(imagePath));
        } else {
          res.status(404).json({ error: "Image file not found" });
        }
      }
    } catch (error) {
      console.error("Error serving gallery image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });
  app2.delete("/api/models/:modelId/gallery/:imageId", async (req, res) => {
    try {
      const modelId = parseInt(req.params.modelId);
      const imageId = parseInt(req.params.imageId);
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      const galleryImages = await storage.getModelGallery(modelId);
      const image = galleryImages.find((img) => img.id === imageId);
      if (!image) {
        return res.status(404).json({ error: "Gallery image not found" });
      }
      if (image.s3Key && s3Service.isInitialized()) {
        try {
          await s3Service.deleteFile(image.s3Key);
          console.log(`Deleted gallery image from S3: ${image.s3Key}`);
        } catch (s3Error) {
          console.error("Failed to delete image from S3:", s3Error);
        }
      }
      const deleted = await storage.deleteGalleryImage(imageId);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete image from database" });
      }
      console.log(`Gallery image ${imageId} deleted successfully`);
      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
  app2.post("/api/models/:id/generate-thumbnail", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      const metadata = model.metadata;
      let filePath = metadata?.filePath;
      let tempFile = null;
      if (metadata?.s3Key && s3Service.isInitialized()) {
        try {
          const tempDir = path2.join(process.cwd(), "uploads/temp-thumbnails");
          if (!fs2.existsSync(tempDir)) {
            fs2.mkdirSync(tempDir, { recursive: true });
          }
          tempFile = path2.join(tempDir, `temp_${modelId}_${Date.now()}_${model.filename}`);
          const signedUrl = await s3Service.getSignedDownloadUrl(metadata.s3Key, 3600);
          const response = await fetch(signedUrl);
          if (!response.ok) {
            throw new Error("Failed to download file from S3");
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          fs2.writeFileSync(tempFile, buffer);
          filePath = tempFile;
          console.log(`Downloaded file from S3 for thumbnail generation: ${metadata.s3Key}`);
        } catch (s3Error) {
          console.error("Failed to download file from S3:", s3Error);
          return res.status(400).json({ message: "Failed to access model file in storage" });
        }
      }
      if (!filePath || !fs2.existsSync(filePath)) {
        return res.status(400).json({ message: "Model file not found" });
      }
      const thumbnailPath = getThumbnailPath(modelId);
      const thumbnailGenerated = await generateThumbnail(filePath, thumbnailPath, {}, model.filename);
      if (tempFile && fs2.existsSync(tempFile)) {
        try {
          fs2.unlinkSync(tempFile);
        } catch (cleanupError) {
          console.error("Failed to cleanup temp file:", cleanupError);
        }
      }
      if (!thumbnailGenerated) {
        return res.status(500).json({ message: "Failed to generate thumbnail" });
      }
      if (!fs2.existsSync(thumbnailPath)) {
        return res.status(500).json({ message: "Thumbnail file was not created" });
      }
      let s3UploadSuccess = false;
      let galleryImageId = null;
      if (s3Service.isInitialized()) {
        try {
          const thumbnailKey = `thumbnails/${req.user.id}/model_${modelId}_thumbnail.png`;
          const thumbnailBuffer = fs2.readFileSync(thumbnailPath);
          await s3Service.uploadBuffer(thumbnailKey, thumbnailBuffer, "image/png");
          await storage.updateModelThumbnail(modelId, thumbnailKey);
          s3UploadSuccess = true;
          console.log(`Thumbnail uploaded to S3 for model ${modelId}`);
          try {
            const galleryImage = await storage.addGalleryImage({
              modelId,
              filename: `generated_thumbnail_${modelId}_${Date.now()}.png`,
              originalName: "Generated Thumbnail",
              filesize: thumbnailBuffer.length,
              mimeType: "image/png",
              displayOrder: 0,
              isThumbnail: true,
              s3Key: thumbnailKey
            });
            galleryImageId = galleryImage.id;
            console.log(`Generated thumbnail added to gallery with ID: ${galleryImageId}`);
          } catch (galleryError) {
            console.error("Failed to add generated thumbnail to gallery:", galleryError);
          }
        } catch (s3Error) {
          console.error("Failed to upload thumbnail to S3:", s3Error);
          console.log("Thumbnail will remain stored locally");
        }
      } else {
        try {
          const thumbnailBuffer = fs2.readFileSync(thumbnailPath);
          const galleryImage = await storage.addGalleryImage({
            modelId,
            filename: `generated_thumbnail_${modelId}_${Date.now()}.png`,
            originalName: "Generated Thumbnail",
            filesize: thumbnailBuffer.length,
            mimeType: "image/png",
            displayOrder: 0,
            isThumbnail: true,
            s3Key: null
          });
          galleryImageId = galleryImage.id;
          console.log(`Generated thumbnail added to local gallery with ID: ${galleryImageId}`);
        } catch (galleryError) {
          console.error("Failed to add generated thumbnail to local gallery:", galleryError);
        }
      }
      res.json({
        success: true,
        message: s3UploadSuccess ? "Thumbnail generated and uploaded to cloud storage" : "Thumbnail generated locally",
        thumbnailUrl: `/api/models/${modelId}/thumbnail?t=${Date.now()}`,
        galleryImageId
      });
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      res.status(500).json({ message: "Failed to generate thumbnail" });
    }
  });
  app2.put("/api/models/:modelId/gallery/:imageId/thumbnail", async (req, res) => {
    try {
      const modelId = parseInt(req.params.modelId);
      const imageId = parseInt(req.params.imageId);
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      if (model.userId !== req.user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const galleryImages = await storage.getModelGallery(modelId);
      const targetImage = galleryImages.find((img) => img.id === imageId);
      if (!targetImage) {
        return res.status(404).json({ error: "Gallery image not found" });
      }
      console.log(`Setting thumbnail for model ${modelId}, image ${imageId}`);
      console.log(`Target image:`, JSON.stringify(targetImage, null, 2));
      await storage.clearGalleryThumbnails(modelId);
      console.log(`Cleared existing gallery thumbnails for model ${modelId}`);
      const updatedImage = await storage.setGalleryThumbnail(imageId);
      console.log(`Set gallery thumbnail:`, JSON.stringify(updatedImage, null, 2));
      if (s3Service.isInitialized() && targetImage.s3Key) {
        try {
          console.log(`Copying gallery image to model thumbnail: ${targetImage.s3Key}`);
          const downloadUrl = await s3Service.getSignedDownloadUrl(targetImage.s3Key, 3600);
          console.log(`Downloaded signed URL: ${downloadUrl}`);
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image from S3: ${response.status}`);
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          console.log(`Image buffer size: ${buffer.length}`);
          const thumbnailKey = `thumbnails/${req.user.id}/model_${modelId}_thumbnail.${targetImage.filename.split(".").pop()}`;
          console.log(`Uploading thumbnail to S3 with key: ${thumbnailKey}`);
          await s3Service.uploadBuffer(thumbnailKey, buffer, targetImage.mimeType);
          console.log(`Thumbnail uploaded successfully to S3`);
          await storage.updateModelThumbnail(modelId, thumbnailKey);
          console.log(`Model thumbnail metadata updated`);
        } catch (s3Error) {
          console.error("Error copying gallery image to model thumbnail:", s3Error);
          throw s3Error;
        }
      } else if (!s3Service.isInitialized()) {
        const sourcePath = path2.join("./uploads", "gallery", targetImage.filename);
        const thumbnailPath = path2.join("./uploads", "thumbnails", `model_${modelId}_thumbnail.${targetImage.filename.split(".").pop()}`);
        await fs2.promises.mkdir(path2.dirname(thumbnailPath), { recursive: true });
        await fs2.promises.copyFile(sourcePath, thumbnailPath);
        await storage.updateModelThumbnail(modelId, `model_${modelId}_thumbnail.${targetImage.filename.split(".").pop()}`);
      }
      res.json({
        success: true,
        message: "Thumbnail updated successfully",
        image: updatedImage
      });
    } catch (error) {
      console.error("Error setting thumbnail:", error);
      res.status(500).json({ error: "Failed to set thumbnail" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.get("/api/tags", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : void 0;
      const tags2 = await storage.getTags(categoryId);
      res.json(tags2);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });
  app2.post("/api/tags", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isClient && !req.user?.isAdmin) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { nameEn, namePl, nameDe, nameFr, nameCs, nameEs, slug, categoryId } = req.body;
      if (!nameEn || !slug) {
        return res.status(400).json({ error: "Name (English) and slug are required" });
      }
      const newTag = await storage.createTag({
        nameEn,
        namePl: namePl || nameEn,
        nameDe: nameDe || nameEn,
        nameFr: nameFr || nameEn,
        nameCs: nameCs || nameEn,
        nameEs: nameEs || nameEn,
        slug,
        categoryId
      });
      res.status(201).json(newTag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ error: "Failed to create tag" });
    }
  });
  app2.put("/api/models/:id/category", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isClient && !req.user?.isAdmin) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const modelId = parseInt(req.params.id);
      const { categoryId } = req.body;
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const updatedModel = await storage.updateModelCategory(modelId, categoryId || null);
      if (!updatedModel) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(updatedModel);
    } catch (error) {
      console.error("Error updating model category:", error);
      res.status(500).json({ error: "Failed to update model category" });
    }
  });
  app2.put("/api/models/:id/tags", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isClient && !req.user?.isAdmin) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const modelId = parseInt(req.params.id);
      const { tagIds } = req.body;
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ error: "tagIds must be an array" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const currentTags = await storage.getModelTags(modelId);
      const currentTagIds = currentTags.map((tag) => tag.id);
      const tagsToAdd = tagIds.filter((id) => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter((id) => !tagIds.includes(id));
      if (tagsToRemove.length > 0) {
        await storage.removeModelTags(modelId, tagsToRemove);
      }
      if (tagsToAdd.length > 0) {
        await storage.addModelTags(modelId, tagsToAdd);
      }
      const updatedTags = await storage.getModelTags(modelId);
      res.json(updatedTags);
    } catch (error) {
      console.error("Error updating model tags:", error);
      res.status(500).json({ error: "Failed to update model tags" });
    }
  });
  app2.get("/api/models/:id/tags", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const tags2 = await storage.getModelTags(modelId);
      res.json(tags2);
    } catch (error) {
      console.error("Error fetching model tags:", error);
      res.status(500).json({ error: "Failed to fetch model tags" });
    }
  });
  app2.get("/api/models/:id/description", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const description = await storage.getModelDescription(modelId);
      res.json(description || null);
    } catch (error) {
      console.error("Error fetching model description:", error);
      res.status(500).json({ error: "Failed to fetch model description" });
    }
  });
  app2.post("/api/models/:id/description", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isClient && !req.user?.isAdmin) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { description, language } = req.body;
      if (!description || !language) {
        return res.status(400).json({ error: "Description and language are required" });
      }
      const supportedLanguages = ["en", "pl", "cs", "de", "fr", "es"];
      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({ error: "Unsupported language" });
      }
      try {
        console.log(`Translating description from ${language}: "${description}"`);
        const translations = await translateDescription(description, language);
        const existingDescription = await storage.getModelDescription(modelId);
        if (existingDescription) {
          const updatedDescription = await storage.updateModelDescription(modelId, {
            ...translations,
            originalLanguage: language,
            originalDescription: description
          });
          res.json({
            success: true,
            description: updatedDescription,
            message: "Description updated and translated successfully"
          });
        } else {
          const newDescription = await storage.createModelDescription({
            modelId,
            ...translations,
            originalLanguage: language,
            originalDescription: description
          });
          res.json({
            success: true,
            description: newDescription,
            message: "Description created and translated successfully"
          });
        }
      } catch (translationError) {
        console.error("Translation error:", translationError);
        const fallbackDescription = {
          [`description${language.charAt(0).toUpperCase() + language.slice(1)}`]: description,
          originalLanguage: language,
          originalDescription: description
        };
        const existingDescription = await storage.getModelDescription(modelId);
        if (existingDescription) {
          const updatedDescription = await storage.updateModelDescription(modelId, fallbackDescription);
          res.json({
            success: true,
            description: updatedDescription,
            message: "Description updated (translation service unavailable)",
            warning: "Automatic translation failed - only original language saved"
          });
        } else {
          const newDescription = await storage.createModelDescription({
            modelId,
            ...fallbackDescription
          });
          res.json({
            success: true,
            description: newDescription,
            message: "Description created (translation service unavailable)",
            warning: "Automatic translation failed - only original language saved"
          });
        }
      }
    } catch (error) {
      console.error("Error creating/updating model description:", error);
      res.status(500).json({ error: "Failed to save model description" });
    }
  });
  app2.delete("/api/models/:id/description", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isClient && !req.user?.isAdmin) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const deleted = await storage.deleteModelDescription(modelId);
      if (!deleted) {
        return res.status(404).json({ error: "Description not found" });
      }
      res.json({ success: true, message: "Description deleted successfully" });
    } catch (error) {
      console.error("Error deleting model description:", error);
      res.status(500).json({ error: "Failed to delete model description" });
    }
  });
  app2.post("/api/models/:id/tags-translate", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isClient && !req.user?.isAdmin) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const modelId = parseInt(req.params.id);
      if (isNaN(modelId)) {
        return res.status(400).json({ error: "Invalid model ID" });
      }
      const { tags: tags2, language } = req.body;
      if (!tags2 || !language) {
        return res.status(400).json({ error: "Tags and language are required" });
      }
      const hasAccess = await hasAccessToModel(req, modelId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      const tagList = tags2.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
      if (tagList.length === 0) {
        return res.status(400).json({ error: "At least one tag is required" });
      }
      const { translateDescription: translateDescription2 } = await Promise.resolve().then(() => (init_google_translate(), google_translate_exports));
      const processedTags = [];
      for (const tagName of tagList) {
        try {
          console.log(`Translating tag from ${language}: "${tagName}"`);
          const translations = await translateDescription2(tagName, language);
          const tagData = {
            nameEn: translations.descriptionEn || tagName,
            namePl: translations.descriptionPl || tagName,
            nameCs: translations.descriptionCs || tagName,
            nameDe: translations.descriptionDe || tagName,
            nameFr: translations.descriptionFr || tagName,
            nameEs: translations.descriptionEs || tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            color: "#6B7280",
            // Default color
            isActive: true
          };
          console.log("Tag translations:", tagData);
          let existingTag = await storage.getTagBySlug(tagData.slug);
          if (existingTag) {
            const updatedTag = await storage.updateTag(existingTag.id, tagData);
            processedTags.push(updatedTag);
          } else {
            const newTag = await storage.createTag(tagData);
            processedTags.push(newTag);
          }
        } catch (translationError) {
          console.error(`Translation failed for tag "${tagName}":`, translationError);
          const fallbackTag = {
            nameEn: language === "en" ? tagName : "",
            namePl: language === "pl" ? tagName : "",
            nameCs: language === "cs" ? tagName : "",
            nameDe: language === "de" ? tagName : "",
            nameFr: language === "fr" ? tagName : "",
            nameEs: language === "es" ? tagName : "",
            slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            color: "#6B7280",
            isActive: true
          };
          let existingTag = await storage.getTagBySlug(fallbackTag.slug);
          if (existingTag) {
            processedTags.push(existingTag);
          } else {
            const newTag = await storage.createTag(fallbackTag);
            processedTags.push(newTag);
          }
        }
      }
      await storage.setModelTags(modelId, processedTags.map((tag) => tag?.id));
      res.json({
        success: true,
        tags: processedTags,
        message: "Tags saved and translated successfully"
      });
    } catch (error) {
      console.error("Error creating/updating model tags:", error);
      res.status(500).json({ error: "Failed to save model tags" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid as nanoid3 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
