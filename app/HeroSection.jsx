/**
 * HeroSection.jsx
 * Полностью самодостаточный компонент — никаких CSS-файлов не нужно.
 * Все стили — inline JS-объекты. Canvas, glassmorphism, счётчики — всё внутри.
 *
 * Зависимости: только React
 * Использование: import HeroSection from './HeroSection'
 */

import { useEffect, useRef, useCallback } from "react"

// ─── Цвета бренда ────────────────────────────────────────────
const C = {
  bg:        "#07080d",
  surface:   "#0d1420",
  nav:       "rgba(7,8,13,.9)",
  border:    "rgba(255,255,255,.07)",
  borderMd:  "rgba(255,255,255,.12)",
  borderAcc: "rgba(41,171,226,.28)",
  primary:   "#29abe2",
  secondary: "#00b4a0",
  priDark:   "#1a8fd1",
  text:      "#ffffff",
  text2:     "rgba(255,255,255,.62)",
  text3:     "rgba(255,255,255,.36)",
  text4:     "rgba(255,255,255,.20)",
  fire:      "#f97316",
  alarm:     "#ef4444",
  access:    "#fbbf24",
  network:   "#00b4a0",
  wifi:      "#34d399",
  green:     "#22c55e",
}

// ─── Шрифты (один раз в <head>) ──────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`

// ─── Keyframes ───────────────────────────────────────────────
const KF = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.22} }
  @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }

  .k-fade-1 { animation: fadeUp .85s .10s both; }
  .k-fade-2 { animation: fadeUp .85s .26s both; }
  .k-fade-3 { animation: fadeUp .85s .42s both; }
  .k-fade-4 { animation: fadeUp .85s .58s both; }
  .k-fade-5 { animation: fadeUp .85s .74s both; }

  .k-float  { animation: float 5.5s ease-in-out infinite; }
  .k-pulse  { animation: pulse 2s infinite; }

  /* Gradient text */
  .k-glow {
    background: linear-gradient(135deg, #fff 30%, #29abe2 65%, #00d4b8 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .k-glow-2 {
    background: linear-gradient(90deg, #29abe2, #00d4b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Glass */
  .k-glass {
    background: rgba(255,255,255,.032);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,.07);
  }
  .k-glass-blue {
    background: rgba(41,171,226,.055);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(41,171,226,.2);
  }

  /* Button hover states */
  .k-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #1a8fd1, #00b4a0);
    border: none; border-radius: 10px;
    color: #fff; font-family: 'Manrope',sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; cursor: pointer;
    transition: transform .25s, box-shadow .25s;
  }
  .k-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(41,171,226,.38);
  }
  .k-btn-primary:active { transform: scale(.97); }

  .k-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px;
    background: transparent;
    border: 1px solid rgba(41,171,226,.42); border-radius: 10px;
    color: #29abe2; font-family: 'Manrope',sans-serif;
    font-size: 13px; font-weight: 600; letter-spacing: .05em;
    text-transform: uppercase; cursor: pointer;
    transition: background .22s, border-color .22s;
  }
  .k-btn-ghost:hover {
    background: rgba(41,171,226,.09);
    border-color: #29abe2;
  }

  /* Nav links */
  .k-nav-link {
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,.52); cursor: pointer;
    transition: color .2s; letter-spacing: .01em;
    text-decoration: none;
  }
  .k-nav-link:hover { color: #fff; }

  /* Service cards */
  .k-srv {
    border-radius: 18px; padding: 28px;
    transition: transform .3s, box-shadow .3s;
  }
  .k-srv:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(0,0,0,.3);
  }

  /* Catalog cards */
  .k-card {
    background: rgba(255,255,255,.032);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; overflow: hidden;
    transition: transform .28s, border-color .28s, background .28s, box-shadow .28s;
  }
  .k-card:hover {
    transform: translateY(-4px);
    border-color: rgba(41,171,226,.38);
    background: rgba(41,171,226,.04);
    box-shadow: 0 8px 32px rgba(41,171,226,.14);
  }

  /* Filter buttons */
  .k-filter {
    padding: 6px 15px; border-radius: 99px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    font-family: 'Manrope',sans-serif;
    font-size: 11px; font-weight: 500; cursor: pointer;
    color: rgba(255,255,255,.45);
    transition: background .2s, color .2s, border-color .2s;
    white-space: nowrap;
  }
  .k-filter:hover { background: rgba(255,255,255,.08); color: #fff; }
  .k-filter.on {
    background: rgba(41,171,226,.14);
    color: #29abe2; border-color: rgba(41,171,226,.42);
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #07080d; }
  ::-webkit-scrollbar-thumb { background: rgba(41,171,226,.35); border-radius: 2px; }
`

// ─── Canvas background component ─────────────────────────────
function CanvasBg() {
  const cvRef = useRef(null)

  useEffect(() => {
    const cv  = cvRef.current
    if (!cv) return
    const ctx = cv.getContext("2d")
    const dpr = window.devicePixelRatio || 1
    let raf, particles = []

    const resize = () => {
      cv.width  = cv.offsetWidth  * dpr
      cv.height = cv.offsetHeight * dpr
      init()
    }

    const init = () => {
      particles = []
      const N = Math.floor((cv.width * cv.height) / 18000)
      for (let i = 0; i < N; i++) {
        particles.push({
          x:  Math.random() * cv.width,
          y:  Math.random() * cv.height,
          vx: (Math.random() - .5) * .32,
          vy: (Math.random() - .5) * .32,
          r:  Math.random() * 1.4 + .4,
          a:  Math.random() * .42 + .08,
          c:  Math.random() > .55 ? "41,171,226"
            : Math.random() > .5  ? "0,180,160"
            : "255,255,255",
        })
      }
    }

    const drawGrid = () => {
      const gs = Math.floor(cv.width / 24)
      ctx.strokeStyle = "rgba(255,255,255,.022)"
      ctx.lineWidth = .5
      for (let x = 0; x < cv.width;  x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,cv.height); ctx.stroke() }
      for (let y = 0; y < cv.height; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cv.width,y);  ctx.stroke() }
    }

    const drawGlow = () => {
      const W = cv.width, H = cv.height
      // Синее свечение слева
      const g1 = ctx.createRadialGradient(W*.2, H*.38, 0, W*.2, H*.38, W*.52)
      g1.addColorStop(0, "rgba(41,171,226,.08)")
      g1.addColorStop(1, "transparent")
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
      // Тиловое справа
      const g2 = ctx.createRadialGradient(W*.8, H*.68, 0, W*.8, H*.68, W*.42)
      g2.addColorStop(0, "rgba(0,180,160,.06)")
      g2.addColorStop(1, "transparent")
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)
    }

    const loop = () => {
      const W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      drawGrid()
      drawGlow()

      // Частицы
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.c},${p.a})`
        ctx.fill()
      })

      // Линии между соседними частицами
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < Math.min(i + 7, particles.length); j++) {
          const b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 85) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(41,171,226,${.13 * (1 - d / 85)})`
            ctx.lineWidth = .5
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener("resize", resize)
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])

  return (
    <canvas
      ref={cvRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        opacity: .58, pointerEvents: "none",
      }}
    />
  )
}

// ─── Animated counter hook ────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const DURATION = 2200
    const timer = setTimeout(() => {
      const start = performance.now()
      const step = (now) => {
        const p    = Math.min((now - start) / DURATION, 1)
        const ease = 1 - Math.pow(1 - p, 4)
        el.textContent = Math.round(ease * target) + (p >= 1 ? suffix : "")
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, 700)
    return () => clearTimeout(timer)
  }, [target, suffix])
  return <span ref={ref}>0</span>
}

// ─── Logo SVG ─────────────────────────────────────────────────
function Logo({ size = 36 }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      <defs>
        <linearGradient id="k360g" x1="6" y1="2" x2="30" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1a5fa8"/>
          <stop offset="100%" stopColor="#00b4a0"/>
        </linearGradient>
      </defs>
      <path d="M18 2L6 8v10c0 7.5 5 14 12 16 7-2 12-8.5 12-16V8L18 2z"
        fill="url(#k360g)" stroke="rgba(41,171,226,.6)" strokeWidth=".8"/>
      <circle cx="18" cy="18" r="6"   fill="none" stroke="#fff" strokeWidth="1.2"/>
      <circle cx="18" cy="18" r="3"   fill="#29abe2"/>
      <circle cx="18" cy="18" r="1.2" fill="#fff"/>
    </svg>
  )
}

// ─── Arrow icon ───────────────────────────────────────────────
const Arr = ({ col = "currentColor" }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const ArrDown = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 9l5 5 5-5" stroke="#29abe2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Floating badge ───────────────────────────────────────────
function FloatBadge({ dot, cat, title, brands, delay = 0 }) {
  return (
    <div className="k-glass" style={{
      borderRadius: 14, padding: "16px 20px", minWidth: 210,
      animationDelay: `${delay}s`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: dot, boxShadow: `0 0 8px ${dot}`,
          flexShrink: 0,
        }}/>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: ".12em",
          textTransform: "uppercase", color: "rgba(255,255,255,.44)",
        }}>{cat}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{brands}</div>
    </div>
  )
}

// ─── Service card ─────────────────────────────────────────────
function SrvCard({ icon, title, desc, tags, tagCol, borderCol, cta }) {
  return (
    <div className="k-srv k-glass" style={{ borderColor: `${borderCol}22` }}>
      <div style={{
        width: 52, height: 52, borderRadius: 13,
        background: `${borderCol}14`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-.01em" }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,.44)", lineHeight: 1.72, marginBottom: 20 }}>
        {desc}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: cta ? 20 : 0 }}>
        {tags.map(t => (
          <span key={t} style={{
            display: "inline-flex", alignItems: "center",
            padding: "4px 10px", borderRadius: 99,
            background: `${tagCol}16`, color: tagCol,
            border: `1px solid ${tagCol}30`,
            fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
          }}>{t}</span>
        ))}
      </div>
      {cta && (
        <button className="k-btn-primary" style={{ fontSize: 11, padding: "10px 18px" }}>
          {cta} <Arr />
        </button>
      )}
    </div>
  )
}

// ─── Stat block ───────────────────────────────────────────────
function Stat({ num, suffix, label, border = true }) {
  return (
    <div style={{
      paddingRight: border ? 52 : 0, paddingLeft: 0,
      borderRight: border ? "1px solid rgba(255,255,255,.08)" : "none",
    }}>
      <div style={{
        fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: "-.04em",
      }} className="k-glow-2">
        <Counter target={num} suffix={suffix} />
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: ".14em",
        textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginTop: 8,
      }}>{label}</div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────
export default function HeroSection() {
  return (
    <div style={{
      fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
      background: C.bg, color: C.text, minHeight: "100vh", overflowX: "hidden",
    }}>

      {/* Inject fonts + keyframes */}
      <style>{FONTS + KF}</style>

      {/* ══ NAVIGATION ══════════════════════════════════════════ */}
      <nav className="k-fade-1" style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 70,
        background: C.nav,
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid rgba(255,255,255,.055)",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={36} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: ".02em", lineHeight: 1 }}>
              КОНТРОЛЬ <span className="k-glow-2">360°</span>
            </div>
            <div style={{
              fontSize: 9, fontWeight: 500, letterSpacing: ".18em",
              color: "rgba(255,255,255,.27)", textTransform: "uppercase", marginTop: 2,
            }}>
              Безопасность начинается с нас
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: 32 }}>
          {["Услуги", "Каталог", "Объекты", "О компании", "Контакты"].map(l => (
            <a key={l} className="k-nav-link">{l}</a>
          ))}
        </div>

        {/* Phone + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13, color: C.primary, fontWeight: 500,
          }}>+7 (800) 000-00-00</span>
          <button className="k-btn-primary" style={{ fontSize: 11, padding: "10px 20px" }}>
            Заказать расчёт
          </button>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", minHeight: "calc(100vh - 70px)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "80px 48px 64px", overflow: "hidden",
      }}>
        {/* Canvas — рисует сетку, частицы, свечения */}
        <CanvasBg />

        {/* Контент поверх canvas */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "calc(100% - 280px)" }}>

          {/* Лайв-badge */}
          <div className="k-fade-1" style={{ marginBottom: 28 }}>
            <span className="k-glass-blue" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 99,
              fontSize: 10, fontWeight: 700, letterSpacing: ".14em",
              textTransform: "uppercase", color: C.primary,
            }}>
              <span className="k-pulse" style={{
                display: "block", width: 6, height: 6, borderRadius: "50%",
                background: C.primary, flexShrink: 0,
              }}/>
              № 1 по слаботочным системам в РФ
            </span>
          </div>

          {/* Заголовок */}
          <h1 className="k-fade-2" style={{
            fontSize: "clamp(38px, 5.5vw, 74px)",
            fontWeight: 800, lineHeight: 1.04, letterSpacing: "-.04em",
            marginBottom: 18,
          }}>
            <span className="k-glow">Комплексная защита</span>
            <br />любого объекта
          </h1>

          {/* Акцентная линия */}
          <div className="k-fade-2" style={{
            display: "flex", alignItems: "center", marginBottom: 20,
          }}>
            <div style={{
              width: 300, height: 1,
              background: "linear-gradient(90deg, rgba(41,171,226,.85), rgba(0,212,184,.85), transparent)",
            }}/>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: C.primary, marginLeft: -1, flexShrink: 0,
            }}/>
          </div>

          {/* Подзаголовок */}
          <p className="k-fade-3" style={{
            fontSize: 17, fontWeight: 400, lineHeight: 1.68,
            color: "rgba(255,255,255,.48)", maxWidth: 580, marginBottom: 40,
          }}>
            Проектируем, монтируем и обслуживаем системы видеонаблюдения,
            пожарной и охранной сигнализации, СКУД и СКС.
            Под ключ. С гарантией 3 года.
          </p>

          {/* Кнопки */}
          <div className="k-fade-4" style={{ display: "flex", gap: 16, marginBottom: 72 }}>
            <button className="k-btn-primary">Рассчитать проект <Arr /></button>
            <button className="k-btn-ghost">Смотреть объекты <ArrDown /></button>
          </div>

          {/* Статистика */}
          <div className="k-fade-5" style={{ display: "flex", gap: 0 }}>
            <Stat num={340} suffix="+" label="сданных объектов" border />
            <div style={{ paddingLeft: 52, paddingRight: 52, borderRight: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: "-.04em", color: "#fff" }}>
                <Counter target={12} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginTop: 8 }}>
                лет на рынке
              </div>
            </div>
            <div style={{ paddingLeft: 52, paddingRight: 52, borderRight: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: "-.04em", color: "#fff" }}>
                <Counter target={18} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginTop: 8 }}>
                городов присутствия
              </div>
            </div>
            <div style={{ paddingLeft: 52 }}>
              <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: "-.04em", color: "#fff" }}>
                24<span style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,.32)" }}>/7</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginTop: 8 }}>
                техподдержка
              </div>
            </div>
          </div>
        </div>

        {/* Плавающие бейджи — правая сторона */}
        <div className="k-float" style={{
          position: "absolute", right: 48, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 14, zIndex: 2,
        }}>
          <FloatBadge dot={C.primary}  cat="Видеонаблюдение" title="IP 4K · PTZ · NVR"     brands="Hikvision · Dahua · Axis"   />
          <FloatBadge dot={C.fire}     cat="Пожарная ОПС"    title="Адресные системы"       brands="Hochiki · Болид · Аргус"    />
          <FloatBadge dot={C.access}   cat="СКУД"            title="RFID · Биометрия · QR"  brands="HID · ZKTeco · Parsec"      />
        </div>
      </section>

      {/* ══ SERVICES ════════════════════════════════════════════ */}
      <section style={{ padding: "88px 48px", background: "rgba(0,0,0,.28)" }}>

        {/* Шапка секции */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 52 }}>
          <div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 99,
              background: "rgba(41,171,226,.09)", color: C.primary,
              border: "1px solid rgba(41,171,226,.22)",
              fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase",
              marginBottom: 18,
            }}>Что мы делаем</span>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.08 }}>
              Полный цикл<br /><span className="k-glow">слаботочных систем</span>
            </h2>
          </div>
          <button className="k-btn-ghost">Все услуги →</button>
        </div>

        {/* Ряд 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
          <SrvCard
            icon={<SvgCamera />}  title="Видеонаблюдение"
            desc="IP-камеры 4K, PTZ, тепловизоры. NVR с RAID. Аналитика: лица, номера, периметр."
            tags={["Hikvision","Dahua","Axis"]} tagCol={C.primary} borderCol={C.primary}
          />
          <SrvCard
            icon={<SvgFire />}    title="Пожарная сигнализация"
            desc="Адресные и пороговые системы. СОУЭ 1–5 типов. Интеграция с ПЦН и диспетчерской."
            tags={["Hochiki","Болид","Аргус-Спектр"]} tagCol={C.fire} borderCol={C.fire}
          />
          <SrvCard
            icon={<SvgShield />}  title="Охранная сигнализация"
            desc="PIR, микроволновые датчики, разбитие стекла. GSM-мониторинг 24/7 на ПЦН."
            tags={["Optex","Paradox","Satel"]} tagCol={C.alarm} borderCol={C.alarm}
          />
        </div>

        {/* Ряд 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <SrvCard
            icon={<SvgCard />}    title="СКУД"
            desc="RFID, биометрия, QR. Турникеты, шлагбаумы, замки. Учёт рабочего времени."
            tags={["HID","ZKTeco","Parsec"]} tagCol={C.access} borderCol={C.access}
          />
          <SrvCard
            icon={<SvgNet />}     title="Сеть / СКС / Wi-Fi"
            desc="Кабельные сети Cat6A/7. PoE-коммутаторы. Сплошное Wi-Fi покрытие объекта."
            tags={["Ubiquiti","MikroTik","TP-Link"]} tagCol={C.network} borderCol={C.network}
          />
          {/* CTA card */}
          <div className="k-glass-blue" style={{ borderRadius: 18, padding: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 13,
              background: "rgba(41,171,226,.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <SvgDocs />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-.01em" }}>
              Проектирование
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.44)", lineHeight: 1.72, marginBottom: 20 }}>
              Полный пакет ПД и РД. Сметная документация.
              Авторский надзор. Лицензии МЧС и ФСБ.
            </p>
            <button className="k-btn-primary" style={{ fontSize: 11, padding: "10px 18px" }}>
              Получить КП <Arr />
            </button>
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═══════════════════════════════════════════ */}
      <section style={{
        padding: "36px 48px",
        borderTop: "1px solid rgba(255,255,255,.05)",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 24,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.2)" }}>
          Нам доверяют
        </div>
        <div style={{ display: "flex", gap: 44, flexWrap: "wrap" }}>
          {["ГАЗПРОМ","СБЕР","РЖД","РОСАТОМ","ВТБ","ЛУКОЙЛ"].map(n => (
            <span key={n} style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".06em", color: "rgba(255,255,255,.2)" }}>{n}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Лицензия МЧС","ISO 9001","СРО"].map(l => (
            <span key={l} style={{
              display: "inline-flex", padding: "4px 10px", borderRadius: 99,
              background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.3)",
              border: "1px solid rgba(255,255,255,.09)",
              fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
            }}>{l}</span>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════ */}
      <section style={{ padding: "88px 48px" }}>
        <div className="k-glass-blue" style={{
          borderRadius: 24, padding: "56px 60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 48, position: "relative", overflow: "hidden",
        }}>
          {/* Декоративные glow-пятна */}
          <div style={{ position:"absolute", right:-60, top:-60, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(41,171,226,.1),transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", left:"42%", bottom:-40, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,180,160,.08),transparent 70%)", pointerEvents:"none" }}/>

          {/* Текст */}
          <div style={{ maxWidth: 540, position: "relative", zIndex: 1 }}>
            <span style={{
              display:"inline-flex", padding:"5px 14px", borderRadius:99,
              background:"rgba(41,171,226,.12)", color:C.primary,
              border:"1px solid rgba(41,171,226,.26)",
              fontSize:10, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase",
              marginBottom:18,
            }}>Бесплатно</span>
            <h2 style={{ fontSize:"clamp(24px,3vw,40px)", fontWeight:800, letterSpacing:"-.03em", lineHeight:1.1, marginBottom:14 }}>
              Выезд инженера и расчёт проекта —{" "}
              <span className="k-glow-2">0 рублей</span>
            </h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,.44)", lineHeight:1.7 }}>
              Оставьте заявку — перезвоним за 15 минут,<br/>
              согласуем время выезда, подготовим смету за 24 часа.
            </p>
          </div>

          {/* Форма */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, minWidth:262, position:"relative", zIndex:1 }}>
            {["Ваш телефон","Название объекта"].map(p => (
              <input key={p} placeholder={p} style={{
                width:"100%", padding:"13px 18px",
                background:"rgba(255,255,255,.07)",
                border:"1px solid rgba(255,255,255,.12)", borderRadius:8,
                color:"#fff", fontSize:14, outline:"none",
                fontFamily:"'Manrope',sans-serif",
              }}/>
            ))}
            <button className="k-btn-primary" style={{ justifyContent:"center", padding:15 }}>
              Получить расчёт бесплатно
            </button>
            <p style={{ fontSize:10, color:"rgba(255,255,255,.22)", textAlign:"center", lineHeight:1.6 }}>
              Нажимая кнопку, вы соглашаетесь<br/>с политикой конфиденциальности
            </p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{
        padding:"36px 48px",
        borderTop:"1px solid rgba(255,255,255,.05)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:24,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Logo size={26}/>
          <span style={{ fontSize:13, fontWeight:700 }}>
            КОНТРОЛЬ <span className="k-glow-2">360°</span>
          </span>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.2)", letterSpacing:".06em" }}>
          © 2024 · Безопасность начинается с нас
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {["Политика конфиденциальности","Реквизиты","Вакансии"].map(l => (
            <span key={l} style={{ fontSize:11, color:"rgba(255,255,255,.26)", cursor:"pointer" }}>{l}</span>
          ))}
        </div>
      </footer>

    </div>
  )
}

/* ── Inline SVG icons ─────────────────────────────────────── */
function SvgCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="#29abe2" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="7" stroke="#29abe2" strokeWidth="1.2" strokeDasharray="2 2"/>
      <circle cx="12" cy="12" r="10.5" stroke="#29abe2" strokeWidth=".8" opacity=".4"/>
    </svg>
  )
}
function SvgFire() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="#f97316" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="2" fill="#f97316"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}
function SvgShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 7v6c0 5 3.6 9.5 8 11 4.4-1.5 8-6 8-11V7L12 3z" stroke="#ef4444" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SvgCard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="11" height="16" rx="2" stroke="#fbbf24" strokeWidth="1.8"/>
      <path d="M14 10h3a2 2 0 012 2v3a2 2 0 01-2 2h-3" stroke="#fbbf24" strokeWidth="1.5"/>
      <circle cx="8.5" cy="14" r="1.5" fill="#fbbf24"/>
    </svg>
  )
}
function SvgNet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="4" rx="1" stroke="#00b4a0" strokeWidth="1.8"/>
      <rect x="2" y="10" width="20" height="4" rx="1" stroke="#00b4a0" strokeWidth="1.5" opacity=".6"/>
      <rect x="2" y="17" width="20" height="4" rx="1" stroke="#00b4a0" strokeWidth="1.2" opacity=".35"/>
      <circle cx="20" cy="5" r="1" fill="#00b4a0"/>
    </svg>
  )
}
function SvgDocs() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="#29abe2" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}
