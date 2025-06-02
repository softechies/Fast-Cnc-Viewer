# Deployment Guide

## Cloud Platform Deployment

### Prerequisites
- Node.js 18+ runtime
- PostgreSQL database
- Python 3.x runtime
- Domain name (optional)

### Environment Variables Setup

Configure the following environment variables in your cloud platform:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your_db_host
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_db_name

# Session Secret (Required - generate random string)
SESSION_SECRET=your_random_session_secret

# AWS S3 (Optional - for cloud file storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_bucket_name

# Email SMTP (Required for sharing features)
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@yourdomain.com

# Google Translate API (Optional - for multilingual features)
GOOGLE_TRANSLATE_API_KEY=your_translate_api_key
```

### Database Setup

1. **Create PostgreSQL database**
2. **Run database migration**:
```bash
npm run db:push
```

3. **Setup initial categories** (optional):
```bash
psql $DATABASE_URL -f setup_categories.sql
```

### Build and Deploy

1. **Install dependencies**:
```bash
npm ci
```

2. **Build production bundle**:
```bash
npm run build
```

3. **Start production server**:
```bash
npm start
```

### Platform-Specific Instructions

#### AWS Elastic Beanstalk
1. Create Elastic Beanstalk application
2. Upload project as ZIP file
3. Configure environment variables in EB console
4. Deploy

#### Google Cloud Platform
1. Create App Engine project
2. Configure app.yaml with environment variables
3. Deploy with `gcloud app deploy`

#### Heroku
1. Create Heroku app
2. Add PostgreSQL addon
3. Set environment variables via Heroku CLI
4. Deploy via Git push

#### DigitalOcean App Platform
1. Create new app from GitHub repository
2. Configure environment variables
3. Set build and run commands
4. Deploy

#### Railway
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically

### Post-Deployment Checklist

- [ ] Database connection working
- [ ] File uploads functional
- [ ] Email notifications working
- [ ] 3D model viewing operational
- [ ] Thumbnail generation working
- [ ] Authentication system functional
- [ ] HTTPS enabled
- [ ] Domain configured (if applicable)

### Monitoring and Maintenance

- Monitor application logs
- Set up database backups
- Monitor storage usage (S3 or local)
- Update dependencies regularly
- Monitor email delivery rates

### Troubleshooting

#### Common Issues:

1. **Database Connection Failed**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database server is running

2. **File Upload Issues**
   - Check storage permissions
   - Verify S3 credentials (if using cloud storage)
   - Check file size limits

3. **Email Not Sending**
   - Verify SMTP credentials
   - Check email provider settings
   - Test with different email provider

4. **3D Models Not Loading**
   - Ensure Python dependencies installed
   - Check file format support
   - Verify thumbnail generation

### Security Considerations

- Use HTTPS in production
- Set strong SESSION_SECRET
- Regularly update dependencies
- Monitor access logs
- Implement rate limiting if needed
- Secure database access