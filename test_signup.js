
const https = require('https');

const data = JSON.stringify({
    email: 'test_node_agent@example.com',
    password: 'password123'
});

const options = {
    hostname: 'uizibdtiuvjjikbrkdcv.supabase.co',
    path: '/auth/v1/signup',
    method: 'POST',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemliZHRpdXZqamlrYnJrZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzAxOTYsImV4cCI6MjA3MTQ0NjE5Nn0.iM8TEX8uCSrC-krRGeBguyVO6Kl7tQdt4kBgumrmcFw',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
