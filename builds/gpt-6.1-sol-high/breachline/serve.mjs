import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let name=decodeURIComponent(req.url.split('?')[0]);if(!name.startsWith('/play/breachline/')){res.writeHead(302,{Location:'/play/breachline/'});res.end();return}name=name.slice('/play/breachline/'.length)||'index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}});server.listen(5220,'127.0.0.1',()=>console.log('Serving production at http://127.0.0.1:5220/play/breachline/'));
