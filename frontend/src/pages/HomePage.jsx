import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, DisclaimerBanner } from '../components/UiComponents';
import {
  MessageCircle,
  Image as ImageIcon,
  Zap,
  MapPin,
  TrendingUp,
  FileText,
  Shield,
  Zap as ZapIcon,
} from 'lucide-react';

export function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: MessageCircle,
      title: 'Text Symptoms',
      desc: 'Describe your symptoms and get AI-powered analysis',
    },
    {
      icon: ImageIcon,
      title: 'Image Analysis',
      desc: 'Upload X-rays or medical images for AI diagnosis',
    },
    {
      icon: Zap,
      title: 'Multimodal Fusion',
      desc: 'Combine symptoms and images for better accuracy',
    },
    {
      icon: MapPin,
      title: 'Nearby Help',
      desc: 'Find hospitals, doctors & pharmacies near you',
    },
    {
      icon: TrendingUp,
      title: 'Dashboard',
      desc: 'Track your diagnosis history and health trends',
    },
    {
      icon: FileText,
      title: 'Reports',
      desc: 'Download professional medical reports as PDF',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* HERO SECTION */}
      <div className="py-20 px-6">
        <div className="content-max-width text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-3xl mb-6">
            <ZapIcon className="text-green-600" size={40} />
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
            DOC <span className="text-green-600">AI</span>
          </h1>

          <p className="text-2xl text-gray-700 mb-4 leading-relaxed">
            Your intelligent healthcare companion powered by medical AI
          </p>

          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Get preliminary symptom analysis, receive nearby doctor recommendations, 
            and access your medical history—all in one secure platform.
          </p>

          {/* CTA Buttons */}
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/login"
                className="btn-primary-lg flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-outline flex items-center justify-center"
              >
                Create Account
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="btn-primary-lg inline-flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
          )}

          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <Shield className="text-green-600" size={16} />
            <span className="text-sm font-medium text-green-900">
              Your data is encrypted and secure
            </span>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="py-20 px-6 bg-white/50 backdrop-blur">
        <div className="content-max-width">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for intelligent health management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <IconComponent className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* DISCLAIMER SECTION */}
      <div className="py-20 px-6">
        <div className="content-max-width max-w-2xl">
          <DisclaimerBanner />
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="py-20 px-6 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="content-max-width text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-green-100 mb-10">
            Join thousands of users managing their health with DOC AI
          </p>
          {!user ? (
            <Link
              to="/register"
              className="btn-primary-lg bg-white text-green-600 hover:bg-gray-50"
            >
              Create Your Account
            </Link>
          ) : (
            <Link
              to="/diagnosis"
              className="btn-primary-lg bg-white text-green-600 hover:bg-gray-50"
            >
              Start Your First Diagnosis
            </Link>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="content-max-width text-center">
          <p className="mb-2">© 2026 DOC AI. All rights reserved.</p>
          <p className="text-sm text-gray-500">
            Educational purposes only. Always consult with healthcare professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}
