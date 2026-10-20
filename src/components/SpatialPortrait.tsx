import { useEffect, useRef } from 'react'

const VERT = `#version 300 es
layout(location = 0) in vec2 p;
out vec2 uv;
void main() { uv = vec2(p.x, -p.y) * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`

// No depth map: a heavily blurred silhouette (a high mip level of the alpha) reads as the
// body's rounded volume, and a soft spot on the face puts it nearest the viewer.
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D img;
uniform vec2 m;
uniform vec2 focus;
uniform float aspect;
in vec2 uv;
out vec4 o;
void main() {
  vec2 q = (uv - focus) * vec2(aspect, 1.0) * 7.0;
  float d = clamp(textureLod(img, uv, 6.0).a * 0.6 + exp(-dot(q, q)) * 0.6, 0.0, 1.0);
  o = texture(img, uv - m * (d - 0.4) * 0.024);
}`

type Props = {
  src: string
  alt: string
  /** Face centre as a fraction of the image, from the top-left. */
  focus: [number, number]
  className?: string
}

/**
 * A cutout photo that turns gently toward the cursor like a 3D photo (a slow drift on touch).
 * Stays a plain <img> without WebGL2 or with reduced motion.
 */
export function SpatialPortrait({ src, alt, focus, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [fx, fy] = focus

  useEffect(() => {
    const wrap = wrapRef.current!
    const img = imgRef.current!
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // A fresh canvas per run: a context released in cleanup can't be revived (StrictMode runs this twice).
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.className = 'pointer-events-none absolute inset-0 h-full w-full opacity-0'
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false })
    if (!gl) return
    wrap.appendChild(canvas)

    const fine = matchMedia('(pointer: fine)').matches
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    let raf = 0
    let visible = false
    let shown = false
    let cancelled = false
    let io: IntersectionObserver | undefined
    let ro: ResizeObserver | undefined

    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth) * 2 - 1
      target.y = (e.clientY / innerHeight) * 2 - 1
    }
    const fallBack = () => {
      cancelAnimationFrame(raf)
      canvas.style.opacity = '0'
      img.style.opacity = ''
    }
    canvas.addEventListener('webglcontextlost', fallBack)

    img.decode().then(() => {
      if (cancelled) return

      const prog = gl.createProgram()!
      for (const [type, code] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]] as const) {
        const s = gl.createShader(type)!
        gl.shaderSource(s, code)
        gl.compileShader(s)
        gl.attachShader(prog, s)
      }
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
      gl.useProgram(prog)

      // One triangle covering the viewport.
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      const uM = gl.getUniformLocation(prog, 'm')
      gl.uniform2f(gl.getUniformLocation(prog, 'focus'), fx, fy)
      gl.uniform1f(gl.getUniformLocation(prog, 'aspect'), img.naturalWidth / img.naturalHeight)

      const frame = (t: number) => {
        if (!fine) {
          target.x = Math.sin(t / 2600) * 0.6
          target.y = Math.sin(t / 3700) * 0.35
        }
        cur.x += (target.x - cur.x) * 0.06
        cur.y += (target.y - cur.y) * 0.06
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(uM, cur.x, cur.y)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        if (!shown) {
          shown = true
          canvas.style.opacity = '1'
          img.style.opacity = '0'
        }
        raf = visible ? requestAnimationFrame(frame) : 0
      }

      ro = new ResizeObserver(() => {
        const dpr = Math.min(devicePixelRatio, 2)
        canvas.width = Math.round(canvas.clientWidth * dpr)
        canvas.height = Math.round(canvas.clientHeight * dpr)
        gl.viewport(0, 0, canvas.width, canvas.height)
      })
      ro.observe(canvas)

      // Only animate while the portrait is on screen.
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(frame)
      })
      io.observe(canvas)
      if (fine) addEventListener('pointermove', onMove, { passive: true })
    }, () => {})

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      io?.disconnect()
      ro?.disconnect()
      removeEventListener('pointermove', onMove)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
      img.style.opacity = ''
    }
  }, [src, fx, fy])

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <img ref={imgRef} src={src} alt={alt} fetchPriority="high" className="block h-full w-full" />
    </div>
  )
}
