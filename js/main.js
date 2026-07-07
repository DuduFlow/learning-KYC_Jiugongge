/* ============================================================
   九宮格學習頁 main.js — v3
   多客戶九宮格 / 格子狀態同步 / 待問問句 / 進攻鏈含急迫性
   ============================================================ */
const STORE='nine-grid-learning-v3';
const stepIds=['map','seven','attack','defense','skills','questions','case','homework'];

/* 七大 KYC 格定義：key=九宮格代號, id=表單欄位, tab=對應問句頁籤, ask=預設待問問句 */
const CELLS=[
 {key:'goal',id:'nGoal',label:'目標：期待與擔心',tab:'goal',ask:'往後看 5 年，你最希望自己完成哪一項財務目標？最擔心什麼阻礙？'},
 {key:'status',id:'nStatus',label:'現況：財務與保單',tab:'goal',ask:'方便請教目前固定開銷、理財、儲蓄大概怎麼分配？'},
 {key:'need',id:'nNeed',label:'需求：落差在哪',tab:'goal',ask:'如果每年需要 20 萬但現在只準備 5 萬，中間的差距你算過嗎？'},
 {key:'urgency',id:'nUrgency',label:'急迫性：為什麼現在',tab:'urgency',ask:'在你的時間軸中，這個規劃最慢什麼時候要啟動？'},
 {key:'preference',id:'nPreference',label:'偏好：方案接受度',tab:'defense',ask:'過去做財務工具配置時，你最不喜歡哪種類型？原因是什麼？'},
 {key:'decision',id:'nDecision',label:'決策者：誰能拍板',tab:'defense',ask:'做這類資金決策時，家人會一起參與，還是以你的意見為主？'},
 {key:'competitor',id:'nCompetitor',label:'資金與競爭者',tab:'defense',ask:'近期除了我，還有其他同業協助你規劃嗎？每月可投入的範圍大概是多少？'}
];
const FIELD_IDS=['nGoal','nStatus','nNeed','nUrgency','nPreference','nDecision','nCompetitor','nNext','custName','attackGoal','attackStatus','attackGap','attackUrgency'];

const mapData={
 goal:'【目標】問出未來期待與擔心。重點不是問「你要不要買」，而是問「你想完成什麼、怕什麼擋住你」。',
 status:'【現況】盤點收入、支出、資產、保單、負債與時間因素。不要像警察盤問，用理財金三角自然帶入。',
 need:'【需求】期待與現況的落差。把抽象期待算成具體缺口，需求才會成立。',
 urgency:'【急迫性】為什麼現在？生日、費率、等待期、健康、時間成本都可以用來收斂行動。',
 preference:'【偏好】客戶喜歡/排斥什麼工具？先問偏好，避免設計出他反感的方案。',
 decision:'【決策者】誰有錢、誰能拍板、誰會影響？枕邊人和同住者常常最關鍵。',
 competitor:'【競爭者】可投入資金多少？有沒有理專、同業、親友業務員在旁邊？別幫別人暖場。'
};
const qData={
 goal:[['往後看 5 年，你最希望自己完成哪一項財務目標？','找出動機，建立感性連結。'],['在這條路上，你最擔心的阻礙是什麼？','把擔心轉成可以討論的風險。'],['為了達成這個目標，你目前做了哪些準備？','盤點現況，不急著推方案。'],['如果每年需要 20 萬，但現在只準備 5 萬，中間 15 萬你之前有算過嗎？','用數字製造落差。']],
 urgency:[['如果現在不做微調，5 年後要補這個缺口，可能要付出幾倍代價？','讓「晚點再說」變得有成本。'],['在你的時間軸中，這個規劃最慢什麼時候要啟動？','讓客戶自己說出時間點。'],['如果一年 3 萬能處理未來一個月 3 萬的風險，你會不會希望現在先開始？','長照/醫療帳戶常用對比。'],['如果方案都是你要的，我們可以從今天開始嗎？','把討論推進到行動。']],
 defense:[['過去做財務工具配置時，你最不喜歡哪種類型？原因是什麼？','避開客戶反感的方案。'],['這筆預算你偏好台幣還是美金？','確認貨幣與風險偏好。'],['做這類資金決策時，家人會一起參與，還是以你的意見為主？','探詢隱形決策者。'],['近期除了我，還有其他同業協助你規劃嗎？','確認競爭者，避免被截胡。']],
 medical:[['如果生病或不能工作，會不會影響你原本的投資/退休計畫？','用既有計畫切入醫療。'],['如果住院開刀要 15 萬，這筆錢會從哪裡來？','從事件拉出現金流缺口。'],['如果這件事發生在你身上，會影響誰？','比「拖累」柔軟，但更有力量。'],['10 年前和現在，哪時候身體比較好？','自然帶出年齡、健康、核保與費率。']]
};
/* 防守缺口 → 對應補洞問句 */
const defenseFix={
 '我知道客戶偏好與反感的工具':'「過去做財務工具配置時，你最不喜歡哪種類型？原因是什麼？」',
 '我知道誰是真正決策者':'「做這類資金決策時，家人會一起參與，還是以你的意見為主？」',
 '我知道可投入資金範圍':'「如果要解決剛才的落差，每個月撥出 1 萬～1.5 萬是你可以接受的範圍嗎？」',
 '我知道有沒有競爭者':'「近期除了我，還有其他同業協助你規劃嗎？」'
};

/* ---------- helpers ---------- */
function $(id){return document.getElementById(id)}
function valueOf(id){return $(id)?.value.trim()||''}
function esc(t){return(t||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1600)}
function checked(sel){return [...document.querySelectorAll(sel)].filter(i=>i.checked).map(i=>i.value)}
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 多客戶資料層 ---------- */
let db={current:'客戶 1',profiles:{'客戶 1':{fields:{},unknown:[],checks:[]}}};
function blankProfile(){return{fields:{},unknown:[],checks:[]}}
function loadDb(){
  try{const s=JSON.parse(localStorage.getItem(STORE));if(s&&s.profiles&&Object.keys(s.profiles).length){db=s}}catch(e){}
  if(!db.profiles[db.current])db.current=Object.keys(db.profiles)[0];
}
function collect(){
  const p=db.profiles[db.current];if(!p)return;
  p.fields={};FIELD_IDS.forEach(id=>{if($(id))p.fields[id]=$(id).value});
  p.unknown=[...document.querySelectorAll('.chip input')].filter(i=>i.checked).map(i=>i.id);
  p.checks=checked('.defense-check');
}
function saveDb(){collect();localStorage.setItem(STORE,JSON.stringify(db))}
function applyProfile(){
  const p=db.profiles[db.current]||blankProfile();
  FIELD_IDS.forEach(id=>{if($(id))$(id).value=(p.fields||{})[id]||''});
  document.querySelectorAll('.chip input').forEach(i=>i.checked=(p.unknown||[]).includes(i.id));
  document.querySelectorAll('.defense-check').forEach(i=>i.checked=(p.checks||[]).includes(i.value));
  ['attackOutput','defenseOutput','finalOutput'].forEach(id=>{if($(id))$(id).textContent=defaultOutput(id)});
  syncAll();
}
function defaultOutput(id){
  return id==='finalOutput'?'完成上方欄位後，這裡會生成一份可直接帶去跟主管討論的九宮格準備稿。'
   :id==='attackOutput'?'填完後，這裡會幫你整理成可問客戶的進攻鏈。'
   :'勾選後，這裡會列出你還需要補問的防守問題。';
}
function renderCustomers(){
  const sel=$('custSelect');if(!sel)return;
  sel.innerHTML=Object.keys(db.profiles).map(n=>`<option value="${esc(n)}"${n===db.current?' selected':''}>${esc(n)}</option>`).join('');
}
function switchCustomer(name){saveDb();db.current=name;renderCustomers();applyProfile();toast('已切換到 '+name)}
function newCustomer(){
  const name=prompt('新客戶名稱（例：方小姐）');if(!name)return;
  if(db.profiles[name]){toast('已有同名客戶');return}
  saveDb();db.profiles[name]=blankProfile();db.current=name;
  renderCustomers();applyProfile();saveDb();toast('已新增 '+name);
}
function deleteCustomer(){
  const names=Object.keys(db.profiles);
  if(names.length<=1){toast('至少要保留一位客戶');return}
  if(!confirm('確定刪除「'+db.current+'」的九宮格？'))return;
  delete db.profiles[db.current];db.current=Object.keys(db.profiles)[0];
  renderCustomers();applyProfile();saveDb();toast('已刪除');
}

/* ---------- 九宮格狀態同步 ---------- */
function cellState(c){
  const unk=$('unk-'+c.key)?.checked;
  if(unk)return'ask';
  return valueOf(c.id)?'filled':'empty';
}
function syncGrid(){
  let filled=0,ask=0;
  CELLS.forEach(c=>{
    const st=cellState(c);
    if(st==='filled')filled++;if(st==='ask')ask++;
    const mini=document.querySelector('.mini[data-panel="'+c.key+'"]');
    if(mini){mini.classList.toggle('filled',st==='filled');mini.classList.toggle('asking',st==='ask')}
    const cell=$(c.id)?.closest('.nf-cell');
    if(cell){cell.classList.toggle('is-filled',st==='filled');cell.classList.toggle('is-ask',st==='ask')}
  });
  const name=valueOf('custName')||db.current;
  const core=document.querySelector('.mini.core');
  if(core)core.innerHTML=esc(name)+'<small>'+filled+' / 7</small>';
  const meta=$('coreMeta');
  if(meta)meta.textContent='已填 '+filled+' / 7 格'+(ask?('｜待問 '+ask+' 格'):'')+(filled===7?'｜九宮格已填滿 ✓':'');
  return{filled,ask};
}

/* ---------- 總覽互動地圖 ---------- */
function showPanel(key){
  const mp=$('mapPanel');if(!mp)return;
  const paint=()=>{
    if(key==='core'){
      const {filled,ask}=syncGrid();
      const name=valueOf('custName')||db.current;
      mp.innerHTML='【客戶核心】'+esc(name)+'：已填 '+filled+' / 7 格'+(ask?('，另有 '+ask+' 格標為待問'):'')+'。'
        +(filled===7?'九宮格已填滿，可以推進成交。':'填滿九宮格之前，先把缺格變成問句。')
        +'<div class="panel-actions no-print"><button class="btn btn-soft compact" onclick="goCell(\'goal\')">去填客戶九宮格 →</button></div>';
    }else{
      const c=CELLS.find(x=>x.key===key);
      const st=c?cellState(c):'empty';
      const badge=st==='filled'?'<b class="panel-badge ok">✓ 這格已填</b>':st==='ask'?'<b class="panel-badge ask">？標為待問</b>':'<b class="panel-badge">尚未填寫</b>';
      mp.innerHTML=badge+mapData[key]
        +'<div class="panel-actions no-print"><button class="btn btn-soft compact" onclick="goQuestions(\''+(c?c.tab:'goal')+'\')">看這格的問句 →</button><button class="btn btn-soft compact" onclick="goCell(\''+key+'\')">去填這格 →</button></div>';
    }
  };
  if(reduceMotion){paint();return}
  mp.classList.add('swap');
  setTimeout(()=>{paint();mp.classList.remove('swap')},160);
}
function goQuestions(tab){renderQuestions(tab);document.getElementById('questions').scrollIntoView({behavior:reduceMotion?'auto':'smooth'})}
function goCell(key){
  const c=CELLS.find(x=>x.key===key);
  const el=c?$(c.id):$('custName');
  document.getElementById('homework').scrollIntoView({behavior:reduceMotion?'auto':'smooth'});
  if(el)setTimeout(()=>el.focus({preventScroll:true}),reduceMotion?0:600);
}

/* ---------- 進攻鏈（含急迫性） ---------- */
function buildAttack(){
  const g=valueOf('attackGoal')||'尚未填寫';
  const s=valueOf('attackStatus')||'尚未填寫';
  const gap=valueOf('attackGap')||'尚未填寫';
  const u=valueOf('attackUrgency');
  let out=`進攻鏈準備：\n\n期待：${g}\n現況：${s}\n落差：${gap}\n急迫性：${u||'未設定 → 這是 90% 成交失敗的死因'}\n\n下一句可以問：\n「如果這個落差不處理，最先影響的是哪一件事？」`;
  out+=u?`\n「既然 ${u}，我們最慢什麼時候要啟動？如果方案都是你要的，可以從今天開始嗎？」`
       :`\n「在你的時間軸中，這件事最慢什麼時候要啟動？」\n\n提醒：先找出他的時間點（生日、費率、等待期、事件），急迫性才收得起來。`;
  $('attackOutput').textContent=out;saveDb();updateProgress();toast('已整理進攻鏈');
}

/* ---------- 防守鏈：缺口直接給補洞問句 ---------- */
function buildDefense(){
  const all=Object.keys(defenseFix);
  const got=checked('.defense-check');
  const miss=all.filter(x=>!got.includes(x));
  let out=`已掌握：\n${got.length?got.map((x,i)=>`${i+1}. ${x}`).join('\n'):'尚未勾選'}\n\n`;
  out+=miss.length
    ?`待補問（把這些問句帶出門）：\n${miss.map((x,i)=>`${i+1}. ${x.replace('我知道','還不知道')}\n   → ${defenseFix[x]}`).join('\n')}`
    :'防守鏈完整，可以進入方案推進。';
  out+='\n\n提醒：方案漂亮不夠，還要能成交、不被推翻、拿得到錢。';
  $('defenseOutput').textContent=out;saveDb();updateProgress();toast('已整理防守鏈');
}

/* ---------- 準備稿：已知寫答案、待問列問句 ---------- */
function buildFinalPlan(){
  const name=valueOf('custName')||db.current;
  let out=`【${name}・九宮格訪談準備稿】\n\n`;
  const askList=[];let filled=0;
  CELLS.forEach((c,i)=>{
    const st=cellState(c);const v=valueOf(c.id);
    if(st==='filled'){filled++;out+=`${i+1}. ${c.label}\n${v}\n\n`}
    else if(st==='ask'){askList.push(v||c.ask);out+=`${i+1}. ${c.label}\n待問 → ${v||c.ask}\n\n`}
    else{askList.push(c.ask);out+=`${i+1}. ${c.label}\n未知 → 建議問句：${c.ask}\n\n`}
  });
  if(valueOf('nNext'))out+=`下次拜訪 / Ending Pose\n${valueOf('nNext')}\n\n`;
  if(askList.length)out+=`── 出門要帶的問句 ──\n${askList.map((q,i)=>`${i+1}. ${q}`).join('\n')}\n\n`;
  out+=`填滿度：${filled}/7\n`;
  out+=filled===7?'九宮格已填滿——可以推進成交，或帶去跟主管討論下一步。'
      :'知道答案寫答案，不知道答案寫問句。九宮格沒填滿之前，不要空手見客戶。';
  $('finalOutput').textContent=out;saveDb();updateProgress();toast('已生成準備稿');
}
function copyText(id){const text=$(id)?.textContent||'';navigator.clipboard.writeText(text).then(()=>toast('已複製'))}
function resetAll(){
  FIELD_IDS.forEach(id=>{if($(id))$(id).value=''});
  document.querySelectorAll('input[type=checkbox]').forEach(i=>i.checked=false);
  ['attackOutput','defenseOutput','finalOutput'].forEach(id=>{if($(id))$(id).textContent=defaultOutput(id)});
  saveDb();syncAll();toast('已清空「'+db.current+'」');
}
function exportPlan(){buildFinalPlan();location.href='#homework'}

/* ---------- 進度 ---------- */
function visited(id){return localStorage.getItem(STORE+':visited:'+id)==='1'}
function markVisited(){stepIds.forEach(id=>{const el=$(id);if(!el)return;const r=el.getBoundingClientRect();if(r.top<innerHeight*.65&&r.bottom>120)localStorage.setItem(STORE+':visited:'+id,'1')})}
function progressItems(){
  const {filled,ask}=syncGrid();
  return[
   {label:'看完九宮格總覽',done:visited('map')},
   {label:'理解七大格子',done:visited('seven')},
   {label:'完成進攻鏈練習',done:!!valueOf('attackGoal')&&$('attackOutput')?.textContent.includes('進攻鏈準備')},
   {label:'完成防守鏈檢核',done:checked('.defense-check').length>=2&&$('defenseOutput')?.textContent.includes('已掌握')},
   {label:'打開問句庫',done:visited('questions')},
   {label:'看完方小姐案例',done:visited('case')},
   {label:'客戶九宮格：每格有答案或問句',done:(filled+ask)>=7&&$('finalOutput')?.textContent.includes('訪談準備稿')}
  ];
}
let shownPct=0,pctRaf=0;
function updateProgress(){
  const items=progressItems();
  const done=items.filter(x=>x.done).length;
  const pct=Math.round(done/items.length*100);
  $('progressBar').style.width=pct+'%';$('navProgressBar').style.width=pct+'%';
  $('progressList').innerHTML=items.map(x=>`<div class="progress-item ${x.done?'done':''}">${esc(x.label)}</div>`).join('');
  if(reduceMotion||pct===shownPct){
    shownPct=pct;$('progressText').textContent=pct+'%';$('navProgressText').textContent=pct+'%';return;
  }
  cancelAnimationFrame(pctRaf);
  const start=shownPct,t0=performance.now();
  (function tick(t){
    const k=Math.min((t-t0)/480,1);
    const v=Math.round(start+(pct-start)*(1-Math.pow(1-k,3)));
    $('progressText').textContent=v+'%';$('navProgressText').textContent=v+'%';
    if(k<1)pctRaf=requestAnimationFrame(tick);else shownPct=pct;
  })(t0);
}
function syncAll(){syncGrid();updateProgress()}

/* ---------- 問句庫 ---------- */
function renderQuestions(tab='goal'){
  document.querySelectorAll('.question-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.qtab===tab));
  const qp=$('questionPanel');
  const paint=()=>{qp.innerHTML=qData[tab].map(([q,why])=>`<div class="q-item"><b>${esc(q)}</b><p>目的：${esc(why)}</p><button class="btn btn-soft compact" onclick="navigator.clipboard.writeText('${q.replace(/'/g,"\\'")}').then(()=>toast('問句已複製'))">複製問句</button></div>`).join('')};
  if(reduceMotion){paint();return}
  qp.classList.add('swap');
  setTimeout(()=>{paint();qp.classList.remove('swap')},80);
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  loadDb();renderCustomers();applyProfile();renderQuestions();

  $('custSelect')?.addEventListener('change',e=>switchCustomer(e.target.value));
  document.querySelectorAll('.mini').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.mini').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');showPanel(b.dataset.panel);
  }));
  document.querySelectorAll('.question-tabs button').forEach(b=>b.addEventListener('click',()=>renderQuestions(b.dataset.qtab)));
  [...document.querySelectorAll('input,textarea,select')].forEach(el=>el.addEventListener('input',()=>{saveDb();syncAll()}));
  document.querySelectorAll('.defense-check,.chip input').forEach(el=>el.addEventListener('change',()=>{saveDb();syncAll()}));
  window.addEventListener('scroll',()=>{markVisited();updateProgress()},{passive:true});

  /* 捲動進場動畫 */
  const sel='.card,.skill-row article,.flow-item,.flow-arrow,.case-card,.case-lab,.quote-wall article,.nine-card,.section-lead,.center-head,.dashboard,.builder,.workshop,.question-panel,.question-tabs,.nf-cell,.customer-bar,.lesson-actions,.final-output';
  if(!reduceMotion&&'IntersectionObserver' in window){
    const els=[...document.querySelectorAll(sel)];
    const counters=new Map();
    els.forEach(el=>{
      el.classList.add('reveal');
      const p=el.parentElement,i=counters.get(p)||0;
      el.style.setProperty('--d',(Math.min(i,7)*.07)+'s');counters.set(p,i+1);
    });
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -40px 0px'});
    els.forEach(el=>io.observe(el));
  }
  /* scrollspy */
  const links=[...document.querySelectorAll('.nav-links a')];
  const secs=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function spy(){let cur=null;secs.forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.42)cur=s});links.forEach(a=>a.classList.toggle('active',!!cur&&a.getAttribute('href')==='#'+cur.id))}
  addEventListener('scroll',spy,{passive:true});spy();
  /* 回到頂部 */
  const top=document.createElement('button');
  top.className='to-top no-print';top.setAttribute('aria-label','回到頂部');top.textContent='↑';
  top.onclick=()=>scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});
  document.body.appendChild(top);
  addEventListener('scroll',()=>top.classList.toggle('show',scrollY>600),{passive:true});

  markVisited();syncAll();
});
