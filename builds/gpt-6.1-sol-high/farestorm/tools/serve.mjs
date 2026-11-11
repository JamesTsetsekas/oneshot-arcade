import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const prefix='/arcade/farestorm/';
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix)){res.writeHead(404).end();return;}const rel=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error('Invalid path');const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404).end('Not found');}}).listen(5270,'127.0.0.1',()=>console.log('Production at http://127.0.0.1:5270/arcade/farestorm/'));
