import { useEffect, useRef, useState } from 'react'
import { fromRanges } from '@/lib/bitmap'

type Result = { pct: number; completed: boolean }

/** Mount with `key={lectureId}`: start position and source are read once per lecture. */
export function VideoPlayer({
  lectureId,
  durationS,
  startAt,
  track,
  watermark,
  onProgress,
}: {
  lectureId: string
  durationS: number
  startAt: number
  track: boolean
  watermark?: string
  onProgress: (r: Result) => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')
  const startAtRef = useRef(startAt)
  const onProgressRef = useRef(onProgress)
  useEffect(() => {
    onProgressRef.current = onProgress
  })

  // Declared before the source effect so that on unmount the final heartbeat is sent
  // before hls.js tears the media down.
  useEffect(() => {
    if (!track) return
    const video = ref.current!
    const send = (keepalive = false) => {
      const ranges: Array<[number, number]> = []
      for (let i = 0; i < video.played.length; i++) ranges.push([video.played.start(i), video.played.end(i)])
      if (!ranges.length) return
      fetch('/api/progress', {
        method: 'POST',
        keepalive,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lectureId, positionS: Math.floor(video.currentTime), watched: fromRanges(ranges, durationS) }),
      })
        .then((res) => (res.ok ? (res.json() as Promise<Result>) : null))
        .then((r) => {
          if (r) onProgressRef.current(r)
        })
        .catch(() => {}) // A missed beat is recovered by the next one: played ranges accumulate.
    }
    const timer = setInterval(() => {
      if (!video.paused) send()
    }, 20_000)
    const onPause = () => send()
    const onHide = () => {
      if (document.visibilityState === 'hidden') send(true)
    }
    video.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(timer)
      video.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onHide)
      send(true)
    }
  }, [lectureId, durationS, track])

  useEffect(() => {
    const video = ref.current!
    const src = `/media/${lectureId}/master.m3u8`
    let cancelled = false
    let destroy = () => {}
    const resume = () => {
      if (startAtRef.current > 0 && startAtRef.current < durationS - 5) video.currentTime = startAtRef.current
    }
    const fail = (status?: number) =>
      setError(
        status === 401 || status === 403
          ? 'Your session has ended or your access has changed. Log in again to keep watching.'
          : 'This video could not be loaded. Please refresh the page.',
      )
    video.addEventListener('loadedmetadata', resume, { once: true })
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari, recent Chrome) hides HTTP statuses, so ask the playlist why playback failed.
      video.src = src
      video.addEventListener(
        'error',
        () => {
          fetch(src)
            .then((res) => fail(res.status))
            .catch(() => fail())
        },
        { once: true },
      )
    } else {
      import('hls.js')
        .then(({ default: Hls }) => {
          if (cancelled) return
          const hls = new Hls()
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) fail(data.response?.code)
          })
          hls.loadSource(src)
          hls.attachMedia(video)
          destroy = () => hls.destroy()
        })
        .catch(() => fail())
    }
    return () => {
      cancelled = true
      destroy()
      video.removeEventListener('loadedmetadata', resume)
    }
  }, [lectureId, durationS])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        className="h-full w-full"
        controls
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Deterrent against re-sharing screen recordings. ponytail: hidden in native fullscreen; a custom fullscreen container would keep it. */}
      {watermark ? (
        <span className="pointer-events-none absolute right-3 top-3 select-none text-xs text-white/25">{watermark}</span>
      ) : null}
      {error ? (
        <div role="alert" className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 text-center text-sm text-white/80">
          {error}
        </div>
      ) : null}
    </div>
  )
}
