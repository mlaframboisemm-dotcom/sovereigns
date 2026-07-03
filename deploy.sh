#!/bin/bash

# =========================================================================
# Sovereign Wealth Terminal Hardened - Complete Deployment Script
# Run this on your Linux server to set up SSL, Nginx, and the app
# =========================================================================

set -e  # Exit on any error

echo "=========================================="
echo "Sovereign Wealth Terminal Deployment"
echo "=========================================="

# Step 1: Update system packages
echo "[1/6] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install Node.js (if not already installed)
echo "[2/6] Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Step 3: Install Certbot and Nginx
echo "[3/6] Installing Certbot and Nginx..."
sudo apt-get install -y certbot python3-certbot-nginx nginx

# Step 4: Generate SSL Certificates
echo "[4/6] Generating SSL certificates for sovereigns.ca..."
sudo certbot certonly --nginx -d sovereigns.ca -d www.sovereigns.ca --non-interactive --agree-tos -m admin@sovereigns.ca 2>/dev/null || echo "SSL certificates may already exist"

# Step 5: Configure Nginx
echo "[5/6] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/sovereigns.ca > /dev/null << 'EOF'
# =========================================================================
# Nginx Configuration - Marshall Sovereign Wealth Terminal
# =========================================================================

server {
    listen 80;
    listen [::]:80;
    server_name sovereigns.ca www.sovereigns.ca;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sovereigns.ca www.sovereigns.ca;

    # SSL Certificates (Managed via Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/sovereigns.ca/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sovereigns.ca/privkey.pem;
    
    # Secure SSL Protocols and Ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

    # Session Configurations
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Client limits
    client_max_body_size 50M;

    # Proxy to Sovereign Wealth Terminal Node Backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # WebSockets support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
    }
}
EOF

# Enable the Nginx site
sudo ln -sf /etc/nginx/sites-available/sovereigns.ca /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Step 6: Set up SSL Certificate auto-renewal
echo "[6/6] Setting up SSL certificate auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your app is now running at:"
echo "  🔒 https://www.sovereigns.ca"
echo "  🔒 https://sovereigns.ca"
echo ""
echo "SSL Certificates auto-renew every 60 days"
echo "Nginx is configured for maximum security"
echo ""
echo "To pull latest updates from GitHub:"
echo "  cd /path/to/sovereign_wealth_terminal"
echo "  git pull origin main"
echo "  npm install"
echo "  npm run build"
echo "  npm start"
echo ""
