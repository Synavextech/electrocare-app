module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server/dist/app.js',
      cwd: '/path/to/electrocare-app',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        USE_DATABASE: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        USE_DATABASE: 'true'
      }
    },
    {
      name: 'frontend',
      script: './client/node_modules/.bin/vite',
      cwd: '/path/to/electrocare-app',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};