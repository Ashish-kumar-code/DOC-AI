import { useState, useEffect } from 'react';
import { diagnosisApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UiComponents'; // If you have it, otherwise we'll use plain divs

export default function DashboardPage() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgConfidence: 0,
    recent: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await diagnosisApi.getHistory(1, 6);
      const data = res.data.data || [];
      setDiagnoses(data);

      const total = data.length;
      const avgConfidence = total > 0 
        ? data.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / total 
        : 0;

      setStats({
        total,
        avgConfidence: Math.round(avgConfidence * 100),
        recent: data[0]
      });
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-600 mt-2">Here's your health overview</p>
        </div>
        <a href="/diagnosis" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
          + New Diagnosis
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="p-6">
          <p className="text-gray-600 text-sm">Total Diagnoses</p>
          <p className="text-4xl font-bold text-green-700 mt-2">{stats.total}</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm">Average Confidence</p>
          <p className="text-4xl font-bold text-green-700 mt-2">{stats.avgConfidence}%</p>
        </Card>

        <Card className="p-6">
          <p className="text-gray-600 text-sm">Latest Diagnosis</p>
          <p className="text-xl font-semibold text-gray-900 mt-2">
            {stats.recent?.final_prediction || 'No diagnosis yet'}
          </p>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <p className="text-green-700 text-sm font-semibold">Health Status</p>
          <p className="text-2xl font-bold text-green-700">Good</p>
        </Card>
      </div>

      {/* Recent Diagnoses */}
      <Card className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Diagnoses</h2>
          <a href="/reports" className="text-green-600 hover:underline">View All Reports →</a>
        </div>

        {diagnoses.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">No diagnoses yet. Start your first one!</p>
        ) : (
          <div className="space-y-4">
            {diagnoses.map(d => (
              <div key={d.id} className="flex items-center justify-between p-5 border rounded-2xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center text-2xl">
                    🩺
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{d.final_prediction}</h3>
                    <p className="text-sm text-gray-600">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-green-600 font-bold text-xl">
                    {Math.round(d.confidence_score * 100)}%
                  </div>
                  <a href={`/reports?id=${d.id}`} className="text-xs text-green-600 hover:underline">View Report</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}