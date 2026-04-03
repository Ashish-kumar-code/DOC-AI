import { Link } from 'react-router-dom'
import { Card } from '../components/UiComponents'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12">
      <Card className="max-w-md text-center">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-block transition">
          ← Back to Home
        </Link>
      </Card>
    </div>
  )
}
