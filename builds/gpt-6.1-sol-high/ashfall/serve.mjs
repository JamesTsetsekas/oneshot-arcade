import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const base=path.resolve('dist');
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith('/arcade/ashfall/')){res.writeHead(404);return res.end('Not found');}const relative=pathname.slice('/arcade/ashfall/'.length)||'index.html';const file=path.resolve(base,relative);if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Missing');return;}res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','png':'image/png'})[file.split('.').pop()]||'application/octet-stream');res.end(data);});});
server.listen(5210,'127.0.0.1',()=>console.log('Production subpath: http://127.0.0.1:5210/arcade/ashfall/'));
