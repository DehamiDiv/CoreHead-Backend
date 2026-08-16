const http = require('http');

const payload = JSON.stringify({
  email: 'dehamidivyanjali166@gmail.com',
  password: 'Admin@1234'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,

  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", data);
  });
});

req.on('error', (err) => {
  console.error("Login request failed:", err.message);
});

req.write(payload);
req.end();
