const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});
console.log('Simple server starting on port 3001...');
server.listen(3001, '127.0.0.1', () => {
  console.log('Simple server listening on port 3001');
});
