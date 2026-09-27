import { useEffect, useRef } from 'react'

// Шаг 1: здесь появится Canvas-движок (камера, Солнце, 9 тел M42).
// Шаг 0: заглушка с проверкой Canvas.
export default function SolarCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const draw = () => {
      const w = (canvas.width = canvas.clientWidth)
      const h = (canvas.height = canvas.clientHeight)
      ctx.fillStyle = '#05060a'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#c9a227'
      ctx.font = '14px monospace'
      ctx.fillText('STEP 0 OK — Canvas готов к M42', 20, 30)
    }
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])

  return <canvas ref={ref} className="solar-canvas" />
}
