import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { diagnosisApi } from '../api/client'
import { Loading, Card, ConfidenceMeter } from '../components/UiComponents'

export function DashboardPage() {
  const [diagnoses, setDiagnoses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDiagnoses()
  }, [])

  const fetchDiagnoses = async () => {
    try {
      const res = await diagnosisApi.getHistory(1, 5)
      setDiagnoses(res.data.data)
    } catch (err) {
      setError('Failed to load diagnosis history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  const recentDiagnosis = diagnoses[0]
  const avgConfidence = diagnoses.length > 0 ? diagnoses.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / diagnoses.length : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Diagnoses</h3>
          <p className="text-3xl font-bold text-blue-600">{diagnoses.length}</p>
        </Card>

        <Card>
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Average Confidence</h3>
          <p className="text-3xl font-bold text-green-600">{(avgConfidence * 100).toFixed(0)}%</p>
        </Card>

        <Card>
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Latest Diagnosis</h3>
          <p className="text-lg font-semibold text-gray-900">{recentDiagnosis?.final_prediction || 'N/A'}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-2xl font-bold mb-4">Recent Diagnoses</h2>
        {diagnoses.length === 0 ? (
          <p className="text-gray-600">No diagnoses yet. Start with a new diagnosis!</p>
        ) : (
          <div className="space-y-4">
            {diagnoses.map((d) => (
              <div key={d.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{d.final_prediction}</h3>
                    <p className="text-sm text-gray-600">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link to={`/reports?id=${d.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                    View Report →
                  </Link>
                </div>
                <ConfidenceMeter score={d.confidence_score} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-8 flex gap-4">
        <Link to="/diagnosis" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
          + New Diagnosis
        </Link>
        <Link to="/reports" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition">
          View All Reports
        </Link>
      </div>
    </div>
  )
}
