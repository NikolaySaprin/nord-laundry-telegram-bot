#!/bin/bash

# WhatsApp Dependencies Installation Script for VPS
# Version: 1.4.1
# Date: 2025-10-13

echo "🔧 Installing WhatsApp dependencies on VPS..."
echo "=============================================="
echo ""

# Check if running as root or with sudo access
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "❌ This script needs sudo access to install system packages"
    echo "💡 Please run with sudo or ensure your user has sudo privileges"
    exit 1
fi

# Update package list
echo "1️⃣ Updating package list..."
sudo apt update

# Install Chromium and all dependencies
echo ""
echo "2️⃣ Installing Chromium and dependencies..."
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

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Verify Chromium installation
echo ""
echo "3️⃣ Verifying Chromium installation..."
CHROMIUM_VERSION=$(chromium-browser --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Chromium installed: $CHROMIUM_VERSION"
else
    echo "❌ Chromium installation failed"
    exit 1
fi

# Navigate to bot directory
BOT_DIR="/var/www/html/nord-laundry-telegram-bot"
if [ ! -d "$BOT_DIR" ]; then
    echo "❌ Bot directory not found: $BOT_DIR"
    echo "💡 Please update BOT_DIR variable in this script"
    exit 1
fi

cd "$BOT_DIR"
echo "📁 Working in: $(pwd)"

# Set NODE_ENV to production
echo ""
echo "4️⃣ Setting NODE_ENV to production..."
if [ -f ".env" ]; then
    if grep -q "NODE_ENV=" .env; then
        sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
        echo "✅ Updated NODE_ENV in .env file"
    else
        echo "NODE_ENV=production" >> .env
        echo "✅ Added NODE_ENV to .env file"
    fi
else
    echo "NODE_ENV=production" > .env
    echo "✅ Created .env file with NODE_ENV=production"
fi

# Stop the bot
echo ""
echo "5️⃣ Stopping current bot instance..."
pm2 stop nord-laundry-bot || echo "⚠️ Bot was not running"

# Check if session exists
echo ""
echo "6️⃣ Checking WhatsApp session..."
if [ -d ".wwebjs_auth/session-nord-laundry-whatsapp" ]; then
    echo "✅ WhatsApp session found"
    SESSION_FILES=$(find .wwebjs_auth/session-nord-laundry-whatsapp -type f | wc -l)
    echo "📊 Session contains $SESSION_FILES files"
else
    echo "⚠️ WhatsApp session not found"
    
    # Try to restore from archive
    if [ -f "whatsapp_auth_latest.tar.gz" ]; then
        echo "📦 Restoring session from archive..."
        tar -xzf whatsapp_auth_latest.tar.gz
        if [ $? -eq 0 ]; then
            echo "✅ Session restored from archive"
        else
            echo "❌ Failed to restore session from archive"
        fi
    else
        echo "⚠️ No session archive found - QR authorization will be required"
    fi
fi

# Set proper permissions for session
if [ -d ".wwebjs_auth" ]; then
    echo "🔐 Setting proper permissions for session..."
    chmod -R 755 .wwebjs_auth/
    chown -R $(whoami):$(whoami) .wwebjs_auth/ 2>/dev/null || true
    echo "✅ Permissions set"
fi

# Create and set permissions for tmp directory
echo ""
echo "📁 Setting up temporary directories..."
if [ ! -d "tmp" ]; then
    mkdir -p tmp
    echo "✅ Created tmp directory"
fi
chmod -R 755 tmp/ 2>/dev/null || true
chown -R $(whoami):$(whoami) tmp/ 2>/dev/null || true
echo "✅ Temporary directory permissions set"

# Clean up old Chromium directories
if [ -d "tmp" ]; then
    OLD_DIRS=$(find tmp -type d -name "chromium-*" -mmin +60 2>/dev/null | wc -l)
    if [ "$OLD_DIRS" -gt 0 ]; then
        echo "🗑️  Cleaning up $OLD_DIRS old Chromium directories..."
        find tmp -type d -name "chromium-*" -mmin +60 -exec rm -rf {} + 2>/dev/null || true
        echo "✅ Old directories cleaned"
    fi
fi

# Restart the bot
echo ""
echo "7️⃣ Starting bot..."
pm2 restart nord-laundry-bot || pm2 start ecosystem.config.cjs

if [ $? -eq 0 ]; then
    echo "✅ Bot restarted successfully"
else
    echo "❌ Failed to restart bot"
    exit 1
fi

# Wait a moment for initialization
echo ""
echo "8️⃣ Waiting for bot initialization (30 seconds)..."
sleep 30

# Check logs
echo ""
echo "9️⃣ Checking bot status..."
echo "==========================================="
pm2 logs nord-laundry-bot --lines 15 --nostream | tail -15

echo ""
echo "==========================================="
echo "✅ Installation complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Check logs: pm2 logs nord-laundry-bot"
echo "   2. Wait for: ✅ WhatsApp бот готов к работе!"
echo "   3. Test by sending WhatsApp message"
echo "   4. Verify message appears in Telegram"
echo ""
echo "🔍 Verify installation:"
echo "   • Chromium: $(chromium-browser --version 2>/dev/null || echo 'Not installed')"
echo "   • NODE_ENV: $(grep NODE_ENV .env 2>/dev/null || echo 'Not set')"
echo "   • Bot status: $(pm2 list | grep nord-laundry-bot | awk '{print $10}' || echo 'Unknown')"
echo ""
echo "🆘 If issues persist:"
echo "   • Check: pm2 logs nord-laundry-bot --err"
echo "   • Verify: ls -la .wwebjs_auth/"
echo "   • Review: VPS_DEPENDENCIES_FIX.md"
echo ""