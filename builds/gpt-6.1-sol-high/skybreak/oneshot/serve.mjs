import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
http.createServer((req,res)=>{let rel=decodeURIComponent((req.url||'/').split('?')[0]);if(!rel.startsWith('/play/skybreak/')){res.writeHead(404);return res.end('Use /play/skybreak/');}rel=rel.slice('/play/skybreak/'.length)||'index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();}else{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);}});}).listen(5250,'127.0.0.1',()=>console.log('Production sub-path: http://127.0.0.1:5250/play/skybreak/'));
