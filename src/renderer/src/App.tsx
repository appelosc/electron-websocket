import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { useEffect } from 'react'
import Login from './pages/Login'
import PasteBin from './pages/PasteBin'

function App() {
  useEffect(() => {
    const unsubscribe = window.api.onLoggedOut(() => {
      window.location.hash = '/login'
    })
    return unsubscribe
  }, [])
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pastebin" element={<PasteBin />} />
      </Routes>
    </HashRouter>
  )
}

export default App
