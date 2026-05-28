import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, ErrorAlert, Label, Button } from '../components/UiComponents';
import { LogIn, Heart } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-6">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-3xl mb-4">
            <Heart className="text-green-600" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">DOC AI</h1>
          <p className="text-gray-600 mt-2">Welcome back to your health dashboard</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label required htmlFor="email">
              Email Address
            </Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label required htmlFor="password">
              Password
            </Label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-lg w-full flex items-center justify-center gap-2 mt-8"
          >
            <LogIn size={20} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center mt-8 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="link-primary font-semibold">
            Create one
          </Link>
        </p>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            🔒 Your data is encrypted and secure
          </p>
        </div>
      </Card>
    </div>
  );
}