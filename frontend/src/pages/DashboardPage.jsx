import { useState, useEffect } from 'react';
import { diagnosisApi, adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Loading,
  ErrorAlert,
  SuccessAlert,
  Card,
  ConfidenceMeter,
  Badge,
  Button,
} from '../components/UiComponents';
import {
  TrendingUp,
  Activity,
  Heart,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    avgConfidence: 0,
    recent: null,
  });
  const [modelStatus, setModelStatus] = useState({
    text: { status: 'unknown', accuracy: null },
    image: { status: 'unknown' },
  });
  const [trainingState, setTrainingState] = useState({
    text: false,
    image: false,
    all: false,
  });
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchModelStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await diagnosisApi.getHistory(1, 6);
      const data = res.data.data || [];
      setDiagnoses(data);

      const total = data.length;
      const avgConfidence =
        total > 0
          ? data.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / total
          : 0;

      setStats({
        total,
        avgConfidence: Math.round(avgConfidence),
        recent: data[0],
      });
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelStatus = async () => {
    try {
      const res = await adminApi.getModelStatus();
      const status = res.data || {};
      setModelStatus({
        text: status.text_model || { status: 'unknown', accuracy: null },
        image: status.image_model || { status: 'unknown' },
      });
    } catch (err) {
      console.warn('Unable to fetch model status', err);
    }
  };

  const runModelTraining = async (type) => {
    setError('');
    setAdminMessage('');
    setTrainingState((prev) => ({ ...prev, [type]: true }));

    try {
      let res;
      if (type === 'text') {
        res = await adminApi.trainTextModel(true);
      } else if (type === 'image') {
        res = await adminApi.trainImageModel(5);
      } else {
        res = await adminApi.trainAllModels(5);
      }

      setAdminMessage(res?.data?.message || 'Model retraining completed successfully.');
      await fetchModelStatus();
      await fetchDashboardData();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        `Unable to retrain ${type} model. Please try again later.`;
      setError(message);
      console.error(err);
    } finally {
      setTrainingState((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return <Loading message="Loading your health dashboard..." fullScreen />;
  }

  const getConfidenceBadgeColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="content-max-width section-spacing">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="text-green-600">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-xl text-gray-600">Here's your health insights overview</p>
          </div>
          <a
            href="/diagnosis"
            className="btn-primary-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={20} />
            New Diagnosis
          </a>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-8">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Diagnoses */}
          <Card variant="highlight">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Diagnoses</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Activity className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          {/* Average Confidence */}
          <Card variant="highlight">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg. Confidence</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {stats.avgConfidence}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          {/* Latest Diagnosis */}
          <Card className="md:col-span-1 lg:col-span-2">
            <div>
              <p className="text-gray-600 text-sm font-medium">Latest Assessment</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.recent?.final_prediction || 'No diagnosis yet'}
              </p>
              {stats.recent && (
                <p className="text-sm text-gray-600 mt-2">
                  {new Date(stats.recent.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ADMIN TRAINING & MODEL STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <Card variant="highlight">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Model Management</p>
                  <h2 className="text-2xl font-bold text-gray-900">Retrain AI Models</h2>
                </div>
                <div className="space-y-2 text-right">
                  <div className="text-sm text-gray-600">Text model</div>
                  <Badge variant={modelStatus.text.status === 'trained' ? 'success' : 'warning'}>
                    {modelStatus.text.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {modelStatus.text.accuracy != null ? `${modelStatus.text.accuracy}%` : 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Image model</p>
                  <Badge variant={modelStatus.image.status === 'trained' ? 'success' : 'warning'}>
                    {modelStatus.image.status}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Train or refresh the underlying machine learning models from the dashboard. Use this after updating training data or before a demo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => runModelTraining('text')}
                  loading={trainingState.text}
                  disabled={trainingState.image || trainingState.all}
                >
                  Retrain Text Model
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => runModelTraining('image')}
                  loading={trainingState.image}
                  disabled={trainingState.text || trainingState.all}
                >
                  Retrain Image Model
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runModelTraining('all')}
                  loading={trainingState.all}
                  disabled={trainingState.text || trainingState.image}
                >
                  Retrain All
                </Button>
              </div>

              {adminMessage && (
                <SuccessAlert
                  message={adminMessage}
                  onDismiss={() => setAdminMessage('')}
                />
              )}
            </div>
          </Card>
        </div>

        {/* RECENT DIAGNOSES SECTION */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Recent Diagnoses</h2>
            <a href="/reports" className="link-primary flex items-center gap-1">
              View All <ArrowRight size={18} />
            </a>
          </div>

          {diagnoses.length === 0 ? (
            <Card className="text-center py-16">
              <Heart className="text-gray-400 mx-auto mb-4" size={48} />
              <p className="text-lg text-gray-600 font-medium">No diagnoses yet</p>
              <p className="text-gray-500 mt-2">
                Start your first diagnosis to build your health record
              </p>
              <a
                href="/diagnosis"
                className="btn-primary inline-flex items-center gap-2 mt-6"
              >
                <Plus size={18} />
                Get Started
              </a>
            </Card>
          ) : (
            <div className="space-y-4">
              {diagnoses.map((diagnosis) => (
                <Card key={diagnosis.id} className="hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    {/* Disease & Date */}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {diagnosis.final_prediction || 'Assessment'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(diagnosis.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div className="md:col-span-2">
                        <ConfidenceMeter
                        score={diagnosis.confidence_score / 100}
                        label="Confidence Score"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <a
                        href={`/reports?id=${diagnosis.id}`}
                        className="btn-secondary text-center py-2 text-sm"
                      >
                        View Report
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}