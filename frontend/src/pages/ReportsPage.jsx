import { useState, useEffect } from 'react';
import { diagnosisApi } from '../api/client';

export default function ReportsPage() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await diagnosisApi.getHistory(1, 20);
      setDiagnoses(res.data.data || []);
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (diagnosisId) => {
    window.open(`http://localhost:5000/api/diagnosis/report/${diagnosisId}`, '_blank');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Reports...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Medical Reports</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-8">{error}</div>}

      {diagnoses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-500">No reports yet</p>
          <p className="text-gray-600 mt-2">Start a new diagnosis to generate reports</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diagnoses.map((d) => (
            <div key={d.id} className="card hover:shadow-xl transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{d.final_prediction}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(d.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-green-600 font-bold text-2xl">
                    {Math.round(d.confidence_score * 100)}%
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-6 line-clamp-2">
                {d.advice}
              </div>

              <button
                onClick={() => downloadReport(d.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-semibold transition"
              >
                📥 Download PDF Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}