import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Previously issued links can still point to the legacy Vercel alias.
// Transfer confirmation URLs, including Supabase's one-time token, to the
// canonical public host BEFORE React can consume the token.
const query = new URLSearchParams(window.location.search)
const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
const isConfirmation =
  query.get('account') === 'confirmed' ||
  (query.has('token_hash') && ['email', 'signup'].includes(query.get('type') || '')) ||
  (fragment.has('access_token') && ['email', 'signup'].includes(fragment.get('type') || ''))

if (window.location.hostname === 'trimemo-frontend.vercel.app' && isConfirmation) {
  window.location.replace(
    'https://trimemo-redac.company' +
    window.location.pathname + window.location.search + window.location.hash
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
