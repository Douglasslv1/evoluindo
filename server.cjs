const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
// .env.local é lido apenas no servidor e nunca copiado para dist.
const envFile=path.join(__dirname,'.env.local');if(fs.existsSync(envFile))for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)){const m=/^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const handler=require('./api/index.js');const port=Number(process.env.PORT||3000);
const publicFiles=new Set(['index.html','course.css','course-app.js','study.js','study.css','evoluindo.css','brand.js','evoluindo-admin.js','duel-monitor.js','smooth-refresh.js','championship-reports.js','disqualification-controls.js','owl.svg']);
const headers={"Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
const server=http.createServer((req,res)=>{for(const [k,v]of Object.entries(headers))res.setHeader(k,v);let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
 if(p==='/api/index'||p==='/api/index.js')return handler(req,res);
 const file=p==='/'?'index.html':p.slice(1);if(!publicFiles.has(file)){res.writeHead(404);return res.end('Não encontrado')}
 fs.readFile(path.join(__dirname,file),(err,data)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':'text/javascript; charset=utf-8');res.end(data)});
});server.listen(port,'127.0.0.1',()=>console.log('Interface: http://127.0.0.1:'+port));
module.exports=server;
