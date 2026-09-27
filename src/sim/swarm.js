// Рой M42 — тысячи малых объектов на типизированных массивах.
// Хранение строго по плану Шага 2:
//   Float32Array: x, y, vx, vy (+ orbitR, angle, angVel для орбитальной механики)
//   Uint8Array: faction, kind, size
// Объекты НЕ в React state, живут в useRef движка SolarCanvas.

export const FACTIONS = {
  IMPERIUM: 0,
  MECHANICUS: 1,
  CHAOS: 2,
  TYRANIDS: 3,
  NEUTRAL: 4,
}

export const FACTION_NAMES = ['Империум', 'Механикус', 'Хаос', 'Тираниды', 'Нейтралы']

export const KINDS = {
  ASTEROID: 0,
  DEBRIS: 1,
  TRADER: 2,
  PATROL: 3,
  CHAOS_SHIP: 4,
  TYRANID: 5,
}

export const KIND_INFO = [
  { key: 'asteroids', label: 'Пояса астероидов', color: '#6b6257', faction: FACTIONS.NEUTRAL },
  { key: 'debris', label: 'Орбитальный мусор', color: '#8a8f96', faction: FACTIONS.NEUTRAL },
  { key: 'traders', label: 'Торговые караваны', color: '#ffd76a', faction: FACTIONS.IMPERIUM },
  { key: 'patrols', label: 'Патрули Империума', color: '#4da3ff', faction: FACTIONS.IMPERIUM },
  { key: 'chaos', label: 'Флот Хаоса', color: '#ff2a5a', faction: FACTIONS.CHAOS },
  { key: 'tyranids', label: 'Щупальце Тиранид', color: '#b44dff', faction: FACTIONS.TYRANIDS },
]

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Кеплер-консистентная угловая скорость: калибровка под BODIES
// (Терра: orbitR=220 -> period=22с => C ~= 0.00674)
const KEPLER_C = 0.00674
function angVelFor(orbitR, speedMul = 1) {
  const period = KEPLER_C * Math.pow(orbitR, 1.5)
  return ((Math.PI * 2) / period) * speedMul
}

export const SWARM_TOTAL = 7000

export function createSwarm(total = SWARM_TOTAL, seed = 1337) {
  const rand = mulberry32(seed)

  const x = new Float32Array(total)
  const y = new Float32Array(total)
  const vx = new Float32Array(total)
  const vy = new Float32Array(total)
  const orbitR = new Float32Array(total)
  const angle = new Float32Array(total)
  const angVel = new Float32Array(total)

  const faction = new Uint8Array(total)
  const kind = new Uint8Array(total)
  const size = new Uint8Array(total)

  // Группы идут непрерывными блоками — удобно для батч-отрисовки по kind.
  const plan = [
    { kind: KINDS.ASTEROID, count: 3000 }, // главный пояс Марс–Юпитер
    { kind: KINDS.ASTEROID, count: 1500 }, // пояс Койпера
    { kind: KINDS.DEBRIS, count: 800 }, // мусор у орбиты Терры
    { kind: KINDS.TRADER, count: 600 }, // караваны Терра–Юпитер
    { kind: KINDS.PATROL, count: 400 }, // патрули у Юпитера/Сатурна
    { kind: KINDS.CHAOS_SHIP, count: 400 }, // флот Хаоса на краю
    { kind: KINDS.TYRANID, count: 300 }, // щупальце Тиранид
  ]

  const groups = []
  let i = 0
  let beltIndex = 0

  const place = (k, orb, ang, spdMul, sz) => {
    orbitR[i] = orb
    angle[i] = ang
    angVel[i] = angVelFor(orb, spdMul)
    x[i] = Math.cos(ang) * orb
    y[i] = Math.sin(ang) * orb
    // касательная скорость круговой орбиты
    vx[i] = -Math.sin(ang) * orb * angVel[i]
    vy[i] = Math.cos(ang) * orb * angVel[i]
    kind[i] = k
    faction[i] = KIND_INFO[k].faction
    size[i] = sz
    i++
  }

  for (const block of plan) {
    const start = i
    for (let n = 0; n < block.count; n++) {
      const r = rand()
      const r2 = rand()
      const a = rand() * Math.PI * 2
      switch (block.kind) {
        case KINDS.ASTEROID: {
          if (beltIndex === 0) {
            // Главный пояс: 300–372, плотное кольцо с вариацией плотности
            place(block.kind, 300 + r * 72 + Math.sin(a * 3) * 4, a, 1, 1 + (r2 < 0.12 ? 1 : 0))
          } else {
            // Пояс Койпера: 760–950, разреженный
            place(block.kind, 760 + r * 190, a, 1, 1 + (r2 < 0.08 ? 1 : 0))
          }
          break
        }
        case KINDS.DEBRIS: {
          // Мусор: тонкое кольцо вокруг орбиты Терры (220) + редкие выбросы
          const wide = r2 > 0.9
          place(
            block.kind,
            wide ? 220 + (r * 2 - 1) * 60 : 220 + (r * 2 - 1) * 14,
            a,
            1 + r2 * 0.15,
            1,
          )
          break
        }
        case KINDS.TRADER: {
          // Караваны: орбиты 230–390, идут чуть быстрее (форсаж) + кучкование в караваны
          const lane = Math.floor(r2 * 5) / 5 // 5 торговых линий
          const jitter = (rand() * 2 - 1) * 6
          const caravanClump = Math.floor(rand() * 24) / 24 // сгустки по 24
          const ang = caravanClump * Math.PI * 2 + lane * 0.35 + (rand() * 2 - 1) * 0.03
          place(block.kind, 232 + lane * 32 + jitter, ang, 2.2, 2)
          break
        }
        case KINDS.PATROL: {
          // Патрули: две сферы — Юпитер (390) и Сатурн (505), быстрые
          const anchor = r2 < 0.55 ? 390 : 505
          place(block.kind, anchor + (r * 2 - 1) * 26, a, 2.8, 2)
          break
        }
        case KINDS.CHAOS_SHIP: {
          // Флот Хаоса: клин на краю (угол ~2.5 рад), радиус 1000–1120
          const spread = (1 - r) * 0.9 // плотное ядро + редкая вуаль
          place(
            block.kind,
            1000 + r2 * 120,
            2.5 + (rand() * 2 - 1) * spread * 0.55,
            0.9,
            2 + (r2 > 0.85 ? 1 : 0),
          )
          break
        }
        case KINDS.TYRANID: {
          // Щупальце: клин от края (1150) к Нептуну (740), сужается к голове.
          // t=0 хвост (широко), t=1 голова у Нептуна (узко, угол ~5.9)
          const t = r
          const orb = 1150 - t * 410
          const width = (1 - t) * 0.5 + 0.02
          place(
            block.kind,
            orb + (rand() * 2 - 1) * 18,
            5.9 + (rand() * 2 - 1) * width,
            0.55,
            1 + (t > 0.75 ? 1 : 0), // голова крупнее
          )
          break
        }
      }
    }
    if (block.kind === KINDS.ASTEROID) beltIndex++
    groups.push({ kind: block.kind, start, end: i })
  }

  return { n: i, x, y, vx, vy, orbitR, angle, angVel, faction, kind, size, groups }
}

export function updateSwarm(sw, dt) {
  const { n, x, y, vx, vy, orbitR, angle, angVel } = sw
  for (let i = 0; i < n; i++) {
    const a = angle[i] + angVel[i] * dt
    angle[i] = a
    const r = orbitR[i]
    const w = angVel[i]
    x[i] = Math.cos(a) * r
    y[i] = Math.sin(a) * r
    vx[i] = -Math.sin(a) * r * w
    vy[i] = Math.cos(a) * r * w
  }
}
