import { useState, useEffect } from 'react'
import { reportApi, diagnosisApi } from '../api/client'
import { Loading, Card, ConfidenceMeter, Button } from '../components/UiComponents'

export function ReportsPage() {
  const [diagnoses, setDiagnoses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    fetchDiagnoses()
  }, [])

  const fetchDiagnoses = async () => {
    try {
      const res = await diagnosisApi.getHistory(1, 20)
      setDiagnoses(res.data.data)
    } catch (err) {
      console.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async (diagnosisId) => {
    try {
      const res = await reportApi.downloadPdf(diagnosisId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report_${diagnosisId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      console.error('Failed to download PDF')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Medical Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-2xl font-bold mb-4">All Reports</h2>
            {diagnoses.length === 0 ? (
              <p className="text-gray-600">No reports available yet.</p>
            ) : (
              <div className="space-y-3">
                {diagnoses.map((d) => (
                  <div key={d.id} onClick={() => setSelectedReport(d)} className="border rounded p-3 cursor-pointer hover:bg-blue-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{d.final_prediction}</h3>
                        <p className="text-sm text-gray-600">{new Date(d.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{(d.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          {selectedReport && (
            <Card>
              <h3 className="text-lg font-bold mb-3">{selectedReport.final_prediction}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold">{new Date(selectedReport.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Symptoms</p>
                  <p className="font-semibold truncate">{selectedReport.symptom_text}</p>
                </div>
                <div>
                  <ConfidenceMeter score={selectedReport.confidence_score} />
                </div>
                <div>
                  <p className="text-gray-600">Advice</p>
                  <p className="font-semibold text-sm">{selectedReport.advice}</p>
                </div>
              </div>
              <Button onClick={() => downloadPdf(selectedReport.id)} className="w-full mt-4">
                📥 Download PDF
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
