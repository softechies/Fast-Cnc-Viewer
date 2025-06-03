// Polish translations

const translations = {
  // Services section translations
  services: {
    title: 'Usługi CNC',
    laser_cutting: 'Cięcie laserowe',
    laser_description: 'Twój projekt 2D jest idealny do realizacji poprzez cięcie laserowe. Oferujemy precyzyjne cięcie laserowe blach, tworzyw sztucznych i innych materiałów.',
    get_quote: 'Zapytaj o wycenę',
    cnc_machining: 'Obróbka CNC',
    cnc_description: 'Twój model 3D jest gotowy do produkcji. Oferujemy profesjonalne usługi toczenia i frezowania CNC z najwyższą precyzją i jakością.',
    manufacturing: 'Usługi produkcyjne',
    manufacturing_description: 'Zrealizujemy Twój projekt produkcyjny od A do Z. Skontaktuj się z nami, aby omówić szczegóły i otrzymać indywidualną wycenę.',
    our_services: 'Nasze usługi produkcyjne',
    laser_details: 'Precyzyjne cięcie blachy, tworzyw sztucznych i innych materiałów z dokładnością do 0,05 mm. Idealne do części 2D.',
    cnc_milling: 'Frezowanie CNC',
    milling_details: 'Obróbka skrawaniem materiałów takich jak aluminium, stal, tworzywa sztuczne. Idealne dla złożonych kształtów 3D.',
    cnc_turning: 'Toczenie CNC',
    turning_details: 'Precyzyjna obróbka części obrotowych z metalu. Idealne do wałków, tulei, części maszyn z dokładnością do 0,01 mm.',
    prototyping: 'Prototypowanie',
    prototyping_details: 'Szybkie wykonanie prototypów i małych serii produkcyjnych. Od projektu do gotowego elementu w kilka dni.',
    contact_us: 'Skontaktuj się z nami',
  },
  // Common UI elements
  appTitle: "Przeglądarka CAD",
  applicationName: "Przeglądarka CAD",
  cad_viewer: "Przeglądarka CAD",
  powered_by: "Obsługiwane przez",
  home: "Strona główna",
  back_to_home: "Powrót do strony głównej",
  language_detecting: "Wykrywanie...",
  upload: "Prześlij",
  uploadModel: "Prześlij model",
  view: "Podgląd",
  share: "Udostępnij",
  delete: "Usuń",
  cancel: "Anuluj",
  save: "Zapisz",
  back: "Powrót",
  loadingGeneric: "Ładowanie...",
  refresh: "Odśwież",
  error: "Błąd",
  success: "Sukces",
  close: "Zamknij",
  confirm: "Potwierdź",
  
  // Auth Page
  app_description: "Zaawansowana aplikacja do analizy i wizualizacji plików CAD 3D",
  feature_1_title: "Zaawansowana wizualizacja",
  feature_1_desc: "Przeglądaj i analizuj modele 3D z precyzją i szczegółami",
  feature_2_title: "Bezpieczne udostępnianie",
  feature_2_desc: "Udostępniaj modele klientom i współpracownikom w bezpieczny sposób",
  feature_3_title: "Wsparcie wielu formatów",
  feature_3_desc: "Obsługa formatów STEP, IGES, STL, DXF i DWG",
  
  // Authentication
  login: "Zaloguj się",
  register: "Zarejestruj się",
  create_account_sharing: "Utwórz konto, aby zarządzać swoimi plikami",
  account_created: "Twoje konto zostało pomyślnie utworzone. Jesteś teraz zalogowany.",
  enter_credentials: "Wprowadź dane logowania",
  username: "Nazwa użytkownika",
  username_optional: "Nazwa użytkownika jest opcjonalna",
  password: "Hasło",
  create_account: "Utwórz nowe konto",
  email: "Email",
  full_name: "Imię i nazwisko",
  company: "Firma",
  client_dashboard: "Panel klienta",
  
  // Buttons
  button: {
    upload: "Prześlij",
    cancel: "Anuluj",
    share: "Udostępnij",
    copy: "Skopiowano"
  },
  
  checking: "Sprawdzanie...",
  
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
  uploading_images: "Przesyłanie obrazów...",
  uploadProgress: "Postęp przesyłania",
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
  
  // Measurement and dimensions
  measurement: {
    mode: "Tryb pomiaru",
    instructions: "Kliknij na model, aby zaznaczyć pierwszy punkt pomiaru, a następnie kliknij ponownie, aby zaznaczyć drugi punkt i zmierzyć odległość.",
    points: "Punkty",
    distance: "Odległość",
    units: "jednostek",
    toggle: "Włącz/wyłącz tryb pomiaru"
  },
  
  // Model dimensions
  dimensions: {
    title: "Wymiary modelu",
    width: "Szerokość",
    height: "Wysokość",
    depth: "Głębokość",
    diagonal: "Przekątna"
  },
  
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
  change_password: "Zmień hasło",
  new_password: "Nowe hasło",
  leave_empty_to_remove: "Pozostaw puste, aby usunąć hasło",
  password_updated: "Hasło zaktualizowane",
  password_update_success: "Hasło zostało pomyślnie zaktualizowane",
  password_update_error: "Błąd aktualizacji hasła",
  model_is_password_protected: "Ten model jest chroniony hasłem",
  open_in_browser: "Otwórz w przeglądarce",
  model_deleted: "Model usunięty",
  model_delete_success: "Model został pomyślnie usunięty",
  model_delete_error: "Błąd usuwania modelu",
  delete_model: "Usuń model",
  delete_model_confirmation: "Czy na pewno chcesz usunąć ten model? Tej operacji nie można cofnąć.",
  gallery_images: "Obrazy galerii",
  no_gallery_images: "Brak obrazów w galerii",
  
  // Shared model access
  sharedModel: "Udostępniony model",
  enterPassword: "Wprowadź hasło, aby zobaczyć ten model",
  passwordProtected: "Chroniony hasłem",
  incorrectPassword: "Nieprawidłowe hasło",
  viewSharedModel: "Zobacz udostępniony model",
  modelSharedBy: "Model udostępniony przez",
  
  // Shared page texts
  shared: {
    protected_model: {
      title: "Chroniony model",
      description: "Ten model jest chroniony hasłem.",
      password_placeholder: "Wprowadź hasło do modelu"
    },
    model_info: {}
  },
  
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
  
  // Email in upload modal
  email_autofilled: "Twój adres email zostanie powiązany z tym modelem",
  email_required: "Podaj swój adres email, aby powiązać go z modelem",
  upload_success: "Plik został pomyślnie przesłany",
  upload_failed: "Przesyłanie pliku nie powiodło się",
  
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
  email_already_exists: "Ten adres email jest już zarejestrowany. Proszę się zalogować.",
  warning: "Ostrzeżenie",
  email_exists_warning: "Ten adres email już istnieje w naszym systemie. Proszę się najpierw zalogować.",
  login_button: "Zaloguj się",
  errors: {
    title: "Błąd",
    share: "Błąd podczas udostępniania modelu",
    password_required: "Wymagane hasło",
    required: "jest wymagane",
    model: {
      fetch: "Nie udało się pobrać informacji o modelu",
      access: "Nie udało się uzyskać dostępu do modelu",
      display_failed: "Nie można wyświetlić modelu"
    }
  },
  
  // Loading states
  loadingState: {
    shared_model: "Ładowanie udostępnionego modelu..."
  },
  
  // Actions
  action: {
    back_to_home: "Powrót do strony głównej",
    access: "Uzyskaj dostęp",
    verifying: "Weryfikacja...",
    go_to_app: "Przejdź do aplikacji"
  },
  
  // Success messages
  sharingSaved: "Ustawienia udostępniania zapisane",
  sharingRemoved: "Udostępnianie zostało wyłączone",
  
  // Admin panel
  // DXF Viewer
  dxf: {
    preview: "Podgląd graficzny",
    svg_code: "Kod SVG",
    loading: "Ładowanie podglądu DXF...",
    error_loading: "Błąd ładowania pliku DXF",
    select_model: "Wybierz model DXF do wyświetlenia"
  },
  
  // Library page translations
  library: {
    title: "Biblioteka modeli CAD",
    description: "Przeglądaj i uzyskaj dostęp do publicznie udostępnionych modeli CAD",
    filters: "Filtry",
    searchPlaceholder: "Szukaj po nazwie lub tagu",
    tags: "Tagi",
    viewModel: "Zobacz model",
    noModels: "Nie znaleziono modeli",
    noModelsDescription: "Nie ma publicznych modeli pasujących do Twoich kryteriów wyszukiwania. Spróbuj dostosować filtry lub sprawdź później.",
    error: "Błąd ładowania biblioteki",
    modelNotFound: "Model nie został znaleziony"
  },
  
  // Common pagination texts
  common: {
    page: "Strona",
    previous: "Poprzednia",
    next: "Następna",
    tryAgain: "Spróbuj ponownie",
    error: "Błąd",
    backToLibrary: "Powrót do biblioteki",
    download: "Pobierz",
    reportAbuse: "Zgłoś nadużycie",
    modelInfo: "Informacje o modelu",
    filename: "Nazwa pliku",
    format: "Format",
    filesize: "Rozmiar pliku",
    gallery: "Galeria",
    goBack: "Wróć",
    description: "Opis",
    category: "Kategoria",
    tags: "Tagi"
  },

  // Zgłaszanie nadużyć
  abuse: {
    subtitle: "Zgłoś nieodpowiednie lub obraźliwe treści",
    report_for_model: "Zgłoś nieodpowiednie treści dla modelu",
    report_title: "Zgłoś nieodpowiednie treści",
    form_instruction: "Proszę podać szczegóły dotyczące nieodpowiednich treści, które chcesz zgłosić. Traktujemy wszystkie zgłoszenia poważnie i niezwłocznie je badamy.",
    details_label: "Szczegóły zgłoszenia",
    details_placeholder: "Proszę opisać nieodpowiednie treści. Podaj konkretne szczegóły dotyczące rodzaju treści naruszających nasze wytyczne społeczności (np. obraźliwe obrazy, nieodpowiednie opisy, naruszenie praw autorskich itp.).",
    guidelines_title: "Wytyczne społeczności",
    guidelines_text: "Nie tolerujemy nieodpowiednich, obraźliwych lub naruszających prawa autorskie treści. Wszystkie zgłoszenia są sprawdzane przez nasz zespół moderacyjny i podejmowane są odpowiednie działania.",
    report_sent: "Twoje zgłoszenie nadużycia zostało przesłane. Dziękujemy za pomoc w utrzymaniu bezpiecznej społeczności.",
    submitting: "Wysyłanie zgłoszenia...",
    submit_report: "Wyślij zgłoszenie"
  },
  
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
  },

  // Client dashboard - nowe tłumaczenia
  shared_models: "Twoja Biblioteka CAD",
  shared_models_description: "Zarządzaj przesłanymi i udostępnionymi modelami 3D",
  shared_status: "Status udostępnienia",
  shared_with: "Udostępniono dla",
  last_accessed: "Ostatni dostęp",
  add_to_cad_library: "Dodaj do publicznej biblioteki CAD",
  public_library_added: "Model dodany do publicznej biblioteki",
  public_library_removed: "Model usunięty z publicznej biblioteki",
  public_library_added_message: "Model został pomyślnie dodany do publicznej biblioteki CAD",
  public_library_removed_message: "Model został pomyślnie usunięty z publicznej biblioteki CAD",
  public_cad_library: "Publiczna Biblioteka CAD",
  public_library_description: "Przeglądaj i pobieraj modele CAD udostępnione przez naszą społeczność. Wszystkie modele są darmowe do użytku w Twoich projektach.",
  search_models_tags: "Szukaj modeli i tagów...",
  all_categories: "Wszystkie Kategorie",
  all_tags: "Wszystkie Tagi",
  tags: "Tagi",
  showing_models: "Wyświetlane {count} z {total} modeli",
  no_models_found: "Nie znaleziono modeli",
  try_different_search: "Spróbuj innego terminu wyszukiwania lub wyczyść filtry",
  no_public_models_yet: "Brak publicznych modeli",
  failed_to_load_library: "Błąd podczas ładowania biblioteki. Spróbuj ponownie później.",
  cad_library_dimensions: "Wymiary",
  cad_library_view: "Zobacz",
  cad_library_download: "Pobierz",
  password_protected_public_error: "Nie można dodać modelu chronionego hasłem do publicznej biblioteki. Najpierw usuń udostępnianie prywatne lub usuń hasło.",
  logout: "Wyloguj",
  
  // Przesyłanie miniaturek
  upload_thumbnail: "Prześlij miniaturkę",
  upload_custom_thumbnail: "Prześlij własną miniaturkę",
  upload_thumbnail_description: "Prześlij własną miniaturkę dla '{modelName}'. Obraz zostanie automatycznie przycięty do kwadratu.",
  select_image_file: "Wybierz plik obrazu",
  supported_formats_jpg_png_max_5mb: "Obsługiwane formaty: JPG, PNG. Maksymalny rozmiar: 5MB",
  max_6_photos_at_once: "Maksymalnie 6 zdjęć na raz.",

  // Client dashboard library section
  your_cad_library: "Twoja Biblioteka CAD",
  models_uploaded_to_account: "Modele przesłane na Twoje konto",
  models_count_in_library: "Masz {count} modeli w swojej bibliotece",
  no_models_in_library: "Nie masz jeszcze żadnych modeli w bibliotece",

  // Model description management
  manage_model_description: "Zarządzaj opisem modelu",
  model_description_explanation: "Dodaj opis opisowy dla modelu. System automatycznie przetłumaczy go na wszystkie obsługiwane języki.",
  original_language: "Język oryginalny",
  select_language: "Wybierz język",
  model_description: "Opis modelu",
  enter_model_description_placeholder: "Wprowadź opis opisowy modelu...",
  auto_translation_note: "Opis zostanie automatycznie przetłumaczony na wszystkie obsługiwane języki.",
  available_translations: "Dostępne tłumaczenia",
  google_translate_powered: "Tłumaczenia obsługiwane przez Google Translate API",
  delete_description: "Usuń opis",
  update_description: "Aktualizuj opis",
  save_description: "Zapisz opis",
  description_saved_successfully: "Opis został pomyślnie zapisany i przetłumaczony",
  description_deleted_successfully: "Opis został pomyślnie usunięty",
  description_required: "Opis jest wymagany",
  language_required: "Język jest wymagany",
  add_description: "Dodaj opis",
  expand_details: "Rozwiń szczegóły",
  model_details: "Szczegóły modelu",
  no_category: "Brak kategorii",
  select_category: "Wybierz kategorię",
  preview: "Podgląd",
  original: "Oryginał",
  
  // Tags management
  enter_tags_placeholder: "Wprowadź tagi oddzielone przecinkami",
  save_tags: "Zapisz tagi",
  tags_saved_successfully: "Tagi zostały pomyślnie zapisane i przetłumaczone",
  tags_save_failed: "Nie udało się zapisać tagów",
  tags_help_text: "Wprowadź tagi oddzielone przecinkami. Zostaną automatycznie przetłumaczone na wszystkie języki.",
  cropped_to_square: "Przycięty do kwadratu",
  processing: "Przetwarzanie...",
  thumbnail_uploaded_successfully: "Miniaturka została przesłana pomyślnie",
  thumbnail_upload_failed: "Nie udało się przesłać miniaturki",
  please_select_image_file: "Proszę wybrać plik obrazu",
  file_too_large_5mb: "Plik jest za duży. Maksymalny rozmiar to 5MB",
  image_processing_failed: "Przetwarzanie obrazu nie powiodło się",
  invalid_image_file: "Nieprawidłowy plik obrazu",
  thumbnail_required_for_public: "Miniaturka jest wymagana aby dodać model do publicznej biblioteki. Proszę najpierw przesłać miniaturkę.",
  
  // Galeria zdjęć
  add_gallery: "Galeria plików",
  add_gallery_title: "Prześlij galerię modelu",
  add_gallery_description: "Prześlij do 6 zdjęć dla modelu {modelName}. Pierwsze zdjęcie będzie użyte jako miniaturka.",
  generate_thumbnail: "Generuj miniaturkę",
  generating_thumbnail: "Generowanie...",
  thumbnail_generated_successfully: "Miniaturka została wygenerowana pomyślnie",
  thumbnail_generation_failed: "Generowanie miniaturki nie powiodło się",
  upload_gallery: "Prześlij galerię",
  gallery_uploaded_successfully: "Galeria została przesłana pomyślnie",
  gallery_upload_failed: "Nie udało się przesłać galerii",
  gallery_preview: "Podgląd galerii",
  first_image_thumbnail_note: "Pierwsze zdjęcie będzie użyte jako miniaturka modelu",
  select_image_files: "Wybierz pliki obrazów",
  thumbnail: "Miniaturka",
  active: "Aktywny",
  inactive: "Nieaktywny",
  
  // Zarządzanie galerią
  gallery_management: "Zarządzanie galerią",
  manage_model_gallery: "Zarządzaj galerią dla modelu {modelName}",
  current_thumbnail: "Obecna miniaturka",
  thumbnail_active: "Ta miniaturka jest obecnie aktywna",
  no_thumbnail_set: "Brak miniaturki dla tego modelu",
  upload_new_images: "Prześlij nowe zdjęcia",
  uploaded_images: "Przesłane zdjęcia",
  set_as_thumbnail: "Ustaw jako miniaturkę",
  click_set_thumbnail_note: "Kliknij 'Ustaw jako miniaturkę' na dowolnym zdjęciu, aby ustawić je jako miniaturkę modelu",
  close_gallery: "Zamknij",
  category_required_for_public: "Kategoria jest wymagana aby dodać model do publicznej biblioteki. Najpierw wybierz kategorię.",
  
  // Categories
  category: "Kategoria",

  art: "Sztuka",
  "home-garden": "Dom i Ogród",
  home_garden: "Dom i Ogród",
  architecture: "Architektura",
  gadget: "Gadżety",
  game: "Gry",
  tools: "Narzędzia",

  // Gallery and screenshot functionality
  deleting: "Usuwanie",
  image_deleted_successfully: "Obraz został pomyślnie usunięty",
  image_delete_failed: "Nie udało się usunąć obrazu",
  capture_screenshot: "Przechwyć Zrzut Ekranu",
  screenshot_captured_successfully: "Zrzut ekranu przechwycony i ustawiony jako miniaturka",
  screenshot_capture_failed: "Nie udało się przechwycić zrzutu ekranu",
  screenshot_instructions: "Ustaw idealny kąt widzenia i powiększenie, następnie kliknij przycisk kamery w przeglądarce 3D aby przechwycić zrzut ekranu jako miniaturkę",
  filename: "Nazwa pliku",
  table_actions: "Akcje",
  view_model: "Zobacz Model",
  view_share_link: "Zobacz Link Udostępniania",
  disable_sharing: "Wyłącz Udostępnianie"
};

export default translations;