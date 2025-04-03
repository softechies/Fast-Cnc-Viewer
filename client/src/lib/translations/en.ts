// English translations

const translations = {
  // Common UI elements
  appTitle: "CAD Viewer",
  applicationName: "CAD Viewer",
  home: "Home",
  upload: "Upload",
  uploadModel: "Upload Model",
  view: "View",
  share: "Share",
  delete: "Delete",
  cancel: "Cancel",
  save: "Save",
  back: "Back",
  loading: "Loading...",
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
    back: "Back to main page",
    view: "View model",
    delete: "Delete"
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
  
  // Messages
  message: {
    no: {
      model: "Drop file here or click to browse"
    },
    loading: "Please wait, processing your file",
    delete: {
      warning: "This action is irreversible. The shared link will stop working and an email notification will be sent if an email was provided."
    },
    password: {
      required: "This model requires a password to view"
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
    footer: "CAD Viewer - © 2025 All rights reserved",
    goto: "Go to application"
  },
  
  // Model sharing
  model: {
    share: {
      password: "Password required",
      revoke: "Revoke access",
      warning: "Are you sure?"
    }
  },

  // Error messages
  genericError: "Something went wrong",
  connectionError: "Connection error",
  fileNotSupported: "File format not supported",
  fileTooLarge: "File is too large",
  invalidPassword: "Invalid password",
  invalidEmail: "Invalid email address",
  
  // Success messages
  sharingSaved: "Sharing settings saved",
  sharingRemoved: "Sharing has been disabled"
};

export default translations;