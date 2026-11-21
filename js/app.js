const $=i=>document.getElementById(i);
let W=960, H=540, bgColor='#ffffff', dpi=72;
const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
const DEF=()=>[{n:'Заливка',v:1,o:1,bm:'source-over',al:0,cl:0},{n:'Лайн',v:1,o:1,bm:'source-over',al:0,cl:0}];
let LS=DEF().map(L=>({...L,c:[mk()]}));
const BM=[['source-over','Нормальный'],['multiply','Умножение'],['screen','Экран'],['overlay','Перекрытие'],['darken','Темнее'],['lighten','Светлее'],['color-dodge','Осветление'],['color-burn','Затемнение']];

let cur=0, act=1, ref=1, tool='brush', color='#000000', size=6, hard=1, tol=40, gap=4, grow=2, onion=true, fps=12, playing=false, pend=null, clip=null, lpOn=false, jrOn=false, tlOn=true, bo=1, rot=0, pid='p'+Date.now(), name='Проект 1';
let selMode='rect', selOp='add', shape='rect', shapeFill=false, shapeRadius=0;
let selection=null; 

const U=[], R=[];
const PAL=['#000000','#ffffff','#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#757575'];
const cv=$('cv'), cx=cv.getContext('2d'); let z=1, px=0, py=0, fitted=false;
const lc=()=>{const c=LS[act].c;return c[cur%c.length].getContext('2d')};

const IC={
 brush:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.9959.9959 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.9959.9959 0 000-1.41z"/></svg>',
 eraser:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83L5.74 20.7c.39.39.9.59 1.41.59.51 0 1.02-.2 1.41-.59l11.14-11.14c.39-.39.59-.9.59-1.41 0-.51-.2-1.02-.59-1.41l-3.15-3.15c-.39-.39-.9-.59-1.41-.59zM5.74 19.29L3.3 16.85l5.66-5.66 2.44 2.44-5.66 5.66z"/></svg>',
 fill:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/></svg>',
 shapes:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM17.5 13a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/></svg>',
 gradient:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v10H7V7zm2 2v6h6V9H9zm2 2h2v2h-2v-2z"/></svg>',
 select:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h4v2H5v2H3V3zm14 0h4v4h-2V5h-2V3zM3 17h2v2h2v2H3v-4zm16 0v2h-2v2h4v-4h-2zM8 3h8v2H8V3zM3 8v8h2V8H3zm16 0v8h2V8h-2zM8 19h8v2H8v-2z"/></svg>',
 wand:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7l2.5-1.4zm12 4.8L17 9l1.4 2.5L17 14l2.5-1.4L22 14l-1.4-2.5L22 9l-2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zM3.5 11l1 1.5L3.5 14l1.5-1 1.5 1-1-1.5L5.5 11l-1.5 1-1.5-1zm7.6-3.3l1.6 1.2-1.2 1.6-1.6-1.2 1.2-1.6zm-5.3 9.9l9.7-9.7 1.4 1.4-9.7 9.7-1.4-1.4z"/></svg>',
 transform:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l4 4h-3v12h3l-4 4-4-4h3V6H8l4-4z"/></svg>',
 hand:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 24c-3.26 0-6.19-1.99-7.4-5.02l-3.03-7A2 2 0 014.42 10l1.75.84a2 2 0 011.1 2.63l-.44 1.2C7.99 14 8.9 13 10 13V5a2 2 0 114 0v6h1V4a2 2 0 114 0v7h1V5a2 2 0 114 0v8h1V8a2 2 0 114 0v9c0 3.86-3.14 7-7 7h-5z"/></svg>'
};

const TL=[['brush',IC.brush,'Кисть'],['eraser',IC.eraser,'Ластик'],['fill',IC.fill,'Заливка'],['shapes',IC.shapes,'Фигуры'],['gradient',IC.gradient,'Градиент'],['select',IC.select,'Выделение'],['wand',IC.wand,'Палочка'],['transform',IC.transform,'Трансформ'],['hand',IC.hand,'Рука']];

function showStart() { $('start-screen').style.display = 'flex'; $('new-canvas-screen').style.display = 'none'; $('gallery-screen').style.display = 'none'; $('app-ui').style.display = 'none'; }
function openNewCanvas() { $('start-screen').style.display = 'none'; $('new-canvas-screen').style.display = 'flex'; }
async function openGallery() {
    $('start-screen').style.display = 'none'; $('gallery-screen').style.display = 'flex';
    const all = (await dbDo('readonly', s => s.getAll())) || [];
    all.sort((a,b) => b.updated - a.updated);
    $('gal-list').innerHTML = all.length ? all.map(p => `
        <div class="gal-item">
            <img src="${p.preview || ''}" alt="preview">
            <div class="gal-info">
                <div><strong>${p.name}</strong><br><small>${new Date(p.updated).toLocaleDateString()}</small></div>
                <div><button onclick="loadProject('${p.id}')">Открыть</button><button onclick="deleteProject('${p.id}')">Удалить</button></div>
            </div>
        </div>
    `).join('') : '<p style="padding:20px;">Нет сохранённых проектов</p>';
}
async function loadProject(id) { const p = await dbDo('readonly', s => s.get(id)); if (p) { await loadP(p); } }
async function deleteProject(id) { if(confirm('Удалить проект?')) { await dbDo('readwrite', s => s.delete(id)); openGallery(); } }
function createNewCanvas() {
    W = parseInt($('nc-w').value) || 960; H = parseInt($('nc-h').value) || 540; dpi = parseInt($('nc-dpi').value) || 72; bgColor = $('nc-bg').value;
    LS = DEF().map(L => ({...L, c: [mk()]}));
    const ctx = LS[0].c[0].getContext('2d'); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, W, H);
    act = 1; ref = 1; cur = 0; pid = 'p' + Date.now(); name = 'Проект ' + new Date().toLocaleTimeString().slice(0,5);
    $('nm').value = name; U.length = 0; R.length = 0; $('new-canvas-screen').style.display = 'none'; $('app-ui').style.display = 'flex'; fitted = false;
    ui(); fit(); tl(); changed();
}
async function openLastProject() {
    let last = null; try { last = localStorage.getItem('animdraw_last'); } catch(e) {}
    if (last) { const p = await dbDo('readonly', s => s.get(last)); if (p) { await loadP(p); return; } }
    alert('Нет прошлых проектов');
}

function fit(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;if(!fitted&&r.width){z=Math.min(r.width/W,r.height/H)*.95;px=(r.width-W*z)/2;py=(r.height-H*z)/2;fitted=true}render()}
function drawF(c,f,pd){f.l.forEach((l,i)=>{const L=LS[i];if(!L.v)return;let s=l;if(L.cl&&i>0){s=mk();const t=s.getContext('2d');t.drawImage(l,0,0);t.globalCompositeOperation='destination-in';t.drawImage(f.l[i-1],0,0)}c.save();c.globalAlpha*=L.o;c.globalCompositeOperation=L.bm;if(pd&&i===act)c.transform(pd.a,pd.b,pd.c,pd.d,pd.e,pd.f);c.drawImage(s,0,0);c.restore()})}
const B=(a,t,v,on)=>`<button data-a="${a}"${v!==undefined?` data-v="${v}"`:''}${on?' class="on"':''} title="${typeof t === 'string' && t.startsWith('<svg') ? '' : t}">${t}</button>`;
const S=(k,t,mn,mx,v)=>`<label>${t}<span><input type=number inputmode=numeric data-s=${k} min=${mn} max=${mx} value=${v}>${{size:' px',bo:' %',hard:' %',gap:' px',grow:' px',shapeRadius:' %'}[k]||''}</span></label>`;

function ui(){
 $('act').innerHTML=B('undo','Отмена')+B('redo','Повтор')+B('jr','Журнал',undefined,jrOn)+(pend?B('commit','Применить',undefined,1)+B('cancelT','Сброс'):'')+B('menuBack','Меню'); 
 $('menu').innerHTML=B('projects','Проекты')+B('rr','Сброс')+B('lay','Слои',undefined,lpOn)+B('tlt','Кадры',undefined,tlOn)+B('toggleUI','Скрыть панели');
 $('tc').style.display=tlOn?'flex':'none';$('fr').style.display=tlOn?'block':'none';
 $('sb').innerHTML=SB();
 let opt='';
 if(tool==='brush'||tool==='eraser') opt=S('hard','Жёсткость',0,100,Math.round(hard*100));
 else if(tool==='fill') opt=S('tol','Порог',0,255,tol)+S('gap','Закрыть пробелы',0,12,gap)+S('grow','Расширить',0,4,grow)+B('ref','Границы: '+LS[ref].n);
 else if(tool==='shapes') opt=B('shape_rect','Квадрат',undefined,shape==='rect')+B('shape_circle','Круг',undefined,shape==='circle')+B('shape_poly','Полигон',undefined,shape==='poly')+B('shape_fill','Заливка',undefined,shapeFill)+S('shapeRadius','Скругление',0,100,shapeRadius);
 else if(tool==='select') opt=B('sel_rect','Прямоуг',undefined,selMode==='rect')+B('sel_lasso','Лассо',undefined,selMode==='lasso')+B('sel_add','+',undefined,selOp==='add')+B('sel_sub','-',undefined,selOp==='sub');
 else if(tool==='wand') opt=S('tol','Порог',0,255,tol)+S('gap','Закрыть пробелы',0,12,gap)+S('grow','Расширить',0,4,grow)+B('wand_scope','Слой/Холст',undefined,false);
 $('opt').innerHTML=opt;
 $('tools').innerHTML=TL.map(([k,ico,t])=>B('tool',ico,k,tool===k)).join('');
 $('tc').innerHTML=B('first','⏮')+B('play',playing?'⏸':'▶')+B('add','+ Кадр')+B('dup','Дубль')+B('copy','Копировать')+B('paste','Вставить')+B('del','Удалить')+B('left','← Сдвиг')+B('right','Сдвиг →')+B('onion','Калька',undefined,onion)+B('fps','FPS '+fps)+`<label>Кадров слоя<span><input type=number data-s=lc min=1 max=500 value=${LS[act].c.length}></span></label>`;lpr();jpr()
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

const ptr=new Map();let drawing=null,start=null,moved=0,multi=false,d0=null;
const pt=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const toC=p=>{const dx=p.x-px,dy=p.y-py,cs=Math.cos(-rot),sn=Math.sin(-rot);return{x:(dx*cs-dy*sn)/z,y:(dx*sn+dy*cs)/z}};
const pr=e=>e.pointerType==='pen'?Math.max(.1,e.pressure):1;
function seg(a,b,w){const c=lc();c.lineCap=c.lineJoin='round';c.globalCompositeOperation=tool==='eraser'?'destination-out':LS[act].al?'source-atop':'source-over';c.globalAlpha=bo;c.strokeStyle=c.fillStyle=color;c.lineWidth=w;c.shadowBlur=hard<1?size*(1-hard):0;c.shadowColor=color;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x+.01,b.y);c.stroke();c.globalCompositeOperation='source-over';c.globalAlpha=1;c.shadowBlur=0}
function two(){const [a,b]=[...ptr.values()];return{c:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},d:Math.hypot(a.x-b.x,a.y-b.y)||1,a:Math.atan2(b.y-a.y,b.x-a.x)}}

cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,pt(e));
 if(ptr.size===1){multi=false;moved=0;start=pt(e);
  if(tool==='brush'||tool==='eraser'){push(tool==='eraser'?'Ластик':'Кисть');drawing=toC(start);seg(drawing,drawing,size*pr(e));render()}
  else if(tool==='shapes'||tool==='select'){drawing=toC(start);}
 }
 else{multi=true;if(drawing){drawing=null;const u=U.pop();if(u)u.k.getContext('2d').putImageData(u.d,0,0);render()}d0=two()}};

cv.onpointermove=e=>{if(!ptr.has(e.pointerId))return;const o=ptr.get(e.pointerId),n=pt(e);ptr.set(e.pointerId,n);
 if(ptr.size>=2){const s=two(),k=s.d/d0.d;
  if(tool==='transform'){const c=toC(d0.c);const t1=toC(s.c),t0=toC(d0.c);pend=new DOMMatrix().translate(t1.x-t0.x,t1.y-t0.y).translate(c.x,c.y).rotate((s.a-d0.a)*180/Math.PI).scale(k).translate(-c.x,-c.y).multiply(pend||new DOMMatrix())}
  else{const q=toC(d0.c);z=Math.min(16,Math.max(.1,z*k));rot+=s.a-d0.a;const cs=Math.cos(rot),sn=Math.sin(rot);px=s.c.x-z*(q.x*cs-q.y*sn);py=s.c.y-z*(q.x*sn+q.y*cs)}
  d0=s;render();return}
 if(multi)return;
 if(Math.hypot(n.x-start.x,n.y-start.y)>12)moved=1;
 if(drawing){const p=toC(n);
  if(tool==='brush'||tool==='eraser'){seg(drawing,p,size*pr(e));drawing=p;}
  else if(tool==='shapes'){render();const c=cx;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=size;c.beginPath();if(shape==='rect'){c.rect(drawing.x,drawing.y,p.x-drawing.x,p.y-drawing.y)}else if(shape==='circle'){const r=Math.hypot(p.x-drawing.x,p.y-drawing.y);c.arc(drawing.x,drawing.y,r,0,Math.PI*2)}c.stroke();}
  else if(tool==='select'){render();cx.strokeStyle='blue';cx.setLineDash([5,5]);cx.strokeRect(drawing.x,drawing.y,p.x-drawing.x,p.y-drawing.y);cx.setLineDash([]);}
  render()}
 else if(tool==='transform'){pend=new DOMMatrix().translate(toC(n).x-toC(o).x,toC(n).y-toC(o).y).multiply(pend||new DOMMatrix());render();ui()}
 else if(tool==='hand'){px+=n.x-o.x;py+=n.y-o.y;render()}};

cv.onpointerup=cv.onpointercancel=e=>{ptr.delete(e.pointerId);if(
