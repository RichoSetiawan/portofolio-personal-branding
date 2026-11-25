import * as THREE from 'three'
import { gsap } from 'gsap'
import { inject, onMounted, onUnmounted, readonly, ref, type InjectionKey, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

/* ==========================================================================
   Planarcardia backdrop & gallery stage
   --------------------------------------------------------------------------
   One fixed full-viewport WebGL canvas, owned by <CosmicBackdrop> and shared
   with the rest of the app through provide/inject (`GallerySceneKey`).

   Layers (back → front):
     • nebula fog planes        — 30% secondary fog/indigo
     • starfield (shader points) — mostly starlight, ~10% gold/crimson motes
     • drifting arcana frames    — tarot outlines + diamonds, scroll parallax
     • astrolabe                 — rings, ticks, gimbals, per-project nodes
     • stage pedestal            — floor rings, spotlight cone, rising dust
   ========================================================================== */

export type SceneMode = 'stage' | 'gallery' | 'dossier'
export type PulseTone = 'crimson' | 'gold'

export interface GallerySceneControls {
  /** false when WebGL could not start (CSS gradient backdrop is used instead). */
  readonly webglAvailable: Readonly<Ref<boolean>>
  readonly ready: Readonly<Ref<boolean>>
  setMode(mode: SceneMode): void
  /** Element the astrolabe should sit behind while it is on screen. */
  bindStage(el: HTMLElement | null): void
  /** Rotate the astrolabe so node `index` of `total` sits at the crown. */
  focusCard(index: number, total: number): void
  /** Brief Aha-style flash + glitch through the rings. */
  pulse(tone?: PulseTone): void
}

export const GallerySceneKey: InjectionKey<GallerySceneControls> = Symbol('GallerySceneControls')

const noopControls: GallerySceneControls = {
  webglAvailable: readonly(ref(false)),
  ready: readonly(ref(false)),
  setMode: () => {},
  bindStage: () => {},
  focusCard: () => {},
  pulse: () => {},
}

/** Consumer side — safe to call anywhere below <CosmicBackdrop>. */
export function useGallerySceneControls(): GallerySceneControls {
  return inject(GallerySceneKey, noopControls)
}

/* ---------- palette (mirrors main.css @theme) ---------- */
const COLOR = {
  frame: 0x3a3366,
  fog: 0x262150,
  mist: 0xa8a2c8,
  starlight: 0xf4f2ff,
  elation: 0xff2a6d,
  gilt: 0xffd166,
} as const

/** Spotlight cone strength — kept low so the gold stays within the 10% accent budget. */
const CONE_OPACITY = 0.07

/* ---------- small math helpers ---------- */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/* ---------- geometry/material factories ---------- */
function circleGeometry(radius: number, segments = 160): THREE.BufferGeometry {
  const pts: number[] = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

function tickGeometry(radius: number, count: number, length: number): THREE.BufferGeometry {
  const pts: number[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    pts.push(c * radius, s * radius, 0, c * (radius + length), s * (radius + length), 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

function lineMaterial(color: number, opacity: number, additive = false): THREE.LineBasicMaterial {
  const m = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  })
  m.userData.baseOpacity = opacity
  m.userData.baseColor = new THREE.Color(color)
  return m
}

function makeGlowTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.22, 'rgba(255,255,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ---------- shaders ---------- */
const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.55 + 0.45 * sin(uTime * (0.5 + aPhase * 1.6) + aPhase * 6.2831);
    vTwinkle = tw;
    vColor = aColor;
    gl_PointSize = aSize * uPixelRatio * (70.0 / -mv.z) * (0.7 + 0.3 * tw);
  }
`

const STAR_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = pow(smoothstep(0.5, 0.0, d), 3.0);
    float flare = max(0.0, 1.0 - abs(c.x) * 16.0) * max(0.0, 1.0 - abs(c.y) * 2.2)
                + max(0.0, 1.0 - abs(c.y) * 16.0) * max(0.0, 1.0 - abs(c.x) * 2.2);
    float a = (core + flare * 0.3) * vTwinkle * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

const NEBULA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const NEBULA_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c);
    float a = pow(smoothstep(0.5, 0.0, d), 2.2);
    float swirl = 0.5 + 0.5 * sin(atan(c.y, c.x) * 3.0 + uTime * 0.05 + d * 9.0);
    gl_FragColor = vec4(uColor, a * uOpacity * (0.7 + 0.3 * swirl));
  }
`

const CONE_VERT = /* glsl */ `
  varying float vH;
  void main() {
    vH = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const CONE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vH;
  void main() {
    float a = pow(vH, 1.6) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`

/* ==========================================================================
   Composable
   ========================================================================== */
export function useGalleryScene(canvasRef: Ref<HTMLCanvasElement | null>): GallerySceneControls {
  const webglAvailable = ref(true)
  const ready = ref(false)
  const reducedMotion = useReducedMotion()

  let canvasEl: HTMLCanvasElement | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let frameId = 0
  let lastTime = 0
  let elapsed = 0
  let running = false

  // Scene graph handles
  let starField: THREE.Points | null = null
  let starMaterial: THREE.ShaderMaterial | null = null
  let nebulaGroup: THREE.Group | null = null
  let framesGroup: THREE.Group | null = null
  let astrolabe: THREE.Group | null = null
  let outerRing: THREE.Group | null = null
  let crownRing: THREE.Group | null = null
  let gimbalA: THREE.Object3D | null = null
  let gimbalB: THREE.Object3D | null = null
  let core: THREE.Object3D | null = null
  let nodesGroup: THREE.Group | null = null
  let stageGroup: THREE.Group | null = null
  let coneMaterial: THREE.ShaderMaterial | null = null
  let dust: THREE.Points | null = null
  let glowTexture: THREE.Texture | null = null

  const astroMaterials: THREE.Material[] = []
  const stageMaterials: THREE.Material[] = []
  const nodeMaterials: THREE.SpriteMaterial[] = []
  const frameMeta: { obj: THREE.Object3D; baseY: number; spin: THREE.Vector3; phase: number }[] = []

  // Animated state (tweened by GSAP or eased per frame)
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  const fade = { astro: 1, stage: 1 }
  const crown = { rotation: 0 }
  const pulseState = { amount: 0 }
  const pulseColor = new THREE.Color(COLOR.elation)
  let mode: SceneMode = 'stage'
  let stageEl: HTMLElement | null = null
  let activeIndex = 0
  let nodeCount = 0

  /* ---------- builders ---------- */
  function buildStars(count: number) {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const tmp = new THREE.Color()
    for (let i = 0; i < count; i++) {
      // spherical shell, biased behind the camera's focal plane
      const r = 30 + Math.random() * 90
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8
      positions[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 6

      // 60/30/10 even in the stars: starlight / lavender / accent motes
      const roll = Math.random()
      if (roll < 0.66) tmp.setHex(COLOR.starlight)
      else if (roll < 0.9) tmp.setHex(COLOR.mist)
      else if (roll < 0.96) tmp.setHex(COLOR.gilt)
      else tmp.setHex(COLOR.elation)
      colors.set([tmp.r, tmp.g, tmp.b], i * 3)

      sizes[i] = roll > 0.9 ? 3.2 + Math.random() * 2.5 : 1.2 + Math.random() * 2.2
      phases[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    starMaterial = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer?.getPixelRatio() ?? 1 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    starField = new THREE.Points(geo, starMaterial)
    scene!.add(starField)
  }

  function buildNebula() {
    nebulaGroup = new THREE.Group()
    const clouds: [number, number, number, number, number, number][] = [
      // x, y, z, size, color, opacity
      [-14, 6, -40, 60, COLOR.fog, 0.55],
      [16, -8, -45, 70, COLOR.frame, 0.4],
      [4, 14, -55, 55, COLOR.fog, 0.45],
      [-6, -16, -50, 40, COLOR.elation, 0.05], // faint Elation blush — accent kept tiny
    ]
    const geo = new THREE.PlaneGeometry(1, 1)
    for (const [x, y, z, size, color, opacity] of clouds) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERT,
        fragmentShader: NEBULA_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, y, z)
      mesh.scale.setScalar(size)
      mesh.rotation.z = Math.random() * Math.PI
      nebulaGroup.add(mesh)
    }
    scene!.add(nebulaGroup)
  }

  function buildFrames(count: number) {
    framesGroup = new THREE.Group()
    const card = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1.6))
    const innerCard = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.82, 1.42))
    const diamond = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.45, 0))
    for (let i = 0; i < count; i++) {
      const accent = i === 3 ? COLOR.gilt : i === 7 ? COLOR.elation : null
      const mat = lineMaterial(accent ?? COLOR.frame, accent ? 0.55 : 0.6)
      let obj: THREE.Object3D
      if (i % 3 === 0) {
        obj = new THREE.LineSegments(diamond, mat)
      } else {
        const g = new THREE.Group()
        g.add(new THREE.LineSegments(card, mat))
        g.add(new THREE.LineSegments(innerCard, lineMaterial(COLOR.frame, 0.3)))
        obj = g
      }
      const side = i % 2 === 0 ? -1 : 1
      obj.position.set(side * (6 + Math.random() * 9), (Math.random() - 0.5) * 24, -6 - Math.random() * 16)
      obj.scale.setScalar(0.8 + Math.random() * 1.4)
      obj.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.4)
      framesGroup.add(obj)
      frameMeta.push({
        obj,
        baseY: obj.position.y,
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.08 + Math.random() * 0.15, (Math.random() - 0.5) * 0.06),
        phase: Math.random() * Math.PI * 2,
      })
    }
    scene!.add(framesGroup)
  }

  function trackAstro<T extends THREE.Material>(m: T): T {
    astroMaterials.push(m)
    return m
  }

  function buildAstrolabe() {
    astrolabe = new THREE.Group()
    astrolabe.rotation.set(0.28, 0, 0.08)

    // Outer ring + fine ticks + gilt hour marks
    outerRing = new THREE.Group()
    outerRing.add(new THREE.LineLoop(circleGeometry(4.2), trackAstro(lineMaterial(COLOR.frame, 0.9))))
    outerRing.add(new THREE.LineLoop(circleGeometry(4.35), trackAstro(lineMaterial(COLOR.frame, 0.45))))
    outerRing.add(new THREE.LineSegments(tickGeometry(4.2, 96, 0.1), trackAstro(lineMaterial(COLOR.mist, 0.35))))
    outerRing.add(new THREE.LineSegments(tickGeometry(4.0, 12, 0.35), trackAstro(lineMaterial(COLOR.gilt, 0.75, true))))
    astrolabe.add(outerRing)

    // Crown ring — dashed gold, carries the project nodes, turns on focus
    crownRing = new THREE.Group()
    const dashed = new THREE.LineDashedMaterial({
      color: COLOR.gilt,
      dashSize: 0.18,
      gapSize: 0.12,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    dashed.userData.baseOpacity = 0.6
    dashed.userData.baseColor = new THREE.Color(COLOR.gilt)
    const crownLine = new THREE.LineLoop(circleGeometry(3.3), trackAstro(dashed))
    crownLine.computeLineDistances()
    crownRing.add(crownLine)
    nodesGroup = new THREE.Group()
    crownRing.add(nodesGroup)
    astrolabe.add(crownRing)

    // Spokes between inner and crown ring
    astrolabe.add(new THREE.LineSegments(tickGeometry(2.3, 8, 0.9), trackAstro(lineMaterial(COLOR.frame, 0.6))))

    // Gimbals — tilted rings that tumble slowly
    gimbalA = new THREE.LineLoop(circleGeometry(2.3), trackAstro(lineMaterial(COLOR.mist, 0.45)))
    gimbalA.rotation.x = Math.PI * 0.42
    astrolabe.add(gimbalA)
    gimbalB = new THREE.LineLoop(circleGeometry(2.7), trackAstro(lineMaterial(COLOR.frame, 0.7)))
    gimbalB.rotation.y = Math.PI * 0.38
    astrolabe.add(gimbalB)

    // Core — gilt star diamond + glow
    const coreGroup = new THREE.Group()
    coreGroup.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.42, 0)),
        trackAstro(lineMaterial(COLOR.gilt, 0.95, true)),
      ),
    )
    const coreGlow = new THREE.Sprite(
      trackAstro(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: COLOR.gilt,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    )
    coreGlow.material.userData.baseOpacity = 0.55
    coreGlow.scale.setScalar(2.2)
    coreGroup.add(coreGlow)
    core = coreGroup
    astrolabe.add(coreGroup)

    scene!.add(astrolabe)
  }

  function rebuildNodes(total: number) {
    if (!nodesGroup) return
    for (const child of [...nodesGroup.children]) {
      nodesGroup.remove(child)
    }
    nodeMaterials.forEach((m) => m.dispose())
    nodeMaterials.length = 0
    nodeCount = total
    for (let i = 0; i < total; i++) {
      const a = Math.PI / 2 + (i / total) * Math.PI * 2
      const mat = new THREE.SpriteMaterial({
        map: glowTexture,
        color: COLOR.elation,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      mat.userData.baseOpacity = 0.85
      nodeMaterials.push(mat)
      const sprite = new THREE.Sprite(mat)
      sprite.position.set(Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0)
      sprite.scale.setScalar(0.42)
      nodesGroup.add(sprite)
    }
    highlightNode(activeIndex)
  }

  function highlightNode(index: number) {
    if (!nodesGroup) return
    nodesGroup.children.forEach((child, i) => {
      const sprite = child as THREE.Sprite
      const active = i === index
      sprite.material.color.setHex(active ? COLOR.gilt : COLOR.elation)
      gsap.to(sprite.scale, {
        x: active ? 0.95 : 0.42,
        y: active ? 0.95 : 0.42,
        duration: 0.6,
        ease: 'back.out(2)',
        overwrite: true,
      })
    })
  }

  function trackStage<T extends THREE.Material>(m: T): T {
    stageMaterials.push(m)
    return m
  }

  function buildStage() {
    stageGroup = new THREE.Group()

    const floor = new THREE.Group()
    floor.rotation.x = -Math.PI / 2
    floor.add(new THREE.LineLoop(circleGeometry(4.6), trackStage(lineMaterial(COLOR.gilt, 0.55, true))))
    floor.add(new THREE.LineLoop(circleGeometry(5.6), trackStage(lineMaterial(COLOR.frame, 0.8))))
    floor.add(new THREE.LineSegments(tickGeometry(4.6, 48, 0.25), trackStage(lineMaterial(COLOR.mist, 0.3))))
    floor.add(new THREE.LineLoop(circleGeometry(3.4), trackStage(lineMaterial(COLOR.elation, 0.35, true))))
    stageGroup.add(floor)

    // Spotlight cone from above (open-ended)
    coneMaterial = new THREE.ShaderMaterial({
      vertexShader: CONE_VERT,
      fragmentShader: CONE_FRAG,
      uniforms: { uColor: { value: new THREE.Color(COLOR.gilt) }, uOpacity: { value: CONE_OPACITY } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 0.25, 9, 48, 1, true), coneMaterial)
    // uv.y = 1 at the top of a cylinder; we want brightness at the floor → flip
    cone.rotation.z = Math.PI
    cone.position.y = 4.5
    stageGroup.add(cone)

    // Rising starlight dust inside the cone
    const dustCount = 140
    const pos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      const r = Math.sqrt(Math.random()) * 4
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = Math.random() * 7
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const dustMat = trackStage(
      new THREE.PointsMaterial({
        size: 0.09,
        map: glowTexture,
        color: COLOR.gilt,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    dustMat.userData.baseOpacity = 0.7
    dust = new THREE.Points(dustGeo, dustMat)
    stageGroup.add(dust)

    scene!.add(stageGroup)
  }

  /* ---------- frame loop ---------- */
  function stageMetrics(): { weight: number; worldY: number; below: boolean } {
    if (!stageEl || !camera) return { weight: 0, worldY: 0, below: true }
    const rect = stageEl.getBoundingClientRect()
    const vh = window.innerHeight
    const centerY = rect.top + rect.height / 2
    const weight = smoothstep(1 - Math.abs(centerY - vh / 2) / (vh * 0.85))
    const visibleH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const worldY = -(centerY / vh - 0.5) * visibleH
    return { weight, worldY: clamp(worldY, -visibleH, visibleH), below: centerY > vh / 2 }
  }

  function render(now: number) {
    if (!renderer || !scene || !camera) return
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now
    const motion = reducedMotion.value ? 0.12 : 1
    elapsed += dt * motion
    const ease = 1 - Math.exp(-dt * 3.5)
    const scrollY = window.scrollY
    const vw = window.innerWidth
    const wide = vw >= 1024
    const compact = vw < 640

    // Pointer parallax
    pointer.x = lerp(pointer.x, pointer.tx * motion, ease)
    pointer.y = lerp(pointer.y, pointer.ty * motion, ease)
    camera.position.x = pointer.x * 0.7
    camera.position.y = -pointer.y * 0.45
    camera.lookAt(0, 0, 0)

    // Stars + nebula drift with scroll (far parallax)
    if (starMaterial) starMaterial.uniforms.uTime!.value = elapsed
    if (starField) {
      starField.rotation.y = elapsed * 0.004
      starField.position.y = scrollY * 0.0022
    }
    if (nebulaGroup) {
      nebulaGroup.position.y = scrollY * 0.0012
      nebulaGroup.children.forEach((m, i) => {
        const mat = (m as THREE.Mesh).material as THREE.ShaderMaterial
        mat.uniforms.uTime!.value = elapsed
        m.rotation.z += dt * motion * 0.004 * (i % 2 ? 1 : -1)
      })
    }

    // Arcana frames — nearer parallax with vertical wrap
    const frameScroll = scrollY * 0.006
    for (const f of frameMeta) {
      const span = 26
      const y = f.baseY + frameScroll + Math.sin(elapsed * 0.4 + f.phase) * 0.3
      f.obj.position.y = ((((y + span / 2) % span) + span) % span) - span / 2
      f.obj.rotation.x += f.spin.x * dt * motion
      f.obj.rotation.y += f.spin.y * dt * motion
      f.obj.rotation.z += f.spin.z * dt * motion
    }

    // Astrolabe anchor: hero (right) → stage (behind carousel) → chronicle (left)
    if (astrolabe) {
      const s = stageMetrics()
      let ax: number
      let ay: number
      let scale: number
      if (mode === 'dossier') {
        ax = wide ? 4.6 : 0
        ay = wide ? 0 : 2.4
        scale = wide ? 1 : 0.7
      } else {
        const heroT = smoothstep(scrollY / (window.innerHeight * 0.9))
        const restX = s.below ? (wide ? 3.8 : 0) : wide ? -4.4 : 0
        const restY = s.below ? (wide ? lerp(0.1, 1.5, heroT) : 1.6) : 0.4
        ax = lerp(restX, 0, s.weight)
        ay = lerp(restY, s.worldY + 0.4, s.weight)
        scale = compact ? 0.66 : wide ? lerp(0.95, 1.12, s.weight) : 0.85
      }
      const glitch = reducedMotion.value ? 0 : pulseState.amount * (Math.random() - 0.5) * 0.25
      astrolabe.position.x = lerp(astrolabe.position.x, ax, ease) + glitch
      astrolabe.position.y = lerp(astrolabe.position.y, ay, ease)
      const sc = lerp(astrolabe.scale.x, scale * (1 + pulseState.amount * 0.06), ease * 2)
      astrolabe.scale.setScalar(sc)
      astrolabe.rotation.y = pointer.x * 0.18
      astrolabe.rotation.x = 0.28 + pointer.y * 0.1

      if (outerRing) outerRing.rotation.z += dt * motion * 0.03
      if (crownRing) crownRing.rotation.z = crown.rotation
      if (gimbalA) gimbalA.rotation.z += dt * motion * 0.25
      if (gimbalB) gimbalB.rotation.x += dt * motion * 0.18
      if (core) {
        core.rotation.y += dt * motion * 0.6
        core.rotation.x = Math.sin(elapsed * 0.5) * 0.3
      }

      // Opacity per mode + pulse tint
      const astroFade = fade.astro * (s.below ? 1 : lerp(0.55, 1, s.weight))
      for (const m of astroMaterials) {
        const mat = m as THREE.LineBasicMaterial
        mat.opacity = (mat.userData.baseOpacity as number) * astroFade * (1 + pulseState.amount * 0.6)
        const base = mat.userData.baseColor as THREE.Color | undefined
        if (base) mat.color.copy(base).lerp(pulseColor, pulseState.amount * 0.75)
      }
      for (const m of nodeMaterials) m.opacity = 0.85 * astroFade

      // Stage pedestal follows astrolabe x, sits under the cards
      if (stageGroup) {
        const stageFade = fade.stage * s.weight
        stageGroup.visible = stageFade > 0.01
        stageGroup.position.set(astrolabe.position.x, astrolabe.position.y - 3.9 * sc, -1.5)
        stageGroup.scale.setScalar(sc)
        stageGroup.rotation.y += dt * motion * 0.05
        for (const m of stageMaterials) {
          m.opacity = (m.userData.baseOpacity as number) * stageFade
        }
        if (coneMaterial) coneMaterial.uniforms.uOpacity!.value = CONE_OPACITY * stageFade * (1 + pulseState.amount * 2)
        if (dust) {
          const p = dust.geometry.getAttribute('position') as THREE.BufferAttribute
          for (let i = 0; i < p.count; i++) {
            let y = p.getY(i) + dt * motion * 0.5
            if (y > 7) y = 0
            p.setY(i, y)
          }
          p.needsUpdate = true
        }
      }
    }

    renderer.render(scene, camera)
  }

  function loop(now: number) {
    frameId = requestAnimationFrame(loop)
    render(now)
  }

  function start() {
    if (running || !renderer) return
    running = true
    lastTime = performance.now()
    frameId = requestAnimationFrame(loop)
  }

  function stop() {
    running = false
    cancelAnimationFrame(frameId)
  }

  /* ---------- events ---------- */
  function onResize() {
    if (!renderer || !camera) return
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w < 640 ? 55 : 45
    camera.updateProjectionMatrix()
    if (starMaterial) starMaterial.uniforms.uPixelRatio!.value = renderer.getPixelRatio()
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch') return
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2
  }

  function onVisibility() {
    if (document.hidden) stop()
    else if (ready.value) start()
  }

  function onContextLost(e: Event) {
    e.preventDefault()
    stop()
    webglAvailable.value = false
  }

  /* ---------- lifecycle ---------- */
  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    canvasEl = canvas
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'high-performance',
      })
    } catch {
      webglAvailable.value = false
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300)
    camera.position.set(0, 0, 14)
    glowTexture = makeGlowTexture()

    const small = window.innerWidth < 768
    buildNebula()
    buildStars(small ? 1100 : 2600)
    buildFrames(small ? 8 : 14)
    buildAstrolabe()
    buildStage()
    rebuildNodes(nodeCount || 6)
    onResize()

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    canvas.addEventListener('webglcontextlost', onContextLost)

    ready.value = true
    start()
  })

  onUnmounted(() => {
    stop()
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('visibilitychange', onVisibility)
    canvasEl?.removeEventListener('webglcontextlost', onContextLost)
    canvasEl = null

    gsap.killTweensOf([fade, crown, pulseState])
    nodesGroup?.children.forEach((c) => gsap.killTweensOf(c.scale))

    // Dispose every GPU resource reachable from the scene graph
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    scene?.traverse((obj) => {
      const o = obj as THREE.Mesh
      if (o.geometry) geometries.add(o.geometry)
      if (o.material) {
        const list = Array.isArray(o.material) ? o.material : [o.material]
        list.forEach((m) => materials.add(m))
      }
    })
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
    glowTexture?.dispose()
    scene?.clear()

    renderer?.dispose()
    renderer?.forceContextLoss()

    astroMaterials.length = 0
    stageMaterials.length = 0
    nodeMaterials.length = 0
    frameMeta.length = 0
    renderer = null
    scene = null
    camera = null
    stageEl = null
    ready.value = false
  })

  /* ---------- public controls ---------- */
  function setMode(next: SceneMode) {
    mode = next
    gsap.to(fade, {
      astro: next === 'gallery' ? 0.45 : next === 'dossier' ? 0.75 : 1,
      stage: next === 'stage' ? 1 : 0,
      duration: reducedMotion.value ? 0.01 : 1.1,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  function bindStage(el: HTMLElement | null) {
    stageEl = el
  }

  function focusCard(index: number, total: number) {
    if (total !== nodeCount) {
      nodeCount = total
      if (nodesGroup) rebuildNodes(total)
    }
    activeIndex = index
    const target = -(index / Math.max(total, 1)) * Math.PI * 2
    const delta = wrapAngle(target - crown.rotation)
    gsap.to(crown, {
      rotation: crown.rotation + delta,
      duration: reducedMotion.value ? 0.01 : 1.3,
      ease: 'expo.out',
      overwrite: true,
    })
    if (outerRing && !reducedMotion.value) {
      gsap.to(outerRing.rotation, { z: outerRing.rotation.z - delta * 0.35, duration: 1.6, ease: 'expo.out' })
    }
    highlightNode(index)
  }

  function pulse(tone: PulseTone = 'crimson') {
    pulseColor.setHex(tone === 'gold' ? COLOR.gilt : COLOR.elation)
    gsap.fromTo(
      pulseState,
      { amount: 1 },
      { amount: 0, duration: reducedMotion.value ? 0.3 : 1.4, ease: 'power3.out', overwrite: true },
    )
  }

  return {
    webglAvailable: readonly(webglAvailable),
    ready: readonly(ready),
    setMode,
    bindStage,
    focusCard,
    pulse,
  }
}
