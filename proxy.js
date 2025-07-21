const http = require('http');
const https = require('https');
const url = require('url');
const net = require('net');

class HTTPProxy {
    constructor(port = 8080) {
        this.port = port;
        this.server = null;
    }

    start() {
        this.server = http.createServer();
        this.server.on('request', this.handleHTTPRequest.bind(this));
        this.server.listen(this.port, () => {
            console.log(`HTTP Proxy Server running on port ${this.port}`);
            console.log(`Configure your browser/app to use proxy: 127.0.0.1:${this.port}`);
        });
        this.server.on('error', (err) => {
            console.error('Proxy server error:', err);
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('Proxy server stopped');
        }
    }


    handleHTTPRequest(clientReq, clientRes) {
        const targetUrl = clientReq.url;
        const parsedUrl = new URL(targetUrl);
        const isHTTPS = parsedUrl.protocol === 'https:';
        const httpModule = isHTTPS ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHTTPS ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: clientReq.method,
            headers: this.sanitizeHeaders(clientReq.headers)
        };

        console.log(`${clientReq.method} ${targetUrl}`);

        const proxyReq = httpModule.request(options, (proxyRes) => {
            const responseHeaders = {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            };

            clientRes.writeHead(proxyRes.statusCode, responseHeaders);
            proxyRes.pipe(clientRes, { end: true });
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy request error:', err.message);
            clientRes.writeHead(500, { 'Content-Type': 'text/plain' });
            clientRes.end('Proxy Error: ' + err.message);
        });

        proxyReq.setTimeout(30000, () => {
            proxyReq.destroy();
            clientRes.writeHead(408, { 'Content-Type': 'text/plain' });
            clientRes.end('Request Timeout');
        });

        clientReq.pipe(proxyReq, { end: true });
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        
        delete sanitized['connection'];
        delete sanitized['keep-alive'];
        delete sanitized['proxy-authenticate'];
        delete sanitized['proxy-authorization'];
        delete sanitized['te'];
        delete sanitized['trailers'];
        delete sanitized['transfer-encoding'];
        delete sanitized['upgrade'];
        
        if (sanitized.host) {
            delete sanitized.host;
        }
        
        return sanitized;
    }
}

const proxy = new HTTPProxy(8080);
proxy.start();

process.on('SIGINT', () => {
    console.log('\nShutting down proxy server...');
    proxy.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down proxy server...');
    proxy.stop();
    process.exit(0);
});