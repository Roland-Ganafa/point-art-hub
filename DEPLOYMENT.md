# Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Create production Supabase project
- [ ] Set up production environment variables
- [ ] Configure production domain in Supabase Auth settings
- [ ] Set up SSL certificate (handled by most hosting platforms)

### 2. Database Setup
- [ ] Run `database_setup.sql` in production Supabase project
- [ ] Verify all tables and functions are created
- [ ] Test database connections and permissions
- [ ] Set up database backups (Supabase handles this automatically)

### 3. Security Configuration
- [ ] Review and update RLS policies if needed
- [ ] Configure Supabase Auth providers (email, social login)
- [ ] Set up proper CORS settings in Supabase
- [ ] Review user roles and permissions

### 4. Performance Optimization
- [ ] Enable Supabase connection pooling if needed
- [ ] Configure caching strategies
- [ ] Optimize images and assets
- [ ] Enable compression in hosting platform

## 🚀 Deployment Platforms

### Vercel (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project root
vercel

# 4. Set environment variables in Vercel dashboard
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Netlify
```bash
# 1. Build the project
npm run build --prefix "./point-art-hub-main"

# 2. Deploy dist folder to Netlify
# 3. Set environment variables in Netlify dashboard
```

### Custom Server (Ubuntu/CentOS)
```bash
# 1. Install Node.js and npm
sudo apt update
sudo apt install nodejs npm

# 2. Clone and build project
git clone <your-repo>
cd point-art-hub-main
npm install
npm run build

# 3. Serve with nginx or serve
npm install -g serve
serve -s dist -l 3000

# 4. Set up reverse proxy with nginx
# 5. Configure SSL with Let's Encrypt
```

## 🔧 Production Environment Variables

Create `.env.production` file:
```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_ENV=production
VITE_APP_NAME=Point Art Hub
```

## 🗄️ Database Migration Commands

```sql
-- 1. First, run the main setup script
-- Copy content from database_setup.sql

-- 2. If migrating from development, export data
-- Use Supabase dashboard's table export feature

-- 3. Import data to production
-- Use Supabase dashboard's table import feature

-- 4. Verify data integrity
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM stationery) as stationery_count,
  (SELECT COUNT(*) FROM gift_store) as gift_store_count;
```

## 🔒 Security Best Practices

### Supabase Configuration
1. **Row Level Security**: Ensure all tables have RLS enabled
2. **Auth Settings**: Configure allowed origins and redirect URLs
3. **API Keys**: Never expose service_role key in client-side code
4. **Rate Limiting**: Enable in Supabase project settings

### Application Security
1. **Input Validation**: All forms have proper validation
2. **Role Permissions**: Admin-only functions are protected
3. **Data Sanitization**: User inputs are sanitized
4. **Error Handling**: No sensitive data in error messages

## 📊 Monitoring and Maintenance

### Supabase Dashboard Monitoring
- Database performance metrics
- API usage and rate limits
- User authentication logs
- Error logs and alerts

### Application Monitoring
```javascript
// Add error tracking (optional)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

### Regular Maintenance
- [ ] Monitor database size and performance
- [ ] Review user access and permissions monthly
- [ ] Update dependencies regularly
- [ ] Backup critical business data
- [ ] Monitor application performance

## 🆘 Troubleshooting Production Issues

### Common Issues:

#### "Failed to fetch" errors:
- Check CORS settings in Supabase
- Verify environment variables
- Check network connectivity

#### Authentication issues:
- Verify redirect URLs in Supabase Auth
- Check domain configuration
- Review RLS policies

#### Performance issues:
- Enable Supabase connection pooling
- Optimize database queries
- Check for memory leaks

### Debug Commands:
```bash
# Check environment variables
echo $VITE_SUPABASE_URL

# Verify build
npm run build

# Test production build locally
npm run preview
```

## 📞 Support

For deployment issues:
1. Check Supabase status page
2. Review hosting platform documentation
3. Check application logs
4. Verify database connectivity

---

**Ready for Production! 🚀**