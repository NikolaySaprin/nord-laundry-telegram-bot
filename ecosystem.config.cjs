// PM2 конфигурация для Nord Laundry Bot
// Использование: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    // Основной бот (Telegram + WhatsApp)
    {
      name: 'nord-laundry-bot',
      script: './bot-runner.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ENABLE_WHATSAPP: 'true'
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    
    // Webhook сервер для заявок с сайта (опционально)
    {
      name: 'nord-laundry-webhook',
      script: './webhook-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WEBHOOK_SECRET: 'your-secret-key-here'
      },
      error_file: './logs/webhook-error.log',
      out_file: './logs/webhook-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 1000
    }
  ]
};
