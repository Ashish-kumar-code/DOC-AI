import { useState, useEffect } from 'react';
import { diagnosisApi, reportApi } from '../api/client';
import {
  Loading,
  ErrorAlert,
  SuccessAlert,
  Card,
  ConfidenceMeter,
} from '../components/UiComponents';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [success, setSuccess] = useState('');

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

  const handleDownloadPDF = async (diagnosisId) => {
    setDownloading(diagnosisId);
    try {
      const response = await reportApi.downloadPdf(diagnosisId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DOC_AI_Report_${diagnosisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('PDF downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <Loading message="Loading your medical reports..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="content-max-width section-spacing">
        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Medical Reports</h1>
          <p className="text-xl text-gray-600">
            Download and review your diagnosis reports
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-8">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-8">
            <SuccessAlert message={success} onDismiss={() => setSuccess('')} />
          </div>
        )}

        {/* REPORTS LIST */}
        {diagnoses.length === 0 ? (
          <Card className="text-center py-20">
            <FileText className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600 mb-8">
              Start a diagnosis to generate and download medical reports
            </p>
            <a href="/diagnosis" className="btn-primary inline-flex items-center gap-2">
              Get Started
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagnoses.map((report) => (
              <Card key={report.id} variant="default">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {report.final_prediction}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Calendar size={16} />
                      {new Date(report.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                </div>

                {/* Confidence Meter */}
                <div className="mb-6">
                  <ConfidenceMeter
                    score={Math.min(1, Math.max(0, report.confidence_score / 100))}
                    label="Confidence"
                  />
                </div>

                {/* Advice Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-900 line-clamp-3">{report.advice}</p>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => handleDownloadPDF(report.id)}
                  disabled={downloading === report.id}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  {downloading === report.id ? 'Downloading...' : 'Download PDF'}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}