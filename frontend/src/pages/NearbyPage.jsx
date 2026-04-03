import { useState } from 'react'
import { locationApi } from '../api/client'
import { ErrorAlert, SuccessAlert, Card, Button, Loading } from '../components/UiComponents'

export function NearbyPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [placeType, setPlaceType] = useState('hospital')
  const [hasLocation, setHasLocation] = useState(false)

  const getLocation = async () => {
    setLoading(true)
    setError('')

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const { latitude, longitude } = position.coords

      const res = await locationApi.nearby(latitude, longitude, placeType)
      setResults(res.data.data.slice(0, 20))
      setHasLocation(true)
    } catch (err) {
      setError('Location access denied or failed. Please enable location services or use manual search.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Nearby Medical Help</h1>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <Card className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Find Nearby Services</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Type of Service</label>
            <select value={placeType} onChange={(e) => setPlaceType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="hospital">Hospital</option>
              <option value="doctor">Doctor</option>
              <option value="clinic">Clinic</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>

          <Button onClick={getLocation} disabled={loading} className="w-full">
            {loading ? 'Getting location...' : '📍 Use Current Location'}
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Results ({results.length} found)</h2>
          {results.map((place, idx) => (
            <Card key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{place.name}</h3>
                <p className="text-sm text-gray-600">{place.address}</p>
                {place.phone && <p className="text-sm text-gray-600">📞 {place.phone}</p>}
                {place.rating && <p className="text-sm text-yellow-600">⭐ {place.rating}</p>}
              </div>
              {place.map_url && (
                <a href={place.map_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 md:mt-0">
                  View on Map →
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      {hasLocation && results.length === 0 && !loading && (
        <Card className="text-center text-gray-600">
          <p>No results found for {placeType}. Try a different search type.</p>
        </Card>
      )}
    </div>
  )
}
