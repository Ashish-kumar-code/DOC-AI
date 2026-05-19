import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-2xl flex items-center justify-center text-white text-2xl">
            🩺
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DOC AI</h1>
        </div>

        <div className="flex items-center gap-8 text-gray-600">
          <Link to="/" className="hover:text-green-600 transition">Home</Link>
          <Link to="/diagnosis" className="hover:text-green-600 transition">Diagnosis</Link>
          <Link to="/dashboard" className="hover:text-green-600 transition">Dashboard</Link>
          <Link to="/reports" className="hover:text-green-600 transition">Reports</Link>
          <Link to="/nearby" className="hover:text-green-600 transition">Nearby</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-green-600">
                <User size={20} />
                <span className="font-medium">{user.name?.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 text-gray-700 hover:text-green-600 font-medium">Login</Link>
              <Link to="/register" className="bg-green-600 text-white px-6 py-2 rounded-2xl font-semibold hover:bg-green-700 transition">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}