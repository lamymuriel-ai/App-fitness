import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { BottomNav } from './components/BottomNav'

import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Journal from './pages/Journal'
import DetailRepas from './pages/DetailRepas'
import Tendances from './pages/Tendances'
import SuggestionsAlimentaires from './pages/SuggestionsAlimentaires'
import Entrainement from './pages/Entrainement'
import SeanceActive from './pages/SeanceActive'
import HistoriqueEntrainement from './pages/HistoriqueEntrainement'
import Suivi from './pages/Suivi'
import Plus from './pages/Plus'
import AideMemoire from './pages/AideMemoire'
import Profil from './pages/Profil'
import ImporterSante from './pages/ImporterSante'
import ExporterDonnees from './pages/ExporterDonnees'
import BilanHebdomadaire from './pages/BilanHebdomadaire'
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

  // Sans ça, changer d'onglet reprend le scroll là où la page précédente
  // l'avait laissé au lieu de repartir en haut, ce qui est déroutant.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

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
        <Route path="/journal/repas/:id" element={<DetailRepas />} />
        <Route path="/journal/tendances" element={<Tendances />} />
        <Route path="/journal/suggestions" element={<SuggestionsAlimentaires />} />
        <Route path="/entrainement" element={<Entrainement />} />
        <Route path="/entrainement/seance/:templateId" element={<SeanceActive />} />
        <Route path="/entrainement/historique" element={<HistoriqueEntrainement />} />
        <Route path="/suivi" element={<Suivi />} />
        <Route path="/plus" element={<Plus />} />
        <Route path="/plus/aide-memoire" element={<AideMemoire />} />
        <Route path="/plus/profil" element={<Profil />} />
        <Route path="/plus/importer-sante" element={<ImporterSante />} />
        <Route path="/plus/exporter" element={<ExporterDonnees />} />
        <Route path="/plus/bilan-semaine" element={<BilanHebdomadaire />} />
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
