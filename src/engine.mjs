import {architectures,methods,markets,suppliers} from './catalog.mjs';
export class GameError extends Error { constructor(message,status=422){super(message);this.status=status;} }
const fail=m=>{throw new GameError(m);};
const number=(v,min,max,name,integer=false)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))fail(`${name} must be ${integer?'a whole number ':''}between ${min} and ${max}.`);return v;};
const text=(v,name,max=100)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(`${name} is required (up to ${max} characters).`);return v.trim();};
const round=v=>Math.round(v);
export function rng(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,n|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function createGame(name='Unwritten Labs',thesis='Build useful intelligence',seed=2023){
 return {version:1,revision:0,quarter:0,seed,name:text(name,'Company name',60),thesis:text(thesis,'Thesis',300),cash:4000000,equity:1,debt:0,trust:50,staff:{research:4,engineering:3,sales:1},hires:[],projects:[],models:[],products:[],contracts:[],offers:[],queue:[],receipts:[],chats:[],ledger:[],history:[],market:{demand:1,compute:1},rivals:[{id:'arc',name:'Arc Research',output:'text',quality:54,price:1100,capacity:3800,customers:2100,cash:15000000,strategy:'frontier'},{id:'patch',name:'Patchwork',output:'code',quality:59,price:2100,capacity:2200,customers:1400,cash:8000000,strategy:'efficient'},{id:'prism',name:'Prism Studio',output:'image',quality:57,price:1600,capacity:2900,customers:1900,cash:9000000,strategy:'distribution'}],status:'active'};
}
export function date(q){return `${2023+Math.floor(q/4)} · Q${q%4+1}`;}
export function design(a){
 const arch=architectures[a.architecture],method=methods[a.method],market=markets[a.output];
 if(!Object.hasOwn(architectures,a.architecture)||!Object.hasOwn(methods,a.method)||!Object.hasOwn(markets,a.output))fail('Choose an architecture, method and output.');
 if(!arch.outputs.includes(a.output))fail(`${arch.name} does not support ${a.output} in this research programme. Choose a compatible design.`);
 number(a.scale,1,70,'Model size in billions of parameters');number(a.data,1,5,'Data investment',true);
 const complexity=Math.sqrt(a.scale/7);
 return {budget:round(160000*arch.cost*method.cost*complexity+a.data*45000),compute:Math.ceil(4*complexity*arch.cost),work:method.quarters*8*complexity,quality:Math.min(95,round((32+Math.log2(a.scale+1)*7+a.data*2.5)*arch.quality*method.quality)),serve:Math.max(.15,arch.serve*Math.sqrt(a.scale/7)*(a.method==='distill'?.6:1)),risk:a.method==='pretrain'?.22:a.method==='adapt'?.06:.12};
}
export function payroll(s){return s.staff.research*60000+s.staff.engineering*48000+s.staff.sales*36000;}
export function capacity(s,q=s.quarter){return 12+s.contracts.filter(c=>c.start<=q&&c.end>=q&&c.status==='active').reduce((n,c)=>n+c.units,0);}
export function supplierFree(s,id,start,duration){const sup=suppliers.find(x=>x.id===id);if(!sup)return 0;let free=sup.capacity;for(let q=start;q<start+duration;q++){const used=s.contracts.filter(c=>c.supplier===id&&c.status==='active'&&c.start<=q&&c.end>=q).reduce((n,c)=>n+c.units,0);free=Math.min(free,sup.capacity-used);}return free;}
export function quote(s,a,id){
 const sup=suppliers.find(x=>x.id===a.supplier);if(!sup)fail('Choose a supplier.');
 const units=number(a.units,1,220,'Compute units',true),duration=number(a.duration,1,16,'Duration',true),start=number(a.start,s.quarter,s.quarter+8,'Start quarter',true),cap=number(a.price,1000,50000,'Unit price cap');
 const free=supplierFree(s,sup.id,start,duration);if(free<1)fail('This supplier has no capacity for the requested schedule.');
 const offeredUnits=Math.min(units,free),util=1-free/sup.capacity;
 const floor=round(Math.max(sup.minimum,sup.price*s.market.compute*(1+util*.3)*(1-Math.min(.15,(duration-1)*.015))*(a.cancellable?1.08:1)));
 const price=Math.max(floor,Math.min(cap,round(floor*1.05)));
 const affordable=price<=cap;
 return {id,supplier:sup.id,units:offeredUnits,duration,start,end:start+duration-1,price,cancellable:!!a.cancellable,status:'offered',expires:s.quarter,requested:{units,duration,start,price:cap,cancellable:!!a.cancellable},withinBudget:affordable,quarterly:price*offeredUnits,total:price*offeredUnits*duration,reason:!affordable?'Your price cap is below the supplier’s reservation price. This is a counteroffer, not an agreement.':offeredUnits<units?'The supplier can only reserve the remaining capacity. Review the reduced quantity.':'These terms clear the supplier’s price and capacity requirements. Acceptance is still required.'};
}
export function cost(s,a){switch(a.type){case'research':return design(a).budget;case'hire':return a.count*15000;case'launch':return 75000;case'marketing':return a.budget;case'accept_offer':{const o=s.offers.find(o=>o.id===a.offerId);return o?o.quarterly:0;}case'cancel_contract':{const c=s.contracts.find(c=>c.id===a.contractId);return c?c.units*c.price:0;}default:return 0;}}
export function validate(s,a){
 if(s.status!=='active')fail('This company has entered administration. Start a new campaign to play again.');
 if(!a||typeof a!=='object')fail('Invalid action.');
 switch(a.type){
 case'research':text(a.name,'Research name');design(a);if(s.projects.filter(p=>p.status==='active').length>=4)fail('The lab can manage four concurrent programmes. Complete or stop one first.');break;
 case'cancel_research':if(!s.projects.some(p=>p.id===a.projectId&&p.status==='active'))fail('This programme is not active.');break;
 case'hire':if(!['research','engineering','sales'].includes(a.role))fail('Choose a staff role.');number(a.count,1,50,'Hiring count',true);break;
 case'layoff':if(!Object.hasOwn(s.staff,a.role))fail('Choose a staff role.');number(a.count,1,s.staff[a.role],'Layoff count',true);break;
 case'launch':text(a.name,'Product name');if(!s.models.some(m=>m.id===a.modelId))fail('Finish a research programme before launching this model.');number(a.price,100,25000,'Quarterly price');break;
 case'price':if(!s.products.some(p=>p.id===a.productId))fail('Product not found.');number(a.price,100,25000,'Quarterly price');break;
 case'marketing':if(!s.products.some(p=>p.id===a.productId&&p.active))fail('Choose an active product.');number(a.budget,10000,1000000,'Campaign budget');break;
 case'sunset':if(!s.products.some(p=>p.id===a.productId&&p.active))fail('Choose an active product.');break;
 case'accept_offer':{const o=s.offers.find(o=>o.id===a.offerId);if(!o||o.status!=='offered'||o.expires<s.quarter)fail('This offer has expired or is already accepted. Request fresh terms.');if(supplierFree(s,o.supplier,o.start,o.duration)<o.units)fail('Capacity changed. Request a new offer.');break;}
 case'cancel_contract':{const c=s.contracts.find(c=>c.id===a.contractId&&c.status==='active');if(!c)fail('Contract is not active.');if(!c.cancellable)fail('This contract is non-cancellable. Its remaining obligations still apply.');break;}
 case'raise':number(a.amount,100000,10000000,'Investment');number(a.valuation,500000,100000000,'Pre-money valuation');break;
 case'borrow':number(a.amount,100000,3000000,'Loan');break;
 default:fail('This action is not supported. No change was made.');
 }
 const spend=cost(s,a)+(a.type==='layoff'?a.count*20000:0);if(spend>s.cash)fail(`This move needs $${spend.toLocaleString()} upfront; available cash is $${s.cash.toLocaleString()}.`);
 return {upfront:spend};
}
export function stage(s,a,id){validate(s,a);if(s.queue.length>=30)fail('Review the current 30 decisions before adding more.');if(s.queue.some(x=>x.id===id))return s;return {...s,queue:[...s.queue,{id,action:structuredClone(a),createdQuarter:s.quarter}]};}
export function journey(s){
 const revenue=s.history.at(-1)?.revenue??0;
 if(s.cash<0||s.cash<2*(payroll(s)+30000))return {name:'Protect the company',goal:'Restore runway before adding new commitments.',place:'business'};
 if(!s.models.length)return {name:'Find your edge',goal:'Choose a model design and finish the first research programme.',place:'lab'};
 if(!s.products.some(p=>p.active))return {name:'Prove the product',goal:'Launch a completed model into a customer market.',place:'business'};
 if(revenue<500000)return {name:'Earn demand',goal:'Build repeat business without outrunning delivery capacity.',place:'business'};
 if((s.history.at(-1)?.profit??0)<0)return {name:'Make growth sustainable',goal:'Turn demand into positive operating cash flow.',place:'business'};
 return {name:'Shape the frontier',goal:'Compound your advantage through better models, distribution and supply.',place:'lab'};
}
export function resolve(input,id){
 if(input.status!=='active')fail('The company is in administration.');
 const s=structuredClone(input),random=rng(s.seed+s.quarter*7919),q=s.quarter,opening=s.cash;
 const log=[],receipts=[];let investment=0,financing=0,extra=0;
 const pay=(amount,reason)=>{s.cash-=amount;investment+=amount;log.push({kind:'investment',amount:-amount,text:reason});};
 for(const {id:aid,action:a} of s.queue){try{validate(s,a);const spent=cost(s,a);switch(a.type){
 case'research':pay(spent,`Started ${a.name}`);s.projects.push({id:aid,...a,...design(a),progress:0,status:'active',started:q});break;
 case'cancel_research':s.projects.find(p=>p.id===a.projectId).status='cancelled';break;
 case'hire':pay(spent,'Recruiting fees');s.hires.push({role:a.role,count:a.count,arrives:q+1});break;
 case'layoff':pay(a.count*20000,'Severance');s.staff[a.role]-=a.count;s.trust=Math.max(0,s.trust-3);break;
 case'launch':pay(spent,`Launched ${a.name}`);s.products.push({id:aid,name:a.name,modelId:a.modelId,price:a.price,customers:0,active:true,awareness:.12,campaign:0,revenue:0,served:0});break;
 case'price':s.products.find(p=>p.id===a.productId).price=a.price;break;
 case'marketing':pay(spent,'Customer acquisition campaign');s.products.find(p=>p.id===a.productId).campaign+=a.budget;break;
 case'sunset':s.products.find(p=>p.id===a.productId).active=false;break;
 case'accept_offer':{const o=s.offers.find(o=>o.id===a.offerId);o.status='accepted';s.contracts.push({...o,status:'active',accepted:q});break;}
 case'cancel_contract':{const c=s.contracts.find(c=>c.id===a.contractId);pay(spent,'Early cancellation fee');c.status='cancelled';break;}
 case'raise':{const revenue=s.history.at(-1)?.revenue??0;const fair=3000000+s.models.length*750000+revenue*8;const max=Math.min(10000000,fair*.5);if(a.valuation>fair*1.25||a.amount>max)fail(`Investors declined: current traction supports roughly $${round(fair).toLocaleString()} pre-money and a raise up to $${round(max).toLocaleString()}.`);s.cash+=a.amount;financing+=a.amount;s.equity*=a.valuation/(a.valuation+a.amount);log.push({kind:'financing',amount:a.amount,text:'Equity round closed; founder ownership diluted.'});break;}
 case'borrow':{const revenue=s.history.at(-1)?.revenue??0;if(s.debt+a.amount>Math.max(300000,revenue*2))fail('Lender declined: cash-flow support is insufficient for this debt.');s.cash+=a.amount;s.debt+=a.amount;financing+=a.amount;log.push({kind:'financing',amount:a.amount,text:'Loan funded at 12% annual interest; 5% principal due each quarter.'});break;}
 }receipts.push({id:aid,status:'executed',type:a.type,text:'Committed to this quarter’s operating plan.'});}catch(e){if(!(e instanceof GameError))throw e;receipts.push({id:aid,status:'rejected',type:a.type,text:e.message});}}
 const hires=s.hires.filter(h=>h.arrives<=q);for(const h of hires){s.staff[h.role]+=h.count;log.push({kind:'people',amount:0,text:`${h.count} ${h.role} hires joined.`});}s.hires=s.hires.filter(h=>h.arrives>q);
 let units=capacity(s),reserved=0;
 for(const c of s.contracts){if(c.status==='active'&&c.end<q)c.status='fulfilled';if(c.status==='active'&&c.start<=q&&c.end>=q)reserved+=c.units*c.price;}
 const active=s.projects.filter(p=>p.status==='active');
 for(const p of active){const allocated=Math.min(p.compute,Math.max(0,units));units-=allocated;const effort=s.staff.research/Math.max(1,active.length)*(allocated/p.compute);p.progress=Math.min(1,p.progress+effort/p.work);if(p.progress>=1){const setback=random()<p.risk;if(setback){p.progress=.82;p.risk*=.5;log.push({kind:'research',amount:0,text:`${p.name} failed validation. One more iteration is needed; no capability was awarded.`});}else{p.status='complete';const quality=Math.max(10,Math.min(99,round(p.quality*(.94+random()*.12))));s.models.push({id:p.id,name:p.name,architecture:p.architecture,method:p.method,output:p.output,scale:p.scale,quality,serve:p.serve,completed:q});log.push({kind:'research',amount:0,text:`${p.name} validated at capability ${quality}/100. Ready for commercialisation.`});}}else log.push({kind:'research',amount:0,text:`${p.name}: ${round(p.progress*100)}% complete; ${allocated}/${p.compute} compute units allocated.`});}
 let revenue=0,serving=0,unserved=0;
 const live=s.products.filter(p=>p.active),engineers=Math.max(1,s.staff.engineering);
 for(const [output,m] of Object.entries(markets)){
 const pool=round(m.buyers*(1+m.growth)**Math.min(q,80)*s.market.demand);
 const offers=[...s.rivals.filter(r=>r.output===output).map(r=>({...r,rival:true,weight:Math.exp(Math.min(4,(r.quality-m.quality)/30))*m.price/r.price*.8})),...live.filter(p=>s.models.find(x=>x.id===p.modelId)?.output===output).map(p=>{const model=s.models.find(x=>x.id===p.modelId);p.awareness=Math.min(.95,p.awareness+.025+s.staff.sales*.008+p.campaign/1500000);return {...p,model,weight:Math.exp(Math.min(4,(model.quality-m.quality)/30))*m.price/p.price*p.awareness*s.trust/60};})];
 const sum=1.6+offers.reduce((n,p)=>n+p.weight,0);
 for(const o of offers){const demand=round(pool*o.weight/sum);if(o.rival){const r=s.rivals.find(r=>r.id===o.id);r.customers=Math.min(r.capacity,demand);continue;}
 const p=s.products.find(p=>p.id===o.id),retained=round(p.customers*(o.model.quality>=m.quality?.88:.65));const wanted=Math.min(demand,retained+round(demand*.35));
 const support=Math.floor(engineers*650/Math.max(1,live.length));const deliverable=Math.floor(units*220/o.model.serve);const served=Math.max(0,Math.min(wanted,support,deliverable));const used=served*o.model.serve/220;units-=used;serving+=round(used*5000);unserved+=Math.max(0,wanted-served);p.customers=served;p.served=served;p.revenue=served*p.price;p.campaign=0;revenue+=p.revenue;
 log.push({kind:'sales',amount:p.revenue,text:`${p.name}: served ${served} accounts at $${p.price}/quarter${wanted>served?`; ${wanted-served} could not be served`:''}.`});}
 }
 if(unserved)s.trust=Math.max(10,s.trust-4);else if(live.length)s.trust=Math.min(95,s.trust+2);
 const wages=payroll(s),overhead=45000,interest=round(s.debt*.03),principal=round(s.debt*.05),opex=wages+overhead+reserved+serving+interest;
 s.cash+=revenue-opex-principal;s.debt-=principal;
 log.push({kind:'operations',amount:-wages,text:'Payroll paid.'},{kind:'operations',amount:reserved?-reserved:0,text:'Reserved compute billed, including unused capacity.'},{kind:'operations',amount:serving?-serving:0,text:'Usage-based inference and infrastructure charges.'},{kind:'operations',amount:-overhead,text:'Office, administration and tooling.'},{kind:'finance',amount:interest+principal?-interest-principal:0,text:'Interest and debt principal settled.'});
 const demandShock=.95+random()*.12;s.market.demand=Math.max(.65,Math.min(1.5,s.market.demand*demandShock));s.market.compute=Math.max(.65,Math.min(1.6,s.market.compute*(.94+random()*.15)));
 for(const r of s.rivals){r.quality=Math.min(95,r.quality+(r.strategy==='frontier'?2.1:1.1));r.capacity=round(r.capacity*1.07);r.cash+=r.customers*r.price-r.capacity*350-600000;if(r.cash<0){r.capacity=round(r.capacity*.8);r.price=round(r.price*1.08);}}
 const report={id,quarter:q,opening,closing:s.cash,revenue,opex,investment,financing,principal,profit:revenue-opex,unserved,log,receipts};
 if(Math.abs(opening+revenue-opex-investment+financing-principal-s.cash)>1)throw Error('Cash reconciliation failed.');
 if(s.cash<0){s.status='administration';log.push({kind:'critical',amount:0,text:'The company cannot meet its obligations and entered administration. Its history remains available.'});}
 s.history.push(report);s.receipts.push(...receipts.map(r=>({...r,quarter:q})));s.ledger.push(...log.map(l=>({...l,amount:l.amount||0,quarter:q})));s.queue=[];s.quarter++;return s;
}
export function overview(s){const last=s.history.at(-1);const ongoing=payroll(s)+45000+s.contracts.filter(c=>c.status==='active').reduce((n,c)=>n+c.units*c.price,0);const burn=Math.max(0,ongoing-(last?.revenue??0));return {journey:journey(s),payroll:payroll(s),compute:capacity(s),runway:burn?Math.max(0,s.cash/burn):null,revenue:last?.revenue??0,profit:last?.profit??null,date:date(s.quarter)};}
