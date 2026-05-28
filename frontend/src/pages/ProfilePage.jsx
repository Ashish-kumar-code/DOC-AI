import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Label } from '../components/UiComponents';
import {
  User,
  Mail,
  Cake,
  LogOut,
  Lock,
  Shield,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="content-max-width section-spacing">
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900">My Profile</h1>
          <p className="text-lg text-gray-600 mt-2">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PROFILE CARD */}
          <div className="lg:col-span-2">
            <Card>
              {/* Avatar & Name */}
              <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center">
                  <User className="text-green-600" size={48} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-2">
                    <Mail size={16} />
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <Label>Age</Label>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {user?.age || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label>Gender</Label>
                  <p className="text-2xl font-bold text-gray-900 mt-2 capitalize">
                    {user?.gender || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                <p className="text-sm text-green-700 font-semibold">Member Since</p>
                <p className="text-lg text-green-900 font-bold mt-1">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })
                    : 'N/A'}
                </p>
              </div>
            </Card>
          </div>

          {/* SECURITY & SETTINGS CARD */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock size={20} className="text-green-600" />
              Account Security
            </h3>

            <div className="space-y-6">
              {/* Password Change */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Password</p>
                    <p className="text-sm text-gray-600 mt-1">Last changed 3 months ago</p>
                  </div>
                  <button className="link-primary text-sm font-semibold">
                    Change
                  </button>
                </div>
              </div>

              {/* Two-Factor Auth */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <Shield size={16} />
                      Two-Factor Auth
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Not enabled</p>
                  </div>
                  <button className="link-primary text-sm font-semibold">
                    Enable
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full btn-danger flex items-center justify-center gap-2 mt-8"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </Card>
        </div>

        {/* DATA & PRIVACY */}
        <Card className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Data Privacy & Security</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              ✓ Your medical data is encrypted using industry-standard AES-256 encryption.
            </p>
            <p>
              ✓ We comply with HIPAA and other medical data protection regulations.
            </p>
            <p>
              ✓ Your data is never sold or shared with third parties without consent.
            </p>
            <p>
              ✓ You can request a complete data export or deletion at any time.
            </p>
          </div>
          <button className="btn-outline mt-6">
            Request Data Export
          </button>
        </Card>
      </div>
    </div>
  );
}