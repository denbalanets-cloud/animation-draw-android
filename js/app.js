/* AnimDraw — покадровая анимация в браузере. */

const $=i=>document.getElementById(i);
let W=960, H=540, bgColor='#ffffff', dpi=72;
const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
const DEF=()=>[{n:'Заливка',v:1,o:1,bm:'source-over',al:0,cl:0},{n:'Лайн',v:1,o:1,bm:'source-over',al:0,cl:0}];
let LS=DEF().map(L=>({...L,c:[mk()]}));
const BM=[['source-over','Нормальный'],['multiply','Умножение'],['screen','Экран'],['overlay','Перекрытие'],['darken','Темнее'],['lighten','Светлее'],['color-dodge','Осветление'],['color-burn','Затемнение']];

let cur=0, act=1, ref=1, tool='brush', color='#000000', size=6, hard=1, tol=40, gap=4, grow=2, onion=true, fps=12, playing=false, pend=null, clip=null, lpOn=false, jrOn=false, tlOn=true, bo=1, rot=0, pid='p'+Date.now(), name='Проект 1';

const U=[], R=[], TL=[['brush','Кисть'],['eraser','Ластик'],['fill','Заливка'],['transform','Трансформ'],['hand','Рука']];
const PAL=['#000000','#ffffff','#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#757575'];
const cv=$('cv'), cx=cv.getContext('2d'); let z=1, px=0, py=0, fitted=false;
const lc=()=>{const c=LS[act].c;return c[cur%c.length].getContext('2d')};

// --- Функции меню ---
function showStart() {
    $('start-screen').style.display = 'flex';
    $('new-canvas-screen').style.display = 'none';
    $('gallery-screen').style.display = 'none';
    $('app-ui').style.display = 'none';
}
function openNewCanvas() {
    $('start-screen').style.display = 'none';
    $('new-canvas-screen').style.display = 'flex';
}
async function openGallery() {
    $('start-screen').style.display = 'none';
    $('gallery-screen').style.display = 'flex';
    const all = (await dbDo('readonly', s => s.getAll())) || [];
    all.sort((a,b) => b.updated - a.updated);
    $('gal-list').innerHTML = all.length ? all.map(p => `
        <div class="gal-item">
            <img src="${p.preview || ''}" alt="preview">
            <div class="gal-info">
                <div>
                    <strong>${p.name}</strong><br>
                    <small>${new Date(p.updated).toLocaleDateString()}</small>
                </div>
                <div>
                    <button onclick="loadProject('${p.id}')">Открыть</button>
                    <button onclick="deleteProject('${p.id}')">Удалить</button>
                </div>
            </div>
        </div>
    `).join('') : '<p style="padding:20px;">Нет сохранённых проектов</p>';
}
async function loadProject(id) {
    const p = await dbDo('readonly', s => s.get(id));
    if (p) { await loadP(p); }
}
async function deleteProject(id) {
    if(confirm('Удалить проект?')) {
        await dbDo('readwrite', s => s.delete(id));
        openGallery();
    }
}
function createNewCanvas() {
    W = parseInt($('nc-w').value) || 960;
    H = parseInt($('nc-h').value) || 540;
    dpi = parseInt($('nc-dpi').value) || 72;
    bgColor = $('nc-bg').value;
    
    LS = DEF().map(L => ({...L, c: [mk()]}));
    // Заливаем фон в первый слой (Заливка)
    const ctx = LS[0].c[0].getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    act = 1; ref = 1; cur = 0; pid = 'p' + Date.now(); name = 'Проект ' + new Date().toLocaleTimeString().slice(0,5);
    $('nm').value = name;
    U.length = 0; R.length = 0;
    
    $('new-canvas-screen').style.display = 'none';
    $('app-ui').style.display = 'flex';
    
    fitted = false;
    ui(); fit(); tl(); changed();
}
async function openLastProject() {
    let last = null;
    try { last = localStorage.getItem('animdraw_last'); } catch(e) {}
    if (last) {
        const p = await dbDo('readonly', s => s.get(last));
        if (p) { await loadP(p); return; }
    }
    alert('Нет прошлых проектов');
}

// --- Основная логика ---
function fit(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;if(!fitted&&r.width){z=Math.min(r.width/W,r.height/H)*.95;px=(r.width-W*z)/2;py=(r.height-H*z)/2;fitted=true}render()}
function drawF(c,f,pd){f.l.forEach((l,i)=>{const L=LS[i];if(!L.v)return;let s=l;if(L.cl&&i>0){s=mk();const t=s.getContext('2d');t.drawImage(l,0,0);t.globalCompositeOperation='destination-in';t.drawImage(f.l[i-1],0,0)}c.save();c.globalAlpha*=L.o;c.globalCompositeOperation=L.bm;if(pd&&i===act)c.transform(pd.a,pd.b,pd.c,pd.d,pd.e,pd.f);c.drawImage(s,0,0);c.restore()})}
const B=(a,t,v,on)=>`<button data-a="${a}"${v!==undefined?` data-v="${v}"`:''}${on?' class="on"':''}>${t}</button>`;
const S=(k,t,mn,mx,v)=>`<label>${t}<span><input type=number inputmode=numeric data-s=${k} min=${mn} max=${mx} value=${v}>${{size:' px',bo:' %',hard:' %',gap:' px',grow:' px'}[k]||''}</span></label>`;

function ui(){
 $('act').innerHTML=B('undo','Отмена')+B('redo','Повтор')+B('jr','Журнал',undefined,jrOn)+(pend?B('commit','Применить',undefined,1)+B('cancelT','Сброс'):'')+B('menuBack','Меню'); 
 $('menu').innerHTML=B('projects','Проекты')+B('rr','Сброс')+B('lay','Слои',undefined,lpOn)+B('tlt','Кадры',undefined,tlOn);
 $('tc').style.display=tlOn?'flex':'none';$('fr').style.display=tlOn?'block':'none';
 $('sb').innerHTML=SB();$('opt').innerHTML=''+
  (tool==='brush'||tool==='eraser'?S('hard','Жёсткость',0,100,Math.round(hard*100)):'')+
  (tool==='fill'?S('tol','Порог',0,255,tol)+S('gap','Закрыть пробелы',0,12,gap)+S('grow','Расширить',0,4,grow)+B('ref','Границы: '+LS[ref].n):'');
 $('tools').innerHTML=TL.map(([k,t])=>B('tool',t,k,tool===k)).join('');
 $('tc').innerHTML=B('first','В начало')+B('play',playing?'Пауза':'Играть')+B('add','+ Кадр')+B('dup','Дубль')+B('copy','Копия')+B('paste','Вставить')+B('del','Удалить')+B('left','Сдвиг влево')+B('right','Сдвиг вправо')+B('onion','Калька',undefined,onion)+B('fps','FPS '+fps)+`<label>Кадров слоя<span><input type=number data-s=lc min=1 max=500 value=${LS[act].c.length}></span></label>`;lpr();jpr()
}

let st;function changed(){render();tl();clearTimeout(st);st=setTimeout(save,1500);$('st').textContent='…';if(jrOn)jpr()}
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));

function fill(p){const x0=p.x|0,y0=p.y|0;if(x0<0||y0<0||x0>=W||y0>=H)return;push('Заливка');
 const rf=F(cur).l[ref].getContext('2d').getImageData(0,0,W,H).data,N=W*H,si=y0*W+x0,s=si*4,ba=rf[s+3];
 const bl=new Uint8Array(N);for(let i=0;i<N;i++){const j=i*4,a=rf[j+3];bl[i]=(!a&&!ba)?0:(Math.max(Math.abs(rf[j]-rf[s]),Math.abs(rf[j+1]-rf[s+1]),Math.abs(rf[j+2]-rf[s+2]),Math.abs(a-ba))>tol?1:0)}
 const ex=(m,r,al)=>{for(let k=0;k<r;k++){const n=m.slice();for(let i=0;i<N;i++){if(!m[i])continue;const x=i%W;if(x>0&&(!al||al[i-1]))n[i-1]=1;if(x<W-1&&(!al||al[i+1]))n[i+1]=1;if(i>=W&&(!al||al[i-W]))n[i-W]=1;if(i<N-W&&(!al||al[i+W]))n[i+W]=1}m=n}return m};
 let wl=gap?ex(bl,gap):bl;if(wl[si])wl=bl;
 let rg=new Uint8Array(N);const q=new Int32Array(N);let hd=0,t=0;rg[si]=1;q[t++]=si;
 const add=n=>{if(!rg[n]&&!wl[n]){rg[n]=1;q[t++]=n}};
 while(hd<t){const i=q[hd++],x=i%W;if(x>0)add(i-1);if(x<W-1)add(i+1);if(i>=W)add(i-W);if(i<N-W)add(i+W)}
 if(gap){const al=new Uint8Array(N);for(let i=0;i<N;i++)al[i]=bl[i]?0:1;rg=ex(rg,gap,al)}
 if(grow)rg=ex(rg,grow);
 const c=lc(),im=c.getImageData(0,0,W,H),d=im.data,col=hex(color);
 for(let i=0;i<N;i++)if(rg[i]){const j=i*4;d[j]=col[0];d[j+1]=col[1];d[j+2]=col[2];d[j+3]=255}
 c.putImageData(im,0,0);changed()}

// ---- ввод ----
const ptr=new Map();let drawing=null,start=null,moved=0,multi=false,d0=null;
const pt=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const toC=p=>{const dx=p.x-px,dy=p.y-py,cs=Math.cos(-rot),sn=Math.sin(-rot);return{x:(dx*cs-dy*sn)/z,y:(dx*sn+dy*cs)/z}};
const pr=e=>e.pointerType==='pen'?Math.max(.1,e.pressure):1;

function seg(a,b,w){const c=lc();c.lineCap=c.lineJoin='round';c.globalCompositeOperation=tool==='eraser'?'destination-out':LS[act].al?'source-atop':'source-over';c.globalAlpha=bo;c.strokeStyle=c.fillStyle=color;c.lineWidth=w;c.shadowBlur=hard<1?size*(1-hard):0;c.shadowColor=color;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x+.01,b.y);c.stroke();c.globalCompositeOperation='source-over';c.globalAlpha=1;c.shadowBlur=0}
function two(){const [a,b]=[...ptr.values()];return{c:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},d:Math.hypot(a.x-b.x,a.y-b.y)||1,a:Math.atan2(b.y-a.y,b.x-a.x)}}

cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,pt(e));
 if(ptr.size===1){multi=false;moved=0;start=pt(e);if(tool==='brush'||tool==='eraser'){push(tool==='eraser'?'Ластик':'Кисть');drawing=toC(start);seg(drawing,drawing,size*pr(e));render()}}
 else{multi=true;if(drawing){drawing=null;const u=U.pop();if(u)u.k.getContext('2d').putImageData(u.d,0,0);render()}d0=two()}};

cv.onpointermove=e=>{if(!ptr.has(e.pointerId))return;const o=ptr.get(e.pointerId),n=pt(e);ptr.set(e.pointerId,n);
 if(ptr.size>=2){const s=two(),k=s.d/d0.d;
  if(tool==='transform'){const c=toC(d0.c);const t1=toC(s.c),t0=toC(d0.c);pend=new DOMMatrix().translate(t1.x-t0.x,t1.y-t0.y).translate(c.x,c.y).rotate((s.a-d0.a)*180/Math.PI).scale(k).translate(-c.x,-c.y).multiply(pend||new DOMMatrix())}
  else{const q=toC(d0.c);z=Math.min(16,Math.max(.1,z*k));rot+=s.a-d0.a;const cs=Math.cos(rot),sn=Math.sin(rot);px=s.c.x-z*(q.x*cs-q.y*sn);py=s.c.y-z*(q.x*sn+q.y*cs)}
  d0=s;render();return}
 if(multi)return;
 if(Math.hypot(n.x-start.x,n.y-start.y)>12)moved=1;
 if(drawing){const p=toC(n);seg(drawing,p,size*pr(e));drawing=p;render()}
 else if(tool==='transform'){pend=new DOMMatrix().translate(toC(n).x-toC(o).x,toC(n).y-toC(o).y).multiply(pend||new DOMMatrix());render();ui()}
 else if(tool==='hand'){px+=n.x-o.x;py+=n.y-o.y;render()}};

cv.onpointerup=cv.onpointercancel=e=>{ptr.delete(e.pointerId);if(ptr.size)return;
 if(drawing){drawing=null;changed()}else if(tool==='fill'&&!multi&&!moved&&start)fill(toC(start));if(pend)ui()};

// ---- действия ----
const A={
 tool:v=>{tool=v;ui()},color:v=>{color=v;ui()},lay:()=>{lpOn=!lpOn;ui()},rr:()=>{rot=0;fitted=false;fit()},eye:v=>{LS[v].v=+!LS[v].v;ui();render();tl()},ref:()=>{ref=(ref+1)%LS.length;ui()},lcl:()=>{LS[act].cl=+!LS[act].cl;ui();render();tl()},lal:()=>{LS[act].al=+!LS[act].al;ui()},lup:()=>lm(1),ldn:()=>lm(-1),
 undo:()=>undo(),redo:()=>redo(),jr:()=>{jrOn=!jrOn;ui()},jgo:v=>{const t=+v;while(U.length>t)undo();while(U.length<t&&R.length)redo();jpr()},tlt:()=>{tlOn=!tlOn;ui();fit()},
 commit:()=>{if(!pend)return;push('Трансформ');const c=lc(),t=mk();t.getContext('2d').drawImage(c.canvas,0,0);c.clearRect(0,0,W,H);c.save();c.transform(pend.a,pend.b,pend.c,pend.d,pend.e,pend.f);c.drawImage(t,0,0);c.restore();pend=null;ui();changed()},
 cancelT:()=>{pend=null;ui();render()},
 onion:()=>{onion=!onion;ui();render()},fps:()=>{fps={6:8,8:12,12:24,24:6}[fps]||12;ui();save()},
 play:()=>{playing=!playing;ui();if(playing)tick();else render()},
 projects:openList,close:()=>$('pl').style.display='none',
 openp:async v=>{const p=await dbDo('readonly',s=>s.get(v));if(p){await save();await loadP(p);A.close()}},
 delp:async v=>{await dbDo('readwrite',s=>s.delete(v));openList()},
 savef:async()=>{const ok=await saveFile((name||'project')+'.json',JSON.stringify(await ser()));$('st').textContent=ok?'Файл сохранён':'Отменено'},
 openf:()=>$('fi').click(),
 menuBack:()=>{save(); showStart()}
};

function SB(){return `<input type=color data-s=col value=${color} class=cc>`+PAL.map(c=>`<button class='sw${c===color?' on':''}' style='background:${c}' data-a=color data-v=${c}></button>`).join('')+`<label>px<input type=number data-s=size min=1 max=500 value=${size}></label><label>%<input type=number data-s=bo min=1 max=100 value=${Math.round(bo*100)}></label>`}
function jpr(){const p=$('jp');if(!jrOn){p.style.display='none';return}p.style.display='block';const all=U.map(u=>u.n).concat(R.slice().reverse().map(r=>r.n));p.innerHTML=all.length?all.map((n,i)=>`<div class=pi style='opacity:${i<U.length?1:.5}'>`+B('jgo',(i+1)+'. '+n,i+1,i+1===U.length)+`</div>`).join(''):'<p>Журнал пуст</p>'}
function lpr(){const p=$('lp');if(!lpOn){p.style.display='none';return}const L=LS[act];p.style.display='block';
 p.innerHTML=`<div class='row' style='padding:0 0 6px'>`+B('ladd','+')+B('ldel','Удалить')+B('lup','↑')+B('ldn','↓')+B('lcl','Обрезка',undefined,L.cl)+B('lal','Альфа',undefined,L.al)+`</div><label style='align-items:stretch;margin-bottom:6px'>Непрозрачность ${Math.round(L.o*100)}%<input type=number data-s=lo min=0 max=100 value=${Math.round(L.o*100)}></label><select data-s=bm>`+BM.map(([k,t])=>`<option value=${k}${k===L.bm?' selected':''}>${t}</option>`).join('')+`</select>`+LS.map((l,i)=>i).reverse().map(i=>`<div class=pi>`+B('eye',LS[i].v?'Вкл':'Выкл',i)+`<button data-a=layer data-v=${i}${i===act?' class=on':''} style='flex:1;text-align:left'>${LS[i].n}</button></div>`).join('')}

document.onclick=e=>{const b=e.target.closest('[data-a]');if(b)A[b.dataset.a](b.dataset.v)};
document.oninput=e=>{const k=e.target.dataset.s;if(!k)return;if(e.target.value==='')return;const v=+e.target.value;({size:()=>size=Math.max(1,v),hard:()=>hard=Math.min(1,Math.max(0,v/100)),tol:()=>tol=v,gap:()=>gap=v,grow:()=>grow=v,bo:()=>bo=Math.min(1,Math.max(.01,v/100)),col:()=>{color=e.target.value},lc:()=>{},lo:()=>{LS[act].o=v/100;render();tl()},bm:()=>{LS[act].bm=e.target.value;render();tl()}})[k]()};
$('nm').oninput=e=>{name=e.target.value;changed()};

// ---- сохранение проекта ----
const dbp=new Promise(r=>{try{const q=indexedDB.open('animdraw',1);q.onupgradeneeded=()=>q.result.createObjectStore('p',{keyPath:'id'});q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
async function dbDo(m,fn){const d=await dbp;if(!d)return null;return new Promise(r=>{try{const t=d.transaction('p',m),q=fn(t.objectStore('p'));t.oncomplete=()=>r(q&&q.result);t.onerror=()=>r(null)}catch(e){r(null)}})}
const img=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(i);i.src=s});

async function save(){const d=await ser();const ok=await dbDo('readwrite',s=>s.put(d));try{localStorage.setItem('animdraw_last',pid)}catch(e){}$('st').textContent=ok===null?'Не сохранено':'Сохранено'}

async function openList(){const all=(await dbDo('readonly',s=>s.getAll()))||[];all.sort((a,b)=>b.updated-a.updated);
 $('pc').innerHTML=B('newp','+ Новый проект')+B('savef','Сохранить файл')+B('openf','Открыть файл')+B('png','PNG кадра')+B('close','Закрыть')+(all.length?all.map(p=>`<div class="pi"><span>${p.name.replace(/</g,'&lt;')} · ${p.n||(p.frames||[]).length} кадр.</span>${B('openp','Открыть',p.id)}${B('delp','Удалить',p.id)}</div>`).join(''):'<p>Сохранённых проектов пока нет.</p>');$('pl').style.display='flex'}

$('fi').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const p=JSON.parse(await f.text());if(!Array.isArray(p.frames)&&!Array.isArray(p.ls))throw 0;p.id='p'+Date.now();await save();await loadP(p);save()}catch(x){$('st').textContent='Неверный файл'}};

async function saveFile(filename,data){
 try{if(typeof claude!=='undefined'&&claude.use){const dl=await claude.use('downloads');if(dl){await dl.save({filename,data});return true}}}catch(e){if(e&&e.code==='declined')return false}
 const blob=data instanceof Blob?data:new Blob([data],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return true}

const cp=c=>{const n=mk();n.getContext('2d').drawImage(c,0,0);return n},ci=()=>cur%LS[act].c.length,K=()=>LS[act].c;
function T(){return Math.max(...LS.map(L=>L.c.length))}
function F(t){return{l:LS.map(L=>L.c[((t%L.c.length)+L.c.length)%L.c.length])}}
function setLen(i,n){const c=LS[i].c;while(c.length<n)c.push(mk());while(c.length>n)c.pop();cur=Math.min(cur,T()-1);ui();changed()}
function hl(){document.querySelectorAll('#fr canvas').forEach(c=>{const[i,t]=c.dataset.v.split(',').map(Number);c.className='th'+(t===cur&&i===act?' on':t===cur?' cc2':'')+(t<LS[i].c.length?'':' dim')})}
function render(){const d=devicePixelRatio||1;cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);cx.setTransform(d,0,0,d,0,0);cx.translate(px,py);cx.rotate(rot);cx.scale(z,z);cx.fillStyle='#fff';cx.fillRect(0,0,W,H);
 if(onion&&!playing){const c=K(),n=c.length;if(n>1){cx.globalAlpha=.25;cx.drawImage(c[((cur-1)%n+n)%n],0,0);cx.globalAlpha=1}}
 drawF(cx,F(cur),pend)}
function tl(){const r=$('fr'),n=T();let h='';for(let i=LS.length-1;i>=0;i--){const L=LS[i];h+=`<div class=lr><div class='ln${i===act?' on':''}' data-a=layer data-v=${i}>${L.n.slice(0,7)}<small>${L.c.length} кадр.</small></div>`;for(let t=0;t<n;t++)h+=`<canvas class='th${t===cur&&i===act?' on':t===cur?' cc2':''}${t<L.c.length?'':' dim'}' width=48 height=27 data-a=cell data-v=${i},${t}></canvas>`;h+='</div>'}
 r.innerHTML=h;r.querySelectorAll('canvas').forEach(c=>{const[i,t]=c.dataset.v.split(',').map(Number),L=LS[i],x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,48,27);x.drawImage(L.c[t%L.c.length],0,0,48,27)})}
function tick(){if(!playing)return;cur=(cur+1)%T();render();hl();setTimeout(tick,1000/fps)}
function push(n){R.length=0;const c=lc();U.push({k:c.canvas,n:n||'Действие',d:c.getImageData(0,0,W,H)});if(U.length>20)U.shift()}
function undo(){const u=U.pop();if(!u)return;const c=u.k.getContext('2d');R.push({k:u.k,n:u.n,d:c.getImageData(0,0,W,H)});c.putImageData(u.d,0,0);changed()}
function redo(){const r=R.pop();if(!r)return;const c=r.k.getContext('2d');U.push({k:r.k,n:r.n,d:c.getImageData(0,0,W,H)});c.putImageData(r.d,0,0);changed()}
function lm(d){const j=act+d;if(j<0||j>=LS.length)return;[LS[act],LS[j]]=[LS[j],LS[act]];act=j;U.length=0;ui();changed()}

async function ser(){
    const previewCv = mk();
    const pCtx = previewCv.getContext('2d');
    pCtx.fillStyle = '#fff';
    pCtx.fillRect(0, 0, W, H);
    drawF(pCtx, F(cur));
    const preview = previewCv.toDataURL('image/jpeg', 0.3);
    return {
        id: pid, name, fps, n: T(), updated: Date.now(),
        w: W, h: H, preview: preview,
        ls: LS.map(L => ({n: L.n, v: L.v, o: L.o, bm: L.bm, al: L.al, cl: L.cl, c: L.c.map(x => x.toDataURL())}))
    };
}

async function loadP(p){
    W = p.w || 960; H = p.h || 540;
    const old = !(p.ls && p.ls[0] && p.ls[0].c);
    const src = (p.ls && p.ls.length ? p.ls : DEF()).map((L, i) => old ? {...L, c: (p.frames || []).map(fr => fr[i]).filter(Boolean)} : L);
    const out = [];
    for(const L of src){const cs=[];for(const u of(L.c && L.c.length ? L.c : [null])){const k=mk();if(u)k.getContext('2d').drawImage(await img(u),0,0);cs.push(k)}out.push({n:L.n,v:L.v,o:L.o,bm:L.bm,al:L.al,cl:L.cl,c:cs})}
    LS.length=0;out.forEach(L=>LS.push(L));
    act=Math.min(act,LS.length-1);ref=Math.min(ref,LS.length-1);cur=0;
    name=p.name||'Проект'; pid=p.id; fps=p.fps||12; $('nm').value=name;
    U.length=0; R.length=0;
    $('start-screen').style.display = 'none';
    $('gallery-screen').style.display = 'none';
    $('app-ui').style.display = 'flex';
    fitted = false;
    ui(); fit(); tl(); changed();
}

Object.assign(A,{
 first:()=>{cur=0;changed()},
 cell:v=>{const[i,t]=v.split(',').map(Number);act=i;cur=t;ui();changed()},
 layer:v=>{act=+v;ui();tl()},
 add:()=>{const k=ci();K().splice(k+1,0,mk());cur=k+1;ui();changed()},
 dup:()=>{const k=ci();K().splice(k+1,0,cp(K()[k]));cur=k+1;ui();changed()},
 copy:()=>{clip=cp(K()[ci()])},
 paste:()=>{if(!clip)return;const k=ci();K().splice(k+1,0,cp(clip));cur=k+1;ui();changed()},
 del:()=>{const c=K();if(c.length<2)return;const k=ci();c.splice(k,1);cur=Math.min(k,c.length-1);ui();changed()},
 left:()=>{const c=K(),k=ci();if(k<1)return;[c[k],c[k-1]]=[c[k-1],c[k]];cur=k-1;changed()},
 right:()=>{const c=K(),k=ci();if(k>=c.length-1)return;[c[k],c[k+1]]=[c[k+1],c[k]];cur=k+1;changed()},
 ladd:()=>{LS.splice(act+1,0,{n:'Слой '+(LS.length+1),v:1,o:1,bm:'source-over',al:0,cl:0,c:Array.from({length:T()},()=>mk())});act++;U.length=0;ui();changed()},
 ldel:()=>{if(LS.length<2)return;LS.splice(act,1);act=Math.min(act,LS.length-1);ref=Math.min(ref,LS.length-1);cur=Math.min(cur,T()-1);U.length=0;ui();changed()},
 newp:async()=>{await save();LS.length=0;DEF().forEach(L=>LS.push({...L,c:[mk()]}));act=1;ref=1;cur=0;pid='p'+Date.now();name='Проект '+new Date().toLocaleTimeString().slice(0,5);$('nm').value=name;U.length=0;R.length=0;A.close();ui();changed();save()},
 png:()=>{const o=mk(),c=o.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);drawF(c,F(cur));o.toBlob(b=>saveFile(name+'_'+(cur+1)+'.png',b))}
});

document.onchange=e=>{if(e.target.dataset.s==='lc'&&e.target.value!=='')setLen(act,Math.max(1,Math.min(500,e.target.value|0)))};
addEventListener('resize',fit);

(async()=>{
    showStart();
})();
