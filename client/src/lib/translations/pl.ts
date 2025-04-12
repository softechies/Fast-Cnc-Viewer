// Polish translations

const translations = {
  // Common UI elements
  appTitle: "Przeglądarka CAD",
  applicationName: "Przeglądarka CAD",
  home: "Strona główna",
  upload: "Prześlij",
  uploadModel: "Prześlij model",
  view: "Podgląd",
  share: "Udostępnij",
  delete: "Usuń",
  cancel: "Anuluj",
  save: "Zapisz",
  back: "Powrót",
  loading: "Ładowanie...",
  refresh: "Odśwież",
  error: "Błąd",
  success: "Sukces",
  close: "Zamknij",
  confirm: "Potwierdź",
  
  // Buttons
  button: {
    upload: "Prześlij",
    cancel: "Anuluj",
    share: "Udostępnij",
    copy: "Skopiowano"
  },
  
  // Home page
  welcome: "Witaj w Przeglądarce CAD",
  welcomeMessage: "Prześlij plik CAD, aby rozpocząć",
  recentModels: "Ostatnie modele",
  noModels: "Nie znaleziono modeli. Prześlij plik CAD, aby rozpocząć.",
  noPreviousFiles: "Brak wcześniejszych plików",
  
  // Upload modal
  dropFileHere: "Upuść plik CAD tutaj",
  dragAndDrop: "Przeciągnij i upuść plik tutaj lub kliknij, aby przeglądać",
  selectFile: "Wybierz plik",
  uploadingModel: "Przesyłanie modelu...",
  uploadComplete: "Przesyłanie zakończone",
  uploadFailed: "Przesyłanie nie powiodło się",
  supportedFormats: "Obsługiwane formaty: STEP, IGES, STL, DXF, DWG",
  processingFile: "Przetwarzanie pliku...",
  
  // Model viewer
  modelInfo: "Informacje o modelu",
  modelInformation: "Informacje o modelu",
  modelTree: "Drzewo modelu",
  components: "Komponenty",
  part: "Część",
  parts: "Części",
  assembly: "Złożenie",
  assemblies: "Złożenia",
  surfaces: "Powierzchnie",
  solids: "Bryły",
  viewControls: "Kontrolki widoku",
  rotate: "Obracaj",
  pan: "Przesuń",
  zoom: "Przybliż",
  fitToView: "Dopasuj do widoku",
  modelDetails: "Szczegóły modelu",
  format: "Format",
  fileSize: "Rozmiar pliku",
  created: "Utworzono",
  createdDate: "Data utworzenia",
  mode: "Tryb",
  fileType: "Typ pliku",
  modelEntities: "Elementy modelu",
  modelNotFound: "Nie znaleziono modelu",
  errorLoadingModel: "Błąd wczytywania modelu",
  
  // Sharing
  shareModel: "Udostępnij model",
  shareTitle: "Udostępnij ten model CAD",
  shareDescription: "Udostępnij ten model innym osobom przez e-mail",
  recipientEmail: "E-mail odbiorcy",
  shareWithPassword: "Udostępnij z hasłem",
  sharePassword: "Hasło",
  generatePassword: "Wygeneruj hasło",
  setExpiry: "Ustaw datę wygaśnięcia",
  expiryDate: "Data wygaśnięcia",
  shareLink: "Link do udostępnienia",
  copyLink: "Kopiuj link",
  linkCopied: "Link skopiowany",
  enableSharing: "Włącz udostępnianie",
  disableSharing: "Wyłącz udostępnianie",
  sharingEnabled: "Udostępnianie włączone",
  sharingDisabled: "Udostępnianie wyłączone",
  sendEmail: "Wyślij powiadomienie e-mail",
  emailSent: "E-mail wysłany",
  emailNotSent: "Nie udało się wysłać e-maila",
  
  // Shared model access
  sharedModel: "Udostępniony model",
  enterPassword: "Wprowadź hasło, aby zobaczyć ten model",
  passwordProtected: "Chroniony hasłem",
  incorrectPassword: "Nieprawidłowe hasło",
  viewSharedModel: "Zobacz udostępniony model",
  modelSharedBy: "Model udostępniony przez",
  
  // Messages
  message: {
    no: {
      model: "Upuść plik tutaj lub kliknij, aby przeglądać"
    },
    loading: "Proszę czekać, przetwarzamy Twój plik",
    delete: {
      warning: "Czy na pewno chcesz usunąć ten model? Tej operacji nie można cofnąć.",
      success: "Model został pomyślnie usunięty"
    },
    share: {
      warning: "Czy na pewno chcesz udostępnić ten model?",
      success: "Model został pomyślnie udostępniony",
      copied: "Link do udostępnienia został skopiowany do schowka"
    },
    revocation: {
      sent: "Powiadomienie e-mail wysłane do"
    },
    password: {
      required: "Hasło nie jest wymagane"
    }
  },
  
  // Labels
  label: {
    file: "Wybrany plik",
    verification: "Weryfikacja w toku",
    shared: {
      model: "udostępniony model"
    },
    password: "Hasło",
    "password.share": "Chronione hasłem",
    "password.share.placeholder": "Wprowadź hasło do udostępnienia",
    expiry: "Data wygaśnięcia",
    email: "Email",
    "email.placeholder": "Wprowadź email odbiorcy"
  },
  
  // Layout
  app: {
    footer: "Przeglądarka CAD - © 2025 Wszelkie prawa zastrzeżone"
  },

  // Headers
  header: {
    error: "Błąd",
    shared: {
      model: "Udostępniony model"
    }
  },

  // Error messages
  genericError: "Coś poszło nie tak",
  connectionError: "Błąd połączenia",
  fileNotSupported: "Format pliku nie jest obsługiwany",
  fileTooLarge: "Plik jest zbyt duży",
  invalidPassword: "Nieprawidłowe hasło",
  invalidEmail: "Nieprawidłowy adres e-mail",
  errors: {
    share: "Błąd podczas udostępniania modelu"
  },
  
  // Success messages
  sharingSaved: "Ustawienia udostępniania zapisane",
  sharingRemoved: "Udostępnianie zostało wyłączone",
  
  // Admin panel
  admin: {
    loginTitle: "Logowanie do Panelu Administratora",
    loginDescription: "Wprowadź dane uwierzytelniające, aby uzyskać dostęp do panelu administratora",
    username: "Nazwa użytkownika",
    usernamePlaceholder: "admin",
    password: "Hasło",
    loginButton: "Zaloguj się",
    loggingIn: "Logowanie...",
    dashboardTitle: "Panel Administratora",
    sharedModelsTitle: "Udostępnione Modele",
    sharedModelsDescription: "Zarządzaj wszystkimi udostępnionymi modelami w systemie",
    refresh: "Odśwież",
    logout: "Wyloguj",
    notAuthenticated: "Niezalogowany",
    pleaseLogin: "Proszę zalogować się, aby uzyskać dostęp do panelu administratora",
    loadError: "Błąd ładowania danych",
    unknownError: "Wystąpił nieznany błąd",
    linkCopied: "Link skopiowany",
    linkCopiedDescription: "Link został skopiowany do schowka",
    sharingRevoked: "Udostępnianie odwołane",
    sharingRevokedDescription: "Udostępnianie modelu zostało pomyślnie wyłączone",
    revokeError: "Błąd odwoływania udostępniania",
    loggedOut: "Wylogowano",
    loggedOutDescription: "Zostałeś pomyślnie wylogowany",
    filename: "Nazwa pliku",
    format: "Format",
    sharedWith: "Udostępniono dla",
    createdDate: "Utworzono",
    lastAccessed: "Ostatni dostęp",
    expiryDate: "Data wygaśnięcia",
    passwordProtection: "Hasło",
    actions: "Akcje",
    shareLink: "Link",
    shareLinkTitle: "Link udostępniania",
    openLink: "Otwórz link",
    revoke: "Odwołaj",
    protected: "Chroniony",
    notProtected: "Niechroniony",
    noSharedModels: "Nie znaleziono udostępnionych modeli",
    revokeConfirmTitle: "Potwierdź odwołanie",
    revokeConfirmDescription: "Czy na pewno chcesz odwołać udostępnianie tego modelu? Tej operacji nie można cofnąć.",
    cancel: "Anuluj",
    confirmRevoke: "Tak, odwołaj"
  }
};

export default translations;