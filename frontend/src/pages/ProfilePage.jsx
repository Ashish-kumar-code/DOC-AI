import { useAuth } from '../context/AuthContext'
import { Card, Button } from '../components/UiComponents'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

      <Card>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Name</p>
            <p className="text-2xl font-bold text-gray-900">{user?.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Email</p>
            <p className="text-lg text-gray-900">{user?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Age</p>
              <p className="text-lg text-gray-900">{user?.age || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Gender</p>
              <p className="text-lg text-gray-900">{user?.gender || 'Not specified'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Member Since</p>
            <p className="text-lg text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-bold mb-4">Medical Information</h2>
        <p className="text-gray-600 mb-4">Your medical data is stored securely and encrypted.</p>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">✓ Encrypted storage</p>
          <p className="text-sm text-gray-700">✓ HIPAA compliant (in production)</p>
          <p className="text-sm text-gray-700">✓ Only you can access your data</p>
        </div>
      </Card>

      <div className="mt-8">
        <Button variant="danger" onClick={() => alert('Logout feature implemented in Navbar')} className="w-full">
          Logout
        </Button>
      </div>
    </div>
  )
}
