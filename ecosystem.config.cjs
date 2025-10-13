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
        NODE_ENV: 'production'
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
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/nord-laundry-webhook-err.log',
      out_file: '/var/log/pm2/nord-laundry-webhook-out.log',
      log_file: '/var/log/pm2/nord-laundry-webhook.log',
      time: true,
      merge_logs: true
    }
  ]
};