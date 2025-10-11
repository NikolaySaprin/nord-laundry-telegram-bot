module.exports = {
  apps: [
    {
      name: 'nord-laundry-bot',
      script: 'bot-runner.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Хуки для проверки и восстановления сессии
      pre_start: './auto-auth-recovery.sh check',
      post_start: './auto-auth-recovery.sh archive'
    },
    {
      name: 'webhook-server',
      script: 'webhook-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_SECRET: 'your-secret-key'  // Замените на свой секретный ключ
      },
      error_file: './logs/webhook-err.log',
      out_file: './logs/webhook-out.log',
      log_file: './logs/webhook-combined.log',
      time: true
    }
  ],
  // Автоматическое развертывание
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_VPS_IP',  // Замените на IP вашего VPS
      ref: 'origin/main',
      repo: 'https://github.com/your-username/nord-laundry-bot.git',  // Замените на ваш репозиторий
      path: '/var/www/html/nord-laundry-telegram-bot',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};