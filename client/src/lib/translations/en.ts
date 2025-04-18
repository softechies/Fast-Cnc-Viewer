// English translations

const translations = {
  // Common UI elements
  appTitle: "CAD Viewer",
  applicationName: "CAD Viewer",
  cad_viewer: "CAD Viewer",
  powered_by: "Powered by",
  home: "Home",
  
  // Authentication
  login: "Log In",
  register: "Register",
  create_account_sharing: "Create an account to manage your files",
  enter_credentials: "Enter your credentials to log in",
  username: "Username",
  password: "Password",
  create_account: "Create a new account",
  email: "Email",
  full_name: "Full Name",
  company: "Company",
  client_dashboard: "Client Dashboard",
  
  // Auth Page
  app_description: "A comprehensive web application for advanced 3D CAD file analysis and visualization",
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
    copy: "Copied"
  },
  
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
  sendEmail: "Send email notification",
  emailSent: "Email sent",
  emailNotSent: "Email could not be sent",
  
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
  
  // Layout
  app: {
    footer: "CAD Viewer - © 2025 All rights reserved"
  },

  // Headers
  header: {
    error: "Error",
    shared: {
      model: "Shared model"
    }
  },

  // Error messages
  genericError: "Something went wrong",
  connectionError: "Connection error",
  fileNotSupported: "File format not supported",
  fileTooLarge: "File is too large",
  invalidPassword: "Invalid password",
  invalidEmail: "Invalid email address",
  
  // Specific error messages
  errors: {
    title: "Error",
    share: "Error sharing model",
    password_required: "Password required",
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
  }
};

export default translations;