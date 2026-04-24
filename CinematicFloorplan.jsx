/**
 * CinematicFloorplan.jsx
 * Точная копия HTML-версии, обёрнутая в React.
 * Весь JS-код рисования идентичен CinematicFloorplan.html — ничего не изменено.
 *
 * Зависимости: только React.
 * Использование:
 *   import CinematicFloorplan from './CinematicFloorplan'
 *   <CinematicFloorplan />
 */

import { useEffect, useRef } from "react"

export default function CinematicFloorplan() {
  const cvRef   = useRef(null)
  const catRef  = useRef(null)
  const ttlRef  = useRef(null)
  const subRef  = useRef(null)
  const spRef   = useRef(null)
  const progRef = useRef(null)
  const chapRef = useRef(null)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')

    // ── EXACT same data as HTML ──────────────────────────────────────────────
    const ROOMS=[
      {id:'lobby',  x:.0, y:.0, w:.58,h:.40,fill:'rgba(0,70,140,.20)', label:'ЛОББИ / РЕСЕПШН', tx:.29,ty:.20},
      {id:'meet1',  x:.58,y:.0, w:.42,h:.40,fill:'rgba(0,50,100,.16)', label:'ПЕРЕГОВОРНАЯ 1',  tx:.79,ty:.20},
      {id:'corr',   x:.0, y:.40,w:1.0,h:.10,fill:'rgba(0,30,65,.13)',  label:'К О Р И Д О Р',  tx:.50,ty:.45},
      {id:'toilet', x:.0, y:.50,w:.16,h:.22,fill:'rgba(0,35,70,.15)',  label:'СА-\nНУЗЕЛ',     tx:.08,ty:.60},
      {id:'kitchen',x:.0, y:.72,w:.16,h:.28,fill:'rgba(0,35,70,.15)',  label:'КУХНЯ',            tx:.08,ty:.84},
      {id:'office', x:.16,y:.50,w:.44,h:.50,fill:'rgba(0,65,130,.18)', label:'ОТКРЫТЫЙ ОФИС',  tx:.38,ty:.75},
      {id:'server', x:.60,y:.50,w:.20,h:.22,fill:'rgba(0,80,160,.30)', label:'IT / СЕРВЕРНАЯ', tx:.70,ty:.60},
      {id:'manager',x:.60,y:.72,w:.20,h:.28,fill:'rgba(0,55,110,.18)', label:'КАБ.\nДИРЕКТОРА',tx:.70,ty:.84},
      {id:'meet2',  x:.80,y:.50,w:.20,h:.50,fill:'rgba(0,50,100,.16)', label:'ПЕРЕГОВОРНАЯ 2', tx:.90,ty:.75},
    ]
    const DOORS=[
      {axis:'v',at:.0, cy:.22,dw:.07,swing: 1},
      {axis:'h',at:.40,cx:.28,dw:.07,swing: 1},
      {axis:'h',at:.40,cx:.78,dw:.07,swing: 1},
      {axis:'v',at:.16,cy:.58,dw:.06,swing:-1},
      {axis:'v',at:.16,cy:.82,dw:.06,swing:-1},
      {axis:'h',at:.50,cx:.37,dw:.08,swing:-1},
      {axis:'h',at:.50,cx:.70,dw:.07,swing:-1},
      {axis:'h',at:.72,cx:.70,dw:.07,swing:-1},
      {axis:'h',at:.50,cx:.88,dw:.07,swing:-1},
      {axis:'v',at:.58,cy:.20,dw:.06,swing:-1},
    ]
    const WINDOWS=[
      {axis:'h',wall:'top',   y:.0, x:.15,l:.10},
      {axis:'h',wall:'top',   y:.0, x:.35,l:.10},
      {axis:'h',wall:'top',   y:.0, x:.65,l:.10},
      {axis:'h',wall:'top',   y:.0, x:.85,l:.10},
      {axis:'v',wall:'left',  x:.0, y:.06,l:.08},
      {axis:'v',wall:'right', x:1.0,y:.08,l:.08},
      {axis:'v',wall:'right', x:1.0,y:.60,l:.12},
      {axis:'h',wall:'bottom',y:1.0,x:.25,l:.12},
      {axis:'h',wall:'bottom',y:1.0,x:.60,l:.10},
    ]
    const EQ={
      cam_lobby: {wx:.54,wy:.04,t:'dome',  c:'#00c8ff',dir:225,fov:100,range:.28,phase:0.0,spd:.35},
      cam_meet1: {wx:.79,wy:.04,t:'dome',  c:'#00c8ff',dir:180,fov:90, range:.24,phase:1.8,spd:.30},
      cam_corr:  {wx:.50,wy:.44,t:'dome',  c:'#00c8ff',dir:90, fov:120,range:.22,phase:3.2,spd:.28,sweep:60},
      cam_office:{wx:.18,wy:.54,t:'dome',  c:'#00c8ff',dir:135,fov:100,range:.30,phase:2.1,spd:.32},
      cam_off2:  {wx:.58,wy:.96,t:'dome',  c:'#00c8ff',dir:315,fov:100,range:.30,phase:4.5,spd:.30},
      cam_meet2: {wx:.98,wy:.52,t:'dome',  c:'#00c8ff',dir:225,fov:90, range:.24,phase:1.2,spd:.28},
      cam_entry: {wx:.01,wy:.22,t:'bullet',c:'#00c8ff',dir:0,  fov:55, range:.35,phase:0.5,spd:.20},
      pir_lobby: {wx:.56,wy:.32,t:'pir',   c:'#ef4444',dir:180,fov:90, range:.18,phase:0.8},
      pir_office:{wx:.23,wy:.52,t:'pir',   c:'#ef4444',dir:90, fov:90, range:.20,phase:2.4},
      pir_server:{wx:.62,wy:.53,t:'pir',   c:'#ef4444',dir:180,fov:80, range:.14,phase:1.5},
      fire_lobby:{wx:.30,wy:.20,t:'fire',  c:'#f97316'},
      fire_meet1:{wx:.79,wy:.20,t:'fire',  c:'#f97316'},
      fire_corr: {wx:.50,wy:.45,t:'fire',  c:'#f97316'},
      fire_off:  {wx:.38,wy:.74,t:'fire',  c:'#f97316'},
      fire_srv:  {wx:.70,wy:.61,t:'fire',  c:'#f97316'},
      fire_meet2:{wx:.90,wy:.74,t:'fire',  c:'#f97316'},
      rfid_srv:  {wx:.605,wy:.58,t:'reader',c:'#fbbf24',dir:180},
      rfid_mgr:  {wx:.605,wy:.82,t:'reader',c:'#fbbf24',dir:180},
      nvr:       {wx:.72,wy:.58,t:'nvr',   c:'#00c8ff'},
      sw1:       {wx:.72,wy:.66,t:'switch',c:'#60a5fa'},
    }
    const CH=[
      {zoom:1,  fx:.50,fy:.50,hold:3800,eq:null,        col:'#00c8ff',cat:'Системы безопасности',    title:'Планировка\nобъекта',       sub:null,specs:[]},
      {zoom:3.8,fx:.54,fy:.04,hold:5200,eq:'cam_lobby', col:'#00c8ff',cat:'Видеонаблюдение',         title:'Купольная IP-камера',        sub:'Hikvision DS-2CD2143G2',specs:['4 Мп · 2688 × 1520','ИК подсветка — 40 м','PoE IEEE 802.3af','IP67 · IK10','FOV 104° · PTZ-поворот']},
      {zoom:3.5,fx:.01,fy:.22,hold:5000,eq:'cam_entry', col:'#00c8ff',cat:'Видеонаблюдение',         title:'Уличная камера Bullet',      sub:'Dahua IPC-HFW3849S, 8 Мп',specs:['4K Ultra HD','Цветная ночная съёмка','Smart Dual Light 60 м','IP67 · −40°C','Встроенный микрофон']},
      {zoom:4.0,fx:.56,fy:.32,hold:5000,eq:'pir_lobby', col:'#ef4444',cat:'Охранная сигнализация',   title:'Датчик движения',            sub:'Optex VX-402NB · Dual PIR',specs:['Зона 12 × 12 м · 90°','Двойной PIR-сенсор','Антимаскинг функция','Температурная компенсация','−30..+55°C']},
      {zoom:4.2,fx:.605,fy:.58,hold:5200,eq:'rfid_srv', col:'#fbbf24',cat:'Контроль доступа — СКУД', title:'Считыватель RFID',           sub:'HID Signo 20K',specs:['13.56 МГц · MiFare','Дальность чтения 10 см','IP65 · PoE питание','Протокол OSDP v2','Тампер-защита']},
      {zoom:4.5,fx:.30,fy:.20,hold:5000,eq:'fire_lobby',col:'#f97316',cat:'Пожарная сигнализация',   title:'Дымовой датчик',             sub:'Hochiki ESP-20B · адресный',specs:['Адресная система','Оптический принцип','Ток 200 мкА','Протокол Apollo','−10..+60°C']},
      {zoom:4.0,fx:.72,fy:.62,hold:5500,eq:'nvr',       col:'#00c8ff',cat:'Видеонаблюдение',         title:'Регистратор NVR',            sub:'Hikvision DS-7732NI-K4',specs:['32 канала · 4K','4 × HDD до 10 ТБ','H.265+ компрессия','HDMI 4K + VGA','RAID 0/1/5/10']},
      {zoom:4.0,fx:.72,fy:.66,hold:5000,eq:'sw1',       col:'#60a5fa',cat:'Сеть / СКС',             title:'PoE-коммутатор',             sub:'TP-Link TL-SG1016PE 16p',specs:['16 портов PoE+','Бюджет PoE 150 Вт','1 Гбит/с','IEEE 802.3at/af','VLAN · QoS · IGMP']},
      {zoom:1,  fx:.50,fy:.50,hold:4500,eq:null,        col:'#00c8ff',cat:'SB-TECH — под ключ',       title:'Работаем\nпод ключ',        sub:null,specs:['Проектирование и согласование','Монтаж и пусконаладка','Техническое обслуживание','Гарантия 3 года']},
    ]

    // ── EXACT same functions as HTML ─────────────────────────────────────────
    let planCanvas=null

    function buildPlan(W,H){
      planCanvas=document.createElement('canvas');planCanvas.width=W;planCanvas.height=H
      const c=planCanvas.getContext('2d')
      c.fillStyle='#03070f';c.fillRect(0,0,W,H)
      c.fillStyle='#050e1c';c.fillRect(0,0,W,H)
      ROOMS.forEach(r=>{c.fillStyle=r.fill;c.fillRect(r.x*W,r.y*H,r.w*W,r.h*H)})
      ROOMS.forEach(r=>{
        c.save();c.font=`bold ${Math.max(8,W*.012)}px 'Courier New',monospace`
        c.fillStyle='rgba(150,200,240,.42)';c.textAlign='center';c.textBaseline='middle'
        const lines=r.label.split('\n'),lh=W*.014
        lines.forEach((l,i)=>c.fillText(l,r.tx*W,r.ty*H+(i-(lines.length-1)/2)*lh))
        c.restore()
      })
      c.strokeStyle='rgba(0,80,160,.08)';c.lineWidth=.5
      for(let gx=0;gx<W;gx+=W*.04)for(let gy=0;gy<H;gy+=H*.04)c.fillRect(gx,gy,1,1)
      const WC='rgba(140,210,255,.85)',WL=Math.max(2,W*.004)
      function hline(y,x1,x2,gaps){
        const py=y*H;let cx=x1
        gaps.sort((a,b)=>a[0]-b[0]).forEach(([gc,gw,sw])=>{
          const gs=gc-gw/2,ge=gc+gw/2
          if(gs>cx){c.beginPath();c.moveTo(cx*W,py);c.lineTo(gs*W,py);c.strokeStyle=WC;c.lineWidth=WL;c.stroke()}
          const dx=gs*W,dr=gw*W
          c.beginPath();c.moveTo(dx,py);c.lineTo(dx,py+sw*dr);c.strokeStyle='rgba(100,180,255,.5)';c.lineWidth=1;c.stroke()
          c.beginPath();c.arc(dx,py,dr,sw>0?0:Math.PI*.5,sw>0?Math.PI*.5:0,sw>0?false:true);c.strokeStyle='rgba(100,180,255,.35)';c.lineWidth=.8;c.stroke()
          cx=ge
        })
        if(cx<x2){c.beginPath();c.moveTo(cx*W,py);c.lineTo(x2*W,py);c.strokeStyle=WC;c.lineWidth=WL;c.stroke()}
      }
      function vline(x,y1,y2,gaps){
        const px=x*W;let cy=y1
        gaps.sort((a,b)=>a[0]-b[0]).forEach(([gc,gw,sw])=>{
          const gs=gc-gw/2,ge=gc+gw/2
          if(gs>cy){c.beginPath();c.moveTo(px,cy*H);c.lineTo(px,gs*H);c.strokeStyle=WC;c.lineWidth=WL;c.stroke()}
          const dy=gs*H,dr=gw*H
          c.beginPath();c.moveTo(px,dy);c.lineTo(px+sw*dr,dy);c.strokeStyle='rgba(100,180,255,.5)';c.lineWidth=1;c.stroke()
          c.beginPath();c.arc(px,dy,dr,sw>0?-Math.PI*.5:Math.PI,sw>0?0:-Math.PI*.5,sw<0);c.strokeStyle='rgba(100,180,255,.35)';c.lineWidth=.8;c.stroke()
          cy=ge
        })
        if(cy<y2){c.beginPath();c.moveTo(px,cy*H);c.lineTo(px,y2*H);c.strokeStyle=WC;c.lineWidth=WL;c.stroke()}
      }
      const hD={},vD={}
      DOORS.forEach(d=>{
        if(d.axis==='h'){if(!hD[d.at])hD[d.at]=[];hD[d.at].push([d.cx,d.dw,d.swing])}
        else{if(!vD[d.at])vD[d.at]=[];vD[d.at].push([d.cy,d.dw,d.swing])}
      })
      hline(0,0,1,hD[0]||[]);hline(1,0,1,hD[1]||[])
      vline(0,0,1,vD[0]||[]);vline(1,0,1,vD[1]||[])
      hline(.40,0,1,hD[.40]||[]);hline(.50,0,1,hD[.50]||[])
      hline(.72,.60,.80,hD[.72]||[])
      vline(.58,0,.40,vD[.58]||[]);vline(.16,.50,1,vD[.16]||[])
      vline(.60,.50,1,vD[.60]||[]);vline(.80,.50,1,vD[.80]||[])
      c.strokeStyle='rgba(100,200,255,.65)';c.lineWidth=1.5
      WINDOWS.forEach(w=>{
        if(w.axis==='h'){
          const y=w.wall==='top'?.5:H-.5,x1=w.x*W,x2=(w.x+w.l)*W
          ;[-1.5,0,1.5].forEach(o=>{c.beginPath();c.moveTo(x1,y+o);c.lineTo(x2,y+o);c.stroke()})
        }else{
          const x=w.wall==='left'?.5:W-.5,y1=w.y*H,y2=(w.y+w.l)*H
          ;[-1.5,0,1.5].forEach(o=>{c.beginPath();c.moveTo(x+o,y1);c.lineTo(x+o,y2);c.stroke()})
        }
      })
      c.save();c.translate(W*.95,H*.96)
      c.fillStyle='rgba(0,200,255,.5)';c.strokeStyle='rgba(0,200,255,.5)';c.lineWidth=1
      c.beginPath();c.moveTo(0,-H*.025);c.lineTo(W*.008,0);c.lineTo(0,-H*.01);c.lineTo(-W*.008,0);c.closePath();c.fill()
      c.beginPath();c.moveTo(0,0);c.lineTo(0,H*.025);c.stroke()
      c.font=`${W*.012}px 'Courier New',monospace`;c.fillStyle='rgba(0,200,255,.4)';c.textAlign='center';c.fillText('С',0,-H*.03)
      c.restore()
      const sbX=W*.82,sbY=H*.962,sbW=W*.10
      c.strokeStyle='rgba(150,200,255,.4)';c.lineWidth=1.2
      c.beginPath();c.moveTo(sbX,sbY);c.lineTo(sbX+sbW,sbY);c.stroke()
      ;[sbX,sbX+sbW].forEach(x=>{c.beginPath();c.moveTo(x,sbY-3);c.lineTo(x,sbY+3);c.stroke()})
      c.font=`${W*.009}px 'Courier New',monospace`;c.fillStyle='rgba(150,200,255,.35)';c.textAlign='center';c.fillText('10 м',sbX+sbW/2,sbY-5)
    }

    function drawFov(c,wx,wy,eq,t){
      if(!eq.fov)return
      const W=cv.width,spd=eq.spd||.35,ph=eq.phase||0
      const sweep=(eq.sweep||eq.fov)/2*Math.PI/180
      const base=eq.dir*Math.PI/180,cur=base+Math.sin(t*spd+ph)*sweep
      const R=eq.range*W,fovHalf=eq.fov/2*Math.PI/180
      const grd=c.createRadialGradient(wx,wy,0,wx,wy,R)
      grd.addColorStop(0,eq.c+'30');grd.addColorStop(.6,eq.c+'14');grd.addColorStop(1,eq.c+'02')
      c.beginPath();c.moveTo(wx,wy);c.arc(wx,wy,R,cur-fovHalf,cur+fovHalf);c.closePath();c.fillStyle=grd;c.fill()
      c.beginPath()
      c.moveTo(wx,wy);c.lineTo(wx+Math.cos(cur-fovHalf)*R,wy+Math.sin(cur-fovHalf)*R)
      c.moveTo(wx,wy);c.lineTo(wx+Math.cos(cur+fovHalf)*R,wy+Math.sin(cur+fovHalf)*R)
      c.strokeStyle=eq.c+'66';c.lineWidth=1;c.stroke()
      const al=R*.7,ax=wx+Math.cos(cur)*al,ay=wy+Math.sin(cur)*al
      c.beginPath();c.moveTo(wx,wy);c.lineTo(ax,ay);c.strokeStyle=eq.c+'44';c.lineWidth=.8;c.setLineDash([4,4]);c.stroke();c.setLineDash([])
      const ah=Math.PI/7,ar=R*.05
      c.beginPath()
      c.moveTo(ax,ay);c.lineTo(ax-Math.cos(cur-ah)*ar,ay-Math.sin(cur-ah)*ar)
      c.moveTo(ax,ay);c.lineTo(ax-Math.cos(cur+ah)*ar,ay-Math.sin(cur+ah)*ar)
      c.strokeStyle=eq.c+'88';c.lineWidth=1;c.stroke()
    }

    function drawFireFov(c,wx,wy,eq,t){
      const W=cv.width,pv=(Math.sin(t*1.8+(eq.phase||0))*.5+.5),R=(eq.range||.10)*W
      c.beginPath();c.arc(wx,wy,R*(1+pv*.2),0,Math.PI*2)
      c.strokeStyle=eq.c+Math.floor(pv*70+20).toString(16).padStart(2,'0')
      c.lineWidth=1;c.setLineDash([3,4]);c.stroke();c.setLineDash([])
    }

    function drawEqSymbol(c,wx,wy,eq,active,t){
      const W=cv.width,r=Math.max(5,W*.009)
      c.save();c.translate(wx,wy)
      switch(eq.t){
        case 'dome':{
          c.beginPath();c.arc(0,0,r*.9,0,Math.PI*2)
          c.fillStyle=active?eq.c+'cc':'#03070f';c.fill()
          c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2;c.stroke()
          c.beginPath();c.arc(0,0,r*.38,0,Math.PI*2);c.fillStyle=eq.c+(active?'ff':'aa');c.fill()
          c.strokeStyle=active?eq.c+'dd':eq.c+'55';c.lineWidth=.7
          ;[0,Math.PI*.5].forEach(a=>{
            c.beginPath();c.moveTo(Math.cos(a)*r*.5,Math.sin(a)*r*.5);c.lineTo(Math.cos(a)*r*.88,Math.sin(a)*r*.88);c.stroke()
            c.beginPath();c.moveTo(-Math.cos(a)*r*.5,-Math.sin(a)*r*.5);c.lineTo(-Math.cos(a)*r*.88,-Math.sin(a)*r*.88);c.stroke()
          })
          break
        }
        case 'bullet':{
          const dir=eq.dir*Math.PI/180,bw=r*.7,bl=r*1.4
          c.rotate(dir)
          c.fillStyle=active?eq.c+'cc':'#071828';c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2
          c.beginPath();c.rect(0,-bw/2,bl,bw);c.fill();c.stroke()
          c.beginPath();c.arc(0,0,bw*.5,0,Math.PI*2);c.fillStyle=eq.c+(active?'ff':'cc');c.fill()
          break
        }
        case 'pir':{
          const dir=eq.dir*Math.PI/180,pr=r*1.0
          c.rotate(dir)
          c.beginPath();c.moveTo(0,0);c.lineTo(pr,-pr*.55);c.lineTo(pr*1.3,0);c.lineTo(pr,pr*.55);c.closePath()
          c.fillStyle=active?eq.c+'cc':'#071828';c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2;c.fill();c.stroke()
          c.beginPath();c.arc(0,0,r*.35,0,Math.PI*2);c.fillStyle=eq.c+(active?'ff':'aa');c.fill()
          break
        }
        case 'fire':{
          c.beginPath();c.arc(0,0,r*.8,0,Math.PI*2)
          c.fillStyle=active?eq.c+'cc':'#071828';c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2;c.fill();c.stroke()
          c.strokeStyle=eq.c+(active?'ff':'aa');c.lineWidth=1.4
          const d=r*.45
          ;[[d,d,-d,-d],[-d,d,d,-d]].forEach(([x1,y1,x2,y2])=>{c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()})
          break
        }
        case 'reader':{
          const dir=eq.dir*Math.PI/180
          c.rotate(dir)
          c.fillStyle=active?eq.c+'cc':'#071828';c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2
          c.beginPath();c.rect(-r*.25,-r*.5,r*.5,r);c.fill();c.stroke()
          ;[r*.5,r*.8,r*1.1].forEach((rd,i)=>{
            const pv=(Math.sin(t*2.5+(eq.phase||0)+i*.7)+1)/2
            c.beginPath();c.arc(0,0,rd,-Math.PI*.55,Math.PI*.55)
            c.strokeStyle=eq.c+Math.floor(pv*120+40).toString(16).padStart(2,'0');c.lineWidth=.8;c.stroke()
          })
          break
        }
        case 'nvr':{
          const bw=r*1.6,bh=r*1.1
          c.fillStyle=active?eq.c+'99':'#071828';c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2
          c.beginPath();c.rect(-bw/2,-bh/2,bw,bh);c.fill();c.stroke()
          for(let i=0;i<3;i++){c.fillStyle=eq.c+'44';c.fillRect(-bw*.4+i*bw*.28,-bh*.28,bw*.22,bh*.56)}
          const lp=(Math.sin(t*2.5)+1)/2
          c.beginPath();c.arc(bw*.36,0,r*.14,0,Math.PI*2);c.fillStyle=`rgba(0,255,120,${.6+lp*.4})`;c.fill()
          break
        }
        case 'switch':{
          const bw=r*1.8,bh=r*.7
          c.fillStyle=active?eq.c+'88':'#071828';c.strokeStyle=eq.c;c.lineWidth=active?1.8:1.2
          c.beginPath();c.rect(-bw/2,-bh/2,bw,bh);c.fill();c.stroke()
          for(let i=0;i<6;i++){
            const lp=(Math.sin(t*3+i*.9)+1)/2,isOn=(i+1)%3!==0
            c.beginPath();c.arc(-bw*.38+i*bw*.14,0,r*.1,0,Math.PI*2)
            c.fillStyle=isOn?`rgba(0,255,120,${.5+lp*.5})`:'rgba(30,50,80,.8)';c.fill()
          }
          break
        }
      }
      if(active){
        const br=r*2.2,bl=r*.65
        c.resetTransform();c.translate(wx,wy)
        ;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy])=>{
          c.beginPath()
          c.moveTo(sx*br,sy*br);c.lineTo(sx*br-sx*bl,sy*br);c.moveTo(sx*br,sy*br);c.lineTo(sx*br,sy*br-sy*bl)
          c.strokeStyle=eq.c;c.lineWidth=2;c.stroke()
        })
        const sy2=(Math.sin(t*3)*.5+.5)*r*4.5-r*2.2
        c.beginPath();c.moveTo(-r*2.4,sy2);c.lineTo(r*2.4,sy2);c.strokeStyle=eq.c+'66';c.lineWidth=1;c.stroke()
      }
      c.restore()
    }

    function drawDetailIcon(c,cx,cy,eq,S,t){
      c.save();c.translate(cx,cy)
      const col=eq.c
      switch(eq.t){
        case 'dome':{
          c.beginPath();c.arc(0,-S*.38,S*.18,0,Math.PI*2);c.fillStyle='#071828';c.fill();c.strokeStyle=col+'77';c.lineWidth=1;c.stroke()
          c.beginPath();c.arc(0,S*.08,S*.62,Math.PI,0);c.lineTo(S*.62,S*.40);c.lineTo(-S*.62,S*.40);c.closePath()
          c.fillStyle='#081a2e';c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke()
          c.beginPath();c.ellipse(0,S*.40,S*.62,S*.10,0,0,Math.PI*2);c.fillStyle='#060f1e';c.fill();c.strokeStyle=col+'55';c.lineWidth=1;c.stroke()
          c.beginPath();c.arc(0,S*.12,S*.28,0,Math.PI*2);c.fillStyle='#020608';c.fill();c.strokeStyle=col+'88';c.lineWidth=1.2;c.stroke()
          const lg=c.createRadialGradient(0,S*.12,0,0,S*.12,S*.2);lg.addColorStop(0,col+'ff');lg.addColorStop(1,col+'22')
          c.beginPath();c.arc(0,S*.12,S*.16,0,Math.PI*2);c.fillStyle=lg;c.fill()
          c.beginPath();c.arc(-S*.07,S*.06,S*.06,0,Math.PI*2);c.fillStyle='#ffffff33';c.fill()
          for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.beginPath();c.arc(Math.cos(a)*S*.23,S*.12+Math.sin(a)*S*.23,S*.03,0,Math.PI*2);c.fillStyle='#ff330077';c.fill()}
          break
        }
        case 'bullet':{
          c.rotate(-Math.PI/5)
          c.fillStyle='#04101e';c.beginPath();c.roundRect(-S*.08,-S*.18,S*.22,S*.26,3);c.fill();c.strokeStyle=col+'55';c.lineWidth=1;c.stroke()
          c.beginPath();c.moveTo(-S*.28,-S*.22);c.lineTo(S*.28,-S*.22);c.lineTo(S*.24,-S*.04);c.lineTo(-S*.24,-S*.04);c.closePath()
          c.fillStyle='#060f1e';c.fill();c.strokeStyle=col+'55';c.lineWidth=1;c.stroke()
          c.beginPath();c.roundRect(-S*.28,-S*.22,S*.56,S*1.1,S*.28);c.fillStyle='#071828';c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke()
          for(let i=0;i<3;i++){c.fillStyle=col+'18';c.beginPath();c.roundRect(-S*.24,-S*.1+i*S*.2,S*.48,S*.12,2);c.fill()}
          c.beginPath();c.arc(0,-S*.65,S*.22,0,Math.PI*2);c.fillStyle='#020508';c.fill();c.strokeStyle=col+'88';c.lineWidth=1.2;c.stroke()
          const llg=c.createRadialGradient(0,-S*.65,0,0,-S*.65,S*.15);llg.addColorStop(0,col+'ff');llg.addColorStop(1,'#010407')
          c.beginPath();c.arc(0,-S*.65,S*.13,0,Math.PI*2);c.fillStyle=llg;c.fill()
          ;[-S*.17,S*.17].forEach(dx=>{c.beginPath();c.arc(dx,-S*.68,S*.05,0,Math.PI*2);c.fillStyle='#ff440077';c.fill()})
          c.beginPath();c.arc(-S*.07,-S*.70,S*.05,0,Math.PI*2);c.fillStyle='#ffffff22';c.fill()
          const lp_b=(Math.sin(t*2)+1)/2;c.beginPath();c.arc(0,S*.46,S*.07,0,Math.PI*2);c.fillStyle=`rgba(0,255,80,${.6+lp_b*.4})`;c.fill()
          break
        }
        case 'pir':{
          c.beginPath();c.moveTo(0,-S*.72);c.lineTo(S*.72,S*.52);c.lineTo(-S*.72,S*.52);c.closePath();c.fillStyle='#071828';c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke()
          ;[.92,1.18,1.5].forEach((r2,i)=>{c.beginPath();c.arc(0,-S*.1,S*r2,-Math.PI*.5,Math.PI*1.5);c.strokeStyle=col+['33','22','11'][i];c.lineWidth=.8;c.setLineDash([3,4]);c.stroke();c.setLineDash([])})
          c.fillStyle='#020810';c.beginPath();c.roundRect(-S*.22,-S*.28,S*.44,S*.36,3);c.fill();c.strokeStyle=col+'66';c.lineWidth=1;c.stroke()
          const grd2=c.createLinearGradient(-S*.22,-S*.28,S*.22,S*.08);grd2.addColorStop(0,col+'22');grd2.addColorStop(1,col+'08')
          c.fillStyle=grd2;c.beginPath();c.roundRect(-S*.22,-S*.28,S*.44,S*.36,3);c.fill()
          for(let r2=0;r2<3;r2++)for(let cc=0;cc<4;cc++){c.fillStyle=col+'18';c.fillRect(-S*.20+cc*S*.115,-S*.26+r2*S*.10,S*.1,S*.08)}
          const lp2=(Math.sin(t*2.5)+1)/2;c.beginPath();c.arc(0,S*.38,S*.09,0,Math.PI*2);c.fillStyle=`rgba(255,50,50,${.7+lp2*.3})`;c.fill()
          break
        }
        case 'fire':{
          ;[-S*.22,S*.22].forEach(dx=>{c.fillStyle='#060f1e';c.beginPath();c.roundRect(dx-S*.05,-S*.78,S*.1,S*.5,2);c.fill();c.strokeStyle=col+'33';c.lineWidth=1;c.stroke();c.beginPath();c.arc(dx,-S*.8,S*.07,0,Math.PI*2);c.fillStyle=col+'44';c.fill()})
          c.beginPath();c.arc(0,0,S*.62,0,Math.PI*2);c.fillStyle='#060e1e';c.fill();c.strokeStyle=col;c.lineWidth=1.8;c.stroke()
          c.beginPath();c.arc(0,0,S*.52,0,Math.PI*2);c.fillStyle='#04091a';c.fill();c.strokeStyle=col+'55';c.lineWidth=1;c.stroke()
          for(let ring=0;ring<2;ring++){const r2=[S*.28,S*.42][ring],holes=[6,10][ring];for(let i=0;i<holes;i++){const a=i/holes*Math.PI*2+(ring*.3);c.beginPath();c.arc(Math.cos(a)*r2,Math.sin(a)*r2,S*.055,0,Math.PI*2);c.fillStyle='#020710';c.fill()}}
          const lp3=(Math.sin(t*1.8)+1)/2;c.beginPath();c.arc(0,0,S*.15,0,Math.PI*2);c.fillStyle=col+(Math.floor(150+lp3*105).toString(16));c.fill()
          c.beginPath();c.arc(0,0,S*.2,0,Math.PI*2);c.strokeStyle=col+Math.floor(lp3*150+50).toString(16).padStart(2,'0');c.lineWidth=2;c.stroke()
          for(let i=-1;i<=1;i++){const ph=t*2+i*1.2;c.beginPath();c.moveTo(i*S*.1,-S*.62);c.bezierCurveTo(i*S*.1+Math.sin(ph)*S*.1,-S*.82,-i*S*.08-Math.sin(ph)*S*.06,-S*.98,i*S*.06+Math.sin(ph)*S*.05,-S*1.12);c.strokeStyle=col+'44';c.lineWidth=1.5;c.stroke()}
          break
        }
        case 'reader':{
          c.fillStyle='#060e1e';c.beginPath();c.roundRect(-S*.36,-S*.72,S*.72,S*1.44,S*.07);c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke()
          c.fillStyle='#020810';c.beginPath();c.roundRect(-S*.26,-S*.60,S*.52,S*.44,3);c.fill();c.strokeStyle=col+'55';c.lineWidth=1;c.stroke()
          c.fillStyle=col+'22';c.beginPath();c.roundRect(-S*.22,-S*.56,S*.44,S*.32,2);c.fill();c.fillStyle=col+'44';c.fillRect(-S*.22,-S*.44,S*.44,S*.08)
          ;[.08,.13,.18].forEach(r2=>{c.beginPath();c.arc(0,-S*.35,S*r2,-Math.PI*.65,Math.PI*1.65);c.strokeStyle=col+'77';c.lineWidth=1.2;c.stroke()})
          for(let row=0;row<3;row++)for(let cc=0;cc<3;cc++){c.beginPath();c.roundRect(-S*.2+cc*S*.2-S*.09,S*.04+row*S*.2-S*.07,S*.18,S*.14,2);c.fillStyle='#0a1e38';c.fill();c.strokeStyle=col+'33';c.lineWidth=.7;c.stroke()}
          const lp4=(Math.sin(t*2.5)+1)/2;c.beginPath();c.arc(0,S*.58,S*.12,0,Math.PI*2);c.fillStyle=`rgba(0,255,100,${.7+lp4*.3})`;c.fill()
          break
        }
        case 'nvr':{
          c.fillStyle='#050d1c';c.beginPath();c.roundRect(-S*.84,-S*.72,S*1.68,S*1.44,5);c.fill();c.strokeStyle=col;c.lineWidth=1.8;c.stroke()
          c.fillStyle='#030a18';c.fillRect(-S*.82,-S*.72,S*1.64,S*.22);c.fillStyle=col+'18';c.fillRect(-S*.82,-S*.72,S*1.64,S*.22)
          for(let i=0;i<4;i++){
            const bx=-S*.72+i*S*.38,by=-S*.42
            c.fillStyle='#040c18';c.beginPath();c.roundRect(bx,by,S*.33,S*.58,3);c.fill();c.strokeStyle=col+'44';c.lineWidth=1;c.stroke()
            c.fillStyle=col+'22';c.fillRect(bx+S*.03,by+S*.05,S*.27,S*.06)
            for(let j=0;j<4;j++){c.fillStyle=col+'14';c.fillRect(bx+S*.05,by+S*.15+j*S*.07,S*.23,S*.04)}
            const lp5=(Math.sin(t*4+(i+1)*1.3)+1)/2
            c.beginPath();c.arc(bx+S*.28,by+S*.5,S*.04,0,Math.PI*2);c.fillStyle=i<3?`rgba(0,255,120,${.4+lp5*.6})`:`rgba(255,200,0,${.5+lp5*.5})`;c.fill()
          }
          ;[-S*.52,-S*.28,-S*.04,S*.2].forEach((lx,i)=>{c.beginPath();c.arc(lx,-S*.58,S*.055,0,Math.PI*2);c.fillStyle=['#22c55e',col,'#3b82f6','#ef4444'][i];c.fill()})
          c.beginPath();c.arc(S*.68,-S*.58,S*.10,0,Math.PI*2);c.fillStyle='#0d2540';c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke()
          c.beginPath();c.moveTo(S*.68,-S*.68);c.lineTo(S*.68,-S*.48);c.moveTo(S*.62,-S*.58);c.arc(S*.68,-S*.58,S*.06,-Math.PI*.8,Math.PI*.8);c.strokeStyle=col;c.lineWidth=1.2;c.stroke()
          break
        }
        case 'switch':{
          c.fillStyle='#050c1a';c.beginPath();c.roundRect(-S*.9,-S*.52,S*1.8,S*1.04,5);c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke()
          for(let row=0;row<2;row++)for(let p=0;p<8;p++){
            const px=-S*.82+p*S*.2,py=-S*.38+row*S*.32
            c.fillStyle='#020910';c.beginPath();c.roundRect(px,py,S*.16,S*.24,2);c.fill();c.strokeStyle=col+'44';c.lineWidth=.8;c.stroke()
            const lp=(Math.sin(t*3.5+p*1.2+row*.8)+1)/2
            c.beginPath();c.arc(px+S*.08,py+S*.06,S*.038,0,Math.PI*2)
            c.fillStyle=(p+row)%3===0?`rgba(0,255,120,${.5+lp*.5})`:'rgba(20,40,70,.8)';c.fill()
          }
          ;['#22c55e','#3b82f6',col].forEach((lc,i)=>{c.beginPath();c.arc(S*.76,-S*.3+i*S*.3,S*.05,0,Math.PI*2);c.fillStyle=lc;c.fill()})
          break
        }
      }
      c.restore()
    }

    // ── Story system (exact same as HTML) ─────────────────────────────────────
    let cam={x:.5,y:.5,z:1},tgt={x:.5,y:.5,z:1}
    let chIdx=0,animT=0,stmrs=[]

    const U={cat:catRef.current,ttl:ttlRef.current,sub:subRef.current,sp:spRef.current,prog:progRef.current,chap:chapRef.current}

    function setUi(ch){
      stmrs.forEach(clearTimeout);stmrs=[]
      U.cat.style.opacity=0;U.ttl.style.opacity=0;U.sub.style.opacity=0;U.sp.innerHTML=''
      stmrs.push(setTimeout(()=>{
        U.cat.innerHTML=`<span style="width:4px;height:4px;border-radius:50%;background:${ch.col};display:block;animation:cfbk 2s infinite"></span><span style="color:${ch.col};margin-left:6px">${ch.cat}</span>`
        U.cat.style.opacity=1
        U.ttl.innerHTML=ch.title.split('\n').map((l,i)=>i===1?`<span style="color:${ch.col}">${l}</span>`:l).join('<br>')
        U.ttl.style.opacity=1
        if(ch.sub){U.sub.textContent=ch.sub;U.sub.style.opacity=1}else{U.sub.style.opacity=0}
        ch.specs.forEach((s,si)=>{
          const row=document.createElement('div')
          row.style.cssText='display:flex;align-items:center;gap:9px;font-size:10px;letter-spacing:.04em;color:rgba(215,235,255,.82);opacity:0;transform:translateX(-8px);transition:opacity .45s,transform .45s'
          row.innerHTML=`<span style="width:4px;height:4px;border-radius:50%;flex-shrink:0;background:${ch.col}"></span>${s}`
          U.sp.appendChild(row)
          stmrs.push(setTimeout(()=>{row.style.opacity=1;row.style.transform='translateX(0)'},460+si*440))
        })
      },120))
      if(U.chap)U.chap.innerHTML=`<span style="color:${ch.col}">${String(chIdx+1).padStart(2,'0')}</span><span style="color:rgba(255,255,255,.2)"> / ${CH.length}</span>`
      if(U.prog){U.prog.innerHTML='';CH.forEach((_,i)=>{const d=document.createElement('div');d.style.cssText=`height:6px;border-radius:3px;transition:all .4s;background:${i===chIdx?CH[i].col:'rgba(255,255,255,.18)'};width:${i===chIdx?20:6}px;box-shadow:${i===chIdx?'0 0 7px '+CH[i].col:'none'}`;U.prog.appendChild(d)})}
    }

    function goChapter(idx){
      chIdx=idx%CH.length
      const ch=CH[chIdx]
      tgt={x:ch.fx,y:ch.fy,z:ch.zoom}
      setUi(ch)
      stmrs.push(setTimeout(()=>goChapter(chIdx+1),1300+ch.hold))
    }

    function resize(){
      const dpr=window.devicePixelRatio||1
      cv.width=cv.offsetWidth*dpr;cv.height=cv.offsetHeight*dpr;planCanvas=null
    }
    window.addEventListener('resize',resize);resize()
    goChapter(0)

    // ── Render loop (exact same as HTML) ──────────────────────────────────────
    const L=.055;let raf
    ;(function loop(now){
      animT=now/1000
      cam.x+=(tgt.x-cam.x)*L;cam.y+=(tgt.y-cam.y)*L;cam.z+=(tgt.z-cam.z)*L
      const W=cv.width,H=cv.height
      ctx.clearRect(0,0,W,H)
      if(!planCanvas)buildPlan(W,H)
      const z=cam.z,tx=W/2-cam.x*W*z,ty=H/2-cam.y*H*z
      ctx.save();ctx.setTransform(z,0,0,z,tx,ty)
      ctx.drawImage(planCanvas,0,0,W,H)
      const ch=CH[chIdx]
      Object.entries(EQ).forEach(([key,eq])=>{
        const wx=eq.wx*W,wy=eq.wy*H,isAct=ch.eq===key
        if(eq.t==='fire'){drawFireFov(ctx,wx,wy,{...eq,range:.10},animT)}
        else if(eq.fov){drawFov(ctx,wx,wy,eq,animT)}
        drawEqSymbol(ctx,wx,wy,eq,isAct,animT)
        if(isAct&&z>2.6){
          const alpha=Math.min(1,(z-2.6)/.9)
          ctx.save();ctx.globalAlpha=alpha
          drawDetailIcon(ctx,wx,wy+W*.072,eq,W*.026,animT)
          ctx.restore()
        }
      })
      ctx.restore()
      const vG=ctx.createRadialGradient(W/2,H/2,H*.18,W/2,H/2,H*.84)
      vG.addColorStop(0,'transparent');vG.addColorStop(1,'rgba(2,4,10,.65)')
      ctx.fillStyle=vG;ctx.fillRect(0,0,W,H)
      const sl=((now/6400)%1)*H;ctx.fillStyle='rgba(0,200,255,.06)';ctx.fillRect(0,sl-1,W,2)
      raf=requestAnimationFrame(loop)
    })(0)

    return () => {
      cancelAnimationFrame(raf)
      stmrs.forEach(clearTimeout)
      window.removeEventListener('resize',resize)
    }
  }, [])

  // ── JSX (only structure, no logic) ──────────────────────────────────────────
  return (
    <div style={{position:'relative',width:'100%',height:'100vh',overflow:'hidden',background:'#03070f',fontFamily:"'Courier New',monospace"}}>
      <style>{`@keyframes cfbk{0%,100%{opacity:1}50%{opacity:.15}}`}</style>

      <canvas ref={cvRef} style={{position:'absolute',inset:0,width:'100%',height:'100%'}} />

      <div ref={el=>{if(catRef)catRef.current=el}} id="ucat" style={{position:'absolute',bottom:68+12+7+7+7+7+28+10+'px',left:32,display:'flex',alignItems:'center',gap:8,fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:10,opacity:0,transition:'opacity .5s',pointerEvents:'none'}} />

      <div style={{position:'absolute',bottom:68,left:32,maxWidth:380,pointerEvents:'none'}}>
        <div ref={catRef} style={{display:'flex',alignItems:'center',gap:8,fontSize:9,letterSpacing:'.2em',textTransform:'uppercase',marginBottom:10,opacity:0,transition:'opacity .5s'}} />
        <div ref={ttlRef} style={{fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',fontSize:28,fontWeight:700,lineHeight:1.07,color:'#fff',letterSpacing:'-.02em',opacity:0,transition:'opacity .6s .1s'}} />
        <div ref={subRef} style={{fontSize:9,letterSpacing:'.06em',marginTop:8,opacity:0,transition:'opacity .5s .22s',color:'rgba(175,210,245,.5)'}} />
        <div ref={spRef}  style={{marginTop:12,display:'flex',flexDirection:'column',gap:7}} />
      </div>

      <div ref={progRef} style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',gap:7,alignItems:'center'}} />
      <div ref={chapRef} style={{position:'absolute',top:24,right:24,fontSize:12,letterSpacing:'.06em'}} />

      <div style={{position:'absolute',top:24,left:24,fontSize:8,letterSpacing:'.18em',textTransform:'uppercase',color:'rgba(0,200,255,.35)',display:'flex',alignItems:'center',gap:7}}>
        <span style={{width:4,height:4,borderRadius:'50%',background:'#00c8ff',display:'block',animation:'cfbk 2s infinite'}} />
        SB-TECH · Слаботочные системы
      </div>

      {/* HUD corners */}
      <div style={{position:'absolute',top:22,left:22,width:18,height:18,borderTop:'1px solid rgba(0,200,255,.38)',borderLeft:'1px solid rgba(0,200,255,.38)'}} />
      <div style={{position:'absolute',top:22,right:22,width:18,height:18,borderTop:'1px solid rgba(0,200,255,.38)',borderRight:'1px solid rgba(0,200,255,.38)'}} />
      <div style={{position:'absolute',bottom:22,left:22,width:18,height:18,borderBottom:'1px solid rgba(0,200,255,.38)',borderLeft:'1px solid rgba(0,200,255,.38)'}} />
      <div style={{position:'absolute',bottom:22,right:22,width:18,height:18,borderBottom:'1px solid rgba(0,200,255,.38)',borderRight:'1px solid rgba(0,200,255,.38)'}} />
    </div>
  )
}
