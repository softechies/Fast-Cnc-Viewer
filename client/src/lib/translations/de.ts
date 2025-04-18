// German translations

const translations = {
  // Common UI elements
  appTitle: "CAD Viewer",
  applicationName: "CAD Viewer",
  home: "Start",
  upload: "Hochladen",
  uploadModel: "Modell hochladen",
  view: "Ansicht",
  share: "Teilen",
  delete: "Löschen",
  cancel: "Abbrechen",
  save: "Speichern",
  back: "Zurück",
  loadingGeneric: "Laden...",
  refresh: "Aktualisieren",
  error: "Fehler",
  success: "Erfolg",
  close: "Schließen",
  confirm: "Bestätigen",
  
  // Authentication
  login: "Anmelden",
  register: "Registrieren",
  create_account_sharing: "Erstellen Sie ein Konto, um Ihre Dateien zu verwalten",
  account_created: "Ihr Konto wurde erfolgreich erstellt. Sie sind jetzt angemeldet.",
  enter_credentials: "Geben Sie Ihre Anmeldedaten ein",
  username: "Benutzername",
  username_optional: "Benutzername ist optional",
  password: "Passwort",
  create_account: "Neues Konto erstellen",
  email: "E-Mail",
  full_name: "Vollständiger Name",
  company: "Unternehmen",
  client_dashboard: "Kunden-Dashboard",
  
  // Buttons
  button: {
    upload: "Hochladen",
    cancel: "Abbrechen",
    share: "Teilen"
  },
  
  // Home page
  welcome: "Willkommen beim CAD Viewer",
  welcomeMessage: "Laden Sie eine CAD-Datei hoch, um zu beginnen",
  recentModels: "Neueste Modelle",
  noModels: "Keine Modelle gefunden. Laden Sie eine CAD-Datei hoch, um zu beginnen.",
  noPreviousFiles: "Keine früheren Dateien",
  
  // Upload modal
  dropFileHere: "CAD-Datei hier ablegen",
  dragAndDrop: "Ziehen und ablegen Sie Ihre Datei hier oder klicken Sie zum Durchsuchen",
  selectFile: "Datei auswählen",
  uploadingModel: "Modell wird hochgeladen...",
  uploadComplete: "Hochladen abgeschlossen",
  uploadFailed: "Hochladen fehlgeschlagen",
  supportedFormats: "Unterstützte Formate: STEP, IGES, STL, DXF, DWG",
  processingFile: "Datei wird verarbeitet...",
  
  // Model viewer
  modelInfo: "Modellinformationen",
  modelInformation: "Modellinformationen",
  modelTree: "Modellbaum",
  components: "Komponenten",
  part: "Teil",
  parts: "Teile",
  assembly: "Baugruppe",
  assemblies: "Baugruppen",
  surfaces: "Oberflächen",
  solids: "Volumenkörper",
  viewControls: "Ansichtssteuerung",
  rotate: "Drehen",
  pan: "Verschieben",
  zoom: "Zoomen",
  fitToView: "An Ansicht anpassen",
  modelDetails: "Modelldetails",
  format: "Format",
  fileSize: "Dateigröße",
  created: "Erstellt",
  createdDate: "Erstellungsdatum",
  mode: "Modus",
  fileType: "Dateityp",
  modelEntities: "Modellentitäten",
  modelNotFound: "Modell nicht gefunden",
  errorLoadingModel: "Fehler beim Laden des Modells",
  
  // Sharing
  shareModel: "Modell teilen",
  shareTitle: "Dieses CAD-Modell teilen",
  shareDescription: "Teilen Sie dieses Modell mit anderen per E-Mail",
  recipientEmail: "E-Mail-Adresse des Empfängers",
  shareWithPassword: "Mit Passwort teilen",
  sharePassword: "Passwort",
  generatePassword: "Passwort generieren",
  setExpiry: "Ablaufdatum festlegen",
  expiryDate: "Ablaufdatum",
  shareLink: "Link zum Teilen",
  copyLink: "Link kopieren",
  linkCopied: "Link kopiert",
  enableSharing: "Teilen aktivieren",
  disableSharing: "Teilen deaktivieren",
  sharingEnabled: "Teilen aktiviert",
  sharingDisabled: "Teilen deaktiviert",
  sendEmail: "E-Mail-Benachrichtigung senden",
  emailSent: "E-Mail gesendet",
  emailNotSent: "E-Mail konnte nicht gesendet werden",
  
  // Shared model access
  sharedModel: "Geteiltes Modell",
  enterPassword: "Geben Sie das Passwort ein, um dieses Modell anzuzeigen",
  passwordProtected: "Passwortgeschützt",
  incorrectPassword: "Falsches Passwort",
  viewSharedModel: "Geteiltes Modell anzeigen",
  modelSharedBy: "Modell geteilt von",
  
  // Shared page texts
  shared: {
    protected_model: {
      title: "Geschütztes Modell",
      description: "Dieses Modell ist passwortgeschützt.",
      password_placeholder: "Passwort für das Modell eingeben"
    },
    model_info: {
      shared_status: "Geteiltes Modell"
    }
  },
  
  // Messages
  message: {
    no: {
      model: "Datei hier ablegen oder zum Durchsuchen klicken"
    },
    loading: "Bitte warten, Ihre Datei wird verarbeitet",
    delete: {
      warning: "Sind Sie sicher, dass Sie dieses Modell löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
    }
  },
  
  // Labels
  label: {
    file: "Ausgewählte Datei",
    verification: "Überprüfung läuft",
    shared: {
      model: "geteiltes Modell"
    },
    password: "Passwort",
    "password.share": "Passwortgeschützt",
    "password.share.placeholder": "Passwort für Freigabe eingeben",
    expiry: "Ablaufdatum",
    email: "Email",
    "email.placeholder": "Email des Empfängers eingeben"
  },
  
  // Layout
  app: {
    footer: "CAD Viewer - © 2025 Alle Rechte vorbehalten"
  },

  // Error messages
  genericError: "Ein Fehler ist aufgetreten",
  connectionError: "Verbindungsfehler",
  fileNotSupported: "Dateiformat wird nicht unterstützt",
  fileTooLarge: "Datei ist zu groß",
  invalidPassword: "Ungültiges Passwort",
  invalidEmail: "Ungültige E-Mail-Adresse",
  
  // Specific error messages
  errors: {
    title: "Fehler",
    share: "Fehler beim Teilen des Modells",
    password_required: "Passwort erforderlich",
    model: {
      fetch: "Modellinformationen konnten nicht abgerufen werden",
      access: "Zugriff auf das Modell nicht möglich",
      display_failed: "Modell kann nicht angezeigt werden"
    }
  },
  
  // Loading states
  loadingState: {
    shared_model: "Geteiltes Modell wird geladen..."
  },
  
  // Actions
  actions: {
    back_to_home: "Zurück zur Startseite",
    access: "Zugriff erhalten",
    verifying: "Überprüfung...",
    go_to_app: "Zur Anwendung"
  },
  
  // Success messages
  sharingSaved: "Freigabeeinstellungen gespeichert",
  sharingRemoved: "Freigabe wurde deaktiviert"
};

export default translations;