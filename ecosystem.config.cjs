module.exports = {
  apps: [
    {
      name: 'nord-laundry-bot',
      script: './bot-runner.mjs',
      cwd: '/var/www/html/nord-laundry-telegram-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_GROUP_CHAT_ID: process.env.TELEGRAM_GROUP_CHAT_ID,
        ENABLE_WHATSAPP: 'true'
      },
      error_file: '/var/log/pm2/nord-laundry-bot-err.log',
      out_file: '/var/log/pm2/nord-laundry-bot-out.log',
      log_file: '/var/log/pm2/nord-laundry-bot.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'nord-laundry-webhook',
      script: './webhook-server.mjs',
      cwd: '/var/www/html/nord-laundry-telegram-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WEBHOOK_SECRET: 'your-secret-key-here',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_GROUP_CHAT_ID: process.env.TELEGRAM_GROUP_CHAT_ID,
        ENABLE_WHATSAPP: 'true'
      },
      error_file: '/var/log/pm2/nord-laundry-webhook-err.log',
      out_file: '/var/log/pm2/nord-laundry-webhook-out.log',
      log_file: '/var/log/pm2/nord-laundry-webhook.log',
      time: true,
      merge_logs: true
    }
  ]
};