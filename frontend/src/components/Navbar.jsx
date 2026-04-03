import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition">
          🏥 DOC AI
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              <Link to="/diagnosis" className="hover:text-blue-200 transition">
                Diagnosis
              </Link>
              <Link to="/nearby" className="hover:text-blue-200 transition">
                Nearby Help
              </Link>
              <Link to="/reports" className="hover:text-blue-200 transition">
                Reports
              </Link>
              <div className="flex items-center gap-3">
                <Link to="/profile" className="hover:text-blue-200 transition">
                  👤 {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition">
                Login
              </Link>
              <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-blue-50 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
