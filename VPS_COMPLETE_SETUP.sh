#!/bin/bash

# Complete VPS Setup and Fix Script for WhatsApp Integration
# Version: 2.0.0
# Date: 2025-10-15
# Purpose: Fix Chromium browser launch errors and session issues

set -e  # Exit on any error

echo "🚀 =========================================="
echo "🚀 NORD LAUNDRY BOT - ПОЛНАЯ УСТАНОВКА VPS"
echo "🚀 =========================================="
echo ""

# Configuration
BOT_DIR="/var/www/html/nord-laundry-telegram-bot"
BOT_NAME="nord-laundry-bot"

# Check if running as root or with sudo access
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "❌ This script needs sudo access to install system packages"
    echo "💡 Please run with sudo or ensure your user has sudo privileges"
    exit 1
fi

# Step 1: Update system
echo "1️⃣ Updating system packages..."
sudo apt update && sudo apt upgrade -y
echo "✅ System updated"
echo ""

# Step 2: Install Chromium and all dependencies
echo "2️⃣ Installing Chromium browser and dependencies..."
sudo apt install -y \
  chromium-browser \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

echo "✅ Chromium and dependencies installed"
echo ""

# Step 3: Verify Chromium
echo "3️⃣ Verifying Chromium installation..."
CHROMIUM_VERSION=$(chromium-browser --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Chromium installed: $CHROMIUM_VERSION"
    echo "📍 Chromium path: $(which chromium-browser)"
else
    echo "❌ Chromium installation failed"
    exit 1
fi
echo ""

# Step 4: Navigate to bot directory
if [ ! -d "$BOT_DIR" ]; then
    echo "❌ Bot directory not found: $BOT_DIR"
    echo "💡 Please update BOT_DIR variable in this script"
    exit 1
fi

cd "$BOT_DIR"
echo "4️⃣ Working in: $(pwd)"
echo ""

# Step 5: Setup environment
echo "5️⃣ Configuring environment..."
if [ -f ".env" ]; then
    # Update NODE_ENV
    if grep -q "NODE_ENV=" .env; then
        sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
    else
        echo "NODE_ENV=production" >> .env
    fi
    
    # Ensure ENABLE_WHATSAPP is set
    if ! grep -q "ENABLE_WHATSAPP=" .env; then
        echo "ENABLE_WHATSAPP=true" >> .env
    fi
    
    echo "✅ Environment configured"
else
    echo "⚠️ .env file not found - creating from template"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "NODE_ENV=production" >> .env
        echo "ENABLE_WHATSAPP=true" >> .env
        echo "✅ Created .env from template"
        echo "⚠️ PLEASE EDIT .env AND ADD YOUR TOKENS!"
    else
        echo "❌ No .env.example found!"
        exit 1
    fi
fi
echo ""

# Step 6: Create and setup directories
echo "6️⃣ Creating necessary directories..."

# Create tmp directory for Chromium
if [ ! -d "tmp" ]; then
    mkdir -p tmp
    echo "✅ Created tmp directory"
fi
chmod -R 755 tmp/
chown -R $(whoami):$(whoami) tmp/ 2>/dev/null || true

# Setup dist directory permissions
if [ -d "dist" ]; then
    chmod -R 755 dist/
    echo "✅ Set permissions for dist directory"
fi

# Setup node_modules permissions
if [ -d "node_modules" ]; then
    chmod -R 755 node_modules/
    echo "✅ Set permissions for node_modules directory"
fi

echo "✅ Directories configured"
echo ""

# Step 7: Clean old Chromium directories
echo "7️⃣ Cleaning old temporary files..."
if [ -d "tmp" ]; then
    OLD_DIRS=$(find tmp -type d -name "chromium-*" 2>/dev/null | wc -l)
    if [ "$OLD_DIRS" -gt 0 ]; then
        echo "🗑️  Found $OLD_DIRS old Chromium directories"
        find tmp -type d -name "chromium-*" -exec rm -rf {} + 2>/dev/null || true
        echo "✅ Cleaned up old directories"
    else
        echo "✅ No old directories to clean"
    fi
fi
echo ""

# Step 8: Stop existing bot
echo "8️⃣ Stopping existing bot..."
pm2 stop $BOT_NAME 2>/dev/null || echo "⚠️ Bot was not running"
pm2 delete $BOT_NAME 2>/dev/null || echo "⚠️ Bot was not in PM2"
echo ""

# Step 9: Check WhatsApp session
echo "9️⃣ Checking WhatsApp session..."
if [ -d ".wwebjs_auth/session-nord-laundry-whatsapp" ]; then
    echo "✅ WhatsApp session found"
    SESSION_FILES=$(find .wwebjs_auth/session-nord-laundry-whatsapp -type f 2>/dev/null | wc -l)
    echo "📊 Session contains $SESSION_FILES files"
    
    # Set proper permissions
    chmod -R 755 .wwebjs_auth/
    chown -R $(whoami):$(whoami) .wwebjs_auth/ 2>/dev/null || true
    echo "✅ Session permissions set"
else
    echo "⚠️ WhatsApp session not found"
    
    # Try to restore from archive
    if [ -f "whatsapp_auth_latest.tar.gz" ]; then
        echo "📦 Restoring session from archive..."
        tar -xzf whatsapp_auth_latest.tar.gz
        chmod -R 755 .wwebjs_auth/
        chown -R $(whoami):$(whoami) .wwebjs_auth/ 2>/dev/null || true
        echo "✅ Session restored from archive"
    else
        echo "⚠️ No session archive found"
        echo "💡 QR code authorization will be required"
        echo "💡 Upload whatsapp_auth_latest.tar.gz to restore session"
    fi
fi
echo ""

# Step 10: Install/Update Node modules
echo "🔟 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install --production
    echo "✅ Dependencies installed"
else
    echo "❌ package.json not found!"
    exit 1
fi
echo ""

# Step 11: Build TypeScript
echo "1️⃣1️⃣ Building TypeScript..."
if [ -f "tsconfig.json" ]; then
    npm run build
    echo "✅ TypeScript compiled"
else
    echo "⚠️ tsconfig.json not found - skipping build"
fi
echo ""

# Step 12: Setup PM2
echo "1️⃣2️⃣ Setting up PM2..."

# Save PM2 config
pm2 save --force

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami)) || true

echo "✅ PM2 configured"
echo ""

# Step 13: Start the bot
echo "1️⃣3️⃣ Starting bot with PM2..."
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs
    echo "✅ Bot started from ecosystem.config.cjs"
else
    pm2 start bot-runner.mjs --name "$BOT_NAME"
    echo "✅ Bot started directly"
fi

pm2 save
echo ""

# Step 14: Wait for initialization
echo "1️⃣4️⃣ Waiting for bot initialization..."
echo "⏳ Waiting 30 seconds..."
sleep 30
echo ""

# Step 15: Check status
echo "1️⃣5️⃣ Checking bot status..."
echo "=========================================="
pm2 list
echo ""
echo "=========================================="
echo "📊 Recent logs:"
echo "=========================================="
pm2 logs $BOT_NAME --lines 20 --nostream || true
echo ""

# Step 16: Final checks
echo "=========================================="
echo "✅ INSTALLATION COMPLETE!"
echo "=========================================="
echo ""
echo "📊 System Information:"
echo "   • Chromium: $CHROMIUM_VERSION"
echo "   • Node.js: $(node --version)"
echo "   • npm: $(npm --version)"
echo "   • PM2: $(pm2 --version)"
echo "   • Working directory: $(pwd)"
echo ""
echo "📋 Next Steps:"
echo "   1. Monitor logs: pm2 logs $BOT_NAME"
echo "   2. Wait for: ✅ WhatsApp бот готов к работе!"
echo "   3. If QR code appears, scan it with WhatsApp"
echo "   4. Test by sending a WhatsApp message"
echo "   5. Verify message appears in Telegram group"
echo ""
echo "🔧 Useful Commands:"
echo "   • View logs: pm2 logs $BOT_NAME"
echo "   • Restart bot: pm2 restart $BOT_NAME"
echo "   • Stop bot: pm2 stop $BOT_NAME"
echo "   • View status: pm2 status"
echo "   • Clean tmp: ./cleanup-chromium-dirs.sh"
echo ""
echo "🆘 If Issues Occur:"
echo "   • Check errors: pm2 logs $BOT_NAME --err --lines 50"
echo "   • Verify .env: cat .env"
echo "   • Check session: ls -la .wwebjs_auth/"
echo "   • Clean restart: pm2 delete $BOT_NAME && pm2 start ecosystem.config.cjs"
echo ""
echo "=========================================="
