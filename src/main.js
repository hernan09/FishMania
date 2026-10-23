import './style.css'
import { createControls } from './controls.js'
import {
  PLAYER_STAGES,
  ENEMY_PALETTES,
  drawSideFish,
  drawBubbleShield,
  drawCoral,
  drawRock,
} from './drawFish.js'

const FISH_PER_LEVEL = 20
const MAX_LIVES = 3
const SHIELD_DURATION = 6
const SHIELD_COOLDOWN = 10

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')
const livesEl = document.getElementById('lives')
const eatenEl = document.getElementById('eaten')
const levelEl = document.getElementById('level')
const growthBar = document.getElementById('growth-bar')
const growthText = document.getElementById('growth-text')
const toastEl = document.getElementById('toast')
const hintEl = document.getElementById('hint')
const overlay = document.getElementById('overlay')
const overlayTitle = document.getElementById('overlay-title')
const overlayMsg = document.getElementById('overlay-msg')
const btnStart = document.getElementById('btn-start')
const shieldBtn = document.getElementById('shield-btn')
const shieldLabel = document.getElementById('shield-label')

const controls = createControls(
  document.getElementById('joystick'),
  document.getElementById('stick'),
  canvas
)

let W = 0
let H = 0
let dpr = 1

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = window.innerWidth
  H = window.innerHeight
  canvas.width = Math.floor(W * dpr)
  canvas.height = Math.floor(H * dpr)
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
window.addEventListener('resize', resize)
resize()

// —— Estado ——
let running = false
let lives = MAX_LIVES
let eaten = 0
let towardLevel = 0
let stage = 0
let invuln = 0
let mouth = 0
let mouthTimer = 0
let scroll = 0
let time = 0
let shake = 0
let shieldTime = 0
let shieldCooldown = 0
let shieldPop = 0

const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  baseSize: 52,
}

const enemies = []
const decor = []
const bubbles = []
const particles = []

function playerSize() {
  return player.baseSize * PLAYER_STAGES[stage].scale
}

function showToast(msg) {
  toastEl.textContent = msg
  toastEl.classList.remove('hidden')
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => toastEl.classList.add('hidden'), 2000)
}

function updateHud() {
  livesEl.textContent = '❤'.repeat(lives) + '♡'.repeat(MAX_LIVES - lives)
  eatenEl.textContent = String(eaten)
  levelEl.textContent = String(stage + 1)
  growthBar.style.width = `${(towardLevel / FISH_PER_LEVEL) * 100}%`
  growthText.textContent = `${towardLevel} / ${FISH_PER_LEVEL}`
}

function resetWorld() {
  lives = MAX_LIVES
  eaten = 0
  towardLevel = 0
  stage = 0
  invuln = 0
  mouth = 0
  scroll = 0
  time = 0
  enemies.length = 0
  decor.length = 0
  bubbles.length = 0
  particles.length = 0
  shieldTime = 0
  shieldCooldown = 0
  shieldPop = 0
  updateShieldUi()

  // Pez siempre centrado a la izquierda de la pantalla
  player.x = W * 0.28
  player.y = H * 0.5
  player.vx = 0
  player.vy = 0

  for (let i = 0; i < 18; i++) spawnDecor(true)
  for (let i = 0; i < 8; i++) spawnEnemy(true)
  for (let i = 0; i < 40; i++) {
    bubbles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 2 + Math.random() * 4,
      sp: 20 + Math.random() * 40,
    })
  }
  updateHud()
}

function spawnDecor(anywhere = false) {
  const x = anywhere ? Math.random() * (W + 400) : W + 40 + Math.random() * 200
  decor.push({
    x,
    y: H - 10,
    h: 70 + Math.random() * 120,
    kind: Math.floor(Math.random() * 4),
    rock: Math.random() > 0.55,
    rockSize: 28 + Math.random() * 40,
  })
}

function spawnEnemy(anywhere = false) {
  const ps = playerSize()
  // Variedad de tamaños: más chicos, iguales y más grandes
  const roll = Math.random()
  let size
  if (roll < 0.45) size = ps * (0.35 + Math.random() * 0.45) // más chico
  else if (roll < 0.7) size = ps * (0.85 + Math.random() * 0.25) // similar
  else size = ps * (1.15 + Math.random() * 0.7) // más grande

  enemies.push({
    x: anywhere ? W * 0.5 + Math.random() * W : W + 60 + Math.random() * 120,
    y: 60 + Math.random() * (H - 120),
    size,
    speed: 80 + Math.random() * 100 + stage * 12,
    palette: ENEMY_PALETTES[Math.floor(Math.random() * ENEMY_PALETTES.length)],
    wobble: Math.random() * Math.PI * 2,
    dead: false,
  })
}

function burst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 0.4 + Math.random() * 0.4,
      color,
      r: 3 + Math.random() * 5,
    })
  }
}

function growIfNeeded() {
  if (towardLevel < FISH_PER_LEVEL) return
  towardLevel = 0
  if (stage < PLAYER_STAGES.length - 1) {
    stage++
    showToast(`¡Creciste! ${PLAYER_STAGES[stage].name}`)
  } else {
    showToast('¡Sos el leviatán!')
  }
  updateHud()
}

function loseLife() {
  if (invuln > 0) return
  lives--
  invuln = 2
  shake = 12
  updateHud()
  showToast(lives > 0 ? `¡Te comieron! Vidas: ${lives}` : 'Game Over')
  if (lives <= 0) {
    running = false
    overlayTitle.textContent = 'Game Over'
    overlayMsg.textContent = `Comiste ${eaten} peces. Nivel ${stage + 1}. ¡Probá de nuevo!`
    btnStart.textContent = 'Reintentar'
    overlay.classList.remove('hidden')
  }
}

function tryEat(enemy) {
  const ps = playerSize()
  // Igual o menor → podés comer
  if (enemy.size <= ps * 1.05) {
    enemy.dead = true
    mouth = 1
    mouthTimer = 0.35
    burst(enemy.x, enemy.y, enemy.palette.patch)
    eaten++
    towardLevel++
    growIfNeeded()
    updateHud()
    return 'eat'
  }
  // Más grande → te come, salvo que la burbuja absorba el golpe
  if (shieldTime > 0) {
    popShield()
    enemy.x += 140
    return 'blocked'
  }
  loseLife()
  enemy.x += 80
  return 'hurt'
}

function shieldRadius() {
  return playerSize() * 0.68
}

function activateShield() {
  if (!running || shieldTime > 0 || shieldCooldown > 0) return
  shieldTime = SHIELD_DURATION
  updateShieldUi()
}

function popShield() {
  shieldTime = 0
  shieldCooldown = SHIELD_COOLDOWN
  shieldPop = 0.35
  invuln = 1
  shake = 6
  const r = shieldRadius()
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    particles.push({
      x: player.x + Math.cos(a) * r,
      y: player.y + Math.sin(a) * r,
      vx: Math.cos(a) * 160,
      vy: Math.sin(a) * 160 - 40,
      life: 0.5 + Math.random() * 0.3,
      color: 'rgba(200,245,255,0.9)',
      r: 2 + Math.random() * 4,
    })
  }
  showToast('¡La burbuja te salvó!')
  updateShieldUi()
}

function updateShieldUi() {
  shieldBtn.classList.toggle('active', shieldTime > 0)
  shieldBtn.classList.toggle('cooldown', shieldCooldown > 0)
  let progress = 1
  if (shieldTime > 0) {
    progress = shieldTime / SHIELD_DURATION
    shieldLabel.textContent = `${Math.ceil(shieldTime)}s`
  } else if (shieldCooldown > 0) {
    progress = 1 - shieldCooldown / SHIELD_COOLDOWN
    shieldLabel.textContent = `${Math.ceil(shieldCooldown)}s`
  } else {
    shieldLabel.textContent = 'Escudo'
  }
  shieldBtn.style.setProperty('--progress', progress.toFixed(3))
}

shieldBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  e.stopPropagation()
  activateShield()
})
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault()
    activateShield()
  }
})

btnStart.addEventListener('click', () => {
  overlay.classList.add('hidden')
  resetWorld()
  running = true
  hintEl.classList.remove('fade')
  setTimeout(() => hintEl.classList.add('fade'), 5000)
})

// Mostrar menú al inicio
overlay.classList.remove('hidden')
resetWorld()

function drawBackground(dt) {
  // Agua degradada
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#05768a')
  g.addColorStop(0.45, '#028090')
  g.addColorStop(1, '#023047')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Rayos de luz
  ctx.save()
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 6; i++) {
    const x = ((i * 180 + scroll * 0.15) % (W + 200)) - 100
    ctx.fillStyle = '#b8f2ff'
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 40, 0)
    ctx.lineTo(x + 120, H)
    ctx.lineTo(x - 40, H)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // Arena del fondo
  ctx.fillStyle = '#3d5a4c'
  ctx.fillRect(0, H - 36, W, 36)
  ctx.fillStyle = '#4a6b58'
  ctx.beginPath()
  ctx.moveTo(0, H - 36)
  for (let x = 0; x <= W; x += 40) {
    ctx.lineTo(x, H - 36 - Math.sin((x + scroll) * 0.02) * 6)
  }
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.fill()
}

function update(dt) {
  time += dt
  if (invuln > 0) invuln -= dt
  if (shake > 0) shake -= dt * 40
  if (shieldPop > 0) shieldPop -= dt
  if (shieldTime > 0) {
    shieldTime -= dt
    if (shieldTime <= 0) {
      shieldTime = 0
      shieldCooldown = SHIELD_COOLDOWN
    }
    updateShieldUi()
  } else if (shieldCooldown > 0) {
    shieldCooldown = Math.max(0, shieldCooldown - dt)
    updateShieldUi()
  }
  if (mouthTimer > 0) {
    mouthTimer -= dt
    mouth = Math.max(0, mouthTimer / 0.35)
  } else {
    mouth *= Math.exp(-8 * dt)
  }

  scroll += (140 + stage * 20) * dt

  const move = controls.getMove()
  const speed = 280
  // El pez queda anclado en X ~28% de la pantalla; solo se mueve un poco
  const targetX = W * 0.28 + move.x * 40
  player.vx += (targetX - player.x) * 6 * dt
  player.vy = move.y * speed

  player.x += player.vx * dt
  player.y += player.vy * dt
  player.vx *= Math.exp(-6 * dt)

  // Clamp: siempre visible y centrado-izquierda
  player.x = Math.max(W * 0.18, Math.min(W * 0.42, player.x))
  const margin = playerSize() * 0.4
  player.y = Math.max(margin + 20, Math.min(H - 50 - margin, player.y))

  // Decor scroll
  for (const d of decor) d.x -= (140 + stage * 20) * dt
  while (decor.length && decor[0].x < -80) {
    decor.shift()
    spawnDecor(false)
  }
  if (decor.length < 14) spawnDecor(false)

  // Enemies vienen de la derecha (dirección opuesta)
  for (const e of enemies) {
    if (e.dead) continue
    e.x -= e.speed * dt
    e.wobble += dt * 8
    e.y += Math.sin(e.wobble) * 12 * dt
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].dead || enemies[i].x < -100) enemies.splice(i, 1)
  }
  if (enemies.length < 7 + stage) spawnEnemy(false)

  // Colisiones
  const ps = playerSize()
  for (const e of enemies) {
    if (e.dead) continue
    const dx = e.x - player.x
    const dy = e.y - player.y
    const dist = Math.hypot(dx, dy)
    const hit = (ps + e.size) * 0.38
    if (dist < hit) tryEat(e)
  }

  // Burbujas
  for (const b of bubbles) {
    b.y -= b.sp * dt
    b.x -= 30 * dt
    if (b.y < -10) {
      b.y = H + 10
      b.x = Math.random() * W
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 120 * dt
    if (p.life <= 0) particles.splice(i, 1)
  }
}

function render() {
  ctx.save()
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
  }

  drawBackground(0)

  // Decoraciones (corales / plantas) — el pez las atraviesa visualmente
  for (const d of decor) {
    if (d.rock) drawRock(ctx, d.x, H - 28, d.rockSize)
    drawCoral(ctx, d.x, H - 28, d.h, d.kind, time)
  }

  // Burbujas
  ctx.fillStyle = 'rgba(200,240,255,0.45)'
  for (const b of bubbles) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Enemigos (vienen de frente, miran a la izquierda)
  for (const e of enemies) {
    if (e.dead) continue
    drawSideFish(ctx, e.x, e.y, e.size, e.palette, {
      flip: true,
      mouth: 0,
      wobble: e.wobble,
    })
  }

  // Jugador (centrado-izquierda, mira a la derecha)
  const blink = invuln > 0 && Math.floor(time * 12) % 2 === 0
  if (!blink) {
    drawSideFish(ctx, player.x, player.y, playerSize(), PLAYER_STAGES[stage], {
      flip: false,
      mouth,
      wobble: time * 10,
    })
  }

  // Partículas
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (shieldTime > 0) {
    // Parpadea en el último segundo para avisar que se termina
    const ending = shieldTime < 1 && Math.floor(time * 10) % 2 === 0
    drawBubbleShield(ctx, player.x, player.y, shieldRadius(), time, ending ? 0.35 : 1)
  } else if (shieldPop > 0) {
    const k = shieldPop / 0.35
    drawBubbleShield(ctx, player.x, player.y, shieldRadius() * (1 + (1 - k) * 0.5), time, k)
  }

  ctx.restore()
}

let last = performance.now()
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now
  if (running) update(dt)
  else {
    // Menú: fondo vivo suave
    time += dt
    scroll += 40 * dt
  }
  render()
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
