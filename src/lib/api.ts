export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** GET when `body` is omitted, JSON POST otherwise (the Worker requires JSON on every POST). */
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(
    path,
    body === undefined
      ? undefined
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
  )
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong')
  return data as T
}

const scripts = new Map<string, Promise<void>>()

/** Loads a third-party script once (Razorpay Checkout, Turnstile). */
export function loadScript(src: string): Promise<void> {
  let loading = scripts.get(src)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const el = document.createElement('script')
      el.src = src
      el.async = true
      el.onload = () => resolve()
      el.onerror = () => {
        scripts.delete(src)
        el.remove()
        reject(new Error(`Failed to load ${src}`))
      }
      document.head.appendChild(el)
    })
    scripts.set(src, loading)
  }
  return loading
}
