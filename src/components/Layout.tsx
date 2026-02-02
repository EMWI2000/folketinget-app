import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/soeg', label: 'Søg i sager' },
    { to: '/statistik', label: 'Statistik' },
  ]

  return (
    <div className="min-h-screen bg-ft-gray">
      <header className="bg-ft-red text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-ft-red font-bold text-lg">FT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">Folketinget</h1>
                <p className="text-xs text-white/70">Åbne Data</p>
              </div>
            </Link>
            <nav className="flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
