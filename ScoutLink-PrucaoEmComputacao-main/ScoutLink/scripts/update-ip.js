const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pula endereços internos (127.0.0.1) e que não sejam IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const envPath = path.join(__dirname, '..', '.env');

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Atualiza ou adiciona o EXPO_PUBLIC_API_URL mantendo as portas
const apiUrlRegex = /^EXPO_PUBLIC_API_URL=.*$/m;
const newApiUrl = `EXPO_PUBLIC_API_URL=http://${localIp}:8000`;

if (apiUrlRegex.test(envContent)) {
  envContent = envContent.replace(apiUrlRegex, newApiUrl);
} else {
  // Se não terminar com nova linha, adiciona uma
  if (envContent && !envContent.endsWith('\n')) {
    envContent += '\n';
  }
  envContent += `${newApiUrl}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log(`\x1b[32m[Auto-IP] \x1b[0mAtualizado .env com o IP da rede local: \x1b[36m${localIp}\x1b[0m`);
