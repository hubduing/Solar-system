import { useRef, useState } from 'react'
import SolarCanvas from './components/SolarCanvas.jsx'
import { BODIES } from './data/bodies.js'
import { SWARM_TOTAL } from './sim/swarm.js'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState(null)
  const canvasApi = useRef(null)

  return (
    <div className="app">
      <header className="hud-header">
        <div>
          <h1>SOLAR SYSTEM M42</h1>
          <span className="subtitle">Тактический стол Инквизиции — Шаг 2: тысячи объектов</span>
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
              <p className="faction">Именованных тел: {BODIES.length} + Солнце · Рой: {SWARM_TOTAL}</p>
              <ul className="faction" style={{ paddingLeft: 16, margin: '8px 0' }}>
                <li>Пояса астероидов: 4500</li>
                <li>Орбитальный мусор: 800</li>
                <li>Торговые караваны: 600</li>
                <li>Патрули Империума: 400</li>
                <li>Флот Хаоса: 400</li>
                <li>Щупальце Тиранид: 300</li>
              </ul>
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
