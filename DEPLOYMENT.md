# 🔒 Deployment Guide - Sovereign Wealth Terminal Hardened

## Quick Start

Your app is already running at **www.sovereigns.ca**. To complete the security setup with SSL and Nginx:

## Automatic Deploy on Git Push

Pushes to `main` now support automatic deployment through GitHub Actions.

Workflow file:
- `.github/workflows/deploy-production.yml`

Required GitHub repository secrets:
- `DEPLOY_HOST`: Server IP or hostname
- `DEPLOY_USER`: SSH username
- `DEPLOY_SSH_KEY`: Private SSH key for that server user
- `DEPLOY_PATH`: Absolute path to your app on server (example: `/var/www/sovereigns`)
- `DEPLOY_PORT` (optional): SSH port (defaults to `22`)
- `DEPLOY_RESTART_COMMAND` (optional): Custom restart command (example: `sudo systemctl restart sovereigns`)

What happens on each push to `main`:
1. Connects to your server via SSH.
2. Pulls latest code from `origin/main`.
3. Runs `npm ci` and `npm run build`.
4. Restarts the app using custom command, PM2, or systemd fallback.

If the workflow fails, your running production app remains on the previous successful deployment.

### On Your Linux Server:

1. **Clone or pull the latest code:**
```bash
cd /path/to/sovereign_wealth_terminal
git pull origin main
```

2. **Run the deployment script:**
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

This will automatically:
- ✅ Install Node.js (if needed)
- ✅ Install Certbot and Nginx
- ✅ Generate free SSL certificates from Let's Encrypt
- ✅ Configure Nginx with security headers
- ✅ Set up automatic certificate renewal
- ✅ Enable HTTPS for www.sovereigns.ca

### What's Configured

**SSL/TLS Security:**
- TLSv1.2 and TLSv1.3
- Strong ciphers (ECDHE, DHE)
- Auto-renewal via Certbot (every 60 days)
- HSTS enabled for 2 years

**Nginx Security Headers:**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Content-Security-Policy enabled
- Strict-Transport-Security enabled

**Firestore Database:**
- User isolation enforced at database level
- Each user can only access their own data
- Rules in `firestore.rules`

### Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx nginx nodejs npm

# 2. Generate SSL certificates
sudo certbot certonly --nginx -d sovereigns.ca -d www.sovereigns.ca

# 3. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/sovereigns.ca
sudo ln -s /etc/nginx/sites-available/sovereigns.ca /etc/nginx/sites-enabled/

# 4. Test and restart
sudo nginx -t
sudo systemctl restart nginx

# 5. Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Starting the Application

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start the server
npm start

# Or use PM2 for production (optional)
npm run start:pm2
```

### Monitoring

```bash
# Check Nginx status
sudo systemctl status nginx

# View SSL certificate info
sudo certbot certificates

# Check application logs
tail -f logs/*.log
```

### Security Checklist

- ✅ Firestore rules enforce user isolation
- ✅ SSL/TLS encryption (HTTPS)
- ✅ Security headers configured
- ✅ Nginx proxy setup
- ✅ Auto-renewal enabled
- ✅ Strong ciphers only

## Troubleshooting

**SSL certificate errors:**
```bash
sudo certbot renew --dry-run
sudo certbot renew --force-renewal
```

**Nginx not starting:**
```bash
sudo nginx -t  # Check for configuration errors
sudo journalctl -u nginx  # View logs
```

**Port 80/443 in use:**
```bash
sudo lsof -i :80
sudo lsof -i :443
```

## Support

Your repository is at: https://github.com/mlaframboisemm-dotcom/Sovereign_Wealth_Terminal_Hardened

All changes are tracked in Git for easy deployment and rollback.
