const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const ip = getLocalIP();
console.log(`Your local IP address is: ${ip}`);
console.log(`Update the API_BASE_URL in services/api.js to: http://${ip}:3000/api`);
console.log(`Make sure your phone and computer are on the same WiFi network.`);


