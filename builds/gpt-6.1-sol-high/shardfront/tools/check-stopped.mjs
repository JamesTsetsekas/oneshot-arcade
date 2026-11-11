import net from 'node:net';
const c=net.connect({host:'127.0.0.1',port:5200});c.once('connect',()=>{console.error('Server still listening');c.destroy();process.exitCode=1;});c.once('error',()=>console.log('Verified: port 5200 is closed.'));
