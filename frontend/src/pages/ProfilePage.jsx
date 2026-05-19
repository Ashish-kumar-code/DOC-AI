import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center text-5xl">
              👤
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600 text-lg">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Age</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user?.age || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">Gender</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{user?.gender}</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-sm text-gray-600 font-semibold mb-2">Member Since</p>
            <p className="text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Security & Settings */}
        <div className="card">
          <h3 className="font-bold text-lg mb-6">Account Security</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-500">Last changed 2 months ago</p>
              </div>
              <button className="text-green-600 hover:underline text-sm font-medium">Change</button>
            </div>

            <div className="pt-6 border-t">
              <button 
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-semibold"
              >
                Logout from all devices
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 card">
        <h3 className="font-bold text-lg mb-4">Data Privacy</h3>
        <p className="text-gray-600 leading-relaxed">
          Your medical data is encrypted and stored securely. We follow best practices to protect your privacy. 
          You can request data deletion at any time.
        </p>
      </div>
    </div>
  );
}