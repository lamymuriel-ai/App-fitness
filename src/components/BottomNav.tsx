import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Aujourd’hui', icon: '🏠' },
  { to: '/journal', label: 'Journal', icon: '🍽️' },
  { to: '/entrainement', label: 'Sport', icon: '💪' },
  { to: '/suivi', label: 'Suivi', icon: '📈' },
  { to: '/plus', label: 'Plus', icon: '✨' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
