import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Soeg from './pages/Soeg'
import SagSide from './pages/SagSide'
import Statistik from './pages/Statistik'
import Aktstykker from './pages/Aktstykker'
import Medlem from './pages/Medlem'
import Finanslov from './pages/Finanslov'
import Styrelser from './pages/Styrelser'
import Regnskab from './pages/Regnskab'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 2,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/soeg" element={<Soeg />} />
            <Route path="/sag/:id" element={<SagSide />} />
            <Route path="/statistik" element={<Statistik />} />
            <Route path="/aktstykker" element={<Aktstykker />} />
            <Route path="/medlem" element={<Medlem />} />
            <Route path="/finanslov" element={<Finanslov />} />
            <Route path="/styrelser" element={<Styrelser />} />
            <Route path="/regnskab" element={<Regnskab />} />
            {/* Redirects fra gamle URLs */}
            <Route path="/styrelser-regnskab" element={<Navigate to="/styrelser?tab=regnskab" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
