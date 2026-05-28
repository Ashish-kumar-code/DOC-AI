import { useState } from 'react';
import { locationApi } from '../api/client';
import {
  Loading,
  ErrorAlert,
  Card,
  Label,
} from '../components/UiComponents';
import {
  MapPin,
  Phone,
  Navigation,
  Building2,
  Search,
} from 'lucide-react';

export default function NearbyPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [placeType, setPlaceType] = useState('hospital');

  const getNearby = async () => {
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const res = await locationApi.nearby(latitude, longitude, placeType, 5000);
      setResults(res.data.facilities || res.data || []);
    } catch (err) {
      setError(
        'Unable to get your location. Please enable location access or try manual search.'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="content-max-width section-spacing">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-3xl mb-4">
            <MapPin className="text-green-600" size={32} />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Nearby Medical Help
          </h1>
          <p className="text-xl text-gray-600">
            Find hospitals, doctors, and pharmacies near your location
          </p>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-8">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {/* SEARCH SECTION */}
        <Card variant="highlight" className="max-w-2xl mx-auto mb-12">
          <div className="space-y-6">
            <div>
              <Label htmlFor="place-type">What are you looking for?</Label>
              <select
                id="place-type"
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="input"
              >
                <option value="hospital">🏥 Hospital</option>
                <option value="doctor">👨‍⚕️ Doctor / Clinic</option>
                <option value="pharmacy">💊 Pharmacy</option>
              </select>
            </div>

            <button
              onClick={getNearby}
              disabled={loading}
              className="btn-primary-lg w-full flex items-center justify-center gap-2"
            >
              <Search size={20} />
              {loading ? 'Finding nearby facilities...' : 'Find Nearby Services'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              📍 We'll use your location to find services within 5 kilometers
            </p>
          </div>
        </Card>

        {/* LOADING STATE */}
        {loading && <Loading message="Finding nearby medical facilities..." />}

        {/* RESULTS */}
        {searched && !loading && results.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Found {results.length}{' '}
                {placeType === 'hospital'
                  ? 'Hospitals'
                  : placeType === 'doctor'
                    ? 'Clinics'
                    : 'Pharmacies'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((place, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {placeType === 'hospital' && (
                        <Building2 className="text-green-600" size={24} />
                      )}
                      {placeType === 'doctor' && (
                        <span className="text-2xl">👨‍⚕️</span>
                      )}
                      {placeType === 'pharmacy' && <span className="text-2xl">💊</span>}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {place.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {place.address || place.vicinity}
                      </p>
                    </div>
                  </div>

                  {/* Distance */}
                  {place.distance && (
                    <div className="flex items-center gap-2 text-green-600 font-medium mb-4">
                      <MapPin size={16} />
                      {place.distance.toFixed(1)} km away
                    </div>
                  )}

                  {/* Info */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700 space-y-1">
                    {place.phone && (
                      <p>
                        <strong>Phone:</strong> {place.phone}
                      </p>
                    )}
                    {place.opening_hours && (
                      <p>
                        <strong>Status:</strong>{' '}
                        {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="flex-1 btn-secondary text-center flex items-center justify-center gap-2 py-2 text-sm"
                      >
                        <Phone size={16} />
                        Call
                      </a>
                    )}
                    {place.map_url && (
                      <a
                        href={place.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-outline text-center flex items-center justify-center gap-2 py-2 text-sm"
                      >
                        <Navigation size={16} />
                        Directions
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* NO RESULTS */}
        {searched && !loading && results.length === 0 && !error && (
          <Card className="text-center py-16">
            <MapPin className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 mb-8">
              No {placeType}s found within 5 kilometers of your location
            </p>
            <button
              onClick={getNearby}
              className="btn-primary inline-flex items-center gap-2"
            >
              Try Again
            </button>
          </Card>
        )}

        {/* EMPTY STATE */}
        {!searched && (
          <Card className="text-center py-16 max-w-md mx-auto">
            <MapPin className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Find Nearby Services
            </h3>
            <p className="text-gray-600">
              Click the button above to find medical facilities near you
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}