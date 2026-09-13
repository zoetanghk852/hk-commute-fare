import { useState } from 'react'
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { t, type Locale } from './i18n/messages'
import { FareSaverPage } from './pages/FareSaverPage'
import { JourneyPage } from './pages/JourneyPage'
import './App.css'

// ─── Navigation bar ───────────────────────────────────────────────────────────

function NavBar({ locale }: { locale: Locale }) {
  const loc = useLocation()
  const isHome = loc.pathname === '/' || loc.pathname === ''
  const isFareSaver = loc.pathname === '/fare-saver'

  return (
    <nav className="app-nav" aria-label={t(locale, 'homeNav')}>
      <Link
        to="/"
        className={`nav-link ${isHome ? 'is-active' : ''}`}
        aria-current={isHome ? 'page' : undefined}
      >
        {t(locale, 'homeNav')}
      </Link>
      <Link
        to="/fare-saver"
        className={`nav-link ${isFareSaver ? 'is-active' : ''}`}
        aria-current={isFareSaver ? 'page' : undefined}
      >
        {t(locale, 'fareSaverNav')}
      </Link>
    </nav>
  )
}

// ─── Root app with routing ────────────────────────────────────────────────────

function AppContent() {
  const [locale, setLocale] = useState<Locale>('zh')

  return (
    <>
      <NavBar locale={locale} />
      <Routes>
        <Route
          path="/"
          element={<JourneyPage locale={locale} onLocaleChange={setLocale} />}
        />
        <Route path="/fare-saver" element={<FareSaverPage locale={locale} />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}

export default App
