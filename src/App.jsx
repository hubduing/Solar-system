import { useEffect, useRef, useState } from 'react'
import SolarCanvas from './components/SolarCanvas.jsx'
import { BODIES } from './data/bodies.js'
import { FACTION_NAMES, KIND_INFO, SWARM_TOTAL } from './sim/swarm.js'
import './App.css'

const SPEEDS = [1, 10, 100]

export default function App() {
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [aliveIds, setAliveIds] = useState(null) // null = все живы
  const [paused, setPaused] = useState(false)
  const [timeScale, setTimeScale] = useState(1)
  const [factionVisible, setFactionVisible] = useState([true, true, true, true, true])
  const canvasApi = useRef(null)

  // время -> движок
  useEffect(() => {
    canvasApi.current?.setPaused(paused)
  }, [paused])
  useEffect(() => {
    if (!paused) canvasApi.current?.setTimeScale(timeScale)
  }, [timeScale, paused])

  // фильтры -> движок
  useEffect(() => {
    canvasApi.current?.setFactionVisible(factionVisible)
  }, [factionVisible])

  // горячие клавиши: Space — пауза, 1/2/3 — скорость (вне полей ввода)
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.code === 'Space') {
        e.preventDefault()
        setPaused((p) => !p)
      } else if (e.key === '1') {
        setTimeScale(1)
        setPaused(false)
      } else if (e.key === '2') {
        setTimeScale(10)
        setPaused(false)
      } else if (e.key === '3') {
        setTimeScale(100)
        setPaused(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const alive = aliveIds ? new Set(aliveIds) : null
  const visibleBodies = BODIES.filter((b) => !alive || alive.has(b.id))
  const q = query.trim().toLowerCase()
  const results = q
    ? visibleBodies.filter((b) => (b.name + ' ' + b.subtitle + ' ' + b.faction).toLowerCase().includes(q)).slice(0, 6)
    : []

  const pickBody = (b) => {
    setSelected(b)
    setQuery('')
    canvasApi.current?.focusBody(b.id)
  }

  const toggleFaction = (i) => {
    setFactionVisible((prev) => prev.map((v, k) => (k === i ? !v : v)))
  }

  const doExterminatus = () => {
    if (!selected || selected.isSwarm) return
    canvasApi.current?.exterminatus(selected.id)
    // canvas сам вызовет onSelect(null) + onBodiesChange
  }

  return (
    <div className="app">
      <header className="hud-header">
        <div>
          <div className="hud-title-row">
            <span className="aquila">☩</span>
            <h1>SOLAR SYSTEM M42</h1>
          </div>
          <span className="subtitle">Тактический стол Инквизиции — <b>Шаг 4: интерактив Инквизитора</b></span>
        </div>
        <div className="hud-controls">
          <div className="time-controls">
            <button
              className={paused ? 'active' : ''}
              onClick={() => setPaused((p) => !p)}
              title="Пауза (Space)"
            >
              {paused ? '▶' : '❚❚'}
            </button>
            {SPEEDS.map((v) => (
              <button
                key={v}
                className={!paused && timeScale === v ? 'active' : ''}
                onClick={() => {
                  setTimeScale(v)
                  setPaused(false)
                }}
                title={`Скорость x${v}`}
              >
                x{v}
              </button>
            ))}
          </div>
          <div className="view-controls">
            <button onClick={() => canvasApi.current?.zoomBy(1.25)}>+</button>
            <button onClick={() => canvasApi.current?.zoomBy(1 / 1.25)}>−</button>
            <button onClick={() => canvasApi.current?.resetView()}>Сброс (R)</button>
          </div>
        </div>
      </header>
      <main className="viewport">
        <SolarCanvas ref={canvasApi} onSelect={setSelected} onBodiesChange={setAliveIds} />
        <aside className="dossier">
          <div className="search-block">
            <input
              className="search-input"
              placeholder="Поиск: Терра, Марс, Титан…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {q && (
              <div className="search-results">
                {results.length === 0 && <div className="no-result">Ничего не найдено среди живых миров.</div>}
                {results.map((b) => (
                  <button key={b.id} className="search-item" onClick={() => pickBody(b)}>
                    {b.name} <span>· {b.subtitle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="filters-block">
            <div className="filters-title">ФИЛЬТРЫ ФРАКЦИЙ</div>
            <div className="filters-grid">
              {FACTION_NAMES.map((name, i) => (
                <label key={name} className={factionVisible[i] ? 'flt on' : 'flt off'}>
                  <input type="checkbox" checked={factionVisible[i]} onChange={() => toggleFaction(i)} />
                  <i style={{ background: factionColor(i) }} />
                  {name}
                </label>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="selected-block">
              <h2>{selected.name}</h2>
              <p className="faction">{selected.subtitle}</p>
              <p className="faction">Фракция: {selected.faction}</p>
              <p>{selected.desc}</p>
              {!selected.isSwarm && (
                <button className="exterminatus" onClick={doExterminatus} title="Уничтожить мир">
                  ☠ EXTERMINATUS
                </button>
              )}
              <button onClick={() => setSelected(null)}>Снять выбор</button>
            </div>
          ) : (
            <div className="selected-block">
              <h2>ДОСЬЕ</h2>
              <p>Клик по телу или точке роя — досье. Drag — панорама. Колесо — зум. Двойной клик / R — сброс. Space — пауза, 1/2/3 — скорость.</p>
              <p className="faction">Живых тел: {visibleBodies.length} / {BODIES.length} · Рой: {SWARM_TOTAL}</p>
              {alive && alive.size < BODIES.length && (
                <p className="omen">☠ Экстерминатус свершён. Погибших: {BODIES.length - alive.size}</p>
              )}
              <p className="omen">ЗНАМЕНИЯ M42: 3 варп-разлома · ☩ обломки Кадии (260) · 6 халков · поля Геллера: Терра, Юпитер, Сатурн · 5 туманностей</p>
            </div>
          )}
        </aside>
      </main>
      <footer className="hud-footer">
        <span>drag — панорама · wheel — зум · click — досье · dblclick/R — сброс · space — пауза · 1/2/3 — время</span>
        <span className="runes">☩ ᛁᚾᛞᚢᛚᚷᛖᚾᚲᛁᚨ ☩ M42 ☩</span>
      </footer>
    </div>
  )
}

function factionColor(i) {
  // цвет маркера = цвет первого kind этой фракции, нейтралы — серый
  const found = KIND_INFO.find((k) => k.faction === i)
  return found ? found.color : '#8a8f96'
}
