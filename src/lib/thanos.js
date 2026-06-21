// "Thanos snap" — dissolves the whole app into dust using an SVG turbulence +
// displacement filter (no screenshot, no deps, works on the live DOM).

function ensureFilter() {
  if (document.getElementById('thanos-svg')) return
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('id', 'thanos-svg')
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.innerHTML = `
    <defs>
      <filter id="thanos-dissolve" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" result="noise" seed="3"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>`
  document.body.appendChild(svg)
}

export function thanosSnap(onDone, duration = 1100) {
  const root = document.getElementById('root')
  if (!root) { onDone?.(); return }
  ensureFilter()
  const disp = document.querySelector('#thanos-dissolve feDisplacementMap')
  const turb = document.querySelector('#thanos-dissolve feTurbulence')

  root.classList.add('dissolving')
  root.style.filter = 'url(#thanos-dissolve)'

  let start = null
  const ease = (t) => t * t
  const step = (ts) => {
    if (start == null) start = ts
    const p = Math.min(1, (ts - start) / duration)
    const e = ease(p)
    disp?.setAttribute('scale', String(e * 520))
    turb?.setAttribute('baseFrequency', String(0.012 + e * 0.03))
    root.style.opacity = String(1 - e)
    root.style.transform = `scale(${1 + e * 0.05}) translateY(${-e * 24}px)`
    if (p < 1) requestAnimationFrame(step)
    else onDone?.()
  }
  requestAnimationFrame(step)
}

// Restore the root after navigation so the next page renders normally (fades in).
export function thanosRestore() {
  const root = document.getElementById('root')
  if (!root) return
  root.style.filter = ''
  root.style.transform = ''
  root.classList.remove('dissolving')
  root.style.transition = 'opacity .5s ease'
  root.style.opacity = '0'
  requestAnimationFrame(() => { root.style.opacity = '1' })
  setTimeout(() => { root.style.transition = ''; root.style.opacity = '' }, 600)
}
