export function createControls(joystickEl, stickEl, canvas) {
  const keys = new Set()
  const axis = { x: 0, y: 0 }
  let pointerId = null
  const maxRadius = 42
  const center = { x: 0, y: 0 }

  const syncCenter = () => {
    const r = joystickEl.getBoundingClientRect()
    center.x = r.left + r.width / 2
    center.y = r.top + r.height / 2
  }

  const setStick = (dx, dy) => {
    const len = Math.hypot(dx, dy) || 1
    const c = Math.min(len, maxRadius)
    const nx = (dx / len) * c
    const ny = (dy / len) * c
    stickEl.style.transform = `translate(${nx}px, ${ny}px)`
    axis.x = nx / maxRadius
    axis.y = ny / maxRadius
  }

  const resetStick = () => {
    stickEl.style.transform = 'translate(0px, 0px)'
    axis.x = 0
    axis.y = 0
    pointerId = null
  }

  window.addEventListener('keydown', (e) => keys.add(e.code))
  window.addEventListener('keyup', (e) => keys.delete(e.code))

  joystickEl.addEventListener('pointerdown', (e) => {
    pointerId = e.pointerId
    joystickEl.setPointerCapture(pointerId)
    syncCenter()
    setStick(e.clientX - center.x, e.clientY - center.y)
  })
  joystickEl.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId) return
    setStick(e.clientX - center.x, e.clientY - center.y)
  })
  const endJ = (e) => {
    if (pointerId !== e.pointerId) return
    resetStick()
  }
  joystickEl.addEventListener('pointerup', endJ)
  joystickEl.addEventListener('pointercancel', endJ)

  let canvasPointer = null
  let origin = { x: 0, y: 0 }
  canvas.addEventListener('pointerdown', (e) => {
    canvasPointer = e.pointerId
    origin = { x: e.clientX, y: e.clientY }
    canvas.setPointerCapture(canvasPointer)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (canvasPointer !== e.pointerId) return
    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    if (Math.hypot(dx, dy) < 6) {
      axis.x = 0
      axis.y = 0
      return
    }
    axis.x = Math.max(-1, Math.min(1, dx / 70))
    axis.y = Math.max(-1, Math.min(1, dy / 70))
  })
  const endC = (e) => {
    if (canvasPointer !== e.pointerId) return
    canvasPointer = null
    if (pointerId === null) {
      axis.x = 0
      axis.y = 0
    }
  }
  canvas.addEventListener('pointerup', endC)
  canvas.addEventListener('pointercancel', endC)

  return {
    getMove() {
      let x = axis.x
      let y = axis.y
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1
      const len = Math.hypot(x, y)
      if (len > 1) {
        x /= len
        y /= len
      }
      return { x, y }
    },
  }
}
