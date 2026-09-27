// Атмосфера M42 — Шаг 3. Детерминированные данные + отрисовка.
// Всё вне React state: живёт в useRef движка SolarCanvas.
// Слои: туманности (фон), обломки Кадии (дрейф), варп-разломы (пульсация),
// корабли-халки (медленный дрейф), поля Геллера (вокруг ключевых миров).

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createAtmosphere(seed = 40042) {
  const rand = mulberry32(seed)

  // Туманности: 5 огромных мягких пятен (мировые координаты, радиус, цвет)
  const nebulas = [
    { x: -1250, y: -700, r: 650, color: '88,32,120', a: 0.10 }, // варп-фиолет
    { x: 1300, y: 550, r: 720, color: '140,20,40', a: 0.09 }, // кровавая
    { x: 300, y: -1350, r: 600, color: '30,60,140', a: 0.09 }, // холодная
    { x: -400, y: 1300, r: 550, color: '20,110,90', a: 0.06 }, // болезненно-зелёная
    { x: 0, y: 0, r: 900, color: '201,162,39', a: 0.03 }, // золотой ореол Терры
  ]

  // Варп-разломы: 3 штуки, у каждого фаза пульсации и угол молний
  const rifts = [
    { x: -880, y: 320, r: 55, spin: 0.7, phase: rand() * 6.28, hue: '177,77,255' },
    { x: 820, y: -580, r: 42, spin: -0.9, phase: rand() * 6.28, hue: '255,42,90' },
    { x: 180, y: 980, r: 64, spin: 0.5, phase: rand() * 6.28, hue: '120,60,255' },
  ]

  // Обломки Кадии: вытянутое облако ~260 осколков
  const CADIA_N = 260
  const cadia = {
    n: CADIA_N,
    x: new Float32Array(CADIA_N),
    y: new Float32Array(CADIA_N),
    s: new Uint8Array(CADIA_N),
    cx: -560,
    cy: -560,
  }
  for (let i = 0; i < CADIA_N; i++) {
    const a = rand() * Math.PI * 2
    const d = Math.pow(rand(), 0.6)
    // эллипс 170x70, повёрнут на -0.5 рад
    const ex = Math.cos(a) * d * 170
    const ey = Math.sin(a) * d * 70
    const ca = Math.cos(-0.5)
    const sa = Math.sin(-0.5)
    cadia.x[i] = cadia.cx + ex * ca - ey * sa + (rand() * 2 - 1) * 6
    cadia.y[i] = cadia.cy + ex * sa + ey * ca + (rand() * 2 - 1) * 6
    cadia.s[i] = 1 + (rand() < 0.15 ? 1 : 0)
  }

  // Корабли-халки: 6 тёмных громадин, медленная круговая орбита
  const hulks = []
  for (let i = 0; i < 6; i++) {
    const orbitR = 620 + rand() * 320
    const angle = rand() * Math.PI * 2
    hulks.push({
      orbitR,
      angle,
      angVel: ((Math.PI * 2) / (0.00674 * Math.pow(orbitR, 1.5))) * 0.5,
      size: 7 + rand() * 7,
      rot: rand() * Math.PI * 2,
      rotVel: (rand() * 2 - 1) * 0.15,
    })
  }

  // Поля Геллера: пузыри вокруг ключевых миров (id тела -> радиус)
  const gellar = [
    { bodyId: 'terra', r: 46, phase: 0 },
    { bodyId: 'jupiter', r: 58, phase: 2.1 },
    { bodyId: 'saturn', r: 62, phase: 4.2 },
  ]

  return { nebulas, rifts, cadia, hulks, gellar, time: 0 }
}

export function updateAtmosphere(atmo, dt) {
  atmo.time += dt
  for (const h of atmo.hulks) {
    h.angle += h.angVel * dt
    h.rot += h.rotVel * dt
  }
  // Кадия медленно дрейфует по орбите (жёсткий сдвиг угла всего облака)
  const w = ((Math.PI * 2) / (0.00674 * Math.pow(790, 1.5))) * 0.8
  const da = w * dt
  const cos = Math.cos(da)
  const sin = Math.sin(da)
  for (let i = 0; i < atmo.cadia.n; i++) {
    const x = atmo.cadia.x[i]
    const y = atmo.cadia.y[i]
    atmo.cadia.x[i] = x * cos - y * sin
    atmo.cadia.y[i] = x * sin + y * cos
  }
}

// --- Отрисовка. Каждый draw получает ctx, atmo, helpers {w,h,toSX,toSY,cam} ---

export function drawNebulas(ctx, atmo, sx) {
  for (const n of atmo.nebulas) {
    const x = (n.x - sx.cam.x) * sx.cam.zoom + sx.w / 2
    const y = (n.y - sx.cam.y) * sx.cam.zoom + sx.h / 2
    const r = n.r * sx.cam.zoom
    if (x + r < 0 || y + r < 0 || x - r > sx.w || y - r > sx.h) continue
    const breathe = 1 + Math.sin(atmo.time * 0.12 + n.x * 0.001) * 0.03
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r * breathe))
    g.addColorStop(0, `rgba(${n.color},${n.a})`)
    g.addColorStop(0.6, `rgba(${n.color},${n.a * 0.45})`)
    g.addColorStop(1, `rgba(${n.color},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - r * breathe, y - r * breathe, r * 2 * breathe, r * 2 * breathe)
  }
}

export function drawCadia(ctx, atmo, sx) {
  ctx.fillStyle = 'rgba(154,140,120,0.75)'
  for (let i = 0; i < atmo.cadia.n; i++) {
    const x = (atmo.cadia.x[i] - sx.cam.x) * sx.cam.zoom + sx.w / 2
    if (x < 0 || x > sx.w) continue
    const y = (atmo.cadia.y[i] - sx.cam.y) * sx.cam.zoom + sx.h / 2
    if (y < 0 || y > sx.h) continue
    const p = atmo.cadia.s[i]
    // редкие осколки с варп-искрой
    if ((i & 31) === 0) ctx.fillStyle = 'rgba(177,77,255,0.8)'
    else if ((i & 31) === 1) ctx.fillStyle = 'rgba(154,140,120,0.75)'
    ctx.fillRect(x, y, p, p)
  }
  // подпись обломков — только когда видно
  const lx = (atmo.cadia.cx - sx.cam.x) * sx.cam.zoom + sx.w / 2
  const ly = (atmo.cadia.cy - sx.cam.y) * sx.cam.zoom + sx.h / 2
  if (lx > 0 && ly > 0 && lx < sx.w && ly < sx.h && sx.cam.zoom > 0.35) {
    ctx.font = '10px monospace'
    ctx.fillStyle = 'rgba(154,140,120,0.55)'
    ctx.fillText('☩ ОБЛОМКИ КАДИИ', lx + 12, ly - 12)
  }
}

export function drawRifts(ctx, atmo, sx) {
  for (const r of atmo.rifts) {
    const x = (r.x - sx.cam.x) * sx.cam.zoom + sx.w / 2
    const y = (r.y - sx.cam.y) * sx.cam.zoom + sx.h / 2
    const base = Math.max(2, r.r * sx.cam.zoom)
    if (x + base * 5 < 0 || y + base * 5 < 0 || x - base * 5 > sx.w || y - base * 5 > sx.h)
      continue
    const flick = 1 + Math.sin(atmo.time * 3 + r.phase) * 0.12 + Math.sin(atmo.time * 7.3 + r.phase * 2) * 0.05

    // внешнее свечение
    const glow = ctx.createRadialGradient(x, y, 0, x, y, base * 4 * flick)
    glow.addColorStop(0, `rgba(${r.hue},0.35)`)
    glow.addColorStop(0.5, `rgba(${r.hue},0.12)`)
    glow.addColorStop(1, `rgba(${r.hue},0)`)
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, base * 4 * flick, 0, Math.PI * 2)
    ctx.fill()

    // ядро-трещина: вытянутый эллипс
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(atmo.time * r.spin * 0.3 + r.phase)
    ctx.fillStyle = `rgba(5,2,12,0.95)`
    ctx.beginPath()
    ctx.ellipse(0, 0, base * 1.1 * flick, base * 0.38 * flick, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(${r.hue},0.9)`
    ctx.lineWidth = Math.max(1, base * 0.08)
    ctx.beginPath()
    ctx.ellipse(0, 0, base * 1.1 * flick, base * 0.38 * flick, 0, 0, Math.PI * 2)
    ctx.stroke()
    // внутренняя молния
    ctx.strokeStyle = 'rgba(255,240,255,0.75)'
    ctx.lineWidth = Math.max(0.6, base * 0.03)
    ctx.beginPath()
    ctx.moveTo(-base * flick, 0)
    ctx.bezierCurveTo(
      -base * 0.3 * flick, -base * 0.3 * flick,
      base * 0.3 * flick, base * 0.3 * flick,
      base * flick, 0,
    )
    ctx.stroke()
    ctx.restore()

    // орбитальные дуги-молнии
    ctx.strokeStyle = `rgba(${r.hue},0.35)`
    ctx.lineWidth = 1
    for (let k = 0; k < 3; k++) {
      const a0 = atmo.time * r.spin + r.phase + (k * Math.PI * 2) / 3
      ctx.beginPath()
      ctx.arc(x, y, base * (1.7 + k * 0.45) * flick, a0, a0 + 1.5)
      ctx.stroke()
    }
  }
}

export function drawHulks(ctx, atmo, sx) {
  for (const h of atmo.hulks) {
    const wx = Math.cos(h.angle) * h.orbitR
    const wy = Math.sin(h.angle) * h.orbitR
    const x = (wx - sx.cam.x) * sx.cam.zoom + sx.w / 2
    const y = (wy - sx.cam.y) * sx.cam.zoom + sx.h / 2
    if (x < -60 || y < -60 || x > sx.w + 60 || y > sx.h + 60) continue
    const s = Math.max(3, h.size * sx.cam.zoom * 0.8)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(h.rot)
    // тёмный остов: два сросшихся корпуса
    ctx.fillStyle = '#101319'
    ctx.strokeStyle = 'rgba(140,120,70,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-s, -s * 0.35)
    ctx.lineTo(-s * 0.2, -s * 0.5)
    ctx.lineTo(s, -s * 0.2)
    ctx.lineTo(s * 0.6, s * 0.4)
    ctx.lineTo(-s * 0.4, s * 0.55)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // редкие огни
    ctx.fillStyle = 'rgba(255,180,90,0.9)'
    ctx.fillRect(-s * 0.3, -s * 0.1, 1.5, 1.5)
    ctx.fillStyle = 'rgba(255,60,80,0.9)'
    ctx.fillRect(s * 0.35, s * 0.05, 1.5, 1.5)
    ctx.restore()
  }
}

export function drawGellar(ctx, atmo, posById, sx) {
  for (const g of atmo.gellar) {
    const p = posById[g.bodyId]
    if (!p) continue
    const x = (p.x - sx.cam.x) * sx.cam.zoom + sx.w / 2
    const y = (p.y - sx.cam.y) * sx.cam.zoom + sx.h / 2
    if (x < -120 || y < -120 || x > sx.w + 120 || y > sx.h + 120) continue
    const r = g.r * sx.cam.zoom * (1 + Math.sin(atmo.time * 1.4 + g.phase) * 0.05)
    ctx.strokeStyle = 'rgba(90,255,210,0.35)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([6, 5])
    ctx.beginPath()
    ctx.arc(x, y, Math.max(4, r), atmo.time * 0.2 + g.phase, atmo.time * 0.2 + g.phase + Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    const fill = ctx.createRadialGradient(x, y, r * 0.7, x, y, r)
    fill.addColorStop(0, 'rgba(90,255,210,0)')
    fill.addColorStop(1, 'rgba(90,255,210,0.06)')
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, y, Math.max(4, r), 0, Math.PI * 2)
    ctx.fill()
  }
}
