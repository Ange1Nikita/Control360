'use client'

import { useEffect, useRef } from 'react'

// ─── Floor plan ───────────────────────────────────────────────────────────────
const ROOMS = [
  { x:.00, y:.00, w:.58, h:.40, fill:"rgba(0,70,140,.25)",  label:"ЛОББИ / РЕСЕПШН",  tx:.29, ty:.20 },
  { x:.58, y:.00, w:.42, h:.40, fill:"rgba(0,50,100,.20)",  label:"ПЕРЕГОВОРНАЯ 1",   tx:.79, ty:.20 },
  { x:.00, y:.40, w:1.0, h:.10, fill:"rgba(0,25,55,.15)",   label:"К О Р И Д О Р",   tx:.50, ty:.45 },
  { x:.00, y:.50, w:.16, h:.22, fill:"rgba(0,35,70,.22)",   label:"САНУЗЕЛ",           tx:.08, ty:.60 },
  { x:.00, y:.72, w:.16, h:.28, fill:"rgba(0,35,70,.22)",   label:"КУХНЯ",             tx:.08, ty:.84 },
  { x:.16, y:.50, w:.44, h:.50, fill:"rgba(0,65,130,.22)",  label:"ОТКРЫТЫЙ ОФИС",   tx:.38, ty:.75 },
  { x:.60, y:.50, w:.20, h:.22, fill:"rgba(0,80,160,.30)",  label:"IT / СЕРВЕРНАЯ",  tx:.70, ty:.60 },
  { x:.60, y:.72, w:.20, h:.28, fill:"rgba(0,55,110,.22)",  label:"КАБ.\nДИРЕКТОРА",tx:.70, ty:.84 },
  { x:.80, y:.50, w:.20, h:.50, fill:"rgba(0,50,100,.20)",  label:"ПЕРЕГОВОРНАЯ 2",  tx:.90, ty:.75 },
]

const DOORS = [
  { axis:"v", at:.00, cy:.22, dw:.07, sw: 1 },
  { axis:"h", at:.40, cx:.28, dw:.07, sw: 1 },
  { axis:"h", at:.40, cx:.78, dw:.07, sw: 1 },
  { axis:"v", at:.16, cy:.58, dw:.06, sw:-1 },
  { axis:"v", at:.16, cy:.82, dw:.06, sw:-1 },
  { axis:"h", at:.50, cx:.37, dw:.08, sw:-1 },
  { axis:"h", at:.50, cx:.70, dw:.07, sw:-1 },
  { axis:"h", at:.72, cx:.70, dw:.07, sw:-1 },
  { axis:"h", at:.50, cx:.88, dw:.07, sw:-1 },
  { axis:"v", at:.58, cy:.20, dw:.06, sw:-1 },
]

const WINDOWS = [
  { axis:"h", wall:"top",    x:.15, l:.10 },
  { axis:"h", wall:"top",    x:.34, l:.10 },
  { axis:"h", wall:"top",    x:.65, l:.10 },
  { axis:"h", wall:"top",    x:.84, l:.10 },
  { axis:"v", wall:"left",   y:.06, l:.08 },
  { axis:"v", wall:"right",  y:.08, l:.08 },
  { axis:"v", wall:"right",  y:.60, l:.12 },
  { axis:"h", wall:"bottom", x:.25, l:.12 },
  { axis:"h", wall:"bottom", x:.60, l:.10 },
]

// ─── Equipment: 10 устройств, по одному каждого типа ──────────────────────────
interface EqItem {
  wx: number; wy: number; t: string; c: string
  dir?: number; fov?: number; range?: number
  phase?: number; spd?: number; sweep?: number
}

const EQ: Record<string, EqItem> = {
  // ── ВХОД (улица) ──
  cam_dome:    { wx:.01, wy:.22,  t:"dome",   c:"#00c8ff", dir:0,   fov:110, range:.30, phase:0,   spd:.25 },

  // ── ЛОББИ (label .29/.20) ──
  cam_bullet:  { wx:.55, wy:.03,  t:"bullet", c:"#00c8ff", dir:150, fov:85,  range:.28, phase:1.5, spd:.30 },
  wifi_lobby:  { wx:.10, wy:.32,  t:"wifi",   c:"#8b5cf6", phase:0.3 },

  // ── ПЕРЕГОВОРНАЯ 1 (label .79/.20) ──
  smoke_meet1: { wx:.68, wy:.10,  t:"smoke",  c:"#f97316", phase:0.6 },

  // ── КОРИДОР (label .50/.45) ──
  pir_corr:    { wx:.78, wy:.44,  t:"pir",    c:"#ef4444", dir:180, fov:90,  range:.18, phase:0.8 },

  // ── САНУЗЕЛ (label .08/.60) ──
  leak:        { wx:.06, wy:.54,  t:"leak",   c:"#06b6d4", phase:2.0 },

  // ── КУХНЯ (label .08/.84) ──
  smoke_kit:   { wx:.06, wy:.78,  t:"smoke",  c:"#f97316", phase:1.8 },

  // ── ОТКРЫТЫЙ ОФИС (label .38/.75) ──
  pir_office:  { wx:.22, wy:.58,  t:"pir",    c:"#ef4444", dir:135, fov:90,  range:.20, phase:1.4 },

  // ── IT / СЕРВЕРНАЯ (label .70/.60) ──
  nvr:         { wx:.64, wy:.55,  t:"nvr",    c:"#00c8ff", phase:0.2 },
  sw:          { wx:.76, wy:.66,  t:"switch", c:"#60a5fa", phase:1.1 },
  reader:      { wx:.66, wy:.49,  t:"reader", c:"#fbbf24", dir:180, phase:0.5 },

  // ── КАБ. ДИРЕКТОРА (label .70/.84) ──
  door_dir:    { wx:.70, wy:.73,  t:"door",   c:"#10b981", phase:1.5 },

  // ── ПЕРЕГОВОРНАЯ 2 (label .90/.75) ──
  wifi_meet2:  { wx:.90, wy:.58,  t:"wifi",   c:"#8b5cf6", phase:2.2 },
}

// ─── Chapters: маршрут обхода ─────────────────────────────────────────────────
interface Chapter {
  zoom: number; fx: number; fy: number; hold: number
  eq: string | null; col: string; title: string
  sub: string | null; specs: string[]
}

const CH: Chapter[] = [
  { zoom:.85, fx:.50, fy:.50, hold:400,  eq:null,          col:"#00c8ff", title:"",                      sub:null,                       specs:[] },
  { zoom:3.5, fx:.01, fy:.22, hold:4000, eq:"cam_dome",    col:"#00c8ff", title:"Купольная камера",      sub:"Hikvision DS-2CD2143G2",   specs:["4 Мп · IP67","ИК — 40 м","Обзор 110°"] },
  { zoom:3.2, fx:.55, fy:.03, hold:3800, eq:"cam_bullet",  col:"#00c8ff", title:"Цилиндрическая камера", sub:"Dahua IPC-HFW3849S",       specs:["8 Мп · 4K","Smart Dual Light","IP67"] },
  { zoom:3.5, fx:.78, fy:.44, hold:3500, eq:"pir_corr",    col:"#ef4444", title:"ИК датчик движения",    sub:"Optex VX-402NB",           specs:["12×12 м · 90°","Dual PIR","Антимаскинг"] },
  { zoom:3.5, fx:.10, fy:.32, hold:3500, eq:"wifi_lobby",  col:"#8b5cf6", title:"WiFi роутер",           sub:"Keenetic Voyager Pro",     specs:["Wi-Fi 6 · AX1800","Mesh · PoE","Потолочный"] },
  { zoom:3.8, fx:.68, fy:.10, hold:3500, eq:"smoke_meet1", col:"#f97316", title:"Датчик дыма",           sub:"Hochiki ESP-20B",          specs:["Адресный","Оптический","Протокол Apollo"] },
  { zoom:4.0, fx:.06, fy:.54, hold:3500, eq:"leak",        col:"#06b6d4", title:"Датчик протечки",       sub:"Ajax LeaksProtect",        specs:["Беспроводной","Мгновенное оповещение","IP65"] },
  { zoom:3.8, fx:.70, fy:.73, hold:3500, eq:"door_dir",    col:"#10b981", title:"Датчик открытия",       sub:"Ajax DoorProtect",         specs:["Магнитоконтакт","До 2 см зазор","Беспроводной"] },
  { zoom:3.8, fx:.66, fy:.49, hold:3800, eq:"reader",      col:"#fbbf24", title:"Считыватель СКУД",      sub:"HID Signo 20K",            specs:["MiFare / DESFire","OSDP v2","IP65"] },
  { zoom:3.5, fx:.64, fy:.55, hold:3800, eq:"nvr",         col:"#00c8ff", title:"Видеорегистратор",      sub:"Hikvision DS-7732NI-K4",   specs:["32 канала · 4K","4×10 ТБ HDD","H.265+"] },
  { zoom:3.5, fx:.76, fy:.66, hold:3500, eq:"sw",          col:"#60a5fa", title:"PoE-коммутатор",        sub:"TP-Link TL-SG1016PE",      specs:["16 портов PoE+","150 Вт бюджет","1 Гбит/с"] },
]

// ─── Icon sources ─────────────────────────────────────────────────────────────
// Real icons from /icons/ folder, Lucide fallback for dome & wifi
function mkSvg(c: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}

// Icon sources: { type: url | dataUri }
// Lucide data-URI builder
function lucideSrc(c: string, body: string) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(mkSvg(c, body))
}

const ICON_SRCS: Record<string, string | ((c: string) => string)> = {
  // Реальный SVG из папки
  dome:   "/icons/dome.svg",
  // Реальный SVG из папки
  bullet: "/icons/bullet.svg",
  // Реальный SVG из папки
  pir:    "/icons/pir.svg",
  // Lucide Wifi
  wifi:   (c: string) => lucideSrc(c,
    `<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>`),
  // Реальный PNG из папки
  smoke:  "/icons/smoke.png",
  // Реальный SVG из папки
  leak:   "/icons/leak.svg",
  // Реальный PNG из папки
  door:   "/icons/door.png",
  // Реальный SVG из папки
  reader: "/icons/reader.svg",
  // Реальный webp — требует removeWhiteBg перед colorize
  nvr:    "/icons/nvr.webp",
  // Реальный PNG из папки
  switch: "/icons/switch.png",
}

// Icon colors per type
const ICON_COLORS: Record<string, string> = {
  dome:"#00c8ff", bullet:"#00c8ff", pir:"#ef4444", wifi:"#8b5cf6",
  smoke:"#f97316", leak:"#06b6d4", door:"#10b981", reader:"#fbbf24",
  nvr:"#00c8ff", switch:"#60a5fa",
}

// Raw + colorized icon cache
let _rawIcons: Record<string, HTMLImageElement> = {}
let _tintedIcons: Record<string, HTMLCanvasElement> = {}
let _iconsReady = false

// Remove white/light background, then colorize to target color
function colorize(img: HTMLImageElement, color: string, size: number): HTMLCanvasElement {
  const cv = document.createElement("canvas")
  cv.width = size; cv.height = size
  const c = cv.getContext("2d")!
  c.drawImage(img, 0, 0, size, size)

  // Remove white/near-white pixels (make them transparent)
  const id = c.getImageData(0, 0, size, size)
  const d = id.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2]
    // If pixel is light (near white/gray watermark), make transparent
    if (r > 180 && g > 180 && b > 180) {
      d[i+3] = 0
    }
  }
  c.putImageData(id, 0, 0)

  // Now colorize remaining dark pixels
  c.globalCompositeOperation = "source-in"
  c.fillStyle = color
  c.fillRect(0, 0, size, size)
  return cv
}

function loadIcons() {
  if (_iconsReady) return
  const types = Object.keys(ICON_SRCS)
  let loaded = 0
  const total = types.length
  const TINT_SIZE = 128 // pre-render at 128px for quality

  for (const t of types) {
    const img = new Image()
    img.crossOrigin = "anonymous"
    const src = ICON_SRCS[t]
    img.src = typeof src === "function" ? src(ICON_COLORS[t]) : src

    img.onload = () => {
      _rawIcons[t] = img
      // Lucide icons (dome, wifi) are already colored via stroke
      // File icons need colorization
      if (typeof src === "string") {
        _tintedIcons[t] = colorize(img, ICON_COLORS[t], TINT_SIZE)
      }
      loaded++
      if (loaded >= total) _iconsReady = true
    }
    img.onerror = () => { loaded++; if (loaded >= total) _iconsReady = true }
  }
}

// ─── Build offscreen floor plan ───────────────────────────────────────────────
function buildPlan(W: number, H: number): HTMLCanvasElement {
  const pc = document.createElement("canvas")
  pc.width = W; pc.height = H
  const c = pc.getContext("2d")!

  c.fillStyle = "#0a1628"; c.fillRect(0,0,W,H)
  ROOMS.forEach(r => { c.fillStyle = r.fill; c.fillRect(r.x*W, r.y*H, r.w*W, r.h*H) })

  c.fillStyle = "rgba(0,80,160,.04)"
  for (let gx = 0; gx < W; gx += W*.04)
    for (let gy = 0; gy < H; gy += H*.04) c.fillRect(gx, gy, 1, 1)

  ROOMS.forEach(r => {
    c.save()
    c.font = `600 ${Math.max(9, W*.014)}px 'Inter',system-ui,sans-serif`
    c.fillStyle = "rgba(160,210,250,.6)"; c.textAlign = "center"; c.textBaseline = "middle"
    r.label.split("\n").forEach((l,i,a) => c.fillText(l, r.tx*W, r.ty*H + (i - (a.length-1)/2) * W*.016))
    c.restore()
  })

  const WC = "rgba(110,190,250,.65)"
  const WL = Math.max(1.5, W*.003)  // Внутренние стены — стандартная толщина
  const WL_OUT = 1                   // Внешние 4 стены периметра — фиксированно тонкие (1px)

  function hwall(y: number, x1: number, x2: number, gaps: number[][] = [], lw: number = WL) {
    const py = y*H; let cx = x1
    gaps.sort((a,b) => a[0]-b[0]).forEach(([gc,gw,sw]) => {
      const gs = gc-gw/2, ge = gc+gw/2
      if (gs > cx) { c.beginPath(); c.moveTo(cx*W, py); c.lineTo(gs*W, py); c.strokeStyle = WC; c.lineWidth = lw; c.stroke() }
      c.save(); c.strokeStyle = "rgba(80,150,220,.22)"; c.lineWidth = .8
      c.beginPath(); c.moveTo(gs*W, py); c.lineTo(gs*W, py + sw*gw*W)
      c.arc(gs*W, py, gw*W, sw>0?0:Math.PI*.5, sw>0?Math.PI*.5:0, sw>0?false:true)
      c.stroke(); c.restore()
      cx = ge
    })
    if (cx < x2) { c.beginPath(); c.moveTo(cx*W, py); c.lineTo(x2*W, py); c.strokeStyle = WC; c.lineWidth = lw; c.stroke() }
  }

  function vwall(x: number, y1: number, y2: number, gaps: number[][] = [], lw: number = WL) {
    const px = x*W; let cy = y1
    gaps.sort((a,b) => a[0]-b[0]).forEach(([gc,gw,sw]) => {
      const gs = gc-gw/2, ge = gc+gw/2
      if (gs > cy) { c.beginPath(); c.moveTo(px, cy*H); c.lineTo(px, gs*H); c.strokeStyle = WC; c.lineWidth = lw; c.stroke() }
      c.save(); c.strokeStyle = "rgba(80,150,220,.22)"; c.lineWidth = .8
      c.beginPath(); c.moveTo(px, gs*H); c.lineTo(px + sw*gw*H, gs*H)
      c.arc(px, gs*H, gw*H, sw>0?-Math.PI*.5:Math.PI, sw>0?0:-Math.PI*.5, sw<0)
      c.stroke(); c.restore()
      cy = ge
    })
    if (cy < y2) { c.beginPath(); c.moveTo(px, cy*H); c.lineTo(px, y2*H); c.strokeStyle = WC; c.lineWidth = lw; c.stroke() }
  }

  const hD: Record<number, number[][]> = {}, vD: Record<number, number[][]> = {}
  DOORS.forEach(d => {
    if (d.axis === "h") { (hD[d.at] = hD[d.at]||[]).push([d.cx!, d.dw, d.sw]) }
    else                { (vD[d.at] = vD[d.at]||[]).push([d.cy!, d.dw, d.sw]) }
  })

  // Внешние 4 стены (периметр) — тонкие
  hwall(0,0,1,hD[0]||[], WL_OUT); hwall(1,0,1,hD[1]||[], WL_OUT)
  vwall(0,0,1,vD[0]||[], WL_OUT); vwall(1,0,1,vD[1]||[], WL_OUT)
  hwall(.4,0,1,hD[.4]||[]); hwall(.5,0,1,hD[.5]||[])
  hwall(.72,0,.16,[])           // стена между санузлом и кухней
  hwall(.72,.6,.8,hD[.72]||[])  // стена между серверной и каб. директора
  vwall(.58,0,.4,vD[.58]||[]); vwall(.16,.5,1,vD[.16]||[])
  vwall(.6,.5,1,vD[.6]||[]); vwall(.8,.5,1,vD[.8]||[])

  // Окна — одна тонкая линия в тон стен (раньше было 3 параллельные, из-за них периметр казался толстым)
  c.lineWidth = 1; c.strokeStyle = "rgba(80,180,240,.55)"
  WINDOWS.forEach(w => {
    if (w.axis === "h") {
      const y = w.wall === "top" ? 1 : H-1, x1 = w.x!*W, x2 = (w.x!+w.l)*W
      c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke()
    } else {
      const x = w.wall === "left" ? 1 : W-1, y1 = w.y!*H, y2 = (w.y!+w.l)*H
      c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.stroke()
    }
  })

  return pc
}

// ─── FOV / coverage ───────────────────────────────────────────────────────────
function drawFov(c: CanvasRenderingContext2D, wx: number, wy: number, eq: EqItem, t: number) {
  if (eq.fov == null || eq.dir == null || eq.range == null) return
  const spd = eq.spd||.35, ph = eq.phase||0
  const sweep = (eq.sweep||eq.fov)/2*Math.PI/180
  const base = eq.dir*Math.PI/180
  const cur = base + Math.sin(t*spd + ph)*sweep
  const R = eq.range*c.canvas.width
  const fH = eq.fov/2*Math.PI/180

  const g = c.createRadialGradient(wx, wy, 0, wx, wy, R)
  g.addColorStop(0, eq.c+"38"); g.addColorStop(.4, eq.c+"1a"); g.addColorStop(.8, eq.c+"08"); g.addColorStop(1, "transparent")
  c.beginPath(); c.moveTo(wx, wy); c.arc(wx, wy, R, cur-fH, cur+fH); c.closePath()
  c.fillStyle = g; c.fill()

  c.beginPath()
  c.moveTo(wx, wy); c.lineTo(wx + Math.cos(cur-fH)*R, wy + Math.sin(cur-fH)*R)
  c.moveTo(wx, wy); c.lineTo(wx + Math.cos(cur+fH)*R, wy + Math.sin(cur+fH)*R)
  c.strokeStyle = eq.c+"40"; c.lineWidth = .7; c.stroke()
}

// Subtle radial coverage for non-directional devices
function drawCoverage(c: CanvasRenderingContext2D, wx: number, wy: number, eq: EqItem, t: number) {
  // Skip devices that have FOV cones (cameras, PIR) — they draw their own
  if (eq.fov != null) return
  const W = c.canvas.width
  const ph = eq.phase || 0
  const pv = Math.sin(t * 1.2 + ph) * .5 + .5

  // Coverage radius varies by type
  const radii: Record<string, number> = { wifi:.18, smoke:.10, leak:.06, door:.05, reader:.05, nvr:.04, switch:.04 }
  const baseR = radii[eq.t] || .06
  const R = W * baseR * (1 + pv * .1)

  const g = c.createRadialGradient(wx, wy, 0, wx, wy, R)
  g.addColorStop(0, eq.c + "30"); g.addColorStop(.4, eq.c + "18"); g.addColorStop(.8, eq.c + "08"); g.addColorStop(1, "transparent")
  c.beginPath(); c.arc(wx, wy, R, 0, Math.PI * 2)
  c.fillStyle = g; c.fill()

  // Dashed ring
  c.beginPath(); c.arc(wx, wy, R, 0, Math.PI * 2)
  c.strokeStyle = eq.c + Math.floor(pv * 25 + 15).toString(16).padStart(2, "0")
  c.lineWidth = .6; c.setLineDash([3, 5]); c.stroke(); c.setLineDash([])
}

// Per-type icon scale adjustments (some SVGs have denser content)
const ICON_SCALE: Record<string, number> = { reader: .75, nvr: .85 }

// ─── Draw icon ────────────────────────────────────────────────────────────────
function drawSymbol(c: CanvasRenderingContext2D, wx: number, wy: number, eq: EqItem, active: boolean, idle: boolean) {
  if (!_iconsReady) return
  // Use tinted version for file icons, raw for Lucide (already colored)
  const icon: CanvasImageSource | undefined = _tintedIcons[eq.t] || _rawIcons[eq.t]
  if (!icon) return
  const W = c.canvas.width
  const baseS = Math.max(20, W * .042)
  const s = baseS * (ICON_SCALE[eq.t] || 1)

  c.save()

  if (active) {
    const g = c.createRadialGradient(wx, wy, s*.2, wx, wy, s)
    g.addColorStop(0, eq.c+"28"); g.addColorStop(1, "transparent")
    c.fillStyle = g
    c.beginPath(); c.arc(wx, wy, s, 0, Math.PI*2); c.fill()
  }

  // Background disc
  c.beginPath(); c.arc(wx, wy, s*.56, 0, Math.PI*2)
  c.fillStyle = active ? "rgba(6,14,30,.90)" : "rgba(6,14,30,.65)"
  c.fill()
  const ringAlpha = active ? "aa" : idle ? "88" : "40"
  c.strokeStyle = eq.c + ringAlpha
  c.lineWidth = active ? 1.5 : idle ? 1.3 : 1
  c.stroke()

  // Icon — bright when active or idle
  c.globalAlpha = active ? 1 : idle ? 0.85 : 0.55
  c.drawImage(icon, wx - s/2, wy - s/2, s, s)
  c.globalAlpha = 1

  // Brackets only when active
  if (active) {
    const b = s*.70, l = s*.22
    c.strokeStyle = eq.c+"55"; c.lineWidth = 1
    ;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([dx,dy]) => {
      c.beginPath()
      c.moveTo(wx+dx*b, wy+dy*b); c.lineTo(wx+dx*b-dx*l, wy+dy*b)
      c.moveTo(wx+dx*b, wy+dy*b); c.lineTo(wx+dx*b, wy+dy*b-dy*l)
      c.stroke()
    })
  }

  c.restore()
}

// ─── Component ────────────────────────────────────────────────────────────────
interface CinematicFloorplanProps {
  /** Если false — планировка отрисовывается, но обход по устройствам (zoom) не стартует. */
  active?: boolean
}

export default function CinematicFloorplan({ active = true }: CinematicFloorplanProps = {}) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const specsRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  const st = useRef({
    // Стартовая позиция совпадает с CH[0] (обзор всего этажа), чтобы при активации
    // не было видимого «отдаления» от z=1 к z=0.85.
    cam: { x:.5, y:.5, z:.85 },
    tgt: { x:.5, y:.5, z:.85 },
    chIdx: 0,
    plan: null as HTMLCanvasElement | null,
    tmrs: [] as ReturnType<typeof setTimeout>[],
    done: false,
  })
  const rafId = useRef(0)
  const goRef = useRef<((i: number) => void) | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext("2d"); if (!ctx) return
    loadIcons()

    const resize = () => {
      const dpr = window.devicePixelRatio||1
      cv.width = cv.offsetWidth * dpr
      cv.height = cv.offsetHeight * dpr
      st.current.plan = null
    }
    resize()
    window.addEventListener("resize", resize)

    const setInfo = (ch: Chapter) => {
      const s = st.current
      s.tmrs.forEach(clearTimeout); s.tmrs = []
      const ttl = titleRef.current, sub = subRef.current, sp = specsRef.current
      if (!ttl || !sub || !sp) return

      ttl.style.opacity = "0"; sub.style.opacity = "0"; sp.innerHTML = ""

      s.tmrs.push(setTimeout(() => {
        if (ch.eq) {
          ttl.textContent = ch.title
          ttl.style.color = ch.col
          ttl.style.opacity = "1"
          if (ch.sub) { sub.textContent = ch.sub; sub.style.opacity = "1" } else sub.style.opacity = "0"
          ch.specs.forEach((text, i) => {
            const row = document.createElement("div")
            row.style.cssText = `display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(200,220,240,.65);opacity:0;transition:opacity .4s`
            row.innerHTML = `<span style="width:4px;height:4px;border-radius:50%;background:${ch.col};flex-shrink:0"></span>${text}`
            sp.appendChild(row)
            s.tmrs.push(setTimeout(() => { row.style.opacity = "1" }, 200 + i*180))
          })
        } else {
          ttl.style.opacity = "0"; sub.style.opacity = "0"
        }
      }, 250))
    }

    const go = (idx: number) => {
      const s = st.current
      if (s.done) return
      if (idx >= CH.length) {
        s.done = true; s.chIdx = 0
        s.tgt = { x: CH[0].fx, y: CH[0].fy, z: CH[0].zoom }
        setInfo(CH[0])
        return
      }
      s.chIdx = idx
      const ch = CH[idx]
      s.tgt = { x: ch.fx, y: ch.fy, z: ch.zoom }
      setInfo(ch)
      s.tmrs.push(setTimeout(() => go(idx + 1), 1000 + ch.hold))
    }
    goRef.current = go
    if (active && !startedRef.current) {
      startedRef.current = true
      go(0)
    }

    const loop = (now: number) => {
      const s = st.current, t = now / 1000
      s.cam.x += (s.tgt.x - s.cam.x) * .045
      s.cam.y += (s.tgt.y - s.cam.y) * .045
      s.cam.z += (s.tgt.z - s.cam.z) * .045

      const W = cv.width, H = cv.height
      if (W === 0 || H === 0) {
        rafId.current = requestAnimationFrame(loop)
        return
      }
      ctx.clearRect(0, 0, W, H)
      if (!s.plan) s.plan = buildPlan(W, H)

      const z = s.cam.z
      const tx = W/2 - s.cam.x*W*z, ty = H/2 - s.cam.y*H*z

      ctx.save()
      ctx.setTransform(z, 0, 0, z, tx, ty)
      ctx.drawImage(s.plan, 0, 0, W, H)

      const activeKey = CH[s.chIdx].eq
      const idle = s.done
      Object.entries(EQ).forEach(([key, eq]) => {
        const wx = eq.wx*W, wy = eq.wy*H
        if (eq.fov != null) drawFov(ctx, wx, wy, eq, t)
        drawCoverage(ctx, wx, wy, eq, t)
        drawSymbol(ctx, wx, wy, eq, activeKey === key, idle)
      })

      ctx.restore()

      // Vignette (very soft)
      const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*.35, W/2, H/2, Math.max(W,H)*.7)
      vg.addColorStop(0, "transparent"); vg.addColorStop(1, "rgba(6,14,30,.35)")
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)

      if (captionRef.current) {
        const op = Math.max(0, Math.min(1, (1.3 - s.cam.z) / 0.3))
        captionRef.current.style.opacity = String(op)
      }

      rafId.current = requestAnimationFrame(loop)
    }
    rafId.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId.current)
      st.current.tmrs.forEach(clearTimeout)
      window.removeEventListener("resize", resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Старт обхода камер — когда active переключается в true (после typewriter в hero)
  useEffect(() => {
    if (active && !startedRef.current && goRef.current) {
      startedRef.current = true
      goRef.current(0)
    }
  }, [active])

  return (
    <div style={{ position:"relative", width:"100%", height:"100%", overflow:"hidden", background:"#03251c", borderRadius:"inherit" }}>
      <canvas ref={cvRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />

      <div style={{ position:"absolute", bottom:20, left:20, pointerEvents:"none", maxWidth:240 }}>
        <div ref={titleRef} style={{
          fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif",
          fontSize:15, fontWeight:600, lineHeight:1.2,
          opacity:0, transition:"opacity .5s",
        }} />
        <div ref={subRef} style={{
          fontSize:10, color:"rgba(160,190,220,.45)", marginTop:3, letterSpacing:".03em",
          opacity:0, transition:"opacity .5s .1s",
        }} />
        <div ref={specsRef} style={{ marginTop:7, display:"flex", flexDirection:"column", gap:3 }} />
      </div>

      <div ref={captionRef} style={{ position:"absolute", bottom:10, left:0, right:0, textAlign:"center", pointerEvents:"none", opacity:1, transition:"opacity .25s" }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".22em",
          textTransform: "uppercase",
          background: "linear-gradient(90deg, #009B76, #14c296)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Полный цикл установки слаботочных систем
        </span>
      </div>
    </div>
  )
}
