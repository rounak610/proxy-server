const http = require('http');
const https = require('https');

function testProxy() {
    console.log('Testing HTTP Proxy Server...');
    
    const proxyOptions = {
        hostname: '127.0.0.1',
        port: 8080,
        path: 'http://httpbin.org/get',
        method: 'GET',
        headers: {
            'User-Agent': 'Proxy-Test-Client/1.0'
        }
    };

    console.log('Testing HTTP request...');
    const req = http.request(proxyOptions, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('HTTP Response:', JSON.parse(data));
            console.log('HTTP test completed successfully!');
        });
    });

    req.on('error', (err) => {
        console.error('HTTP test error:', err.message);
    });

    req.end();
}

setTimeout(testProxy, 2000);