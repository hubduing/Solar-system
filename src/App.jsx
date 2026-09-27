import SolarCanvas from './components/SolarCanvas.jsx'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="hud-header">
        <h1>SOLAR SYSTEM M42</h1>
        <span className="subtitle">Тактический стол Инквизиции — Шаг 0: инициализация</span>
      </header>
      <main className="viewport">
        <SolarCanvas />
      </main>
    </div>
  )
}
