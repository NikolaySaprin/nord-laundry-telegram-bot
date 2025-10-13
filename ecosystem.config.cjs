module.exports = {
  apps: [
    {
      name: 'nord-laundry-bot',
      cwd: '/var/www/html/nord-laundry-bot',
      script: './bot-runner.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ENABLE_WHATSAPP: 'true'
      },
      error_file: '/var/www/html/nord-laundry-bot/logs/bot-error.log',
      out_file: '/var/www/html/nord-laundry-bot/logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    
    {
      name: 'nord-laundry-webhook',
      cwd: '/var/www/html/nord-laundry-bot',
      script: './webhook-server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WEBHOOK_SECRET: 'your-secret-key-here'
      },
      error_file: '/var/www/html/nord-laundry-bot/logs/webhook-error.log',
      out_file: '/var/www/html/nord-laundry-bot/logs/webhook-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 1000
    }
  ]
};
