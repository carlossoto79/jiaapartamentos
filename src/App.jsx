import { useState } from 'react'
import Dashboard from './components/Dashboard'
import NewTicket from './components/NewTicket'
import TicketDetail from './components/TicketDetail'
import SearchTickets from './components/SearchTickets'
import UnitRegistry from './components/UnitRegistry'
import { Menu } from 'lucide-react'
import './styles/app.css'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [params, setParams] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigate = (page, param = null) => {
    setCurrentPage(page)
    setParams(param)
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-header">
          <button 
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
          <h1 className="app-title">JIA Apartamentos</h1>
          <div className="nav-spacer"></div>
        </div>

        <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <li>
            <button 
              onClick={() => navigate('dashboard')}
              className={currentPage === 'dashboard' ? 'active' : ''}
            >
              📊 Dashboard
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('new-ticket')}
              className={currentPage === 'new-ticket' ? 'active' : ''}
            >
              ➕ Nueva Boleta
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('search')}
              className={currentPage === 'search' ? 'active' : ''}
            >
              🔍 Buscar
            </button>
          </li>
          <li>
            <button 
              onClick={() => navigate('registry')}
              className={currentPage === 'registry' ? 'active' : ''}
            >
              📋 Unidades
            </button>
          </li>
        </ul>
      </nav>

      <main className="app-main">
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
      </main>

      <footer className="app-footer">
        <p>Sistema de Seguimiento de Mantenimiento JIA Apartamentos © 2024</p>
      </footer>
    </div>
  )
}
