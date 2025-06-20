const translations = {
  // Basic navigation and interface
  home: "Inicio",
  about: "Acerca de",
  contact: "Contacto",
  login: "Iniciar sesión",
  logout: "Cerrar sesión",
  register: "Registrarse",
  back: "Volver",
  close: "Cerrar",
  save: "Guardar",
  cancel: "Cancelar",
  delete: "Eliminar",
  edit: "Editar",
  view: "Ver",
  download: "Descargar",
  upload: "Subir",
  loading: "Cargando...",
  error: "Error",
  success: "Éxito",
  warning: "Advertencia",
  info: "Información",
  confirm: "Confirmar",
  yes: "Sí",
  no: "No",
  ok: "OK",
  next: "Siguiente",
  previous: "Anterior",
  search: "Buscar",
  reset: "Restablecer",
  refresh: "Actualizar",
  submit: "Enviar",
  create: "Crear",
  update: "Actualizar",
  remove: "Eliminar",
  add: "Añadir",
  
  // File management
  file: "Archivo",
  files: "Archivos",
  filename: "Nombre del archivo",
  file_size: "Tamaño del archivo",
  file_type: "Tipo de archivo",
  format: "Formato",
  // Auth Page
  app_description: "Plataforma completamente gratuita para visualizar archivos CAD. Almacena modelos STL, STEP, DXF y DWG directamente en tu navegador. Comparte archivos protegidos con contraseña y navega modelos CAD desde cualquier lugar.",
  app_title: "Visor Profesional de Archivos CAD",
  upload_file: "Subir archivo",
  select_file: "Seleccionar archivo",
  drag_drop_files: "Arrastra y suelta archivos aquí o haz clic para seleccionar",
  supported_formats: "Formatos Soportados",
  max_file_size: "Tamaño máximo del archivo",
  
  // Authentication
  username: "Nombre de usuario",
  email: "Correo electrónico",
  password: "Contraseña",
  confirm_password: "Confirmar contraseña",
  forgot_password: "¿Olvidaste tu contraseña?",
  remember_me: "Recordarme",
  sign_in: "Iniciar sesión",
  sign_up: "Registrarse",
  sign_out: "Cerrar sesión",
  create_account: "Crear cuenta",
  already_have_account: "¿Ya tienes una cuenta?",
  dont_have_account: "¿No tienes una cuenta?",
  
  // Dashboard
  dashboard: "Panel de control",
  my_models: "Mis modelos",
  my_files: "Mis archivos",
  recent_uploads: "Subidas recientes",
  storage_used: "Almacenamiento usado",
  total_models: "Total de modelos",
  public_models: "Modelos públicos",
  private_models: "Modelos privados",
  shared_models: "Modelos compartidos",
  
  // Model viewer
  model_viewer: "Visor de modelos",
  view_model: "Ver modelo",
  model_info: "Información del modelo",
  model_details: "Detalles del modelo",
  model_properties: "Propiedades del modelo",

  material: "Material",
  created_at: "Creado el",
  updated_at: "Actualizado el",
  author: "Autor",
  description: "Descripción",
  
  // 3D Viewer controls
  zoom_in: "Acercar",
  zoom_out: "Alejar",
  rotate: "Rotar",
  pan: "Panorámica",
  reset_view: "Restablecer vista",
  wireframe: "Estructura alámbrica",
  solid: "Sólido",
  shaded: "Sombreado",
  fit_to_screen: "Ajustar a pantalla",
  
  // File upload
  upload_model: "Subir modelo",
  choose_files: "Elegir archivos",
  upload_progress: "Progreso de subida",
  upload_complete: "Subida completa",
  upload_failed: "Error en la subida",
  file_too_large: "Archivo demasiado grande",
  invalid_file_type: "Tipo de archivo no válido",
  upload_in_progress: "Subida en progreso...",
  
  // Sharing
  share: "Compartir",
  share_model: "Compartir modelo",
  sharing_options: "Opciones de compartir",
  public_link: "Enlace público",
  private_link: "Enlace privado",
  share_via_email: "Compartir por correo",
  copy_link: "Copiar enlace",
  link_copied: "Enlace copiado",
  generate_link: "Generar enlace",
  access_level: "Nivel de acceso",
  view_only: "Solo vista",
  download_allowed: "Descarga permitida",
  
  // Error messages
  file_not_found: "Archivo no encontrado",
  access_denied: "Acceso denegado",
  invalid_credentials: "Credenciales no válidas",
  network_error: "Error de red",
  server_error: "Error del servidor",
  upload_error: "Error de subida",
  processing_error: "Error de procesamiento",
  
  // Success messages
  file_uploaded: "Archivo subido exitosamente",
  model_saved: "Modelo guardado",
  settings_updated: "Configuración actualizada",
  link_generated: "Enlace generado",
  email_sent: "Correo enviado",
  
  // Settings
  settings: "Configuración",
  account_settings: "Configuración de cuenta",
  profile: "Perfil",
  preferences: "Preferencias",
  language: "Idioma",
  theme: "Tema",
  notifications: "Notificaciones",
  privacy: "Privacidad",
  security: "Seguridad",
  
  // Common actions
  open: "Abrir",
  import: "Importar",
  export: "Exportar",
  copy: "Copiar",
  paste: "Pegar",
  cut: "Cortar",
  undo: "Deshacer",
  redo: "Rehacer",
  select_all: "Seleccionar todo",
  clear: "Limpiar",
  
  // Time and dates
  today: "Hoy",
  yesterday: "Ayer",
  last_week: "Semana pasada",
  last_month: "Mes pasado",
  never: "Nunca",
  
  // File formats
  step_files: "Archivos STEP",
  stl_files: "Archivos STL",
  dxf_files: "Archivos DXF",
  iges_files: "Archivos IGES",
  
  // Application specific
  cad_viewer: "Visor CAD",
  model_library: "Biblioteca de modelos",
  file_converter: "Conversor de archivos",
  batch_processing: "Procesamiento por lotes",
  
  // Library section
  library: {
    title: "Biblioteca CAD",
    description: "Explora y gestiona tu colección de modelos CAD"
  },
  
  // Company/brand specific
  welcome_message: "Bienvenido al Visor CAD",
  
  // Header and navigation
  header: "Encabezado",
  menu: "Menú",
  sidebar: "Barra lateral",
  footer: "Pie de página",
  breadcrumb: "Ruta de navegación",
  
  // Model management
  model_name: "Nombre del modelo",
  model_type: "Tipo de modelo",
  model_version: "Versión del modelo",
  model_status: "Estado del modelo",
  upload_date: "Fecha de subida",
  file_format: "Formato de archivo",
  
  // Workspace and collaboration
  workspace: "Espacio de trabajo",
  project: "Proyecto",
  folder: "Carpeta",
  organize: "Organizar",
  sort_by: "Ordenar por",
  filter_by: "Filtrar por",
  group_by: "Agrupar por",
  
  // Viewer controls and tools
  tools: "Herramientas",
  measure: "Medir",
  annotate: "Anotar",
  section: "Sección",
  explode: "Explotar",
  assembly: "Ensamblaje",
  parts: "Piezas",
  
  // Export and printing
  print: "Imprimir",
  print_preview: "Vista previa de impresión",
  export_options: "Opciones de exportación",
  quality: "Calidad",
  resolution: "Resolución",
  
  // Help and support
  help: "Ayuda",
  documentation: "Documentación",
  tutorials: "Tutoriales",
  support: "Soporte",
  contact_support: "Contactar soporte",
  report_bug: "Reportar error",
  feedback: "Comentarios",
  
  // Admin functionality
  admin: "Administrador",
  admin_panel: "Panel de administrador",
  user_management: "Gestión de usuarios",
  system_settings: "Configuración del sistema",
  logs: "Registros",
  analytics: "Analíticas",
  
  // Responsive and mobile
  mobile_view: "Vista móvil",
  desktop_view: "Vista de escritorio",
  responsive: "Responsivo",
  
  // Notifications and alerts
  notification: "Notificación",
  alert: "Alerta",
  message: "Mensaje",
  inbox: "Bandeja de entrada",
  unread: "No leído",
  
  // Search and filtering
  search_results: "Resultados de búsqueda",
  no_results: "Sin resultados",
  advanced_search: "Búsqueda avanzada",
  filter: "Filtro",
  sort: "Ordenar",
  
  // CAD Library Page
  public_cad_library: "Biblioteca Pública CAD",
  public_library_description: "Navega y descarga modelos CAD compartidos por nuestra comunidad. Todos los modelos son gratuitos para usar en tus proyectos.",
  search_models_tags: "Buscar modelos y etiquetas...",
  all_categories: "Todas las Categorías",
  all_tags: "Todas las Etiquetas",
  tags: "Etiquetas",
  showing_models: "Mostrando {count} de {total} modelos",
  no_models_found: "No se encontraron modelos",
  try_different_search: "Prueba un término de búsqueda diferente o limpia los filtros",
  no_public_models_yet: "Aún no hay modelos públicos disponibles",
  cad_library_view: "Ver",
  cad_library_download: "Descargar",

  failed_to_load_library: "Error al cargar la biblioteca",
  
  // Categories
  category: "Categoría",
  select_category: "Seleccionar categoría",
  no_category: "Sin categoría",
  art: "Arte",
  "home-garden": "Hogar y Jardín",
  architecture: "Arquitectura",
  gadget: "Gadgets",
  game: "Juegos",
  
  // Model upload and management
  category_required_for_public: "Se requiere una categoría para agregar este modelo a la biblioteca pública. Por favor selecciona una categoría primero.",
  thumbnail_required_for_public: "Se requiere una miniatura para agregar este modelo a la biblioteca pública. Por favor sube una miniatura primero.",
  
  // Contact and support
  contact_us: "Contáctanos",
  send_message: "Enviar mensaje",
  your_name: "Tu nombre",
  your_email: "Tu correo electrónico",
  your_message: "Tu mensaje",
  subject: "Asunto",
  phone: "Teléfono",
  company: "Empresa",
  
  // Common UI elements
  actions: "Acciones",
  status: "Estado",
  active: "Activo",
  inactive: "Inactivo",
  enabled: "Habilitado",
  disabled: "Deshabilitado",
  public: "Público",
  private: "Privado",
  shared: "Compartido",
  
  // Time and date formatting
  date: "Fecha",
  time: "Hora",
  datetime: "Fecha y hora",
  created: "Creado",
  modified: "Modificado",
  accessed: "Accedido",
  
  // File operations
  rename: "Renombrar",
  move: "Mover",
  duplicate: "Duplicar",
  compress: "Comprimir",
  decompress: "Descomprimir",
  convert: "Convertir",
  
  // Model sharing and collaboration
  share_with: "Compartir con",
  shared_with_you: "Compartido contigo",
  collaboration: "Colaboración",
  comments: "Comentarios",
  revisions: "Revisiones",
  version_history: "Historial de versiones",
  
  // System and technical
  system: "Sistema",
  version: "Versión",
  build: "Compilación",
  environment: "Entorno",
  configuration: "Configuración",
  maintenance: "Mantenimiento",
  
  // Gallery and thumbnails
  gallery: "Galería",
  thumbnail: "Miniatura",
  thumbnails: "Miniaturas",
  preview: "Vista previa",
  full_size: "Tamaño completo",
  
  // Model information
  model_id: "ID del modelo",
  file_path: "Ruta del archivo",
  checksum: "Suma de verificación",
  metadata: "Metadatos",

  // Missing translations from logs
  noPreviousFiles: "No hay archivos anteriores",
  supportedFormats: "Formatos soportados",
  "library.title": "Biblioteca CAD",
  "library.description": "Explora nuestra colección de modelos CAD",
  client_dashboard: "Panel del Cliente",
  "button.upload": "Subir",
  "button.cancel": "Cancelar",
  "button.share": "Compartir",
  "message.no.model": "No hay modelos disponibles",
  "message.share.warning": "Advertencia al compartir",
  email_autofilled: "Correo electrónico completado automáticamente",
  email_required: "Correo electrónico requerido",
  "header.error": "Error en cabecera",
  "common.gallery": "Galería",
  // Dimensions object structure
  dimensions: {
    title: "Dimensiones",
    width: "Ancho",
    height: "Alto",
    depth: "Profundidad"
  },
  mode: "Modo",

  // Alternative keys without dots for nested structure
  library_title: "Biblioteca CAD",
  library_description: "Explora nuestra colección de modelos CAD",

  message_share_warning: "Advertencia al compartir",
  header_error: "Error en cabecera",
  common_gallery: "Galería",
  dimensions_title: "Dimensiones",
  dimensions_width: "Ancho",
  dimensions_height: "Alto",
  dimensions_depth: "Profundidad",

  // Common elements
  common: {
    backToLibrary: "Volver a la biblioteca",
    download: "Descargar",
    reportAbuse: "Reportar abuso",
    modelInfo: "Información del modelo",
    gallery: "Galería",
    filename: "Nombre del archivo",
    format: "Formato",
    filesize: "Tamaño del archivo",
    tags: "Etiquetas"
  },

  // Services section translations
  services: {
    title: "Servicios CNC",
    laser_cutting: "Corte láser",
    laser_description: "Tu proyecto 2D es ideal para realizar mediante corte láser. Ofrecemos corte láser preciso de chapas metálicas, plásticos y otros materiales.",
    get_quote: "Solicitar presupuesto",
    cnc_machining: "Mecanizado CNC",
    cnc_description: "Tu modelo 3D está listo para producción. Ofrecemos servicios profesionales de torneado y fresado CNC con la máxima precisión y calidad.",
    manufacturing: "Servicios de manufactura",
    manufacturing_description: "Realizaremos tu proyecto de producción de A a Z. Contáctanos para discutir los detalles y recibir un presupuesto personalizado.",
    our_services: "Nuestros servicios de producción",
    laser_details: "Corte preciso de chapa metálica, plásticos y otros materiales con precisión de hasta 0,05 mm. Ideal para piezas 2D.",
    cnc_milling: "Fresado CNC",
    milling_details: "Mecanizado por arranque de virutas de materiales como aluminio, acero, plásticos. Ideal para formas complejas 3D.",
    cnc_turning: "Torneado CNC",
    turning_details: "Mecanizado preciso de piezas rotativas de metal. Ideal para ejes, casquillos, piezas de máquinas con precisión de hasta 0,01 mm.",
    prototyping: "Prototipado",
    prototyping_details: "Ejecución rápida de prototipos y pequeñas series de producción. Del diseño al elemento terminado en pocos días.",
    contact_us: "Contáctanos"
  },

  // Client dashboard translations
  upload_thumbnail: "Subir miniatura",
  shared_status: "Estado compartido",
  last_accessed: "Último acceso",
  add_to_cad_library: "Agregar a biblioteca CAD",
  view_share_link: "Ver enlace compartido",
  change_password: "Cambiar contraseña",
  disable_sharing: "Deshabilitar compartir",
  enable_sharing: "Habilitar compartir",
  new_password: "Nueva contraseña",
  leave_empty_to_remove: "Dejar vacío para eliminar",
  delete_model: "Eliminar modelo",
  delete_model_confirmation: "¿Estás seguro de que deseas eliminar este modelo?",
  shareLink: "Enlace compartido",
  open_in_browser: "Abrir en navegador",
  add_gallery: "Agregar galería",
  generate_thumbnail: "Generar miniatura",
  back_to_home: "Volver al inicio",
  welcome: "Bienvenido",
  shared_models_description: "Gestiona tus modelos compartidos",

  // Gallery management
  gallery_management: "Gestión de galería",
  manage_model_gallery: "Gestionar galería del modelo",
  current_thumbnail: "Miniatura actual",
  no_thumbnail_set: "Sin miniatura establecida",
  upload_new_images: "Subir nuevas imágenes",
  supported_formats_jpg_png_max_5mb: "Formatos soportados: JPG, PNG (máx. 5MB)",
  max_6_photos_at_once: "Máximo 6 fotos a la vez.",

  // Client dashboard library section
  your_cad_library: "Tu Biblioteca CAD",
  models_uploaded_to_account: "Modelos subidos a tu cuenta",
  models_count_in_library: "Tienes {count} modelos en tu biblioteca",
  no_models_in_library: "Aún no tienes modelos en tu biblioteca",
  gallery_images: "Imágenes de galería",
  no_gallery_images: "Sin imágenes en galería",
  click_set_thumbnail_note: "Haz clic en una imagen para establecerla como miniatura",
  close_gallery: "Cerrar galería",

  // Additional missing translations
  set_as_thumbnail: "Establecer como miniatura",
  thumbnail_active: "Miniatura activa",
  
  // Tags and description management
  save_tags: "Guardar etiquetas",
  tags_help_text: "Ingrese etiquetas separadas por comas. Se traducirán automáticamente a todos los idiomas.",
  model_description: "Descripción del modelo",
  save_description: "Guardar descripción",
  auto_translation_note: "La descripción se traducirá automáticamente a todos los idiomas compatibles.",
  
  // Gallery management
  select_image_files: "Seleccionar archivos de imagen",
  images_in_gallery: "imágenes en la galería",
  capture_screenshot: "Capturar pantalla",
  uploaded_images: "Imágenes subidas",
  screenshot_instructions: "Posicione el modelo 3D como desee y haga clic en el botón para capturar una captura de pantalla para la galería",
  
  // Upload modal translations
  upload_and_share: "Subir y Compartir",
  drag_drop_file: "Arrastra y suelta tu archivo aquí",
  or_click_to_browse: "o haz clic para explorar",
  selected_file: "Archivo seleccionado",
  file_verification: "Verificación de archivo",
  uploading: "Subiendo...",
  email_for_notifications: "Email para notificaciones",
  enter_email_address: "Ingresa tu dirección de email",
  checking_email: "Verificando email...",
  email_exists_create_account: "Este email ya existe. ¿Crear cuenta?",
  create_new_account: "Crear nueva cuenta",
  use_existing_account: "Usar cuenta existente",
  username_placeholder: "Nombre de usuario",
  full_name_placeholder: "Nombre completo",
  company_placeholder: "Empresa (opcional)",
  register_and_upload: "Registrar y Subir",
  
  // Share dialog translations
  enable_model_sharing: "Habilitar compartir modelo",
  password_protection: "Protección con contraseña",
  optional_password: "Contraseña (opcional)",
  expiry_date: "Fecha de vencimiento",
  select_expiry_date: "Seleccionar fecha de vencimiento",
  recipient_email: "Email del destinatario",
  enter_recipient_email: "Ingresa el email del destinatario",
  share_link_generated: "Enlace de compartir generado",
  send_notification: "Enviar notificación",
  sharing_enabled: "Compartir habilitado",
  sharing_disabled: "Compartir deshabilitado",
  update_sharing: "Actualizar compartir",
  
  // Category and tags update messages
  category_updated: "Categoría Actualizada",
  category_updated_successfully: "La categoría del modelo ha sido actualizada exitosamente",
  category_update_failed: "No se pudo actualizar la categoría del modelo",
  tags_updated: "Etiquetas Actualizadas",
  tags_updated_successfully: "Las etiquetas del modelo han sido actualizadas exitosamente",
  tags_update_failed: "No se pudieron actualizar las etiquetas del modelo",
  description_saved_successfully: "Descripción guardada exitosamente"
};

export default translations;