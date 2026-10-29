// CabLine smoke tests — run with:  node tests/smoke.js
// Needs Playwright (npm i playwright && npx playwright install chromium). No real Firebase is used: it is mocked.
const path=require('path'),fs=require('fs');const {chromium}=require('playwright');
const FILE='file://'+path.resolve(__dirname,'../index.html');
const T=process.env.CI?3:1;   // slower machines on GitHub get longer waits
let pass=0,fail=0;const ok=(name,c,extra)=>{if(c){pass++;console.log('  PASS '+name);}else{fail++;console.log('  FAIL '+name+(extra?' — '+extra:''));}};
const FB=`(function(){const S=window.__DB=window.__DB||{users:{}};const L=[];let cur=null;const accts=JSON.parse(localStorage.getItem('__acc')||'{}');
 const mkU=(a)=>a?{email:a.email,emailVerified:a.v,isAnonymous:!!a.anon,displayName:a.name||'',reload:async()=>{const x=JSON.parse(localStorage.getItem('__acc')||'{}')[a.email];if(x)cur=mkU(x);},getIdToken:async()=>'t',updateProfile:async(o)=>{a.name=o.displayName;},sendEmailVerification:async()=>{window.__sent=(window.__sent||0)+1;},reauthenticateWithCredential:async(c)=>{if(c.pw!==a.pw)throw {code:'auth/wrong-password'};}}:null;
 const save=()=>localStorage.setItem('__acc',JSON.stringify(accts));const fire=()=>L.forEach(f=>f(cur));
 const sess=localStorage.getItem('__cur');if(sess&&accts[sess])cur=mkU(accts[sess]);
 const auth={get currentUser(){return cur;},onAuthStateChanged(f){L.push(f);setTimeout(()=>f(cur),20);},
  signInWithEmailAndPassword:async(e,p)=>{const a=accts[e];if(!a||a.pw!==p)throw {code:'auth/invalid-credential'};cur=mkU(a);localStorage.setItem('__cur',e);fire();},
  createUserWithEmailAndPassword:async(e,p)=>{if(accts[e])throw {code:'auth/email-already-in-use'};accts[e]={email:e,pw:p,v:false};save();cur=mkU(accts[e]);localStorage.setItem('__cur',e);fire();return {user:cur};},
  signOut:async()=>{cur=null;localStorage.removeItem('__cur');fire();},sendPasswordResetEmail:async()=>{},signInAnonymously:async()=>{}};
 const docs=()=>JSON.parse(localStorage.getItem('__db')||'{}');const put=(o)=>localStorage.setItem('__db',JSON.stringify(o));
 const db={enablePersistence:()=>Promise.resolve(),collection:c=>({onSnapshot:(f)=>{f({docChanges:()=>[],forEach(){},docs:[]});return ()=>{};},doc:i=>{const k=c+'/'+i;return {get:async()=>{const d=docs()[k];return {exists:!!d,data:()=>d};},set:async(v,o)=>{const D=docs();D[k]=Object.assign({},o&&o.merge?D[k]:{},JSON.parse(JSON.stringify(v)));put(D);},
   onSnapshot:(f)=>{const t=()=>{const d=docs()[k];f({exists:!!d,data:()=>d});};t();const iv=setInterval(()=>{const j=JSON.stringify(docs()[k]||null);if(j!==this._l){this._l=j;t();}},300);return ()=>clearInterval(iv);}};}})};
 window.firebase={apps:[],initializeApp(){this.apps.push(1);},auth:Object.assign(()=>auth,{EmailAuthProvider:{credential:(e,pw)=>({e,pw})}}),firestore:Object.assign(()=>db,{FieldValue:{serverTimestamp:()=>1,arrayUnion:(...a)=>a}})};
 window.__setAcc=(e,patch)=>{Object.assign(accts[e],patch);save();};})();`;
const DBMOCK=`window.__DB=window.__DB||{};window.mkdb=function(){const S=window.__DB;return {collection:c=>({doc:i=>{const k=c+'/'+i;return {get:async()=>({exists:!!S[k],data:()=>S[k]?JSON.parse(JSON.stringify(S[k])):undefined}),set:async(d,o)=>{S[k]=o&&o.merge?Object.assign({},S[k]||{},JSON.parse(JSON.stringify(d))):JSON.parse(JSON.stringify(d));},onSnapshot:f=>{setTimeout(()=>f({metadata:{},exists:!!S[k],data:()=>JSON.parse(JSON.stringify(S[k]||{}))}),30);return ()=>{};}};}}),runTransaction:async fn=>{const t={get:r=>r.get(),set:(r,v)=>{t.w=[r,v];}};await fn(t);if(t.w)await t.w[0].set(t.w[1]);}};};window.__fb={firestore:{FieldValue:{serverTimestamp:()=>1,arrayUnion:(...a)=>a}}};`;
const SITE='https://kiyanooshmahmoodi-sketch.github.io/Joinery/';
// Tests never touch the internet: Firebase, fonts and libraries are blocked (or mocked) so results are the same everywhere.
const OFF=/^https?:\/\/(?!kiyanooshmahmoodi-sketch\.github\.io\/)/;
const iso=async x=>{await x.route(OFF,r=>r.abort());return x;};
(async()=>{const b=await chromium.launch();
// ---------- 1. pages load without errors, phone has no sideways scroll
{console.log('Pages');for(const [w,h] of [[1366,860],[390,844]]){const p=await iso(await b.newPage({viewport:{width:w,height:h}}));const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(FILE);await p.waitForTimeout(T*1000);
  const r=await p.evaluate(()=>{applyRole('admin','Kiya','',['admin']);allJobs.j1={id:'j1',name:'Bondi',info:{client:'Ali'},drawings:[],units:[]};selectJob('j1');
    ['jobs','cabinetlist','tracker','installation','maint','admin'].forEach(v=>{switchView(v);document.querySelectorAll('#view-'+v+' .tab').forEach(t=>{try{t.click();}catch(e){}});});return document.documentElement.scrollWidth;});
  ok('all pages open without errors at '+w+'px',!errs.length,errs[0]);ok('no sideways scroll at '+w+'px',r<=w,'width '+r);await p.close();}}
// ---------- 2. sign-in
{console.log('Sign-in');const ctx=await iso(await b.newContext({serviceWorkers:'block'}));
  await ctx.route(SITE+'**',r=>{const u=new URL(r.request().url());r.fulfill({path:path.resolve(__dirname,'..'+u.pathname.replace('/Joinery','').replace(/\/$/,'/index.html'))});});
  const p=await ctx.newPage();await p.route(/gstatic\.com\/firebasejs/,r=>r.fulfill({body:FB,contentType:'text/javascript'}));p.on('dialog',d=>d.accept());
  await p.goto(SITE+'index.html');await p.waitForTimeout(T*1500);
  const vis=()=>p.evaluate(()=>['rc-signin','rc-create','rc-verify','rc-pending'].filter(i=>document.getElementById(i).style.display!=='none').join()+'|'+document.getElementById('role-ov').style.display);
  ok('sign-in screen shows',(await vis()).startsWith('rc-signin'));
  await p.evaluate(()=>{rcShow('rc-create');rc=(i,v)=>document.getElementById(i).value=v;rc('rc-name','Sara');rc('rc-email-in','sara@x.com');rc('rc-pw1','123456');rc('rc-pw2','123456');rcCreate();});await p.waitForTimeout(T*500);
  ok('new account asks to confirm email',(await vis()).startsWith('rc-verify'));
  await p.evaluate(()=>__setAcc('sara@x.com',{v:true}));await p.evaluate(()=>rcVerified());await p.waitForTimeout(T*700);
  ok('confirmed account waits for approval',(await vis()).startsWith('rc-pending'));
  await p.evaluate(()=>{const D=JSON.parse(localStorage.getItem('__db'));Object.assign(D['users/sara@x.com'],{status:'approved',roles:['designer']});localStorage.setItem('__db',JSON.stringify(D));});await p.waitForTimeout(T*900+4500);   // the opening drawing plays for ~4 s before the app shows
  ok('approved person gets in',(await vis()).endsWith('|none'));
  await p.evaluate(()=>rcSignOut());await p.waitForTimeout(T*1500);
  await p.evaluate(()=>{const a=JSON.parse(localStorage.getItem('__acc'));a['kiyanoosh.mahmoodi@gmail.com']={email:'kiyanoosh.mahmoodi@gmail.com',pw:'654321',v:true,name:'Kiya'};localStorage.setItem('__acc',JSON.stringify(a));});await p.reload();await p.waitForTimeout(T*1500);await p.evaluate(()=>{document.getElementById('rc-si-em').value='kiyanoosh.mahmoodi@gmail.com';document.getElementById('rc-si-pw').value='bad';rcSignIn();});await p.waitForTimeout(T*400);
  ok('wrong password refused',await p.evaluate(()=>/Wrong/.test(document.getElementById('role-err').textContent)));
  await p.evaluate(()=>{document.getElementById('rc-si-pw').value='654321';rcSignIn();});await p.waitForTimeout(T*700);
  ok('admin email signs in as Admin',await p.evaluate(()=>SESSION.roles.indexOf('admin')>-1));await ctx.close();}
// ---------- 3. client sign-off, approval, allow changes
{console.log('Client sign-off');const ctx=await iso(await b.newContext());const p=await ctx.newPage();p.on('dialog',d=>d.accept('Client wants another oven'));
  await p.addInitScript(DBMOCK);await p.goto(FILE);await p.waitForTimeout(T*1000);
  const tok=await p.evaluate(async()=>{cloud.db=mkdb();cloud.user={uid:'x'};cloud.ready=true;window.firebase=window.__fb;SESSION.name='Kiya';
    allJobs.j1={id:'j1',name:'Bondi',info:{client:'Ali'},drawings:[]};currentJobId='j1';showTab('client',document.querySelector('.tab[onclick*="client"]'));ciPick('j1');
    apInit(allJobs.j1).ss=[{id:'s1',name:'Kitchen',stone:'Calacatta'}];await clEnsure();await clPublish('j1');return allJobs.j1.info.clientToken;});
  const c=await ctx.newPage();c.on('dialog',d=>d.accept());await c.addInitScript(DBMOCK+';window.__DB='+JSON.stringify(await p.evaluate(()=>window.__DB))+';');await c.goto(FILE+'?client='+tok);await c.waitForTimeout(T*700);
  const sign=(db,why)=>c.evaluate(async([db,why])=>{if(db)window.__DB=db;cloud.db=mkdb();cloud.user={uid:'c'};window.firebase=window.__fb;clientLoad();await new Promise(r=>setTimeout(r,250));_clTab='ss';clientRender();
    const locked=[...document.querySelectorAll('#cl-ov select,#cl-ov input:not(#cl-ok):not(#cl-sn)')].some(x=>x.disabled);const rs=document.getElementById('cl-rs');if(rs)rs.value=why;
    document.getElementById('cl-ok').checked=true;document.getElementById('cl-sn').value='Ali Smith';clSign();await new Promise(r=>setTimeout(r,150));return {locked,reason:!!rs,db:window.__DB};},[db,why]);
  const des=(db,fn)=>p.evaluate(async([db,fn])=>{window.__DB=db;cloud.db=mkdb();await clPublish('j1');if(fn)await window[fn]();clStatus();return {st:document.getElementById('cl-status').innerText,db:window.__DB};},[db,fn]);
  let r1=await sign(null,'');ok('client can edit before signing',!r1.locked);
  let d1=await des(r1.db,'clApprove');ok('designer approves after client signs',/Approved for production/.test(d1.st));
  let d2=await des(d1.db,'clUnlock');ok('allow changes needs and keeps a reason',/Reason: Client wants another oven/.test(d2.st));
  let r2=await sign(d2.db,'Changed oven');ok('client must write why when signing again',r2.reason);
  let d3=await des(r2.db,'clApprove');ok('history keeps every step',(d3.st.match(/Signed off by/g)||[]).length>=2&&/Reason: Changed oven/.test(d3.st)&&/Reason: Client wants another oven/.test(d3.st));await ctx.close();}
// ---------- 4. syncing two devices
{console.log('Sync');const p=await iso(await b.newPage());await p.goto(FILE);await p.waitForTimeout(T*900);
  const r=await p.evaluate(async()=>{const S={};const doc=k=>({get:async()=>({exists:!!S[k],data:()=>JSON.parse(JSON.stringify(S[k]))}),set:async v=>{S[k]=JSON.parse(JSON.stringify(v));}});
    cloud.db={collection:c=>({doc:i=>doc(c+'/'+i)}),runTransaction:async fn=>{const t={get:r=>r.get(),set:(r,v)=>{t.w=[r,v];}};await fn(t);if(t.w)await t.w[0].set(t.w[1]);}};cloud.user={uid:'x'};window.firebase={firestore:{FieldValue:{serverTimestamp:()=>1}}};
    const base={id:'j1',name:'J',info:{client:'Ali',phone:'1'},units:[{id:1,w:600,qcLog:[]}],finishes:{clientBrief:[{id:'a',text:'x'}]}};const bs=JSON.stringify(base);
    S['jobs/j1']=await _pack(bs);cloud.sig.j1=bs;allJobs.j1=JSON.parse(bs);
    const R=JSON.parse(bs);R.units[0].qcLog.push({at:1});R.info.client='Ali Smith';R.finishes.clientBrief=[];S['jobs/j1']=await _pack(JSON.stringify(R));
    allJobs.j1.info.phone='0400';allJobs.j1.units[0].w=650;allJobs.j1.finishes.clientBrief.push({id:'b',text:'y'});await cloudPushJob('j1');return JSON.parse(await _unpack(S['jobs/j1']));});
  ok('my change kept',r.info.phone==='0400'&&r.units[0].w===650);ok('other device change kept',r.info.client==='Ali Smith'&&r.units[0].qcLog.length===1);
  ok('deleted and added notes both applied',JSON.stringify(r.finishes.clientBrief.map(x=>x.id))==='["b"]');await p.close();}
// ---------- 5. client notes
{console.log('Client notes');const p=await iso(await b.newPage());p.on('dialog',d=>d.accept('Lighting'));await p.goto(FILE);await p.waitForTimeout(T*900);
  const r=await p.evaluate(async()=>{allJobs.j1={id:'j1',name:'B',info:{},drawings:[]};showTab('client',document.querySelector('.tab[onclick*="client"]'));ciPick('j1');
    const pdf=()=>new File([new Uint8Array([37,80,68,70])],'m.pdf',{type:'application/pdf'});const v=[];
    for(let i=0;i<2;i++){brNew();v.push(document.getElementById('br-ver').value);_brFiles=[pdf()];document.getElementById('br-txt').value='change '+i;await brSave();}
    brNew();document.getElementById('br-cat').value='Stone';document.getElementById('br-txt').value='Calacatta';await brSave();
    const B=allJobs.j1.finishes.clientBrief;brDone(B[0].id,true);const struck=[...document.querySelectorAll('#br-list div')].some(d=>/line-through/.test(d.style.textDecoration));
    brSetCat('Stone');const st=document.getElementById('br-list').innerText;brSetCat('');brDel(B[1].id);return {v,struck,st,n:allJobs.j1.finishes.clientBrief.length};});
  ok('versions count up',r.v.join()==='1,2');ok('done notes are struck through',r.struck);ok('topic filter works',/Calacatta/.test(r.st)&&!/change/.test(r.st));ok('delete works',r.n===2);await p.close();}
// ---------- 6. hardware: which cabinets use each item
{console.log('Hardware cabinets');const p=await iso(await b.newPage());await p.goto(FILE);await p.waitForTimeout(T*900);
  const r=await p.evaluate(()=>{applyRole('admin','Kiya','',['admin']);const U=(id,room,hw)=>({id,type:'cabinet',room,parts:[{name:'UBack HW'}],hwModelOverride:hw});
    allJobs.j1={id:'j1',name:'B',info:{},drawings:[],units:[U('K01','Kitchen','110 Hinge (4), Bi Fold Hinge (2)'),U('L01','Laundry','110 Hinge (2)')]};selectJob('j1');
    switchView('cabinetlist');showTab('hardware',document.querySelector('.tab[onclick*="hardware"]'));renderHardware();
    [...document.querySelectorAll('#hw-list button')].filter(b=>/^Cabinets/.test(b.textContent))[0].click();return document.getElementById('hw-list').innerText;});
  ok('hardware item lists its cabinets with quantities',/K01 ×4/.test(r)&&/L01 ×2/.test(r));
  const q=await p.evaluate(()=>{const U=(id,hw,pto)=>({id,type:'cabinet',room:'K',isPTO:!!pto,parts:[{name:'UBack HW'}],hwModelOverride:hw});
    units=[U('A1','110 Hinge (2), 155 Hinge (2), PTO'),U('A2','110 hinge (2),PTO (1)'),U('A3','Bin',1)];return hwItems().map(i=>i.title+'='+i.total).join('|');});
  ok('"110 Hinge (2), 155 Hinge (2), PTO" counts 2 + 2 + 1 PTO',q==='🔘 PTO Mechanisms=3|110 Hinge=4|155 Hinge=2|Bin=1',q);await p.close();}
// ---------- 7. drafting page
{console.log('Drafting');const p=await iso(await b.newPage());p.on('dialog',d=>d.accept());await p.goto(FILE);await p.waitForTimeout(T*900);
  const r=await p.evaluate(()=>{applyRole('admin','Kiya','',['admin']);
    allJobs.d1={id:'d1',name:'Bondi',info:{stageManual:'drafting',stageAutoAt:'design'},drawings:[{kind:'cm',id:'c1',name:'CM.jpg',mime:'image/jpeg',size:1}],units:[]};
    allJobs.d2={id:'d2',name:'Other',info:{},drawings:[],units:[]};selectJob('d1');switchView('drafting');const t=document.getElementById('df-root').innerText;
    dfTick('cm',true);const kept=!!(allJobs.d1.info.drafting&&allJobs.d1.info.drafting.check.cm);dfToProd();const blocked=jhStage(allJobs.d1);
    units=allJobs.d1.units=[{id:'K1',type:'cabinet',parts:[]}];dfToProd();return {list:/Bondi/.test(t)&&!/Other/.test(t),cm:/CM\.jpg/.test(t),kept,blocked,after:jhStage(allJobs.d1),
      nav:[...document.querySelectorAll('.view-switch .view-btn')].filter(b=>b.style.display!=='none').map(b=>b.textContent.trim().replace(/\s*\d+$/,'')).join('|')};});
  ok('drafting lists only drafting jobs with their CM files',r.list&&r.cm);ok('checklist tick is saved',r.kept);
  ok('cannot go to Production without the Excel',r.blocked==='drafting');ok('Send to Production moves the job',r.after==='production',r.after);
  ok('menu order: Jobs, Drafting, Cabinets & Hardware…',r.nav.indexOf('Jobs|Drafting|Cabinets & Hardware|QC & Dispatch|Installation|Maintenance')===0,r.nav);await p.close();}
// ---------- 8. standby
{console.log('Standby');const p=await iso(await b.newPage());await p.goto(FILE);await p.waitForTimeout(T*600);
  await p.evaluate(()=>{applyRole('admin','Kiya','',['admin']);document.getElementById('role-ov').style.display='none';SB_MS=800;sbArm();});
  await p.waitForTimeout(T*1500);const on=await p.evaluate(()=>document.getElementById('role-ov').style.display==='flex'&&_sbOn);
  await p.mouse.click(200,200);await p.waitForTimeout(T*700);const off=await p.evaluate(()=>document.getElementById('role-ov').style.display==='none'&&!_sbOn&&SESSION.role==='admin');
  ok('standby shows the opening screen when idle',on);ok('a tap brings the app back, still signed in',off);await p.close();}
// ---------- 9. job list on the left of each section
{console.log('Section job lists');const p=await iso(await b.newPage());await p.goto(FILE);await p.waitForTimeout(T*700);
  const r=await p.evaluate(()=>{applyRole('admin','Kiya','',['admin']);const J=(id,st,n)=>{allJobs[id]={id,name:id,info:{stageManual:st},drawings:[],units:Array.from({length:n},(_,i)=>({id:id+i,type:'cabinet',parts:[]}))};allJobs[id].info.stageAutoAt=jhAutoStage(allJobs[id]);};
    J('P1','production',3);J('Q1','qcd',3);J('I1','installation',3);J('M1','maintenance',3);selectJob('P1');const o={};
    [['cabinetlist','cabinetlist'],['tracker','tracker'],['installation','installation'],['maint','maint']].forEach(([v,el])=>{switchView(v);o[v]=document.querySelector('#view-'+el+' .vs-side').innerText;});
    vsPick('Q1');o.picked=currentJobId;return o;});
  ok('Cabinets & Hardware lists production jobs',/P1/.test(r.cabinetlist)&&!/I1/.test(r.cabinetlist));ok('QC & Dispatch lists QC jobs',/Q1/.test(r.tracker));
  ok('Installation lists installation jobs',/I1/.test(r.installation));ok('Maintenance lists maintenance jobs',/M1/.test(r.maint));ok('tapping a job opens it',r.picked==='Q1');await p.close();}
console.log('\n'+pass+' passed, '+fail+' failed');await b.close();process.exit(fail?1:0);})();
