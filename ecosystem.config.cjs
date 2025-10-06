module.exports = {
  apps: [
    {
      name: 'nord-laundry-bot',
      cwd: '/var/www/html/nord-laundry-telegram-bot',
      script: 'node',
      args: 'bot-runner.mjs',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Настройки для стабильности бота
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M',
      // Настройки логов
      out_file: './logs/bot-out.log',
      error_file: './logs/bot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Автоперезапуск при ошибках
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Настройки для мониторинга
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
    }
  ]
};
