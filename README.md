# FastCNC CAD Viewer

A cutting-edge web application for advanced 3D CAD file analysis and visualization, with robust multilingual support and dynamic user experience enhancements.

## Features

### Core Technologies
- **React frontend** with TypeScript
- **Three.js** for advanced 3D rendering
- **OpenCascade.js** for DXF/DWG file parsing
- **Express.js backend** with AWS S3 integration
- **PostgreSQL** with Drizzle ORM
- **Comprehensive mobile-friendly** file upload and validation systems
- **Multilingual support** (English, Polish, Spanish, Czech, German, French)
- **Advanced thumbnail generation** for 3D file formats
- **Secure anonymous reporting system**

### Key Features
- **3D Model Viewing**: Support for STL, STEP, DXF, and DWG file formats
- **Public CAD Library**: Browse and share models publicly
- **Client Dashboard**: Private model management with sharing capabilities
- **Multilingual Tagging System**: Automatic translation of tags and descriptions
- **Gallery System**: Upload multiple images for each model
- **Secure File Sharing**: Password-protected links with expiration dates
- **Admin Panel**: Complete administration interface
- **S3 Integration**: Cloud storage for models and thumbnails
- **Email Notifications**: SMTP support for sharing notifications

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Python 3.x (for thumbnail generation)
- AWS S3 bucket (optional, for cloud storage)

### Environment Variables
Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your_bucket

# Email (SMTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@yourdomain.com

# Google Translate API (for multilingual features)
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
```

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/glyzwinski/fastcnc-viewer.git
cd fastcnc-viewer
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup database**
```bash
npm run db:push
```

4. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

5. **Start development server**
```bash
npm run dev
```

## File Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and translations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express.js backend
│   ├── routes.ts           # API endpoints
│   ├── auth.ts             # Authentication logic
│   ├── storage.ts          # Database operations
│   ├── s3-service.ts       # AWS S3 integration
│   └── *.py                # Python scripts for file processing
├── shared/                 # Shared TypeScript types
└── uploads/                # Local file storage
```

## Supported File Formats

- **STL**: 3D models for viewing and analysis
- **STEP/STP**: Advanced 3D CAD models
- **DXF**: 2D technical drawings
- **DWG**: AutoCAD drawings

## API Endpoints

### Public API
- `GET /api/public/models` - Browse public models
- `GET /api/public/models/:publicId` - Get specific public model
- `GET /api/categories` - Get all categories

### Client API (Authenticated)
- `GET /api/client/models` - Get user's private models
- `POST /api/models/upload-stl` - Upload new model
- `PUT /api/models/:id/sharing` - Configure model sharing

### Admin API (Admin only)
- `GET /api/admin/models` - Manage all models
- `DELETE /api/admin/models/:id` - Delete models

## Deployment

### Environment Setup
1. Configure production database
2. Set up AWS S3 bucket
3. Configure SMTP email service
4. Set all environment variables

### Production Build
```bash
npm run build
npm start
```

## Development

### Database Migrations
```bash
npm run db:push
```

### Adding Translations
Edit files in `client/src/lib/translations/` for each supported language.

### Thumbnail Generation
The system automatically generates thumbnails for uploaded models using Python scripts.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## Support

For issues and questions, please open a GitHub issue.