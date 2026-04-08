module.exports = {
  apps: [{
    name: 'oliecare-ads-agent',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: { NODE_ENV: 'production' },
    log_file: './logs/combined.log',
    error_file: './logs/error.log',
    time: true,
  }]
};
