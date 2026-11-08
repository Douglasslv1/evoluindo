const assert=require('node:assert/strict');
const base=String(process.env.EVOLUINDO_URL||'').replace(/\/$/,'');
if(!/^https:\/\//.test(base))throw Error('Defina EVOLUINDO_URL com a URL HTTPS publicada.');

async function get(path){const response=await fetch(base+path,{redirect:'error',signal:AbortSignal.timeout(15000)});assert.equal(response.status,200,`${path} respondeu ${response.status}`);return response}

(async()=>{
  for(const asset of ['/','/evoluindo.css','/evoluindo-admin.js','/owl.svg'])await get(asset);
  const home=await get('/');
  const csp=home.headers.get('content-security-policy')||'';
  assert.match(csp,/default-src 'self'/,'Cabeçalho CSP ausente.');
  const status=await fetch(base+'/api/index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status'}),signal:AbortSignal.timeout(15000)});
  assert.equal(status.status,200,`API respondeu ${status.status}`);
  const data=await status.json();
  assert.equal(data.mode,'cloud','A publicação não está usando o banco em nuvem.');
  assert.equal(data.needsSetup,false,'ADMIN_PASSWORD não foi reconhecida.');
  console.log('Publicação verificada: arquivos, CSP, API e armazenamento em nuvem estão ativos.');
})().catch(error=>{console.error('Falha na verificação:',error.message);process.exitCode=1});
