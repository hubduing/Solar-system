// Именованные тела M42. orbitR — мировые единицы, period — секунд на оборот при x1.
export const BODIES = [
  {
    id: 'mercury', name: 'МЕРКУРИЙ', subtitle: 'Мануфакторум-аванпост',
    orbitR: 110, size: 4, color: '#8a7f6a', glow: '#5a5346',
    period: 8, angle0: 0.6, faction: 'Империум',
    desc: 'Выжженный мир кузниц. Автоматические мануфакторумы плавят руду под надзором скитариев Марса.',
  },
  {
    id: 'venus', name: 'ВЕНЕРА', subtitle: 'Аэрозавеса Морта',
    orbitR: 160, size: 6, color: '#c9a86a', glow: '#7a6435',
    period: 14, angle0: 2.1, faction: 'Империум',
    desc: 'Кислотные облака скрывают орбитальные доки. Станции-завесы гробят радары чужаков.',
  },
  {
    id: 'terra', name: 'ТЕРРА', subtitle: 'Священная Терра · Тронный мир',
    orbitR: 220, size: 9, color: '#4da3ff', glow: '#1e4d8f',
    period: 22, angle0: 4.0, faction: 'Империум',
    desc: 'Тронный мир Императора. Улей-купол Дворца светится сквозь смог. Паломнические караваны идут непрерывным потоком.',
  },
  {
    id: 'luna', name: 'ЛУНА', subtitle: 'Цитадель Кулаков',
    parent: 'terra', orbitR: 20, size: 3, color: '#b8bcc4', glow: '#5a5e66',
    period: 3, angle0: 1.2, faction: 'Империум',
    desc: 'Крепость-монастырь Имперских Кулаков. Орудия Фаланги держат подступы к Терре.',
  },
  {
    id: 'mars', name: 'МАРС', subtitle: 'Красная планета · Мир-кузня',
    orbitR: 285, size: 8, color: '#ff5a2a', glow: '#8f2e12',
    period: 30, angle0: 5.3, faction: 'Адептус Механикус',
    desc: 'Вотчина Омниссии. Заводы-хребты извергают пламя. Титаны Легио готовятся в ангарах-городах.',
  },
  {
    id: 'jupiter', name: 'ЮПИТЕР', subtitle: 'Верфи Кольца',
    orbitR: 390, size: 13, color: '#d8a97e', glow: '#7a5636',
    period: 55, angle0: 0.2, faction: 'Империум',
    desc: 'Кольцевые верфи выводят линкоры Боевого флота Сол. Рой точек вокруг — стапели и сухогрузы.',
  },
  {
    id: 'saturn', name: 'САТУРН', subtitle: 'Врата Титана',
    orbitR: 505, size: 11, color: '#e3cfa3', glow: '#6e6046', rings: true,
    period: 75, angle0: 2.8, faction: 'Империум',
    desc: 'Кольца утыканы боевыми станциями. Где-то в тени — Титан, и о нём не говорят вслух.',
  },
  {
    id: 'titan', name: 'ТИТАН', subtitle: '[ДАННЫЕ УДАЛЕНЫ]',
    parent: 'saturn', orbitR: 24, size: 2.5, color: '#9aa0aa', glow: '#3a3d44',
    period: 4, angle0: 3.3, faction: '???',
    desc: 'Запрос отклонён Инквизицией. Уровень доступа: Серый.',
  },
  {
    id: 'uranus', name: 'УРАН', subtitle: 'Дозорный рубеж',
    orbitR: 625, size: 8, color: '#7fd4c9', glow: '#2e6b64',
    period: 100, angle0: 1.7, faction: 'Империум',
    desc: 'Холодный дозор. Станции раннего предупреждения ловят тени из-за края системы.',
  },
  {
    id: 'neptune', name: 'НЕПТУН', subtitle: 'Последний фонарь',
    orbitR: 740, size: 8, color: '#5a7dff', glow: '#26377a',
    period: 130, angle0: 5.9, faction: 'Империум',
    desc: 'Край света Империума. Дальше — только тьма, и в ней что-то движется.',
  },
]
