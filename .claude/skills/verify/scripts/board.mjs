// Serve a folder of saved design-canvas files. Usage: node board.mjs <dir-with-.dc.html> <port>
// The boards load ./support.js, which the artifact does not publish; it is artifact-type/dc-runtime.js.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [dir, port] = process.argv.slice(2);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const runtime = [path.join(dir, 'support.js'), path.join(dir, '..', 'artifact-type', 'dc-runtime.js')].find((f) => fs.existsSync(f));
http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  const file = name === 'support.js' ? runtime : path.join(dir, name);
  if (!file || !file.startsWith(dir.replace(/\/$/, '')) && file !== runtime || !fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file));
}).listen(Number(port), () => console.log(`boards on :${port}`));
