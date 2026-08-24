module.exports = {
  apps: [
    {
      name: "crm-api",
      cwd: "/Users/andras/Sites/crm/crm-backend",
      script: "server.js",
      env: { NODE_ENV: "development", PORT: 8000 },
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
