import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'

// Lazy-load sider, så hver rute kun hentes når den besøges (mindre initial bundle)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Soeg = lazy(() => import('./pages/Soeg'))
const SagSide = lazy(() => import('./pages/SagSide'))
const Statistik = lazy(() => import('./pages/Statistik'))
const Aktstykker = lazy(() => import('./pages/Aktstykker'))
const Medlem = lazy(() => import('./pages/Medlem'))
const Finanslov = lazy(() => import('./pages/Finanslov'))
const Styrelser = lazy(() => import('./pages/Styrelser'))
const Regnskab = lazy(() => import('./pages/Regnskab'))
const Vejledning = lazy(() => import('./pages/Vejledning'))
const Loendata = lazy(() => import('./pages/Loendata'))

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
          <Suspense fallback={<div className="p-8 text-center text-gray-500 dark:text-gray-400">Indlæser…</div>}>
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
            <Route path="/loendata" element={<Loendata />} />
            <Route path="/vejledning" element={<Vejledning />} />
            {/* Redirects fra gamle URLs */}
            <Route path="/styrelser-regnskab" element={<Navigate to="/styrelser?tab=regnskab" replace />} />
          </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
