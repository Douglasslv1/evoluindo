const {createService}=require('../lib/service.cjs');let service,queue=Promise.resolve();
async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');res.statusCode=405;return res.end(JSON.stringify({error:'Use POST.'}))}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    if(!(req.headers['content-type']||'').startsWith('application/json')){res.statusCode=415;return res.end(JSON.stringify({error:'Use JSON.'}))}
    const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
    if(req.headers['sec-fetch-site']==='cross-site'||(origin&&new URL(origin).host!==host)){res.statusCode=403;return res.end(JSON.stringify({error:'Origem não autorizada.'}))}
    service||=createService();let body=req.body;if(!body){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>60000){res.statusCode=413;return res.end(JSON.stringify({error:'Envio muito grande.'}))}chunks.push(chunk)}body=JSON.parse(Buffer.concat(chunks).toString()||'{}')}
    if(typeof body==='string')body=JSON.parse(body);if(!body||typeof body!=='object'||Array.isArray(body)){res.statusCode=400;return res.end(JSON.stringify({error:'Envio inválido.'}))}if(Buffer.byteLength(JSON.stringify(body))>60000){res.statusCode=413;return res.end(JSON.stringify({error:'Envio muito grande.'}))}
    const cookies=String(req.headers.cookie||'').split(';').map(x=>x.trim()),raw=cookies.find(x=>x.startsWith('interface_session='))?.slice(18);let action=body.action;
    if(action==='logout'){res.setHeader('Set-Cookie','interface_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(process.env.VERCEL?'; Secure':''));return res.end(JSON.stringify({ok:true}))}
    const work=async()=>{const auth=await service.session(raw),ip=process.env.VERCEL?String(req.headers['x-forwarded-for']||'unknown').split(',')[0]:req.socket?.remoteAddress||'local';return service.execute(action,body,auth,ip)};
    // O servidor local grava em arquivo. Serializar impede sobreposição de gravações.
    let result;if(service.store.cloud)result=await work();else{const job=queue.then(work);queue=job.catch(()=>{});result=await job}
    if(result.token){res.setHeader('Set-Cookie','interface_session='+result.token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800'+(process.env.VERCEL?'; Secure':''));delete result.token}
    res.end(JSON.stringify(result));
  }catch(e){res.statusCode=e.status||(e instanceof SyntaxError?400:503);res.end(JSON.stringify({error:e.status?e.message:e instanceof SyntaxError?'Envio inválido.':'Não foi possível acessar o servidor. Confira a configuração do banco e tente novamente.'}));}
}
module.exports=handler;
