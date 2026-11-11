import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
const root=resolve('dist');
createServer(async(req,res)=>{try{const url=new URL(req.url??'/', 'http://localhost');if(!url.pathname.startsWith('/play/shardfront/')){res.writeHead(302,{Location:'/play/shardfront/'}).end();return;}const relative=decodeURIComponent(url.pathname.slice('/play/shardfront/'.length))||'index.html';const file=resolve(root,relative);if(!file.startsWith(root))throw new Error('path');const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'} as Record<string,string>)[extname(file)]??'application/octet-stream');res.end(data);}catch{res.writeHead(404).end('Not found');}}).listen(5200,'127.0.0.1',()=>console.log('Production at http://127.0.0.1:5200/play/shardfront/'));
