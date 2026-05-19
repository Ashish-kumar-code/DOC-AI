import { useState } from 'react';
import { locationApi } from '../api/client';

export default function NearbyPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeType, setPlaceType] = useState('hospital');

  const getNearby = async () => {
    setLoading(true);
    setError('');

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
      setError('Unable to get location. Please allow location access or try manual search.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-green-700 mb-3">📍 Nearby Medical Help</h1>
        <p className="text-gray-600 text-lg">Find hospitals, doctors, and pharmacies near you</p>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-8">{error}</div>}

      <div className="bg-white rounded-3xl shadow p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2">Service Type</label>
            <select 
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
            className="btn-primary px-10 py-3.5 text-lg"
          >
            {loading ? 'Finding...' : 'Find Nearby'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Results Near You ({results.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((place, index) => (
              <div key={index} className="card">
                <h3 className="font-bold text-xl text-gray-900">{place.name}</h3>
                <p className="text-gray-600 mt-1">{place.address || place.vicinity}</p>
                
                {place.distance && <p className="text-sm text-green-600 mt-2">📍 {place.distance} km away</p>}
                
                <div className="mt-6 flex gap-3">
                  {place.phone && (
                    <a href={`tel:${place.phone}`} className="flex-1 text-center py-3 border border-gray-300 rounded-2xl hover:bg-gray-50">
                      📞 Call
                    </a>
                  )}
                  {place.map_url && (
                    <a href={place.map_url} target="_blank" className="flex-1 text-center py-3 border border-gray-300 rounded-2xl hover:bg-gray-50">
                      🗺️ Directions
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}