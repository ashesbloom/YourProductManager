import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { CRISP_WEBSITE_ID } from './lib/links'
import './styles.css'

// First-touch attribution for Meta ads: remember the first landing's UTM/fbclid until the visitor signs up.
try {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].filter((k) => params.has(k))
  if (keys.length && !localStorage.getItem('ypm_utm')) {
    localStorage.setItem(
      'ypm_utm',
      JSON.stringify({
        ...Object.fromEntries(keys.map((k) => [k, params.get(k)])),
        referrer: document.referrer.slice(0, 200),
        landing: window.location.pathname,
        at: Date.now(),
      }),
    )
  }
} catch {
  // Storage blocked (private mode): attribution is best-effort.
}

// Live chat bubble (bottom-right). Appearance, colour and opening hours are set in the Crisp dashboard.
if (CRISP_WEBSITE_ID !== 'REPLACE_ME') {
  Object.assign(window, { $crisp: [], CRISP_WEBSITE_ID })
  const s = document.createElement('script')
  s.src = 'https://client.crisp.chat/l.js'
  s.async = true
  document.head.appendChild(s)
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
