# 🚀 Production Deployment Guide

## Overview
This guide will help you deploy the Village Machaan booking system to production with enterprise-grade security, performance, and monitoring.

## Prerequisites

### 1. Server Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 50GB SSD
- **Recommended**: 4 CPU cores, 8GB RAM, 100GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 2. Domain & SSL
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- DNS records pointing to your server

### 3. External Services
- Supabase project
- Razorpay account
- Email service (EmailJS or similar)
- Monitoring service (Sentry, DataDog, etc.)

## Quick Start (Docker)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd village-machaan-booking
cp env.production.example .env.local
```

### 2. Configure Environment
Edit `.env.local` with your production values:
```bash
nano .env.local
```

### 3. Deploy
```bash
# Install dependencies
npm install

# Build and deploy
npm run deploy:production
```

## Manual Deployment

### 1. Server Setup

#### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Application Setup

#### Clone Repository
```bash
cd /var/www
sudo git clone <your-repo> village-machaan
sudo chown -R $USER:$USER village-machaan
cd village-machaan
```

#### Install Dependencies
```bash
npm install
npm run build
```

### 3. Database Setup

#### PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
CREATE DATABASE village_machaan;
CREATE USER village_machaan_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE village_machaan TO village_machaan_user;
\q
```

#### Redis
```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass your_redis_password
sudo systemctl restart redis
```

### 4. SSL Certificate

#### Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. Nginx Configuration

#### Create Site Config
```bash
sudo nano /etc/nginx/sites-available/village-machaan
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/village-machaan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Process Management

#### PM2 Setup
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'village-machaan',
    script: 'backend/server-production.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Monitoring Setup

### 1. Application Monitoring

#### Sentry Integration
```bash
# Install Sentry
npm install @sentry/node @sentry/react

# Configure in your app
```

#### Health Checks
```bash
# Create health check script
nano health-check.sh
```

```bash
#!/bin/bash
curl -f http://localhost:3001/api/health || exit 1
```

```bash
chmod +x health-check.sh
```

### 2. Server Monitoring

#### Install Monitoring Tools
```bash
# Install htop, iotop, etc.
sudo apt install htop iotop nethogs -y

# Install monitoring agent (example: DataDog)
DD_API_KEY=your_api_key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

## Security Hardening

### 1. Firewall Setup
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2Ban
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

### 3. Security Headers
Add to your Nginx config:
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Backup Strategy

### 1. Database Backup
```bash
# Create backup script
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump village_machaan > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +7 -delete
```

### 2. Application Backup
```bash
# Create app backup script
nano backup-app.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/app_$DATE.tar.gz /var/www/village-machaan
find /backups -name "app_*.tar.gz" -mtime +7 -delete
```

### 3. Automated Backups
```bash
# Add to crontab
crontab -e
```

```bash
# Daily backups at 2 AM
0 2 * * * /path/to/backup-db.sh
0 2 * * * /path/to/backup-app.sh
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Add indexes
CREATE INDEX CONCURRENTLY idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX CONCURRENTLY idx_bookings_villa ON bookings(villa_id);
CREATE INDEX CONCURRENTLY idx_availability_villa_date ON availability(villa_id, date);

-- Analyze tables
ANALYZE bookings;
ANALYZE availability;
ANALYZE villas;
```

### 2. Caching
```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
```

### 3. CDN Setup
- Configure CloudFlare or similar CDN
- Enable caching for static assets
- Set up image optimization

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs village-machaan

# Check environment variables
pm2 show village-machaan

# Restart application
pm2 restart village-machaan
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U village_machaan_user -d village_machaan
```

#### 3. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues

#### 1. High Memory Usage
```bash
# Check memory usage
free -h
htop

# Restart application
pm2 restart village-machaan
```

#### 2. Slow Database Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Maintenance

### Daily Tasks
- Check application logs
- Monitor server resources
- Verify backups

### Weekly Tasks
- Update dependencies
- Review security logs
- Performance analysis

### Monthly Tasks
- Security updates
- Database maintenance
- Backup testing

## Scaling

### Horizontal Scaling
1. Add more application servers
2. Configure load balancer
3. Use database read replicas
4. Implement Redis clustering

### Vertical Scaling
1. Increase server resources
2. Optimize database configuration
3. Add more caching layers

## Support

For production support:
- Email: support@villagemachaan.com
- Documentation: [Your Docs URL]
- Monitoring: [Your Monitoring URL]

---

**Note**: This is a comprehensive production deployment guide. Adjust configurations based on your specific requirements and infrastructure.










