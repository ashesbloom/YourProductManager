import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError, loadScript } from '@/lib/api'
import { useMe } from '@/lib/me'
import { safeNext } from '@/lib/links'
import { btnGhost, btnPrimary, input } from '@/components/ui'

type Turnstile = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string
  reset: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string

function storedUtm(): string | null {
  try {
    return localStorage.getItem('ypm_utm')
  } catch {
    return null
  }
}

export default function Login() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(
    params.get('error') === 'google' ? 'Google sign-in did not complete. Try again or use your email.' : '',
  )
  const widgetEl = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')
      .then(() => {
        if (!widgetEl.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(widgetEl.current, {
          sitekey: SITE_KEY,
          callback: setToken,
          'expired-callback': () => setToken(''),
        })
      })
      .catch(() => setError('Could not load the verification check. Disable ad-blockers for this site and refresh.'))
  }, [])

  if (me?.user) return <Navigate to={next} replace />

  const fail = (err: unknown) => setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/auth/otp', { email, turnstileToken: token })
      setStep('code')
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
      // Turnstile tokens are single-use.
      setToken('')
      if (widgetId.current) window.turnstile?.reset(widgetId.current)
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/auth/verify', { email, code, utm: storedUtm() })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate(next, { replace: true })
    } catch (err) {
      fail(err)
      setBusy(false)
    }
  }

  const utm = storedUtm()
  const googleHref = `/api/auth/google?next=${encodeURIComponent(next)}${utm ? `&utm=${encodeURIComponent(utm)}` : ''}`

  return (
    <div className="bg-black px-4 pt-32 pb-24 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card p-8">
        <h1 className="text-2xl font-bold">Log in to YPM</h1>
        <p className="mt-2 text-sm text-white/60">Use the email you enrolled with. New here? Logging in creates your account.</p>

        <a href={googleHref} className={`${btnGhost} mt-8 w-full`}>
          Continue with Google
        </a>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <label className="block text-sm font-medium text-white/80" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
            <button type="submit" disabled={busy || !token} className={`${btnPrimary} w-full`}>
              {busy ? 'Sending…' : 'Email me a login code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <label className="block text-sm font-medium text-white/80" htmlFor="code">
              Enter the 6-digit code sent to {email}
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${input} tracking-[0.5em]`}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={`${btnPrimary} w-full`}>
              {busy ? 'Checking…' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
              }}
              className="w-full text-sm text-white/60 hover:text-white"
            >
              Use a different email or resend the code
            </button>
          </form>
        )}
        {/* Stays mounted across steps so the Turnstile widget survives "resend". */}
        <div ref={widgetEl} className={step === 'email' ? 'mt-4' : 'hidden'} />
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
