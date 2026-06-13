import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import NewTicket from './components/NewTicket'
import TicketDetail from './components/TicketDetail'
import SearchTickets from './components/SearchTickets'
import UnitRegistry from './components/UnitRegistry'
import UnitDetail from './components/UnitDetail'
import {
  Menu, Moon, Sun, Building2,
  LayoutDashboard, Building, Plus, Search
} from 'lucide-react'
import './styles/app.css'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [params, setParams] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [darkMode])

  const navigate = (page, param = null) => {
    setCurrentPage(page)
    setParams(param)
    setMobileMenuOpen(false)
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registry', label: 'Apartamentos', icon: Building, match: ['registry', 'unit-detail'] },
    { id: 'new-ticket', label: 'Nuevo ticket', icon: Plus },
    { id: 'search', label: 'Buscar', icon: Search },
  ]

  const isActive = (item) =>
    (item.match || [item.id]).includes(currentPage)

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-top">
          <div className="nav-header">
            <div className="nav-logo">
              <Building2 size={18} />
            </div>
            <h1 className="app-title">
              JIA<span>Apartamentos</span>
            </h1>
            <button
              className="menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </div>

          <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.id)}
                    className={isActive(item) ? 'active' : ''}
                  >
                    <Icon size={18} /> {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="nav-footer">
          <span className="nav-copyright">© 2026 JIA</span>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <main className="app-main">
        <div className="content-area">
          <div className="content-inner">
            {currentPage === 'dashboard' && (
              <Dashboard onNavigate={navigate} />
            )}
            {currentPage === 'new-ticket' && (
              <NewTicket onNavigate={navigate} />
            )}
            {currentPage === 'ticket-detail' && params && (
              <TicketDetail ticketId={params} onNavigate={navigate} />
            )}
            {currentPage === 'search' && (
              <SearchTickets onNavigate={navigate} />
            )}
            {currentPage === 'registry' && (
              <UnitRegistry onNavigate={navigate} />
            )}
            {currentPage === 'unit-detail' && params && (
              <UnitDetail unit={params} onNavigate={navigate} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
