import { useRef, useState } from 'react'
import SolarCanvas from './components/SolarCanvas.jsx'
import { BODIES } from './data/bodies.js'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState(null)
  const canvasApi = useRef(null)

  return (
    <div className="app">
      <header className="hud-header">
        <div>
          <h1>SOLAR SYSTEM M42</h1>
          <span className="subtitle">Тактический стол Инквизиции — Шаг 1: ядро + Священная Терра</span>
        </div>
        <div className="hud-controls">
          <button onClick={() => canvasApi.current?.zoomBy(1.25)}>+</button>
          <button onClick={() => canvasApi.current?.zoomBy(1 / 1.25)}>−</button>
          <button onClick={() => canvasApi.current?.resetView()}>Сброс (R)</button>
        </div>
      </header>
      <main className="viewport">
        <SolarCanvas ref={canvasApi} onSelect={setSelected} />
        <aside className="dossier">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <p className="faction">{selected.subtitle}</p>
              <p className="faction">Фракция: {selected.faction}</p>
              <p>{selected.desc}</p>
              <button onClick={() => setSelected(null)}>Снять выбор</button>
            </>
          ) : (
            <>
              <h2>ДОСЬЕ</h2>
              <p>Клик по телу — досье. Drag — панорама. Колесо — зум. Двойной клик / R — сброс.</p>
              <p className="faction">Именованных тел: {BODIES.length} + Солнце</p>
            </>
          )}
        </aside>
      </main>
      <footer className="hud-footer">
        <span>drag — панорама · wheel — зум · click — досье · dblclick/R — сброс</span>
      </footer>
    </div>
  )
}
