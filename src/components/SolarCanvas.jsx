import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { BODIES } from '../data/bodies.js'

// Детерминированный ГПСЧ для звездного фона
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SOLAR = { size: 22, color: '#ffd76a' }

const SolarCanvas = forwardRef(function SolarCanvas({ onSelect }, ref) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useImperativeHandle(ref, () => ({
    resetView() {
      const s = stateRef.current
      if (!s) return
      s.cam.x = 0
      s.cam.y = 0
      s.cam.zoom = s.fitZoom
    },
    zoomBy(f) {
      const s = stateRef.current
      if (!s) return
      const c = s.canvas
      s.cam.zoom = clampZoom(s.cam.zoom * f, s.fitZoom)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // --- состояние симуляции (вне React) ---
    const s = {
      canvas,
      bodies: BODIES.map((b) => ({ ...b, angle: b.angle0 })),
      cam: { x: 0, y: 0, zoom: 1 },
      fitZoom: 0.5,
      stars: [],
      time: 0,
      fps: 60,
      selectedId: null,
      drag: null,
    }
    stateRef.current = s

    const rand = mulberry32(40000)
    for (let i = 0; i < 700; i++) {
      s.stars.push({
        x: (rand() * 2 - 1) * 2200,
        y: (rand() * 2 - 1) * 2200,
        r: rand() < 0.9 ? 1 : 1.8,
        a: 0.25 + rand() * 0.55,
      })
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      s.fitZoom = Math.min(w, h) / 1750
      if (!s.userMoved) s.cam.zoom = s.fitZoom
    }
    resize()
    window.addEventListener('resize', resize)

    // --- камера: drag-pan, wheel-zoom, double-click reset ---
    const toWorld = (sx, sy) => {
      const r = canvas.getBoundingClientRect()
      const px = sx - r.left - r.width / 2
      const py = sy - r.top - r.height / 2
      return { x: px / s.cam.zoom + s.cam.x, y: py / s.cam.zoom + s.cam.y }
    }

    const onMouseDown = (e) => {
      s.drag = { x: e.clientX, y: e.clientY, cx: s.cam.x, cy: s.cam.y, moved: false }
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onMouseMove = (e) => {
      if (!s.drag) return
      const dx = (e.clientX - s.drag.x) / s.cam.zoom
      const dy = (e.clientY - s.drag.y) / s.cam.zoom
      if (Math.abs(e.clientX - s.drag.x) + Math.abs(e.clientY - s.drag.y) > 4) s.drag.moved = true
      s.cam.x = s.drag.cx - dx
      s.cam.y = s.drag.cy - dy
      s.userMoved = true
    }
    const onMouseUp = (e) => {
      const wasDrag = s.drag?.moved
      s.drag = null
      if (wasDrag) return
      // клик: хит-тест по именованным телам
      const p = positions()
      const r = canvas.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top
      let best = null
      let bestD = 1e9
      for (const b of p) {
        const sp = worldToScreen(b.x, b.y)
        const d = Math.hypot(sp.x - mx, sp.y - my)
        const hitR = Math.max(10, b.size * s.cam.zoom + 8)
        if (d < hitR && d < bestD) {
          best = b
          bestD = d
        }
      }
      s.selectedId = best ? best.id : null
      onSelectRef.current?.(best ? BODIES.find((x) => x.id === best.id) ?? null : null)
    }
    const onWheel = (e) => {
      e.preventDefault()
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const before = toWorld(e.clientX, e.clientY)
      s.cam.zoom = clampZoom(s.cam.zoom * f, s.fitZoom)
      const after = toWorld(e.clientX, e.clientY)
      s.cam.x += before.x - after.x
      s.cam.y += before.y - after.y
      s.userMoved = true
    }
    const onDblClick = () => {
      s.cam.x = 0
      s.cam.y = 0
      s.cam.zoom = s.fitZoom
    }
    const onKey = (e) => {
      if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') onDblClick()
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('dblclick', onDblClick)
    window.addEventListener('keydown', onKey)

    // --- позиции: планеты вокруг Солнца, луны вокруг родителей ---
    const byId = (id) => s.bodies.find((b) => b.id === id)
    function positions() {
      const out = []
      const cache = {}
      const get = (b) => {
        if (cache[b.id]) return cache[b.id]
        let x
        let y
        if (!b.parent) {
          x = Math.cos(b.angle) * b.orbitR
          y = Math.sin(b.angle) * b.orbitR
        } else {
          const p = get(byId(b.parent))
          x = p.x + Math.cos(b.angle) * b.orbitR
          y = p.y + Math.sin(b.angle) * b.orbitR
        }
        const pos = { ...b, x, y }
        cache[b.id] = pos
        out.push(pos)
        return pos
      }
      for (const b of s.bodies) get(b)
      return out
    }

    function worldToScreen(x, y) {
      const r = canvas.getBoundingClientRect()
      return {
        x: (x - s.cam.x) * s.cam.zoom + r.width / 2,
        y: (y - s.cam.y) * s.cam.zoom + r.height / 2,
      }
    }

    // --- главный цикл ---
    let raf = 0
    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      s.fps += (1 / Math.max(dt, 1e-4) - s.fps) * 0.05
      s.time += dt
      for (const b of s.bodies) b.angle += ((Math.PI * 2) / b.period) * dt

      const r = canvas.getBoundingClientRect()
      const w = r.width
      const h = r.height
      ctx.fillStyle = '#05060a'
      ctx.fillRect(0, 0, w, h)

      // тактическая сетка
      ctx.strokeStyle = 'rgba(201,162,39,0.07)'
      ctx.lineWidth = 1
      const grid = 100 * s.cam.zoom
      if (grid > 24) {
        const ox = w / 2 - s.cam.x * s.cam.zoom
        const oy = h / 2 - s.cam.y * s.cam.zoom
        ctx.beginPath()
        for (let gx = ox % grid; gx < w; gx += grid) {
          ctx.moveTo(gx, 0)
          ctx.lineTo(gx, h)
        }
        for (let gy = oy % grid; gy < h; gy += grid) {
          ctx.moveTo(0, gy)
          ctx.lineTo(w, gy)
        }
        ctx.stroke()
      }

      // звезды
      for (const st of s.stars) {
        const sp = worldToScreen(st.x, st.y)
        if (sp.x < 0 || sp.y < 0 || sp.x > w || sp.y > h) continue
        ctx.globalAlpha = st.a
        ctx.fillStyle = '#cfd6e4'
        ctx.fillRect(sp.x, sp.y, st.r, st.r)
      }
      ctx.globalAlpha = 1

      const c = worldToScreen(0, 0)

      // орбиты планет (без лун)
      ctx.strokeStyle = 'rgba(214,211,200,0.14)'
      ctx.lineWidth = 1
      for (const b of s.bodies) {
        if (b.parent) continue
        ctx.beginPath()
        ctx.arc(c.x, c.y, b.orbitR * s.cam.zoom, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Солнце + Астрономикон
      const sunR = SOLAR.size * s.cam.zoom
      const pulse = 1 + Math.sin(s.time * 2) * 0.06
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, sunR * 6)
      glow.addColorStop(0, 'rgba(255,215,106,0.55)')
      glow.addColorStop(0.35, 'rgba(255,180,80,0.18)')
      glow.addColorStop(1, 'rgba(255,180,80,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(c.x, c.y, sunR * 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = SOLAR.color
      ctx.beginPath()
      ctx.arc(c.x, c.y, Math.max(3, sunR * pulse), 0, Math.PI * 2)
      ctx.fill()
      // луч Астрономикона — вертикальный столб света
      ctx.fillStyle = 'rgba(255,230,150,0.10)'
      ctx.fillRect(c.x - Math.max(2, sunR * 0.35), 0, Math.max(4, sunR * 0.7), h)

      // тела
      const pos = positions()
      ctx.textBaseline = 'top'
      for (const b of pos) {
        const sp = worldToScreen(b.x, b.y)
        if (sp.x < -80 || sp.y < -40 || sp.x > w + 80 || sp.y > h + 40) continue
        const rr = Math.max(1.5, b.size * s.cam.zoom * 0.55)

        if (b.rings) {
          ctx.strokeStyle = 'rgba(227,207,163,0.55)'
          ctx.lineWidth = Math.max(1, 2 * s.cam.zoom * 0.5)
          ctx.beginPath()
          ctx.ellipse(sp.x, sp.y, rr * 2.1, rr * 0.8, -0.4, 0, Math.PI * 2)
          ctx.stroke()
        }

        const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, rr * 3)
        g.addColorStop(0, b.color)
        g.addColorStop(0.4, b.glow)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, rr * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, rr, 0, Math.PI * 2)
        ctx.fill()

        if (b.id === 'terra') {
          ctx.fillStyle = 'rgba(255,255,255,0.9)'
          ctx.beginPath()
          ctx.arc(sp.x - rr * 0.25, sp.y - rr * 0.25, Math.max(1, rr * 0.28), 0, Math.PI * 2)
          ctx.fill()
        }

        const isSel = s.selectedId === b.id
        if (isSel) {
          ctx.strokeStyle = '#c9a227'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(sp.x, sp.y, rr + 6, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.font = `${isSel ? 'bold ' : ''}11px monospace`
        ctx.fillStyle = isSel ? '#c9a227' : 'rgba(214,211,200,0.85)'
        ctx.fillText(b.name, sp.x + rr + 5, sp.y - 8)
      }

      // подпись центра + FPS
      ctx.font = '11px monospace'
      ctx.fillStyle = 'rgba(201,162,39,0.8)'
      ctx.fillText('СОЛНЦЕ · АСТРОНОМИКОН', c.x + 12, c.y + 10)
      ctx.fillStyle = 'rgba(214,211,200,0.6)'
      ctx.fillText(`${Math.round(s.fps)} FPS · тел: ${pos.length}`, 12, 12)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dblclick', onDblClick)
    }
  }, [])

  return <canvas ref={canvasRef} className="solar-canvas" />
})

function clampZoom(z, fitZoom) {
  return Math.min(8, Math.max(fitZoom * 0.5, z))
}

export default SolarCanvas
