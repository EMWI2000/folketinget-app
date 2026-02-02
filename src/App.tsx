import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Soeg from './pages/Soeg'
import SagSide from './pages/SagSide'
import Statistik from './pages/Statistik'
import Aktstykker from './pages/Aktstykker'

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
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
