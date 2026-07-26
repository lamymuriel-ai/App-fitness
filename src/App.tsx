import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { BottomNav } from './components/BottomNav'

import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import AjouterRepas from './pages/AjouterRepas'
import AjouterRepasPhoto from './pages/AjouterRepasPhoto'
import AjouterRepasScan from './pages/AjouterRepasScan'
import AjouterRepasManuel from './pages/AjouterRepasManuel'
import DetailRepas from './pages/DetailRepas'
import Tendances from './pages/Tendances'
import Entrainement from './pages/Entrainement'
import SeanceActive from './pages/SeanceActive'
import HistoriqueEntrainement from './pages/HistoriqueEntrainement'
import Suivi from './pages/Suivi'
import Plus from './pages/Plus'
import AideMemoire from './pages/AideMemoire'
import Profil from './pages/Profil'
import ImporterSante from './pages/ImporterSante'
import ImportRapide from './pages/ImportRapide'
import RaccourciIOS from './pages/RaccourciIOS'

function Chargement() {
  return (
    <div className="screen center" style={{ paddingTop: '40vh' }}>
      <div style={{ fontSize: '2.5rem' }}>🌸</div>
      <p className="muted">Chargement de tes données…</p>
    </div>
  )
}

function RoutesApp() {
  const { chargement, profil } = useAppData()
  const location = useLocation()

  if (chargement) return <Chargement />

  if (!profil.onboardingTermine && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  const masquerNav = location.pathname === '/onboarding'

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/ajouter" element={<AjouterRepas />} />
        <Route path="/journal/ajouter/photo" element={<AjouterRepasPhoto />} />
        <Route path="/journal/ajouter/scan" element={<AjouterRepasScan />} />
        <Route path="/journal/ajouter/manuel" element={<AjouterRepasManuel />} />
        <Route path="/journal/repas/:id" element={<DetailRepas />} />
        <Route path="/journal/tendances" element={<Tendances />} />
        <Route path="/entrainement" element={<Entrainement />} />
        <Route path="/entrainement/seance/:templateId" element={<SeanceActive />} />
        <Route path="/entrainement/historique" element={<HistoriqueEntrainement />} />
        <Route path="/suivi" element={<Suivi />} />
        <Route path="/plus" element={<Plus />} />
        <Route path="/plus/aide-memoire" element={<AideMemoire />} />
        <Route path="/plus/profil" element={<Profil />} />
        <Route path="/plus/importer-sante" element={<ImporterSante />} />
        <Route path="/plus/raccourci-ios" element={<RaccourciIOS />} />
        <Route path="/import-rapide" element={<ImportRapide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!masquerNav && <BottomNav />}
    </>
  )
}

function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <RoutesApp />
      </HashRouter>
    </AppDataProvider>
  )
}

export default App
