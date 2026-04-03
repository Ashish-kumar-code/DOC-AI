import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Card, Button } from '../components/UiComponents'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
            DOC AI
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Your intelligent healthcare companion powered by AI
          </p>
          <p className="text-gray-600 mb-8">
            Get preliminary symptom analysis, receive nearby doctor recommendations, and access your medical history in one place.
          </p>

          {!user ? (
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
                Login
              </Link>
              <Link to="/register" className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition">
                Sign Up
              </Link>
            </div>
          ) : (
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold inline-block transition">
              Go to Dashboard
            </Link>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            {
              icon: '💬',
              title: 'Symptom Chatbot',
              desc: 'Interactive symptom collection through guided conversation',
            },
            {
              icon: '🖼️',
              title: 'Image Analysis',
              desc: 'AI-powered medical image diagnosis (X-ray, skin lesions)',
            },
            {
              icon: '🔄',
              title: 'Multimodal Fusion',
              desc: 'Combined text and image analysis for better accuracy',
            },
            {
              icon: '📍',
              title: 'Nearby Help',
              desc: 'Find doctors, hospitals & pharmacies near you',
            },
            {
              icon: '📊',
              title: 'Dashboard',
              desc: 'View diagnosis history and trends',
            },
            {
              icon: '📄',
              title: 'Reports',
              desc: 'Download medical reports as PDF',
            },
          ].map((feature, idx) => (
            <Card key={idx}>
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
          <h3 className="font-bold text-yellow-900 mb-2">⚠️ Important Medical Disclaimer</h3>
          <p className="text-yellow-800 text-sm">
            DOC AI is for educational purposes only. It is NOT a replacement for professional medical advice, diagnosis, or treatment. Always consult with a licensed healthcare provider. In case of emergency, contact emergency services immediately.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 DOC AI. All rights reserved. Educational purposes only.</p>
        </div>
      </footer>
    </div>
  )
}
