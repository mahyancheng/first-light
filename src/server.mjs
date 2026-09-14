import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {Store} from './store.mjs';
import {createGame,GameError,stage,resolve,quote,overview,design} from './engine.mjs';
import {catalog} from './catalog.mjs';
import {advise} from './advisor.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
export function app({dbPath=process.env.DATA_PATH||join(root,'data/game.sqlite'),ai=advise}={}){
 const store=new Store(dbPath);store.recover();let pending=0;
 const server=createServer(async(req,res)=>{
  const send=(code,data)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));};
  try{
   const url=new URL(req.url,'http://local');
   if(!url.pathname.startsWith('/api/')){const paths={'/':'public/index.html','/app.js':'public/app.js','/style.css':'public/style.css','/catalog.mjs':'src/catalog.mjs','/engine.mjs':'src/engine.mjs'};const path=paths[url.pathname];if(!path){res.writeHead(404);return res.end('Not found');}const body=await readFile(join(root,path));res.writeHead(200,{'content-type':path.endsWith('.html')?'text/html; charset=utf-8':path.endsWith('.css')?'text/css':'text/javascript','cache-control':'no-cache','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});return res.end(body);}
   if(url.pathname==='/api/health')return send(200,{ok:true,sha:process.env.BUILD_SHA||'development',ai:!!process.env.CODEX_HOME});
   let owner=req.headers.cookie?.match(/(?:^|; )firstlight=([a-f0-9]{64})(?:;|$)/)?.[1];
   if(!owner){owner=randomBytes(32).toString('hex');res.setHeader('set-cookie',`firstlight=${owner}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${process.env.COOKIE_SECURE==='1'?'; Secure':''}`);}
   if(req.method==='GET'&&url.pathname==='/api/state'){const state=store.get(owner);if(state)state.rivals=state.rivals.map(({cash,...visible})=>visible);return send(200,{state,overview:state?overview(state):null,catalog,ai:!!process.env.CODEX_HOME,sha:process.env.BUILD_SHA||'development'});}
   if(req.method!=='POST')throw new GameError('Route not found.',404);
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new GameError('Request origin does not match.',403);
   if(!req.headers['content-type']?.startsWith('application/json'))throw new GameError('JSON is required.',415);
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>50000)throw new GameError('Request too large.',413);}
   let b;try{b=JSON.parse(raw);}catch{throw new GameError('Invalid JSON.',400);}
   if(url.pathname==='/api/design')return send(200,design(b));
   const before=store.get(owner);let runChat=false;
   const result=store.transact(owner,b.id,{...b,path:url.pathname},state=>{
    if(url.pathname==='/api/found'){if(state)throw new GameError('A campaign already exists. It has not been replaced.',409);return createGame(b.name,b.thesis,2023);}
    if(!state)throw new GameError('Found your company first.',404);
    const s=structuredClone(state);
    switch(url.pathname){
     case'/api/stage':return stage(s,b.action,b.id);
     case'/api/remove':if(!s.queue.some(x=>x.id===b.actionId))throw new GameError('Decision not found.',404);s.queue=s.queue.filter(x=>x.id!==b.actionId);return s;
     case'/api/resolve':return resolve(s,b.id);
     case'/api/quote':s.offers.push(quote(s,b,b.id));return s;
     case'/api/chat':if(typeof b.message!=='string'||!b.message.trim()||b.message.length>3000)throw new GameError('Message must contain 1–3000 characters.');if(!['chief',...catalog.suppliers.map(s=>s.id)].includes(b.counterparty))throw new GameError('Counterparty not found.');if(s.chats.some(c=>c.status==='pending')||pending>=2)throw new GameError('A conversation is already in progress. Your draft has not been sent.',429);s.chats.push({id:b.id,message:b.message,counterparty:b.counterparty,status:'pending',reply:'',proposals:[],quarter:s.quarter});runChat=true;return s;
     default:throw new GameError('Route not found.',404);
    }
   });
   send(runChat?202:200,result);
   if(runChat){pending++;Promise.resolve().then(()=>ai(before,b.message,b.counterparty)).then(r=>store.updateChat(owner,b.id,r)).catch(()=>store.updateChat(owner,b.id,{status:'failed',reply:'This reply failed. Your message was saved; no action was executed.',proposals:[]})).finally(()=>pending--);}
  }catch(e){if(res.headersSent)return;send(e instanceof GameError?e.status:500,{error:e instanceof GameError?e.message:'The request could not be committed. Refresh to reconcile its status.'});}
 });
 return {server,store};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {server}=app();server.listen(Number(process.env.PORT||3111),'0.0.0.0',()=>console.log('First Light listening'));}
