// English translations

const translations = {
  // Services section translations
  services: {
    title: 'CNC Services',
    laser_cutting: 'Laser Cutting',
    laser_description: 'Your 2D project is perfect for laser cutting. We offer precise laser cutting of sheet metal, plastics and other materials.',
    get_quote: 'Request a quote',
    cnc_machining: 'CNC Machining',
    cnc_description: 'Your 3D model is ready for production. We offer professional CNC turning and milling services with the highest precision and quality.',
    manufacturing: 'Manufacturing Services',
    manufacturing_description: "We'll implement your production project from A to Z. Contact us to discuss details and receive an individual quote.",
    our_services: 'Our Manufacturing Services',
    laser_details: 'Precise cutting of sheet metal, plastics and other materials with accuracy up to 0.05 mm. Ideal for 2D parts.',
    cnc_milling: 'CNC Milling',
    milling_details: 'Machining of materials such as aluminum, steel, plastics. Ideal for complex 3D shapes.',
    cnc_turning: 'CNC Turning',
    turning_details: 'Precise machining of rotary parts from metal. Ideal for shafts, bushings, machine parts with accuracy up to 0.01 mm.',
    prototyping: 'Prototyping',
    prototyping_details: 'Quick production of prototypes and small production series. From design to finished element in a few days.',
    contact_us: 'Contact us',
  },
  // Common UI elements
  appTitle: "CAD Viewer",
  applicationName: "CAD Viewer",
  cad_viewer: "CAD Viewer",
  powered_by: "Powered by",
  home: "Home",
  back_to_home: "Back to Home",
  language_detecting: "Detecting...",
  
  // Authentication
  login: "Log In",
  logout: "Log Out",
  register: "Register",
  create_account_sharing: "Create an account to manage your files",
  account_created: "Your account has been created successfully. You are now logged in.",
  enter_credentials: "Enter your credentials to log in",
  username: "Username",
  username_optional: "Username is optional",
  password: "Password",
  create_account: "Create a new account",
  email: "Email",
  full_name: "Full Name",
  company: "Company",
  client_dashboard: "Client Dashboard",
  
  // Auth Page
  app_description: "Completely free platform for viewing CAD files. Store STL, STEP, DXF and DWG models directly in your browser. Share files secured with password protection and browse CAD models from anywhere.",
  app_title: "Professional CAD File Viewer",
  supported_formats: "Supported Formats",
  upload_file: "Upload File",
  feature_1_title: "Advanced Visualization",
  feature_1_desc: "View and analyze 3D models with precision and detail",
  feature_2_title: "Secure Sharing",
  feature_2_desc: "Share your models securely with clients and collaborators",
  feature_3_title: "Cross-Format Support",
  feature_3_desc: "Support for STEP, IGES, STL, DXF, and DWG formats",
  upload: "Upload",
  uploadModel: "Upload Model",
  view: "View",
  share: "Share",
  delete: "Delete",
  cancel: "Cancel",
  save: "Save",
  back: "Back",
  loadingGeneric: "Loading...",
  refresh: "Refresh",
  error: "Error",
  success: "Success",
  close: "Close",
  confirm: "Confirm",
  
  // Buttons
  button: {
    upload: "Upload",
    cancel: "Cancel",
    share: "Share",
    copy: "Copied",
    back: "Back to Home"
  },
  
  checking: "Checking...",
  
  // Home page
  welcome: "Welcome to CAD Viewer",
  welcomeMessage: "Upload a CAD file to get started",
  recentModels: "Recent Models",
  noModels: "No models found. Upload a CAD file to get started.",
  noPreviousFiles: "No previous files",
  
  // Upload modal
  dropFileHere: "Drop your CAD file here",
  dragAndDrop: "Drag and drop your file here, or click to browse",
  selectFile: "Select File",
  uploadingModel: "Uploading model...",
  uploadProgress: "Upload progress",
  uploadComplete: "Upload complete",
  uploadFailed: "Upload failed",
  supportedFormats: "Supported formats: STEP, IGES, STL, DXF, DWG",
  processingFile: "Processing file...",
  
  // Model viewer
  modelInfo: "Model Info",
  modelInformation: "Model Information",
  modelTree: "Model Tree",
  components: "Components",
  part: "Part",
  parts: "Parts",
  assembly: "Assembly",
  assemblies: "Assemblies",
  surfaces: "Surfaces",
  solids: "Solids",
  viewControls: "View Controls",
  rotate: "Rotate",
  pan: "Pan",
  zoom: "Zoom",
  fitToView: "Fit to View",
  modelDetails: "Model Details",
  format: "Format",
  fileSize: "File Size",
  created: "Created",
  createdDate: "Creation Date",
  mode: "Mode",
  fileType: "File Type",
  modelEntities: "Model Entities",
  modelNotFound: "Model not found",
  errorLoadingModel: "Error loading model",
  
  // Measurement and dimensions
  measurement: {
    mode: "Measurement Mode",
    instructions: "Click on the model to mark the first measurement point, then click again to mark the second point and measure the distance.",
    points: "Points",
    distance: "Distance",
    units: "units",
    toggle: "Toggle measurement mode"
  },
  
  // Model dimensions
  dimensions: {
    title: "Model Dimensions",
    width: "Width",
    height: "Height",
    depth: "Depth",
    diagonal: "Diagonal"
  },
  
  // Sharing
  shareModel: "Share Model",
  shareTitle: "Share this CAD model",
  shareDescription: "Share this model with others via email",
  recipientEmail: "Recipient Email",
  shareWithPassword: "Share with password",
  sharePassword: "Password",
  generatePassword: "Generate Password",
  setExpiry: "Set expiry date",
  expiryDate: "Expiry Date",
  shareLink: "Share Link",
  copyLink: "Copy Link",
  linkCopied: "Link copied",
  enableSharing: "Enable Sharing",
  disableSharing: "Disable Sharing",
  sharingEnabled: "Sharing enabled",
  sharingDisabled: "Sharing disabled",
  sharing_enabled: "Sharing Enabled",
  sharing_disabled: "Sharing Disabled",
  sharing_enabled_success: "Model has been shared successfully",
  sharing_disabled_success: "Model is no longer shared",
  sharing_error: "Error updating sharing status",
  sendEmail: "Send email notification",
  emailSent: "Email sent",
  emailNotSent: "Email could not be sent",
  
  // Client dashboard
  shared_models: "Your CAD Library",
  shared_models_description: "Manage your uploaded and shared 3D models",
  filename: "Filename",
  shared_with: "Shared With",
  status: "Status",
  shared_status: "Shared Status",
  last_accessed: "Last Accessed",
  add_to_cad_library: "Add to Public CAD Library",
  public_library_added: "Model added to public library",
  public_library_removed: "Model removed from public library",
  public_library_added_message: "Model has been successfully added to the public CAD library",
  public_library_removed_message: "Model has been successfully removed from the public CAD library",
  public_cad_library: "Public CAD Library",
  public_library_description: "Browse and download CAD models shared by our community. All models are free to use for your projects.",
  search_models_tags: "Search models and tags...",
  all_categories: "All Categories",
  all_tags: "All Tags",
  tags: "Tags",
  showing_models: "Showing {count} of {total} models",
  no_models_found: "No models found",
  try_different_search: "Try a different search term or clear filters",
  no_public_models_yet: "No public models available yet",
  failed_to_load_library: "Failed to load library. Please try again later.",
  cad_library_dimensions: "Dimensions",
  cad_library_view: "View",
  cad_library_download: "Download",
  password_protected_public_error: "Cannot add password-protected model to public library. Please remove private sharing or remove password first.",
  active: "Active",
  inactive: "Inactive",
  
  // Gallery upload translations
  add_gallery: "File Gallery",
  add_gallery_title: "Upload Model Gallery",
  add_gallery_description: "Upload up to 6 images for model {modelName}. The first image will be used as thumbnail.",
  generate_thumbnail: "Generate Thumbnail",
  generating_thumbnail: "Generating...",
  thumbnail_generated_successfully: "Thumbnail generated successfully",
  thumbnail_generation_failed: "Thumbnail generation failed",
  upload_gallery: "Upload Gallery",
  gallery_uploaded_successfully: "Gallery uploaded successfully",
  gallery_upload_failed: "Failed to upload gallery",
  gallery_preview: "Gallery Preview",
  first_image_thumbnail_note: "The first image will be used as the model thumbnail",
  select_image_files: "Select Image Files",
  thumbnail: "Thumbnail",
  
  // Gallery modal translations
  gallery_management: "Gallery Management",
  model_details: "Model Details",
  manage_model_gallery: "Manage gallery for model {modelName}",
  current_thumbnail: "Current Thumbnail",
  thumbnail_active: "This thumbnail is currently active",
  no_thumbnail_set: "No thumbnail set for this model",
  upload_new_images: "Upload New Images",
  uploaded_images: "Uploaded Images",
  set_as_thumbnail: "Set as Thumbnail",
  click_set_thumbnail_note: "Click 'Set as Thumbnail' on any image to make it the model's thumbnail",
  thumbnail_updated_successfully: "Thumbnail updated successfully",
  uploading_images: "Uploading images...",
  close_gallery: "Close",
  deleting: "Deleting",
  image_deleted_successfully: "Image deleted successfully",
  image_delete_failed: "Failed to delete image",
  capture_screenshot: "Capture Screenshot",
  screenshot_captured_successfully: "Screenshot captured and set as thumbnail",
  screenshot_capture_failed: "Failed to capture screenshot",
  screenshot_instructions: "Set the perfect view angle and zoom, then click the camera button in the 3D viewer to capture a screenshot as thumbnail",
  gallery_images: "Gallery Images",
  no_gallery_images: "No gallery images available",
  images_uploaded_to_gallery: "Images uploaded to gallery",
  new_thumbnail_set: "New thumbnail has been set",
  image_removed_from_gallery: "Image removed from gallery",
  images_in_gallery: "images in gallery",
  view_model: "View Model",
  view_share_link: "View Share Link",
  enable_sharing: "Share Model",
  disable_sharing: "Stop Sharing",
  change_model_color: "Change Model Color",
  custom_color: "Custom Color",
  validation_error: "Validation Error",
  public_library_requirements: "To add model to public library, it must have: thumbnail, description, and at least one tag",
  open_link: "Open Link",
  no_models: "No Models Found",
  no_models_description: "Upload your first model to get started",
  change_password: "Change Password",
  new_password: "New Password",
  leave_empty_to_remove: "Leave empty to remove password",
  password_updated: "Password Updated",
  password_update_success: "Password has been successfully updated",
  password_update_error: "Error updating password",
  model_is_password_protected: "This model is password protected",
  open_in_browser: "Open in Browser",
  model_deleted: "Model Deleted",
  model_delete_success: "Model has been successfully deleted",
  model_delete_error: "Error deleting model",
  delete_model: "Delete Model",
  delete_model_confirmation: "Are you sure you want to delete this model? This action cannot be undone.",
  
  // Tags and description management
  save_tags: "Save Tags",
  tags_saved_successfully: "Tags have been successfully saved and translated",
  tags_save_failed: "Failed to save tags",
  description_save_failed: "Failed to save description",
  tags_help_text: "Enter tags separated by commas. They will be automatically translated to all languages.",
  enter_tags_placeholder: "Enter tags separated by commas",
  enter_model_description_placeholder: "Enter model description...",
  model_description: "Model Description",
  select_language: "Select Language",
  
  // Shared model access
  sharedModel: "Shared Model",
  enterPassword: "Enter password to view this model",
  passwordProtected: "Password protected",
  incorrectPassword: "Incorrect password",
  viewSharedModel: "View shared model",
  modelSharedBy: "Model shared by",
  
  // Shared page texts
  shared: {
    protected_model: {
      title: "Protected Model",
      description: "This model is password protected.",
      password_placeholder: "Enter model password"
    },
    model_info: {
      shared_status: "Shared model"
    }
  },
  
  // Messages
  message: {
    no: {
      model: "Drop file here or click to browse"
    },
    loading: "Please wait, processing your file",
    delete: {
      warning: "Are you sure you want to delete this model? This action cannot be undone.",
      success: "Model deleted successfully"
    },
    share: {
      warning: "Are you sure you want to share this model?",
      success: "Model shared successfully",
      copied: "Share link copied to clipboard"
    },
    revocation: {
      sent: "Email notification sent to"
    },
    password: {
      required: "Password not required"
    }
  },
  
  // Labels
  label: {
    file: "Selected file",
    verification: "Verification in progress",
    shared: {
      model: "shared model"
    },
    password: "Password",
    "password.share": "Password protected",
    "password.share.placeholder": "Enter password for sharing",
    expiry: "Expiry date",
    email: "Email",
    "email.placeholder": "Enter recipient email"
  },
  
  // Email in upload modal
  email_autofilled: "Your email address will be associated with this model",
  email_required: "Please provide your email to associate with this model",
  upload_success: "File uploaded successfully",
  upload_failed: "File upload failed",
  
  // Layout
  app: {
    footer: "CAD Viewer - © 2025 All rights reserved"
  },

  // Headers
  header: {
    error: "Error",
    shared: {
      model: "Shared model"
    },
    no: {
      model: "The requested model was not found or is not available."
    }
  },

  // Error messages
  genericError: "Something went wrong",
  connectionError: "Connection error",
  fileNotSupported: "File format not supported",
  fileTooLarge: "File is too large",
  invalidPassword: "Invalid password",
  invalidEmail: "Invalid email address",
  email_already_exists: "This email is already registered. Please log in instead.",
  warning: "Warning",
  email_exists_warning: "This email already exists in our system. Please log in first.",
  login_button: "Log in",
  
  // Specific error messages
  errors: {
    title: "Error",
    share: "Error sharing model",
    password_required: "Password required",
    required: "is required",
    model: {
      fetch: "Failed to fetch model information",
      access: "Failed to access the model",
      display_failed: "Cannot display the model"
    }
  },
  
  // Loading states
  loadingState: {
    shared_model: "Loading shared model..."
  },
  
  // Actions
  actions: {
    back_to_home: "Back to home page",
    access: "Access",
    verifying: "Verifying...",
    go_to_app: "Go to application"
  },
  action: {
    back_to_home: "Back to home page",
    access: "Access",
    verifying: "Verifying...",
    go_to_app: "Go to application"
  },
  
  // Success messages
  sharingSaved: "Sharing settings saved",
  sharingRemoved: "Sharing has been disabled",
  
  // Delete share page
  deleteShare: {
    title: "Delete Model Sharing",
    description: "Confirm deletion of shared model link",
    confirmMessage: "Are you sure you want to delete this shared model link? This action cannot be undone and the model will no longer be accessible to others.",
    confirm: "Delete Share",
    cancel: "Cancel",
    deleting: "Deleting...",
    successTitle: "Sharing Deleted",
    successMessage: "The shared model link has been successfully deleted and is no longer accessible.",
    errorTitle: "Deletion Failed",
    unknownError: "An unknown error occurred during deletion.",
    connectionError: "Connection error. Please try again later.",
    invalidToken: "Invalid or expired security token.",
    backToHome: "Back to Home"
  },
  
  // Admin panel
  // DXF Viewer
  dxf: {
    preview: "Graphical Preview",
    svg_code: "SVG Code",
    loading: "Loading DXF preview...",
    error_loading: "Error loading DXF file",
    select_model: "Select a DXF model to display"
  },
  
  // Library page translations
  library: {
    title: "CAD Model Library",
    description: "Browse and access publicly shared CAD models",
    filters: "Filters",
    searchPlaceholder: "Search by name or tag",
    tags: "Tags",
    viewModel: "View Model",
    noModels: "No Models Found",
    noModelsDescription: "There are no public models matching your search criteria. Try adjusting your filters or check back later.",
    error: "Error loading library",
  },
  
  // Common pagination texts
  common: {
    page: "Page",
    previous: "Previous",
    next: "Next",
    tryAgain: "Try Again",
    error: "Error",
    backToLibrary: "Back to Library",
    download: "Download",
    reportAbuse: "Report Abuse",
    modelInfo: "Model Information",
    filename: "Filename",
    format: "Format",
    filesize: "File Size",
    gallery: "Gallery",
    goBack: "Go Back",
    description: "Description",
    category: "Category",
    tags: "Tags"
  },

  // Abuse reporting translations
  abuse: {
    subtitle: "Report inappropriate or offensive content",
    report_for_model: "Report inappropriate content for model",
    report_title: "Report Inappropriate Content",
    form_instruction: "Please provide details about the inappropriate content you wish to report. We take all reports seriously and will investigate promptly.",
    details_label: "Report Details",
    details_placeholder: "Please describe the inappropriate content. Include specific details about what type of content violates our community guidelines (e.g., offensive imagery, inappropriate descriptions, copyright infringement, etc.).",
    details_required: "Report details are required",
    guidelines_title: "Community Guidelines",
    guidelines_text: "We do not tolerate inappropriate, offensive, or copyrighted content. All reports are reviewed by our moderation team and appropriate action will be taken.",
    report_sent: "Your abuse report has been submitted. Thank you for helping us maintain a safe community.",
    submitting: "Submitting Report...",
    submit_report: "Submit Report"
  },
  
  admin: {
    loginTitle: "Admin Panel Login",
    loginDescription: "Enter your credentials to access the admin panel",
    username: "Username",
    usernamePlaceholder: "admin",
    password: "Password",
    loginButton: "Log In",
    loggingIn: "Logging in...",
    dashboardTitle: "Admin Dashboard",
    sharedModelsTitle: "Shared Models",
    sharedModelsDescription: "Manage all shared model links in the system",
    refresh: "Refresh",
    logout: "Log Out",
    notAuthenticated: "Not Authenticated",
    pleaseLogin: "Please log in to access the admin panel",
    loadError: "Error Loading Data",
    unknownError: "An unknown error occurred",
    linkCopied: "Link Copied",
    linkCopiedDescription: "Link has been copied to clipboard",
    sharingRevoked: "Sharing Revoked",
    sharingRevokedDescription: "The model sharing has been successfully disabled",
    revokeError: "Error Revoking Sharing",
    loggedOut: "Logged Out",
    loggedOutDescription: "You have been successfully logged out",
    filename: "Filename",
    format: "Format",
    sharedWith: "Shared With",
    createdDate: "Created",
    lastAccessed: "Last Accessed",
    expiryDate: "Expiry Date",
    passwordProtection: "Password",
    actions: "Actions",
    shareLink: "Link",
    shareLinkTitle: "Share Link",
    openLink: "Open Link",
    revoke: "Revoke",
    protected: "Protected",
    notProtected: "Not Protected",
    noSharedModels: "No shared models found",
    revokeConfirmTitle: "Confirm Revocation",
    revokeConfirmDescription: "Are you sure you want to revoke sharing for this model? This action cannot be undone.",
    cancel: "Cancel",
    confirmRevoke: "Yes, Revoke"
  },

  // Thumbnail upload
  upload_thumbnail: "Upload Thumbnail",
  upload_custom_thumbnail: "Upload Custom Thumbnail",
  upload_thumbnail_description: "Upload a custom thumbnail image for '{modelName}'. The image will be automatically cropped to a square format.",
  select_image_file: "Select Image File",
  supported_formats_jpg_png_max_5mb: "Supported formats: JPG, PNG. Maximum size: 5MB",
  max_6_photos_at_once: "Maximum 6 photos at once.",

  // Client dashboard library section
  your_cad_library: "Your CAD Library",
  models_uploaded_to_account: "Models you have uploaded to your account",
  models_count_in_library: "You have {count} models in your library",
  no_models_in_library: "You have no models in your library yet",

  // Model description management
  manage_model_description: "Manage Model Description",
  model_description_explanation: "Add a descriptive text for the model. The system will automatically translate it to all supported languages.",
  original_language: "Original Language",
  auto_translation_note: "The description will be automatically translated to all supported languages.",
  available_translations: "Available Translations",
  google_translate_powered: "Translations powered by Google Translate API",
  delete_description: "Delete Description",
  update_description: "Update Description",
  save_description: "Save Description",
  description_saved_successfully: "Description saved and translated successfully",
  description_deleted_successfully: "Description deleted successfully",
  description_required: "Description is required",
  language_required: "Language is required",
  add_description: "Add Description",
  preview: "Preview",
  original: "Original",
  cropped_to_square: "Cropped to Square",
  processing: "Processing...",
  thumbnail_uploaded_successfully: "Thumbnail uploaded successfully",
  thumbnail_upload_failed: "Failed to upload thumbnail",
  please_select_image_file: "Please select an image file",
  file_too_large_5mb: "File is too large. Maximum size is 5MB",
  image_processing_failed: "Image processing failed",
  invalid_image_file: "Invalid image file",
  thumbnail_required_for_public: "A thumbnail is required to add this model to the public library. Please upload a thumbnail first.",
  category_required_for_public: "A category is required to add this model to the public library. Please select a category first.",
  
  // Categories
  category: "Category",
  select_category: "Select category",
  no_category: "No category",
  art: "Art",
  "home-garden": "Home & Garden",
  home_garden: "Home & Garden",
  architecture: "Architecture",
  gadget: "Gadget",
  game: "Game",
  tools: "Tools",
  
  // Category and tags update messages
  category_updated: "Category Updated",
  category_updated_successfully: "Model category has been updated successfully",
  category_update_failed: "Failed to update model category",
  tags_updated: "Tags Updated", 
  tags_updated_successfully: "Model tags have been updated successfully",
  tags_update_failed: "Failed to update model tags"
};

export default translations;