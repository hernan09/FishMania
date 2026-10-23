/** Peces de perfil (vista lateral) con boca animable. */

export const PLAYER_STAGES = [
  { name: 'Alevín', scale: 1, body: '#fff5eb', patch: '#ff6b35', fin: '#e85d04', outline: '#3d2914' },
  { name: 'Koi coral', scale: 1.25, body: '#e0f7ff', patch: '#00b4d8', fin: '#0077b6', outline: '#023047' },
  { name: 'Koi tigre', scale: 1.55, body: '#fff3e0', patch: '#f4a261', fin: '#e76f51', outline: '#264653' },
  { name: 'Rey arrecife', scale: 1.9, body: '#f3e8ff', patch: '#9b5de5', fin: '#7b2cbf', outline: '#240046' },
  { name: 'Leviatán', scale: 2.35, body: '#d8f3dc', patch: '#2d6a4f', fin: '#1b4332', outline: '#081c15' },
]

export const ENEMY_PALETTES = [
  { body: '#ff6b6b', patch: '#c92a2a', fin: '#a61e4d', outline: '#3b0a0a' },
  { body: '#69db7c', patch: '#2f9e44', fin: '#087f5b', outline: '#0b2e13' },
  { body: '#74c0fc', patch: '#1c7ed6', fin: '#1864ab', outline: '#0b2948' },
  { body: '#ffe066', patch: '#f59f00', fin: '#e67700', outline: '#5c3b00' },
  { body: '#b197fc', patch: '#7950f2', fin: '#5f3dc4', outline: '#2b1a66' },
  { body: '#ced4da', patch: '#868e96', fin: '#495057', outline: '#212529' },
]

function bodyPath(ctx, s) {
  ctx.beginPath()
  ctx.moveTo(s * 0.5, 0)
  ctx.bezierCurveTo(s * 0.46, -s * 0.15, s * 0.16, -s * 0.24, -s * 0.08, -s * 0.2)
  ctx.bezierCurveTo(-s * 0.24, -s * 0.16, -s * 0.33, -s * 0.08, -s * 0.38, -s * 0.045)
  ctx.lineTo(-s * 0.38, s * 0.045)
  ctx.bezierCurveTo(-s * 0.3, s * 0.1, -s * 0.12, s * 0.2, s * 0.08, s * 0.19)
  ctx.bezierCurveTo(s * 0.3, s * 0.17, s * 0.46, s * 0.1, s * 0.5, s * 0.02)
  ctx.closePath()
}

/** Aleta translúcida con radios: base → borde, rays líneas desde la base. */
function drawFin(ctx, s, base, edge, color, outline) {
  ctx.beginPath()
  ctx.moveTo(base[0][0] * s, base[0][1] * s)
  for (const [px, py] of edge) ctx.lineTo(px * s, py * s)
  ctx.lineTo(base[1][0] * s, base[1][1] * s)
  ctx.closePath()
  ctx.globalAlpha = 0.72
  ctx.fillStyle = color
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.strokeStyle = outline
  ctx.lineWidth = Math.max(0.6, s * 0.008)
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  edge.forEach(([px, py], i) => {
    const t = edge.length > 1 ? i / (edge.length - 1) : 0
    const bx = base[0][0] + (base[1][0] - base[0][0]) * t
    const by = base[0][1] + (base[1][1] - base[0][1]) * t
    ctx.moveTo(bx * s, by * s)
    ctx.lineTo(px * s, py * s)
  })
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * Dibuja un pez de perfil mirando a la derecha (o izquierda si flip).
 * mouth: 0 cerrado … 1 abierto
 */
export function drawSideFish(ctx, x, y, size, palette, opts = {}) {
  const { flip = false, mouth = 0, wobble = 0 } = opts
  const s = size
  const swing = Math.sin(wobble) * 0.22
  const flap = Math.sin(wobble * 1.3) * 0.5 + 0.5

  ctx.save()
  ctx.translate(x, y)
  if (flip) ctx.scale(-1, 1)

  // Cola bifurcada, pivotando en el pedúnculo
  ctx.save()
  ctx.translate(-s * 0.37, 0)
  ctx.rotate(swing)
  ctx.translate(s * 0.37, 0)
  drawFin(
    ctx,
    s,
    [[-0.36, -0.05], [-0.36, 0.05]],
    [[-0.52, -0.24], [-0.58, -0.22], [-0.5, -0.06], [-0.47, 0], [-0.5, 0.06], [-0.58, 0.22], [-0.52, 0.24]],
    palette.fin,
    palette.outline
  )
  ctx.restore()

  // Aleta dorsal y anal
  drawFin(
    ctx,
    s,
    [[-0.14, -0.18], [0.18, -0.2]],
    [[-0.16, -0.22], [-0.08, -0.32], [0.02, -0.36], [0.1, -0.33], [0.18, -0.22]],
    palette.fin,
    palette.outline
  )
  drawFin(
    ctx,
    s,
    [[-0.26, 0.11], [-0.1, 0.17]],
    [[-0.28, 0.16], [-0.24, 0.22], [-0.16, 0.24], [-0.1, 0.19]],
    palette.fin,
    palette.outline
  )
  // Aleta pélvica
  drawFin(
    ctx,
    s,
    [[0.08, 0.17], [0.16, 0.16]],
    [[0.04, 0.27], [0.08, 0.28], [0.15, 0.2]],
    palette.fin,
    palette.outline
  )

  // Cuerpo con contrasombreado (lomo oscuro, vientre claro)
  bodyPath(ctx, s)
  const g = ctx.createLinearGradient(0, -s * 0.24, 0, s * 0.2)
  g.addColorStop(0, palette.fin)
  g.addColorStop(0.32, palette.patch)
  g.addColorStop(0.68, palette.body)
  g.addColorStop(1, '#fbf7ef')
  ctx.fillStyle = g
  ctx.fill()

  ctx.save()
  bodyPath(ctx, s)
  ctx.clip()

  // Manchas
  ctx.fillStyle = palette.patch
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  ctx.ellipse(-s * 0.04, -s * 0.06, s * 0.13, s * 0.08, -0.25, 0, Math.PI * 2)
  ctx.ellipse(-s * 0.24, -s * 0.02, s * 0.07, s * 0.05, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Escamas
  if (s > 28) {
    const sc = Math.max(3, s * 0.045)
    ctx.lineWidth = Math.max(0.5, s * 0.006)
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'
    ctx.beginPath()
    let row = 0
    for (let yy = -s * 0.24; yy < s * 0.22; yy += sc * 0.75, row++) {
      const off = row % 2 ? sc * 0.5 : 0
      for (let xx = -s * 0.38 + off; xx < s * 0.27; xx += sc) {
        ctx.moveTo(xx, yy - sc * 0.55)
        ctx.arc(xx, yy, sc * 0.55, -Math.PI / 2, Math.PI / 2, true)
      }
    }
    ctx.stroke()
  }

  // Línea lateral
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = Math.max(0.8, s * 0.01)
  ctx.beginPath()
  ctx.moveTo(s * 0.3, -s * 0.06)
  ctx.quadraticCurveTo(0, -s * 0.03, -s * 0.38, 0)
  ctx.stroke()

  // Brillo del lomo
  const hl = ctx.createLinearGradient(0, -s * 0.22, 0, -s * 0.06)
  hl.addColorStop(0, 'rgba(255,255,255,0)')
  hl.addColorStop(0.5, 'rgba(255,255,255,0.28)')
  hl.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hl
  ctx.fillRect(-s * 0.4, -s * 0.22, s * 0.9, s * 0.16)

  // Sombra inferior para volumen
  const sh = ctx.createLinearGradient(0, s * 0.08, 0, s * 0.2)
  sh.addColorStop(0, 'rgba(0,0,0,0)')
  sh.addColorStop(1, 'rgba(0,30,50,0.25)')
  ctx.fillStyle = sh
  ctx.fillRect(-s * 0.4, s * 0.08, s * 0.9, s * 0.14)

  // Opérculo (agalla)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = Math.max(1, s * 0.014)
  ctx.beginPath()
  ctx.moveTo(s * 0.27, -s * 0.15)
  ctx.quadraticCurveTo(s * 0.2, 0, s * 0.28, s * 0.15)
  ctx.stroke()
  ctx.restore()

  // Contorno suave
  bodyPath(ctx, s)
  ctx.strokeStyle = palette.outline
  ctx.globalAlpha = 0.55
  ctx.lineWidth = Math.max(1, s * 0.016)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Aleta pectoral (aletea)
  const py = s * (0.08 + flap * 0.04)
  drawFin(
    ctx,
    s,
    [[0.22, 0.03], [0.24, 0.07]],
    [[0.1, py / s + 0.02], [0.08, py / s + 0.07], [0.14, py / s + 0.09]],
    palette.fin,
    palette.outline
  )

  // Boca: la mandíbula baja al abrir
  const open = mouth * s * 0.13
  if (open > 0.5) {
    ctx.fillStyle = '#3a0d14'
    ctx.beginPath()
    ctx.moveTo(s * 0.5, -s * 0.01)
    ctx.lineTo(s * 0.38, s * 0.035)
    ctx.lineTo(s * 0.47, s * 0.03 + open)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = palette.outline
    ctx.lineWidth = Math.max(1, s * 0.018)
    ctx.beginPath()
    ctx.moveTo(s * 0.38, s * 0.035)
    ctx.lineTo(s * 0.47, s * 0.03 + open)
    ctx.stroke()
  } else {
    ctx.strokeStyle = palette.outline
    ctx.lineWidth = Math.max(1, s * 0.014)
    ctx.beginPath()
    ctx.moveTo(s * 0.5, s * 0.015)
    ctx.quadraticCurveTo(s * 0.45, s * 0.04, s * 0.41, s * 0.03)
    ctx.stroke()
  }

  // Ojo con iris y brillo
  const ex = s * 0.37
  const ey = -s * 0.055
  const er = Math.max(2, s * 0.048)
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.arc(ex, ey, er * 1.12, 0, Math.PI * 2)
  ctx.fill()
  const iris = ctx.createRadialGradient(ex, ey, er * 0.2, ex, ey, er)
  iris.addColorStop(0, '#f5d76e')
  iris.addColorStop(1, '#a8741a')
  ctx.fillStyle = iris
  ctx.beginPath()
  ctx.arc(ex, ey, er, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#050505'
  ctx.beginPath()
  ctx.arc(ex + er * 0.12, ey, er * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.arc(ex + er * 0.35, ey - er * 0.35, er * 0.22, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/** Escudo de burbuja alrededor de un pez. */
export function drawBubbleShield(ctx, x, y, r, t, fading = 1) {
  ctx.save()
  ctx.globalAlpha = fading
  const wob = Math.sin(t * 4) * r * 0.03
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r)
  g.addColorStop(0, 'rgba(255,255,255,0.35)')
  g.addColorStop(0.6, 'rgba(160,230,255,0.08)')
  g.addColorStop(0.92, 'rgba(140,220,255,0.35)')
  g.addColorStop(1, 'rgba(200,245,255,0.7)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(x, y, r + wob, r - wob, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(220,250,255,0.75)'
  ctx.lineWidth = 2
  ctx.stroke()
  // Reflejos
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = Math.max(2, r * 0.06)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.78, Math.PI * 1.1, Math.PI * 1.4)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(x + r * 0.45, y + r * 0.42, r * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawCoral(ctx, x, y, h, kind, t) {
  ctx.save()
  ctx.translate(x, y)
  const sway = Math.sin(t * 1.5 + x * 0.01) * 0.08

  if (kind === 0) {
    // Rama
    ctx.strokeStyle = '#e63946'
    ctx.lineCap = 'round'
    const draw = (px, py, ang, len, depth) => {
      if (depth <= 0) return
      const x2 = px + Math.cos(ang + sway) * len
      const y2 = py + Math.sin(ang + sway) * len
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.lineWidth = Math.max(3, depth * 2)
      draw(x2, y2, ang - 0.5, len * 0.65, depth - 1)
      draw(x2, y2, ang + 0.45, len * 0.6, depth - 1)
    }
    ctx.lineWidth = 10
    draw(0, 0, -Math.PI / 2, h * 0.28, 4)
  } else if (kind === 1) {
    // Tubos
    for (let i = 0; i < 4; i++) {
      const bx = (i - 1.5) * 14
      const hh = h * (0.45 + (i % 3) * 0.15)
      const g = ctx.createLinearGradient(bx, 0, bx, -hh)
      g.addColorStop(0, '#3a0ca3')
      g.addColorStop(1, '#4cc9f0')
      ctx.fillStyle = g
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx - 7, -hh, 14, hh, 6)
      } else {
        ctx.rect(bx - 7, -hh, 14, hh)
      }
      ctx.fill()
      ctx.fillStyle = '#80ffdb'
      ctx.beginPath()
      ctx.arc(bx, -hh, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (kind === 2) {
    // Cerebro / montículo
    const g = ctx.createRadialGradient(0, -h * 0.15, 5, 0, -h * 0.1, h * 0.35)
    g.addColorStop(0, '#ff8fab')
    g.addColorStop(1, '#c9184a')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, -h * 0.12, h * 0.28, h * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(80,10,30,0.4)'
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(0, -h * 0.12, 10 + i * 8, 0.3, Math.PI - 0.3)
      ctx.stroke()
    }
  } else {
    // Algas
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 12
      ctx.strokeStyle = i === 1 ? '#52b788' : '#2d6a4f'
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(ox, 0)
      ctx.bezierCurveTo(ox - 15 + sway * 40, -h * 0.35, ox + 18, -h * 0.65, ox + sway * 30, -h)
      ctx.stroke()
    }
  }

  ctx.restore()
}

export function drawRock(ctx, x, y, s) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#5a6a78'
  ctx.beginPath()
  ctx.moveTo(-s, 0)
  ctx.lineTo(-s * 0.6, -s * 0.7)
  ctx.lineTo(s * 0.2, -s * 0.9)
  ctx.lineTo(s, -s * 0.3)
  ctx.lineTo(s * 0.7, 0)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.ellipse(-s * 0.2, -s * 0.45, s * 0.25, s * 0.12, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
